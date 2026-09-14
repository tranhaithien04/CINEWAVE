"use client";

import { m } from "@/components/motion";
import Image from "next/image";
import Link from "next/link";
import { Clock, Play, Star, Ticket } from "lucide-react";

import type { Movie } from "@/@types/movie";
import { AgeBadge } from "@/components/movies/age-badge";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { paths } from "@/routes/paths";

export function MovieCard({ movie, priority = false }: { movie: Movie; priority?: boolean }) {
  const reduced = usePrefersReducedMotion();

  return (
    <m.div
      whileHover={reduced ? undefined : { y: -6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full"
    >
      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-cinema-900/70 shadow-xl backdrop-blur-md transition-[border-color,box-shadow] duration-300 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/15">
        <Link href={paths.movie(movie.slug)} className="relative aspect-[2/3] w-full overflow-hidden bg-cinema-800">
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 24vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-transparent to-black/40 opacity-80 transition-opacity group-hover:opacity-90" />
          <AgeBadge rating={movie.rating} className="absolute right-3 top-3 z-10" />
          {typeof movie.imdbRating === "number" ? (
            <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-amber-300 backdrop-blur-md">
              <Star className="h-3 w-3 fill-current" />
              {movie.imdbRating.toFixed(1)}
            </span>
          ) : !movie.nowShowing ? (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-2 py-0.5 text-[10px] font-bold text-black shadow-lg shadow-amber-500/25">
              Sắp chiếu
            </span>
          ) : null}
          {!movie.nowShowing && typeof movie.imdbRating === "number" ? (
            <span className="absolute left-3 top-11 z-10 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-2 py-0.5 text-[10px] font-bold text-black shadow-lg shadow-amber-500/25">
              Sắp chiếu
            </span>
          ) : null}
          <span className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/90 text-white shadow-lg shadow-cyan-500/40 backdrop-blur-sm transition-transform group-hover:scale-110">
              <Play className="ml-1 h-6 w-6 fill-current" />
            </span>
          </span>
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-gray-300 backdrop-blur-md">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>{movie.durationMin} phút</span>
          </div>
        </Link>
        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <h3 className="mb-1 line-clamp-1 font-display text-base font-bold text-white transition-colors group-hover:text-cyan-400">
              {movie.title}
            </h3>
            <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-gray-400">{movie.description}</p>
          </div>
          <div className="border-t border-white/5 pt-2">
            <Button asChild size="sm" className="w-full">
              <Link href={paths.movie(movie.slug)}>
                <Ticket className="h-4 w-4" />
                Đặt vé ngay
              </Link>
            </Button>
          </div>
        </div>
      </article>
    </m.div>
  );
}
