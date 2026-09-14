import { api } from './client';
import { Movie, Showtime } from '../types';
import { mockMovies, mockShowtimes } from '../data/mock-data';

export async function fetchMovies(): Promise<Movie[]> {
  try {
    const res = await api<{ movies: Movie[] }>('/movies');
    return res.movies;
  } catch {
    return mockMovies;
  }
}

export async function fetchMovieBySlug(slug: string): Promise<Movie | null> {
  try {
    const res = await api<{ movie: Movie }>(`/movies/${slug}`);
    return res.movie;
  } catch {
    return mockMovies.find((m) => m.slug === slug) || null;
  }
}

export async function fetchShowtimes(movieSlug?: string): Promise<Showtime[]> {
  try {
    const query = movieSlug ? `?movieSlug=${encodeURIComponent(movieSlug)}` : '';
    const res = await api<{ showtimes: Showtime[] }>(`/showtimes${query}`);
    return res.showtimes;
  } catch {
    if (movieSlug) {
      return mockShowtimes.filter((s) => s.movieSlug === movieSlug);
    }
    return mockShowtimes;
  }
}

export async function fetchShowtimeById(id: string): Promise<Showtime | null> {
  try {
    const res = await api<{ showtime: Showtime }>(`/showtimes/${id}`);
    return res.showtime;
  } catch {
    return mockShowtimes.find((s) => s.id === id) || null;
  }
}

