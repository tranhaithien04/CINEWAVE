import { randomUUID } from "node:crypto";

import { getBookingByCode, getBookingById, listBookingsByShowtime, saveBooking } from "../helpers/booking-store.js";
import { getMovieBySlug, getShowtimeById, listShowtimes } from "../helpers/catalog-store.js";
import { computeConcessionTotal, ensureConcessionMenuLoaded, resolveConcessions, type ConcessionLine } from "../helpers/concessions.js";
import {
  assertValidSeatSelection,
  buildSeatLayout,
  computeSeatTotal,
  type OccupancyState,
} from "../helpers/seat-pricing.js";
import { findUserById } from "../helpers/user-store.js";
import type { BookingRecord } from "../models/catalog.js";
import { DomainError } from "../models/errors.js";
import { notifyUser } from "./notification.service.js";

const HOLD_MS = () => Math.round(Number((process.env.HOLD_TTL_SECONDS ?? "270")) * 1000);
const CANCEL_LEAD_MS = 60 * 60 * 1000;
const REFUND_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type HoldBody = {
  showtimeId?: string;
  movieSlug?: string;
  seats?: string[];
  total?: number;
};

function ticketCode() {
  return `CW-${randomUUID().slice(0, 4).toUpperCase()}`;
}

function isHoldStillActive(booking: BookingRecord) {
  if (booking.status !== "HELD" && booking.status !== "PENDING_PAYMENT") return false;
  const exp = booking.paymentExpiresAt ?? booking.holdExpiresAt;
  if (!exp) return true;
  return new Date(exp).getTime() > Date.now();
}

export function occupiesSeats(booking: BookingRecord) {
  if (booking.status === "PAID" || booking.status === "USED") return true;
  return isHoldStillActive(booking);
}

function mapSeatError(code: string): never {
  if (code === "TOO_MANY_SEATS") throw new DomainError("TOO_MANY_SEATS", "Tối đa 8 ghế mỗi đơn", 400);
  if (code === "SEAT_BLOCKED") throw new DomainError("SEAT_BLOCKED", "Ghế này không mở bán", 409);
  if (code === "INVALID_COUPLE_PAIR") throw new DomainError("INVALID_COUPLE_PAIR", "Ghế đôi phải chọn cả cặp", 400);
  throw new DomainError("VALIDATION_ERROR", "Thiếu hoặc sai danh sách ghế");
}

export async function occupiedSeatMap(showtimeId: string, excludeBookingId?: string, viewerEmail?: string | null) {
  const map = new Map<string, OccupancyState>();
  const bookings = await listBookingsByShowtime(showtimeId);
  for (const booking of bookings) {
    if (excludeBookingId && booking.id === excludeBookingId) continue;
    if (!occupiesSeats(booking)) continue;
    const state: OccupancyState =
      booking.status === "PAID" || booking.status === "USED"
        ? "SOLD"
        : viewerEmail && booking.userEmail === viewerEmail
          ? "MINE_HELD"
          : "HELD";
    for (const seat of booking.seats) {
      if (state === "SOLD" || map.get(seat) !== "SOLD") map.set(seat, state);
    }
  }
  return map;
}

export async function assertSeatsFree(showtimeId: string, seats: string[], excludeBookingId?: string) {
  const occupied = await occupiedSeatMap(showtimeId, excludeBookingId);
  const taken = seats.filter((seat) => {
    const state = occupied.get(seat);
    return state === "SOLD" || state === "HELD" || state === "MINE_HELD";
  });
  if (taken.length) {
    throw new DomainError("SEAT_TAKEN", `Ghế ${taken.join(", ")} vừa được giữ hoặc đã bán`, 409);
  }
}

export async function listShowtimeSeats(showtimeId: string, viewerEmail?: string | null) {
  const showtime = await getShowtimeById(showtimeId);
  if (!showtime) throw new DomainError("NOT_FOUND", "Không tìm thấy suất", 404);
  const occupied = await occupiedSeatMap(showtimeId, undefined, viewerEmail);
  return {
    showtimeId,
    blockedSeats: showtime.blockedSeats ?? [],
    seats: buildSeatLayout(showtime.blockedSeats ?? []).map((seat) => ({
      id: seat.id,
      row: seat.row,
      number: seat.number,
      type: seat.type,
      state: seat.blocked ? "BLOCKED" : (occupied.get(seat.label) ?? "AVAILABLE"),
    })),
  };
}

