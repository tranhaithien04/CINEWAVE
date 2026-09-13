import { listBookings, getBookingByCode } from "../helpers/booking-store.js";
import { findUserById } from "../helpers/user-store.js";
import { DomainError } from "../models/errors.js";

export async function listMyTickets(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  }
  const bookings = await listBookings();
  return bookings.filter((item) => item.userEmail === user.email);
}

export async function getMyTicket(userId: string, code: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập", 401);
  }
  const booking = await getBookingByCode(code);
  if (!booking || booking.userEmail !== user.email) {
    throw new DomainError("NOT_FOUND", "Không tìm thấy vé", 404);
  }
  return booking;
}
