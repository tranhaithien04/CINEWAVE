import { api } from './client';
import { ConcessionItem, Movie, Seat, Showtime } from '../types';

export type SimilarMovie = {
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  year: string | null;
  slug?: string;
  imdbRating?: number;
};

function normalizeSeat(raw: Seat & { status?: string; state?: string }): Seat {
  const state = (raw.state ?? raw.status ?? 'AVAILABLE') as Seat['state'];
  return { ...raw, state };
}

export async function fetchMovies(): Promise<Movie[]> {
  const res = await api<{ movies: Movie[] }>('/movies');
  return res.movies;
}

export async function fetchMovieBySlug(slug: string): Promise<Movie | null> {
  const res = await api<{ movie: Movie }>(`/movies/${slug}`);
  return res.movie;
}

export async function fetchShowtimes(movieSlug?: string): Promise<Showtime[]> {
  const query = movieSlug ? `?movieSlug=${encodeURIComponent(movieSlug)}` : '';
  const res = await api<{ showtimes: Showtime[] }>(`/showtimes${query}`);
  return res.showtimes;
}

export async function fetchShowtimeById(id: string): Promise<Showtime | null> {
  const res = await api<{ showtime: Showtime }>(`/showtimes/${id}`);
  return res.showtime;
}

export async function fetchShowtimeSeats(id: string): Promise<Seat[]> {
  const res = await api<{ seats: Seat[] }>(`/showtimes/${encodeURIComponent(id)}/seats`);
  return (res.seats ?? []).map(normalizeSeat);
}

export async function fetchConcessions(): Promise<ConcessionItem[]> {
  const res = await api<{ items: ConcessionItem[] }>('/concessions');
  return res.items;
}

export async function fetchSimilarMovies(slug: string): Promise<SimilarMovie[]> {
  const res = await api<{ movies: SimilarMovie[] }>(`/movies/${encodeURIComponent(slug)}/similar`);
  return res.movies;
}
