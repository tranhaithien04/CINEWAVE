import { getMovieBySlug, getShowtimeById, listMovies, listShowtimes } from "../helpers/catalog-store.js";
import { listConcessionMenu } from "../helpers/concessions.js";
import { DomainError } from "../models/errors.js";
import { listSimilarMovies } from "./movie-import.service.js";
import { listShowtimeSeats } from "./booking.service.js";
import { findUserById } from "../helpers/user-store.js";

export async function listPublicMovies() {
  return listMovies();
}

export async function getPublicMovie(slug: string) {
  const movie = await getMovieBySlug(slug);
  if (!movie) {
    throw new DomainError("NOT_FOUND", "Không tìm thấy phim", 404);
  }
  return movie;
}

export async function listPublicSimilar(slug: string) {
  return listSimilarMovies(slug);
}

export async function listPublicShowtimes(movieSlug?: string) {
  const showtimes = await listShowtimes();
  return movieSlug ? showtimes.filter((show) => show.movieSlug === movieSlug) : showtimes;
}

export async function getPublicShowtime(id: string) {
  const showtime = await getShowtimeById(id);
  if (!showtime) {
    throw new DomainError("NOT_FOUND", "Không tìm thấy suất", 404);
  }
  return showtime;
}

export async function listPublicCinemas() {
  const showtimes = await listShowtimes();
  return [...new Set(showtimes.map((show) => show.cinema))].map((name) => ({ name }));
}

export async function listPublicSeats(showtimeId: string, userId?: string) {
  const email = userId ? (await findUserById(userId))?.email : null;
  return listShowtimeSeats(showtimeId, email);
}

export async function listConcessions() {
  return listConcessionMenu(false);
}
