import { randomUUID } from "node:crypto";

import { getBookingByCode, getBookingById, listBookings, saveBooking } from "../helpers/booking-store.js";
import {
  getMovieById,
  getMovieBySlug,
  getShowtimeById,
  listMovies,
  listShowtimes,
  removeMovie,
  removeShowtime,
  saveMovie,
  saveShowtime,
} from "../helpers/catalog-store.js";
import { listUsers, updateUser } from "../helpers/user-store.js";
import { toPublicUser } from "../models/user.js";
import { DomainError } from "../models/errors.js";
import { parseMovieInput, parseShowtimeInput, parseUserRole, slugify } from "../validators/admin.js";
import { notifyUser } from "./notification.service.js";

export async function getOverview() {
  const [movies, showtimes, bookings, users] = await Promise.all([
    listMovies(),
    listShowtimes(),
    listBookings(),
    listUsers(),
  ]);
  const paid = bookings.filter((item) => item.status === "PAID" || item.status === "USED");
  return {
    movies: movies.length,
    showtimes: showtimes.length,
    tickets: bookings.length,
    users: users.length,
    revenue: paid.reduce((sum, item) => sum + item.total, 0),
  };
}

export async function createMovie(body: unknown) {
  const input = parseMovieInput(body);
  const slug = input.slug || slugify(input.title);
  if (await getMovieBySlug(slug)) {
    throw new DomainError("VALIDATION_ERROR", "Slug phim đã tồn tại");
  }
  return saveMovie({
    id: randomUUID(),
    slug,
    title: input.title,
    description: input.description,
    durationMin: input.durationMin,
    rating: input.rating,
    posterUrl: input.posterUrl,
    backdropUrl: input.backdropUrl,
    genres: input.genres,
    nowShowing: input.nowShowing,
    trailerUrl: input.trailerUrl,
  });
}

export async function updateMovie(id: string, body: unknown) {
  const current = await getMovieById(id);
  if (!current) throw new DomainError("NOT_FOUND", "Không tìm thấy phim", 404);
  const input = parseMovieInput({ ...current, ...(body as object) });
  const slug = input.slug || current.slug;
  const clash = await getMovieBySlug(slug);
  if (clash && clash.id !== id) {
    throw new DomainError("VALIDATION_ERROR", "Slug phim đã tồn tại");
  }
  return saveMovie({
    ...current,
    ...input,
    id,
    slug,
  });
}

export async function deleteMovie(id: string) {
  if (!(await removeMovie(id))) {
    throw new DomainError("NOT_FOUND", "Không tìm thấy phim", 404);
  }
  return { ok: true };
}

export async function createShowtime(body: unknown) {
  const input = parseShowtimeInput(body);
  if (!(await getMovieBySlug(input.movieSlug))) {
    throw new DomainError("NOT_FOUND", "Không tìm thấy phim cho suất này", 404);
  }
  return saveShowtime({
    id: `st-${randomUUID().slice(0, 8)}`,
    ...input,
  });
}

export async function updateShowtime(id: string, body: unknown) {
  const current = await getShowtimeById(id);
  if (!current) throw new DomainError("NOT_FOUND", "Không tìm thấy suất", 404);
  const input = parseShowtimeInput({ ...current, ...(body as object) });
  if (!(await getMovieBySlug(input.movieSlug))) {
    throw new DomainError("NOT_FOUND", "Không tìm thấy phim cho suất này", 404);
  }
  return saveShowtime({ ...current, ...input, id });
}

export async function deleteShowtime(id: string) {
  if (!(await removeShowtime(id))) {
    throw new DomainError("NOT_FOUND", "Không tìm thấy suất", 404);
  }
  return { ok: true };
}

export async function closeShowtime(id: string) {
  const current = await getShowtimeById(id);
  if (!current) throw new DomainError("NOT_FOUND", "Không tìm thấy suất", 404);
  return saveShowtime({ ...current, closed: true });
}

export async function cancelBooking(id: string) {
  const booking = await getBookingById(id);
  if (!booking) throw new DomainError("NOT_FOUND", "Không tìm thấy đơn", 404);
  if (booking.status === "USED") {
    throw new DomainError("CANCEL_NOT_ALLOWED", "Vé đã check-in, không hủy được");
  }
  const next = await saveBooking({ ...booking, status: booking.status === "PAID" ? "VOIDED" : "CANCELLED" });
  await notifyUser({
    userEmail: next.userEmail,
    type: "BOOKING_CANCELLED",
    title: "Đơn vé đã bị hủy",
    body: `Admin đã hủy vé ${next.code}. Ghế ${next.seats.join(", ")} không còn hiệu lực.`,
    href: `/tickets/${next.code}`,
    bookingId: next.id,
    movieSlug: next.movieSlug,
    dedupe: false,
  });
  return next;
}

export async function refundBooking(id: string) {
  const booking = await getBookingById(id);
  if (!booking) throw new DomainError("NOT_FOUND", "Không tìm thấy đơn", 404);
  if (booking.status !== "PAID" && booking.status !== "VOIDED") {
    throw new DomainError("CANCEL_NOT_ALLOWED", "Chỉ hoàn tiền đơn đã thanh toán");
  }
  const next = await saveBooking({ ...booking, status: "REFUNDED" });
  await notifyUser({
    userEmail: next.userEmail,
    type: "BOOKING_REFUNDED",
    title: "Đã hoàn tiền",
    body: `Vé ${next.code} đã được hoàn tiền. Số tiền sẽ về theo phương thức thanh toán đã dùng.`,
    href: `/tickets/${next.code}`,
    bookingId: next.id,
    movieSlug: next.movieSlug,
    dedupe: false,
  });
  return next;
}

export async function checkInTicket(code: string) {
  const booking = await getBookingByCode(code);
  if (!booking) throw new DomainError("NOT_FOUND", "Không tìm thấy vé", 404);
  if (booking.status === "USED") {
    throw new DomainError("ALREADY_CHECKED_IN", "Vé đã check-in");
  }
  if (booking.status !== "PAID") {
    throw new DomainError("FORBIDDEN_BOOKING", "Vé chưa thanh toán hoặc đã hủy");
  }
  return saveBooking({ ...booking, status: "USED" });
}

export async function listAdminUsers() {
  return (await listUsers()).map(toPublicUser);
}

export async function changeUserRole(id: string, body: unknown) {
  const role = parseUserRole(body);
  const user = await updateUser(id, { role });
  if (!user) throw new DomainError("NOT_FOUND", "Không tìm thấy tài khoản", 404);
  return toPublicUser(user);
}

export async function revenueReport() {
  const bookings = await listBookings();
  const counted = bookings.filter((item) => item.status === "PAID" || item.status === "USED");
  const byMovie = new Map<string, number>();
  for (const item of counted) {
    byMovie.set(item.movieSlug, (byMovie.get(item.movieSlug) ?? 0) + item.total);
  }
  return {
    total: counted.reduce((sum, item) => sum + item.total, 0),
    paidCount: counted.length,
    byMovie: [...byMovie.entries()].map(([movieSlug, total]) => ({ movieSlug, total })),
  };
}

export { listBookings, listMovies, listShowtimes };
