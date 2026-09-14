import React, { createContext, useContext, useEffect, useState } from 'react';
import { Movie, Showtime } from '../types';
import { fetchMovies, fetchShowtimes } from '../api/catalog';
import { mockMovies, mockShowtimes } from '../data/mock-data';

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
  const [movies, setMovies] = useState<Movie[]>(mockMovies);
  const [showtimes, setShowtimes] = useState<Showtime[]>(mockShowtimes);
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
      setError(err?.message || 'Không thể tải danh mục phim');
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

