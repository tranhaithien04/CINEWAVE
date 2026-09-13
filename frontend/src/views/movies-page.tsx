"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { AgeRating } from "@/@types/movie";
import { MovieFilters } from "@/components/movies/movie-filters";
import { MovieGrid } from "@/components/movies/movie-grid";
import { Input } from "@/components/ui/input";
import { useCatalog } from "@/hooks/use-catalog";

export function MoviesPage() {
  const { movies, loading } = useCatalog();
  const [rating, setRating] = useState<AgeRating | "ALL">("ALL");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return movies.filter((movie) => {
      const matchRating = rating === "ALL" || movie.rating === rating;
      const matchQuery =
        !needle ||
        movie.title.toLowerCase().includes(needle) ||
        movie.genres.some((genre) => genre.toLowerCase().includes(needle));
      return matchRating && matchQuery;
    });
  }, [movies, query, rating]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">IMAX Catalog</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-white md:text-5xl">
            Danh sách phim
          </h1>
          <p className="text-xs text-gray-400">
            Hiển thị <span className="font-bold text-cyan-300">{filtered.length}</span> tác phẩm điện ảnh đang mở bán vé.
          </p>
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm tên phim hoặc thể loại..."
            className="rounded-xl border-white/10 bg-cinema-900/80 pl-9 backdrop-blur-md transition-all duration-300 focus:border-cyan-400 focus:shadow-neon"
          />
        </div>
      </div>
      <MovieFilters value={rating} onChange={setRating} />
      <MovieGrid movies={filtered} loading={loading} error={null} />
    </main>
  );
}

export default MoviesPage;
