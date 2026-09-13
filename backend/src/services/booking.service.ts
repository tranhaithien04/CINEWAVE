import { randomUUID } from "node:crypto";

import { getBookingById, saveBooking } from "../helpers/booking-store.js";
import { getShowtimeById } from "../helpers/catalog-store.js";
import { findUserById } from "../helpers/user-store.js";
import type { BookingRecord } from "../models/catalog.js";
import { DomainError } from "../models/errors.js";

const HOLD_MS = 8 * 60 * 1000;

type HoldBody = {
  showtimeId?: string;
  movieSlug?: string;
  seats?: string[];
  total?: number;
};

function ticketCode() {
  return `CW-${randomUUID().slice(0, 4).toUpperCase()}`;
}

export async function holdSeats(userId: string, body: HoldBody) {
  const user = await findUserById(userId);
  if (!user) throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  if (!body.showtimeId || !body.movieSlug || !body.seats?.length) {
    throw new DomainError("VALIDATION_ERROR", "Thiếu suất hoặc ghế để giữ chỗ");
  }

  const showtime = await getShowtimeById(body.showtimeId);
  if (!showtime || showtime.closed) {
    throw new DomainError("NOT_FOUND", "Suất chiếu không còn mở", 404);
  }
  if (showtime.movieSlug !== body.movieSlug) {
    throw new DomainError("VALIDATION_ERROR", "Suất không khớp phim đã chọn");
  }

  const booking: BookingRecord = {
    id: randomUUID(),
    code: ticketCode(),
    movieSlug: body.movieSlug,
    showtimeId: body.showtimeId,
    seats: body.seats,
    status: "HELD",
    total: Math.round(body.total ?? 0),
    userEmail: user.email,
    createdAt: new Date().toISOString(),
    holdExpiresAt: new Date(Date.now() + HOLD_MS).toISOString(),
  };
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
