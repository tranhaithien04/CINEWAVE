import { randomUUID } from "node:crypto";

import {
  getBookingById,
  getBookingByPaymentCode,
  getBookingBySepayTransactionId,
  listBookings,
  saveBooking,
} from "../helpers/booking-store.js";
import { getMovieBySlug } from "../helpers/catalog-store.js";
import {
  buildPaymentView,
  extractPaymentCode,
  paymentProvider,
  type SepayQrInfo,
  type SepayWebhookPayload,
  verifySepayWebhook,
} from "../helpers/sepay.js";
import { findUserById } from "../helpers/user-store.js";
import { DomainError } from "../models/errors.js";
import type { BookingRecord } from "../models/catalog.js";
import { notifyUser } from "./notification.service.js";
import { sendTicketPurchaseEmail } from "../helpers/ticket-mail.js";

type ConfirmBody = {
  bookingId?: string;
  showtimeId?: string;
  movieSlug?: string;
  seats?: string[];
  total?: number;
};

const PAYMENT_TTL_MS = 10 * 60 * 1000;

function ticketCode() {
  return `CW-${randomUUID().slice(0, 4).toUpperCase()}`;
}

function makePaymentCode() {
  return `CW${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

async function assertOwner(userId: string, booking: BookingRecord) {
  const user = await findUserById(userId);
  if (!user) throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  if (booking.userEmail && booking.userEmail !== user.email) {
    throw new DomainError("FORBIDDEN_BOOKING", "Không thể thanh toán đơn của người khác", 403);
  }
  return user;
}

async function markPaid(booking: BookingRecord, sepayTransactionId?: string | null) {
  if (booking.status === "PAID" || booking.status === "USED") {
    return booking;
  }
  const paid: BookingRecord = {
    ...booking,
    status: "PAID",
    paidAt: new Date().toISOString(),
    sepayTransactionId: sepayTransactionId ?? booking.sepayTransactionId ?? null,
  };
  await saveBooking(paid);
  const movie = await getMovieBySlug(paid.movieSlug);
  await notifyUser({
    userEmail: paid.userEmail,
    type: "PAYMENT_SUCCESS",
    title: "Thanh toán thành công",
    body: `Bạn đã thanh toán ${movie?.title ?? paid.movieSlug}. Mã vé ${paid.code} đã vào Ví vé và đã gửi email.`,
    href: `/tickets/${paid.code}`,
    bookingId: paid.id,
    movieSlug: paid.movieSlug,
    dedupe: true,
    sendEmail: false,
  });
  try {
    await sendTicketPurchaseEmail(paid);
  } catch (error) {
    console.error("Không gửi được email vé", error);
  }
  return paid;
}

export async function createPaymentIntent(userId: string, bookingId: string): Promise<{
  booking: BookingRecord;
  payment: SepayQrInfo;
}> {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new DomainError("NOT_FOUND", "Không tìm thấy đơn", 404);
  await assertOwner(userId, booking);

  if (booking.status === "EXPIRED" || booking.status === "CANCELLED" || booking.status === "VOIDED") {
    throw new DomainError("HOLD_EXPIRED", "Đơn đã hết hạn, vui lòng chọn ghế lại", 409);
  }

  if (booking.status === "PAID" || booking.status === "USED") {
    const expiresAt = booking.paymentExpiresAt ?? booking.paidAt ?? new Date().toISOString();
    return {
      booking,
      payment: buildPaymentView(booking.paymentCode ?? booking.code.replace(/-/g, ""), booking.total, expiresAt),
    };
  }

  const holdEnd = booking.holdExpiresAt ? new Date(booking.holdExpiresAt).getTime() : 0;
  if (holdEnd && holdEnd < Date.now() && booking.status === "HELD") {
    await saveBooking({ ...booking, status: "EXPIRED" });
    throw new DomainError("HOLD_EXPIRED", "Hết giờ giữ ghế, vui lòng chọn lại", 409);
  }

  const paymentCode = booking.paymentCode || makePaymentCode();
  const expiresAt = new Date(
    Math.max(holdEnd || 0, Date.now() + PAYMENT_TTL_MS),
  ).toISOString();
  const updated: BookingRecord = {
    ...booking,
    status: "PENDING_PAYMENT",
    paymentProvider: paymentProvider(),
    paymentCode,
    paymentExpiresAt: booking.paymentExpiresAt ?? expiresAt,
    holdExpiresAt: booking.holdExpiresAt ?? expiresAt,
  };
  await saveBooking(updated);
  return {
    booking: updated,
    payment: buildPaymentView(paymentCode, updated.total, updated.paymentExpiresAt ?? expiresAt),
  };
}

export async function getPaymentStatus(userId: string, bookingId: string) {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new DomainError("NOT_FOUND", "Không tìm thấy đơn", 404);
  await assertOwner(userId, booking);
  const paid = booking.status === "PAID" || booking.status === "USED";
  const payment = booking.paymentCode
    ? buildPaymentView(
        booking.paymentCode,
        booking.total,
        booking.paymentExpiresAt ?? booking.holdExpiresAt ?? new Date().toISOString(),
      )
    : null;
  return { booking, paid, payment };
}

export async function confirmMockPayment(userId: string, body: ConfirmBody) {
  if (paymentProvider() === "SEPAY") {
    throw new DomainError(
      "PAYMENT_PENDING",
      "Đơn dùng SePay — hệ thống sẽ kích hoạt vé khi nhận được tiền chuyển khoản",
      409,
    );
  }

  const user = await findUserById(userId);
  if (!user) throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);

  let booking = body.bookingId ? await getBookingById(body.bookingId) : null;
  if (booking && booking.userEmail && booking.userEmail !== user.email) {
    throw new DomainError("FORBIDDEN_BOOKING", "Không thể thanh toán đơn của người khác", 403);
  }

  if (!booking) {
    if (!body.showtimeId || !body.movieSlug || !body.seats?.length) {
      throw new DomainError("VALIDATION_ERROR", "Thiếu thông tin suất để tạo vé");
    }
    booking = {
      id: body.bookingId || randomUUID(),
      code: ticketCode(),
      movieSlug: body.movieSlug,
      showtimeId: body.showtimeId,
      seats: body.seats,
      status: "HELD",
      total: Math.round(body.total ?? 0),
      userEmail: user.email,
      createdAt: new Date().toISOString(),
      paymentProvider: "MOCK",
    } satisfies BookingRecord;
  }

  return markPaid({ ...booking, paymentProvider: booking.paymentProvider ?? "MOCK" });
}

export async function handleSepayWebhook(
  payload: SepayWebhookPayload,
  headers: Record<string, unknown>,
  rawBody?: Buffer,
) {
  if (!verifySepayWebhook(headers, rawBody)) {
    throw new DomainError("UNAUTHORIZED", "Webhook SePay không hợp lệ", 401);
  }

  if (String(payload.transferType ?? "in").toLowerCase() !== "in") {
    return { success: true, ignored: true as const };
  }

  const txnId = payload.id == null ? "" : String(payload.id);
  if (txnId) {
    const existing = await getBookingBySepayTransactionId(txnId);
    if (existing) {
      return { success: true, bookingId: existing.id };
    }
  }

  const code = extractPaymentCode(payload);
  if (!code) {
    return { success: true, ignored: true as const };
  }

  const booking = await getBookingByPaymentCode(code);
  if (!booking) {
    return { success: true, ignored: true as const };
  }

  if (booking.status === "PAID" || booking.status === "USED") {
    if (txnId && !booking.sepayTransactionId) {
      await saveBooking({ ...booking, sepayTransactionId: txnId });
    }
    return { success: true, bookingId: booking.id };
  }

  const amount = Number(payload.transferAmount ?? 0);
  if (!Number.isFinite(amount) || amount < booking.total) {
    return { success: true, underpaid: true as const, bookingId: booking.id };
  }

  const paid = await markPaid(booking, txnId || null);
  return { success: true, bookingId: paid.id };
}

export async function expireStalePayments() {
  const now = Date.now();
  const bookings = await listBookings();
  for (const booking of bookings) {
    if (booking.status !== "PENDING_PAYMENT" && booking.status !== "HELD") continue;
    const exp = booking.paymentExpiresAt ?? booking.holdExpiresAt;
    if (!exp || new Date(exp).getTime() > now) continue;
    await saveBooking({ ...booking, status: "EXPIRED" });
  }
}