function withTotals(booking: BookingRecord, priceBase: number, concessions?: ConcessionLine[]): BookingRecord {
  const lines = concessions ?? booking.concessions ?? [];
  const seatTotal = computeSeatTotal(booking.seats, priceBase);
  const concessionTotal = computeConcessionTotal(lines);
  return {
    ...booking,
    concessions: lines,
    seatTotal,
    concessionTotal,
    total: seatTotal + concessionTotal,
  };
}

async function requireOwner(userId: string, booking: BookingRecord) {
  const user = await findUserById(userId);
  if (!user) throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  if (booking.userEmail && booking.userEmail !== user.email) {
    throw new DomainError("FORBIDDEN_BOOKING", "Không thể thao tác đơn của người khác", 403);
  }
  return user;
}

export function canModifyPaidTicket(startsAt: string) {
  return new Date(startsAt).getTime() - Date.now() >= CANCEL_LEAD_MS;
}

export async function holdSeats(userId: string, body: HoldBody) {
  const user = await findUserById(userId);
  if (!user) throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  if (!body.showtimeId || !body.movieSlug) {
    throw new DomainError("VALIDATION_ERROR", "Thiếu suất hoặc ghế để giữ chỗ");
  }

  const showtime = await getShowtimeById(body.showtimeId);
  if (!showtime || showtime.closed) {
    throw new DomainError("NOT_FOUND", "Suất chiếu không còn mở", 404);
  }
  if (showtime.movieSlug !== body.movieSlug) {
    throw new DomainError("VALIDATION_ERROR", "Suất không khớp phim đã chọn");
  }
  if (new Date(showtime.startsAt).getTime() <= Date.now()) {
    throw new DomainError("SHOWTIME_STARTED", "Suất đã bắt đầu, không giữ ghế được", 409);
  }

  let seats: string[];
  try {
    seats = assertValidSeatSelection(body.seats ?? [], showtime.blockedSeats ?? []);
  } catch (error) {
    mapSeatError(error instanceof Error ? error.message : "VALIDATION_ERROR");
  }

  await assertSeatsFree(showtime.id, seats);

  const booking = withTotals(
    {
      id: randomUUID(),
      code: ticketCode(),
      movieSlug: body.movieSlug,
      showtimeId: body.showtimeId,
      seats,
      status: "HELD",
      total: 0,
      userEmail: user.email,
      createdAt: new Date().toISOString(),
      holdExpiresAt: new Date(Date.now() + HOLD_MS()).toISOString(),
      concessions: [],
    },
    showtime.priceBase,
    [],
  );
  return saveBooking(booking);
}

export async function getMyBooking(userId: string, bookingId: string) {
  const user = await findUserById(userId);
  if (!user) throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  const booking = await getBookingById(bookingId);
  if (!booking) throw new DomainError("NOT_FOUND", "Không tìm thấy đơn", 404);
  if (booking.userEmail && booking.userEmail !== user.email) {
    throw new DomainError("FORBIDDEN_BOOKING", "Không thể xem đơn của người khác", 403);
  }
  return booking;
}

export async function updateConcessions(userId: string, bookingId: string, items: Array<{ id?: string; qty?: number }>) {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new DomainError("NOT_FOUND", "Không tìm thấy đơn", 404);
  await requireOwner(userId, booking);
  if (booking.status !== "HELD" && booking.status !== "PENDING_PAYMENT") {
    throw new DomainError("HOLD_EXPIRED", "Chỉ thêm combo trước khi thanh toán xong", 409);
  }
  const holdEnd = booking.holdExpiresAt ? new Date(booking.holdExpiresAt).getTime() : 0;
  if (holdEnd && holdEnd < Date.now()) {
    await saveBooking({ ...booking, status: "EXPIRED" });
    throw new DomainError("HOLD_EXPIRED", "Hết giờ giữ ghế, vui lòng chọn lại", 409);
  }
  const showtime = await getShowtimeById(booking.showtimeId);
  if (!showtime) throw new DomainError("NOT_FOUND", "Suất chiếu không còn mở", 404);
  await ensureConcessionMenuLoaded();
  const lines = resolveConcessions(items);
  return saveBooking(withTotals(booking, showtime.priceBase, lines));
}

