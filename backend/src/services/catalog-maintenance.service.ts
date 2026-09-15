import { BookingModel } from "../db/models.js";
import { getAppMeta, setAppMeta } from "../helpers/app-meta-store.js";
import {
  ensureShowtimesForNextWeek,
  listMovies,
  listShowtimes,
  listShowtimesByMovieSlug,
  removeShowtimesByIds,
} from "../helpers/catalog-store.js";
import { deleteBookingsByShowtimeIds } from "../helpers/booking-store.js";

const WEEKLY_META_KEY = "catalogWeeklyShowtimesAt";
const WEEKLY_MS = 7 * 24 * 60 * 60 * 1000;
const END_BUFFER_MS = 15 * 60 * 1000;
const DEFAULT_DURATION_MIN = 120;

function showtimeEndedAtMs(startsAt: string, durationMin: number) {
  return new Date(startsAt).getTime() + durationMin * 60 * 1000 + END_BUFFER_MS;
}

export async function purgeEndedShowtimesAndBookings() {
  const movies = await listMovies();
  const durationBySlug = new Map(movies.map((movie) => [movie.slug, movie.durationMin]));
  const showtimes = await listShowtimes();
  const endedIds: string[] = [];

  for (const showtime of showtimes) {
    const durationMin = durationBySlug.get(showtime.movieSlug) ?? DEFAULT_DURATION_MIN;
    if (Date.now() > showtimeEndedAtMs(showtime.startsAt, durationMin)) {
      endedIds.push(showtime.id);
    }
  }

  if (!endedIds.length) {
    return { showtimesRemoved: 0, bookingsRemoved: 0 };
  }

  const bookingsRemoved = await deleteBookingsByShowtimeIds(endedIds);
  const showtimesRemoved = await removeShowtimesByIds(endedIds);
  return { showtimesRemoved, bookingsRemoved };
}

export async function ensureNowShowingHaveUpcomingShowtimes() {
  const movies = (await listMovies()).filter((movie) => movie.nowShowing);
  let moviesRefreshed = 0;
  let showtimesCreated = 0;

  for (const movie of movies) {
    const slots = await listShowtimesByMovieSlug(movie.slug);
    const futureForMovie = slots.filter(
      (item) => new Date(item.startsAt).getTime() > Date.now() + END_BUFFER_MS,
    );
    if (futureForMovie.length) continue;
    const created = await ensureShowtimesForNextWeek(movie.slug);
    if (created.length) {
      moviesRefreshed += 1;
      showtimesCreated += created.length;
    }
  }

  return { moviesRefreshed, showtimesCreated };
}

export async function refreshWeeklyShowtimesForNowShowing() {
  const movies = (await listMovies()).filter((movie) => movie.nowShowing);
  let showtimesCreated = 0;
  for (const movie of movies) {
    const created = await ensureShowtimesForNextWeek(movie.slug);
    showtimesCreated += created.length;
  }
  await setAppMeta(WEEKLY_META_KEY, new Date().toISOString());
  return { movies: movies.length, showtimesCreated };
}

async function shouldRunWeeklyRefresh() {
  const last = await getAppMeta(WEEKLY_META_KEY);
  if (!last) return true;
  const lastMs = new Date(last).getTime();
  if (!Number.isFinite(lastMs)) return true;
  return Date.now() - lastMs >= WEEKLY_MS;
}

export async function runCatalogMaintenance() {
  const purged = await purgeEndedShowtimesAndBookings();
  const refilled = await ensureNowShowingHaveUpcomingShowtimes();

  let weekly = { movies: 0, showtimesCreated: 0 };
  if (await shouldRunWeeklyRefresh()) {
    weekly = await refreshWeeklyShowtimesForNowShowing();
  }

  if (purged.showtimesRemoved || purged.bookingsRemoved || refilled.showtimesCreated || weekly.showtimesCreated) {
    console.log(
      `[catalog-maintenance] suất đã xóa=${purged.showtimesRemoved}, vé đã xóa=${purged.bookingsRemoved}, bù suất=${refilled.showtimesCreated}, tuần mới +${weekly.showtimesCreated}`,
    );
  }

  return { purged, refilled, weekly };
}
