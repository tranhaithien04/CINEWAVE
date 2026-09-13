"use client";

import useEmblaCarousel from "embla-carousel-react";

import type { Movie } from "@/@types/movie";
import { MovieCard } from "@/components/movies/movie-card";

export function MovieCarousel({ movies }: { movies: Movie[] }) {
  const [viewportRef] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  return (
    <div className="overflow-hidden" ref={viewportRef}>
      <div className="-ml-4 flex">
        {movies.map((movie, index) => (
          <div key={movie.id} className="min-w-0 shrink-0 grow-0 basis-[48%] pl-4 sm:basis-[32%] lg:basis-[24%]">
            <MovieCard movie={movie} priority={index < 2} />
          </div>
        ))}
      </div>
    </div>
  );
}
