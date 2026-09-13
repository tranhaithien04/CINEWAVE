import { randomUUID } from "node:crypto";

import { getBookingById, saveBooking } from "../helpers/booking-store.js";
import { getMovieBySlug } from "../helpers/catalog-store.js";
import { findUserById } from "../helpers/user-store.js";
import { DomainError } from "../models/errors.js";
import type { BookingRecord } from "../models/catalog.js";
import { notifyUser } from "./notification.service.js";

type ConfirmBody = {
  bookingId?: string;
  showtimeId?: string;
  movieSlug?: string;
  seats?: string[];
  total?: number;
};

function ticketCode() {
  return `CW-${randomUUID().slice(0, 4).toUpperCase()}`;
}

export async function confirmMockPayment(userId: string, body: ConfirmBody) {
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
      status: "PAID",
      total: Math.round(body.total ?? 0),
      userEmail: user.email,
      createdAt: new Date().toISOString(),
    } satisfies BookingRecord;
  } else if (booking.status !== "PAID" && booking.status !== "USED") {
    booking = { ...booking, status: "PAID", userEmail: booking.userEmail ?? user.email };
  }

  await saveBooking(booking);
  const movie = await getMovieBySlug(booking.movieSlug);
  await notifyUser({
    userId: user.id,
    type: "PAYMENT_SUCCESS",
    title: "Thanh toán thành công",
    body: `Bạn đã thanh toán ${movie?.title ?? booking.movieSlug}. Mã vé ${booking.code} đã vào Ví vé.`,
    href: `/tickets/${booking.code}`,
    bookingId: booking.id,
    movieSlug: booking.movieSlug,
    dedupe: true,
  });
  return booking;
}
