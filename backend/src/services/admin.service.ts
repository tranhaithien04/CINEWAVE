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
import { getRoomLayout, saveRoomLayout } from "../helpers/room-layout.js";
import { DomainError } from "../models/errors.js";
import { parseBroadcastInput, parseConcessionInput, parseMovieInput, parseRoomBlockedInput, parseRoomLayoutInput, parseShowtimeInput, parseUserRole, slugify } from "../validators/admin.js";
import {
  deleteConcessionItem,
  listConcessionMenu,
  saveConcessionItem,
} from "../helpers/concessions.js";
import { listAgeVerifications } from "../helpers/age-verification-store.js";
import { notifyUser } from "./notification.service.js";
import { checkInTicket as checkInPaidTicket } from "./ticket.service.js";
import { parseBlockedSeatsInput } from "../helpers/seat-pricing.js";

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
  return checkInPaidTicket(code);
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
  const [bookings, showtimes] = await Promise.all([listBookings(), listShowtimes()]);
  const counted = bookings.filter((item) => item.status === "PAID" || item.status === "USED");
  const showById = new Map(showtimes.map((show) => [show.id, show]));
  const byMovie = new Map<string, number>();
  const byCinema = new Map<string, number>();
  let seatRevenue = 0;
  let concessionRevenue = 0;

  for (const item of counted) {
    byMovie.set(item.movieSlug, (byMovie.get(item.movieSlug) ?? 0) + item.total);
    const cinema = showById.get(item.showtimeId)?.cinema ?? "Khác";
    byCinema.set(cinema, (byCinema.get(cinema) ?? 0) + item.total);
    seatRevenue += item.seatTotal ?? item.total;
    concessionRevenue += item.concessionTotal ?? 0;
  }

  return {
    total: counted.reduce((sum, item) => sum + item.total, 0),
    paidCount: counted.length,
    seatRevenue,
    concessionRevenue,
    byMovie: [...byMovie.entries()]
      .map(([movieSlug, total]) => ({ movieSlug, total }))
      .sort((a, b) => b.total - a.total),
    byCinema: [...byCinema.entries()]
      .map(([cinema, total]) => ({ cinema, total }))
      .sort((a, b) => b.total - a.total),
  };
}

export async function listRooms() {
  const showtimes = await listShowtimes();
  const rooms = new Map<
    string,
    { cinema: string; room: string; blockedSeats: string[]; showtimeCount: number }
  >();
  for (const show of showtimes) {
    const key = `${show.cinema}::${show.room}`;
    const current = rooms.get(key);
    if (!current) {
      rooms.set(key, {
        cinema: show.cinema,
        room: show.room,
        blockedSeats: [...(show.blockedSeats ?? [])],
        showtimeCount: 1,
      });
      continue;
    }
    current.showtimeCount += 1;
  }
  const list = [...rooms.values()].sort((a, b) =>
    a.cinema === b.cinema ? a.room.localeCompare(b.room) : a.cinema.localeCompare(b.cinema),
  );
  return Promise.all(
    list.map(async (room) => {
      const layout = await getRoomLayout(room.cinema, room.room);
      const known = new Set(layout.seats.map((seat) => seat.label));
      const blockedSeats = room.blockedSeats.filter((label) => known.has(label.toUpperCase()));
      return {
        ...room,
        blockedSeats,
        seats: layout.seats,
        layoutUpdatedAt: layout.updatedAt,
      };
    }),
  );
}

export async function listCinemas() {
  const rooms = await listRooms();
  const map = new Map<string, { name: string; roomCount: number; showtimeCount: number; rooms: string[] }>();
  for (const room of rooms) {
    const current = map.get(room.cinema);
    if (!current) {
      map.set(room.cinema, {
        name: room.cinema,
        roomCount: 1,
        showtimeCount: room.showtimeCount,
        rooms: [room.room],
      });
      continue;
    }
    current.roomCount += 1;
    current.showtimeCount += room.showtimeCount;
    current.rooms.push(room.room);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function updateRoomBlockedSeats(body: unknown) {
  if (body && typeof body === "object" && Array.isArray((body as { seats?: unknown }).seats)) {
    return updateRoomLayout(body);
  }

  const input = parseRoomBlockedInput(body);
  const layout = await getRoomLayout(input.cinema, input.room);
  let blockedSeats: string[];
  try {
    blockedSeats = parseBlockedSeatsInput(input.blockedSeats, layout.seats);
  } catch (error) {
    throw new DomainError(
      "VALIDATION_ERROR",
      error instanceof Error ? error.message : "Danh sách ghế khóa không hợp lệ",
    );
  }

  const showtimes = await listShowtimes();
  const matched = showtimes.filter(
    (show) => show.cinema === input.cinema && show.room === input.room,
  );
  if (!matched.length) {
    throw new DomainError("NOT_FOUND", "Không tìm thấy phòng chiếu nào khớp", 404);
  }
  const updated = [];
  for (const show of matched) {
    updated.push(await saveShowtime({ ...show, blockedSeats }));
  }
  return {
    cinema: input.cinema,
    room: input.room,
    blockedSeats,
    seats: layout.seats,
    updatedCount: updated.length,
    showtimes: updated,
  };
}

export async function updateRoomLayout(body: unknown) {
  const input = parseRoomLayoutInput(body);
  const layout = await saveRoomLayout({
    cinema: input.cinema,
    room: input.room,
    seats: input.seats,
  });

  const showtimes = await listShowtimes();
  const matched = showtimes.filter(
    (show) => show.cinema === input.cinema && show.room === input.room,
  );
  if (!matched.length) {
    throw new DomainError("NOT_FOUND", "Không tìm thấy phòng chiếu nào khớp", 404);
  }

  const updated = [];
  for (const show of matched) {
    updated.push(await saveShowtime({ ...show, blockedSeats: input.blockedSeats }));
  }

  return {
    cinema: input.cinema,
    room: input.room,
    blockedSeats: input.blockedSeats,
    seats: layout.seats,
    layoutUpdatedAt: layout.updatedAt,
    updatedCount: updated.length,
    showtimes: updated,
  };
}

export async function listAdminConcessions() {
  return listConcessionMenu(true);
}

export async function upsertAdminConcession(body: unknown) {
  const input = parseConcessionInput(body);
  try {
    return await saveConcessionItem(input);
  } catch {
    throw new DomainError("VALIDATION_ERROR", "Tên và giá combo không hợp lệ");
  }
}

export async function removeAdminConcession(id: string) {
  if (!(await deleteConcessionItem(id))) {
    throw new DomainError("NOT_FOUND", "Không tìm thấy món F&B", 404);
  }
  return { ok: true };
}

export async function listAdminAgeVerifications() {
  return listAgeVerifications();
}

export async function broadcastNotification(body: unknown) {
  const input = parseBroadcastInput(body);
  const users = await listUsers();
  let sent = 0;
  for (const user of users) {
    const note = await notifyUser({
      userId: user.id,
      type: "ADMIN_BROADCAST",
      title: input.title,
      body: input.body,
      href: input.href,
      dedupe: false,
    });
    if (note) sent += 1;
  }
  return { sent, totalUsers: users.length };
}

export { listBookings, listMovies, listShowtimes };