export async function cancelMyTicket(userId: string, code: string) {
  const booking = await getBookingByCode(code);
  if (!booking) throw new DomainError("NOT_FOUND", "Không tìm thấy vé", 404);
  await requireOwner(userId, booking);
  if (booking.status === "USED") {
    throw new DomainError("ALREADY_CHECKED_IN", "Vé đã check-in, không hủy được", 409);
  }
  if (booking.status !== "PAID") {
    throw new DomainError("CANCEL_NOT_ALLOWED", "Chỉ hủy được vé đã thanh toán", 409);
  }
  const showtime = await getShowtimeById(booking.showtimeId);
  if (!showtime) throw new DomainError("NOT_FOUND", "Không tìm thấy suất", 404);
  if (!canModifyPaidTicket(showtime.startsAt)) {
    throw new DomainError("BOOKING_CUTOFF", "Chỉ hủy vé trước giờ chiếu ít nhất 60 phút", 409);
  }

  const next = await saveBooking({
    ...booking,
    status: "CANCELLED",
    cancelledAt: new Date().toISOString(),
    refundExpiresAt: new Date(Date.now() + REFUND_TTL_MS).toISOString(),
  });
  const movie = await getMovieBySlug(next.movieSlug);
  await notifyUser({
    userEmail: next.userEmail,
    type: "REFUND_READY",
    title: "Vé đã hủy — nhận hoàn tiền tại quầy",
    body: `Vé ${next.code} (${movie?.title ?? next.movieSlug}) đã hủy. Ghế đã trả. Mang QR hoàn tiền ra quầy soát vé trong 7 ngày.`,
    href: `/tickets/${next.code}`,
    bookingId: next.id,
    movieSlug: next.movieSlug,
    dedupe: false,
  });
  return next;
}

export async function listRescheduleOptions(userId: string, code: string) {
  const booking = await getBookingByCode(code);
  if (!booking) throw new DomainError("NOT_FOUND", "Không tìm thấy vé", 404);
  await requireOwner(userId, booking);
  if (booking.status !== "PAID") {
    throw new DomainError("CANCEL_NOT_ALLOWED", "Chỉ đổi suất vé đã thanh toán, chưa dùng", 409);
  }
  const current = await getShowtimeById(booking.showtimeId);
  if (!current) throw new DomainError("NOT_FOUND", "Không tìm thấy suất", 404);
  if (!canModifyPaidTicket(current.startsAt)) {
    throw new DomainError("BOOKING_CUTOFF", "Chỉ đổi suất trước giờ chiếu ít nhất 60 phút", 409);
  }
  const now = Date.now();
  const showtimes = (await listShowtimes()).filter(
    (show) =>
      show.movieSlug === booking.movieSlug &&
      !show.closed &&
      show.id !== current.id &&
      show.priceBase === current.priceBase &&
      new Date(show.startsAt).getTime() > now + CANCEL_LEAD_MS,
  );
  return { booking, current, showtimes };
}

