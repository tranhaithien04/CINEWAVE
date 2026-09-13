"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { Movie, Showtime } from "@/@types/movie";
import { fetchMovies, fetchShowtimes } from "@/api/catalog";
import { movies as fallbackMovies, showtimes as fallbackShowtimes } from "@/data/mock-catalog";

type CatalogContextValue = {
  movies: Movie[];
  showtimes: Showtime[];
  loading: boolean;
  refresh: () => Promise<void>;
  getMovieBySlug: (slug: string) => Movie | null;
  getShowtimesByMovie: (slug: string) => Showtime[];
  getShowtimeById: (id: string) => Showtime | null;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [movies, setMovies] = useState<Movie[]>(fallbackMovies);
  const [showtimes, setShowtimes] = useState<Showtime[]>(fallbackShowtimes);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [movieData, showData] = await Promise.all([fetchMovies(), fetchShowtimes()]);
      setMovies(movieData.movies);
      setShowtimes(showData.showtimes);
    } catch {
      /* keep last known catalog */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<CatalogContextValue>(
    () => ({
      movies,
      showtimes,
      loading,
      refresh,
      getMovieBySlug: (slug) => movies.find((movie) => movie.slug === slug) ?? null,
      getShowtimesByMovie: (slug) => showtimes.filter((show) => show.movieSlug === slug),
      getShowtimeById: (id) => showtimes.find((show) => show.id === id) ?? null,
    }),
    [movies, showtimes, loading, refresh],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return context;
}
