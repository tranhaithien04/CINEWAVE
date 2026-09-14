import type { Movie, Showtime } from "@/@types/movie";
import type { Seat } from "@/@types/seat";

import { api } from "./client";

export type SimilarMovie = {
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  year: string | null;
  slug?: string;
  imdbRating?: number;
};

export function fetchMovies() {
  return api<{ movies: Movie[] }>("/movies");
}

export function fetchMovie(slug: string) {
  return api<{ movie: Movie }>(`/movies/${slug}`);
}

export function fetchSimilarMovies(slug: string) {
  return api<{ movies: SimilarMovie[] }>(`/movies/${encodeURIComponent(slug)}/similar`);
}

export function fetchShowtimes(movieSlug?: string) {
  const query = movieSlug ? `?movieSlug=${encodeURIComponent(movieSlug)}` : "";
  return api<{ showtimes: Showtime[] }>(`/showtimes${query}`);
}

export function fetchShowtime(id: string) {
  return api<{ showtime: Showtime }>(`/showtimes/${id}`);
}

export function fetchShowtimeSeats(id: string) {
  return api<{ showtimeId: string; blockedSeats?: string[]; seats: Seat[] }>(
    `/showtimes/${encodeURIComponent(id)}/seats`,
  );
}

export type ConcessionItem = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export function fetchConcessions() {
  return api<{ items: ConcessionItem[] }>("/concessions");
}
