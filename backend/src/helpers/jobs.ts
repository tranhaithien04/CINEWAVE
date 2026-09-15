import { getMovieBySlug, getShowtimeById } from "./catalog-store.js";
import { listBookings } from "./booking-store.js";
import { notifyUser } from "../services/notification.service.js";
import { runCatalogMaintenance } from "../services/catalog-maintenance.service.js";
import { expireStalePayments } from "../services/payment.service.js";
import { purgeCccdTmp } from "../services/age-verification.service.js";

const CATALOG_MAINTENANCE_MS = 15 * 60 * 1000;
let lastCatalogMaintenanceAt = 0;

const HOLD_WARN_MS = 2 * 60 * 1000;
const SHOWTIME_REMIND_MS = 60 * 60 * 1000;

export async function expireHolds() {}
export async function expirePayments() {
  await expireStalePayments();
}
export async function reconcilePayments() {}
export { purgeCccdTmp };

export async function warnHoldExpiring() {
  const now = Date.now();
  const bookings = await listBookings();
  for (const booking of bookings) {
    if (booking.status !== "HELD" || !booking.holdExpiresAt || !booking.userEmail) continue;
    const expires = new Date(booking.holdExpiresAt).getTime();
    if (expires <= now || expires - now > HOLD_WARN_MS) continue;
    const movie = await getMovieBySlug(booking.movieSlug);
    await notifyUser({
      userEmail: booking.userEmail,
      type: "HOLD_EXPIRING",
      title: "Ghế sắp hết giờ giữ",
      body: `Đơn ${booking.code} (${movie?.title ?? booking.movieSlug}) sẽ hết giữ ghế trong ít phút. Thanh toán ngay để không mất ghế.`,
      href: `/checkout/${booking.id}`,
      bookingId: booking.id,
      movieSlug: booking.movieSlug,
      dedupe: true,
    });
  }
}

export async function remindUpcomingShowtimes() {
  const now = Date.now();
  const bookings = await listBookings();
  for (const booking of bookings) {
    if ((booking.status !== "PAID" && booking.status !== "USED") || !booking.userEmail) continue;
    const showtime = await getShowtimeById(booking.showtimeId);
    if (!showtime) continue;
    const starts = new Date(showtime.startsAt).getTime();
    const delta = starts - now;
    if (delta <= 0 || delta > SHOWTIME_REMIND_MS) continue;
    const movie = await getMovieBySlug(booking.movieSlug);
    await notifyUser({
      userEmail: booking.userEmail,
      type: "SHOWTIME_REMINDER",
      title: "Sắp tới giờ chiếu",
      body: `${movie?.title ?? booking.movieSlug} chiếu lúc ${new Date(showtime.startsAt).toLocaleString("vi-VN")}. Vé ${booking.code} · ghế ${booking.seats.join(", ")}.`,
      href: `/tickets/${booking.code}`,
      bookingId: booking.id,
      movieSlug: booking.movieSlug,
      dedupe: true,
    });
  }
}

function maybeCatalogMaintenance() {
  const now = Date.now();
  if (now - lastCatalogMaintenanceAt < CATALOG_MAINTENANCE_MS) return;
  lastCatalogMaintenanceAt = now;
  void runCatalogMaintenance();
}

export function startBackgroundJobs() {
  const tick = () => {
    void warnHoldExpiring();
    void remindUpcomingShowtimes();
    void expireHolds();
    void expirePayments();
    void purgeCccdTmp();
    maybeCatalogMaintenance();
  };
  tick();
  return setInterval(tick, 30_000);
}
