import React, { createContext, useContext, useEffect, useState } from 'react';
import { Movie, Showtime } from '../types';
import { fetchMovies, fetchShowtimes } from '../api/catalog';
import { getApiUrl } from '../api/client';

type CatalogContextType = {
  movies: Movie[];
  showtimes: Showtime[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getMovieBySlug: (slug: string) => Movie | undefined;
  getShowtimesByMovie: (slug: string) => Showtime[];
  getShowtimeById: (id: string) => Showtime | undefined;
};

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedMovies, fetchedShowtimes] = await Promise.all([
        fetchMovies(),
        fetchShowtimes(),
      ]);
      setMovies(fetchedMovies);
      setShowtimes(fetchedShowtimes);
      setError(null);
    } catch (err: any) {
      // Keep last successful catalog (same as web). Surface API URL so mismatch is obvious.
      const base = getApiUrl();
      setError(
        err?.message
          ? `${err.message} · API: ${base}`
          : `Không thể tải danh mục phim · API: ${base}`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const getMovieBySlug = (slug: string) => {
    return movies.find((m) => m.slug === slug);
  };

  const getShowtimesByMovie = (slug: string) => {
    return showtimes.filter((s) => s.movieSlug === slug);
  };

  const getShowtimeById = (id: string) => {
    return showtimes.find((s) => s.id === id);
  };

  return (
    <CatalogContext.Provider
      value={{
        movies,
        showtimes,
        loading,
        error,
        refresh: loadData,
        getMovieBySlug,
        getShowtimesByMovie,
        getShowtimeById,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}