export async function rescheduleMyTicket(
  userId: string,
  code: string,
  body: { showtimeId?: string; seats?: string[] },
) {
  const booking = await getBookingByCode(code);
  if (!booking) throw new DomainError("NOT_FOUND", "Không tìm thấy vé", 404);
  await requireOwner(userId, booking);
  if (booking.status === "USED") {
    throw new DomainError("ALREADY_CHECKED_IN", "Vé đã check-in, không đổi suất được", 409);
  }
  if (booking.status !== "PAID") {
    throw new DomainError("CANCEL_NOT_ALLOWED", "Chỉ đổi suất vé đã thanh toán", 409);
  }

  const current = await getShowtimeById(booking.showtimeId);
  const nextShow = body.showtimeId ? await getShowtimeById(body.showtimeId) : null;
  if (!current || !nextShow) throw new DomainError("NOT_FOUND", "Không tìm thấy suất", 404);
  if (!canModifyPaidTicket(current.startsAt)) {
    throw new DomainError("BOOKING_CUTOFF", "Chỉ đổi suất trước giờ chiếu ít nhất 60 phút", 409);
  }
  if (nextShow.closed || nextShow.movieSlug !== booking.movieSlug) {
    throw new DomainError("SHOWTIME_CLOSED", "Suất mới không còn mở hoặc khác phim", 409);
  }
  if (new Date(nextShow.startsAt).getTime() <= Date.now() + CANCEL_LEAD_MS) {
    throw new DomainError("BOOKING_CUTOFF", "Suất mới phải cách hiện tại ít nhất 60 phút", 409);
  }
  if (nextShow.priceBase !== current.priceBase) {
    throw new DomainError("PRICE_MISMATCH", "Chỉ đổi sang suất cùng giá vé", 409);
  }

  let seats: string[];
  try {
    seats = assertValidSeatSelection(body.seats ?? [], nextShow.blockedSeats ?? []);
  } catch (error) {
    mapSeatError(error instanceof Error ? error.message : "VALIDATION_ERROR");
  }

  const oldSeatTotal = booking.seatTotal ?? computeSeatTotal(booking.seats, current.priceBase);
  const newSeatTotal = computeSeatTotal(seats, nextShow.priceBase);
  if (newSeatTotal !== oldSeatTotal) {
    throw new DomainError(
      "PRICE_MISMATCH",
      "Tổng tiền ghế phải bằng vé cũ. Chọn cùng loại/số ghế (ví dụ 2 ghế thường).",
      409,
    );
  }

  await assertSeatsFree(nextShow.id, seats, booking.id);
  const concessionTotal = computeConcessionTotal(booking.concessions ?? []);
  const next = await saveBooking({
    ...booking,
    showtimeId: nextShow.id,
    seats,
    seatTotal: newSeatTotal,
    concessionTotal,
    total: newSeatTotal + concessionTotal,
  });
  const movie = await getMovieBySlug(next.movieSlug);
  await notifyUser({
    userEmail: next.userEmail,
    type: "SHOWTIME_REMINDER",
    title: "Đã đổi suất chiếu",
    body: `Vé ${next.code} (${movie?.title ?? next.movieSlug}) chuyển sang ${new Date(nextShow.startsAt).toLocaleString("vi-VN")}. Ghế ${next.seats.join(", ")}.`,
    href: `/tickets/${next.code}`,
    bookingId: next.id,
    movieSlug: next.movieSlug,
    dedupe: false,
  });
  return next;
}

export async function payoutRefund(code: string) {
  const booking = await getBookingByCode(code);
  if (!booking) throw new DomainError("NOT_FOUND", "Không tìm thấy vé", 404);
  if (booking.status === "REFUNDED") {
    throw new DomainError("CANCEL_NOT_ALLOWED", "Vé này đã hoàn tiền rồi", 409);
  }
  if (booking.status !== "CANCELLED") {
    throw new DomainError("CANCEL_NOT_ALLOWED", "Chỉ hoàn tiền vé đã hủy, mang QR hoàn tiền", 409);
  }
  if (booking.refundExpiresAt && new Date(booking.refundExpiresAt).getTime() < Date.now()) {
    throw new DomainError("HOLD_EXPIRED", "QR hoàn tiền đã hết hạn (7 ngày)", 409);
  }
  const next = await saveBooking({
    ...booking,
    status: "REFUNDED",
    refundedAt: new Date().toISOString(),
  });
  await notifyUser({
    userEmail: next.userEmail,
    type: "BOOKING_REFUNDED",
    title: "Đã nhận hoàn tiền tại quầy",
    body: `Quầy đã trả ${next.total.toLocaleString("vi-VN")}₫ cho vé ${next.code}.`,
    href: `/tickets/${next.code}`,
    bookingId: next.id,
    movieSlug: next.movieSlug,
    dedupe: false,
  });
  return next;
}
