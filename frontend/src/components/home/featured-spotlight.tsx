"use client";

import Image from "next/image";
import Link from "next/link";
import { Ticket } from "lucide-react";

import { m } from "@/components/motion";
import { Button } from "@/components/ui/button";
import type { Movie } from "@/@types/movie";
import { paths } from "@/routes/paths";

export function FeaturedSpotlight({
  movie,
  onBook,
}: {
  movie: Movie;
  onBook: () => void;
}) {
  return (
    <section className="relative flex min-h-0 flex-col items-center justify-center overflow-visible px-4 py-16 sm:min-h-[100svh] sm:py-24">
      <m.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 mx-auto w-full max-w-4xl"
      >
        <div className="group relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-cinema-900/60 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl transition-[border-color] duration-500 hover:border-cyan-400 sm:rounded-3xl">
          <div className="relative flex flex-col sm:block">
            <div className="relative aspect-[16/10] w-full sm:aspect-[21/9] sm:min-h-[320px]">
              <Image
                src={movie.backdropUrl}
                alt={movie.title}
                fill
                priority
                sizes="(min-width: 1024px) 80vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/55 to-transparent sm:bg-gradient-to-r sm:from-cinema-950 sm:via-cinema-950/70 sm:to-transparent" />
            </div>

            <div className="relative flex flex-col justify-end gap-1 p-5 sm:absolute sm:inset-x-0 sm:bottom-0 sm:p-8 md:p-12">
              <div className="inline-flex flex-col items-start gap-1.5">
                <p className="font-display text-lg font-black leading-none tracking-tight sm:text-xl md:text-[1.75rem]">
                  <span className="bg-gradient-to-r from-amber-200 via-yellow-50 to-amber-300 bg-clip-text text-transparent">
                    Phim nổi bật tuần này
                  </span>
                </p>
                <span
                  aria-hidden
                  className="h-[2px] w-14 rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-transparent"
                />
              </div>
              <h2 className="mt-3 font-display text-2xl font-black text-white sm:text-3xl md:text-5xl">
                {movie.title}
              </h2>
              <p className="mt-2 line-clamp-3 max-w-2xl text-sm text-gray-300 sm:line-clamp-2 md:text-base">
                {movie.description}
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <Button
                  type="button"
                  size="lg"
                  className="w-full shadow-lg shadow-cyan-500/30 sm:w-auto"
                  onClick={onBook}
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  Đặt vé suất sớm
                </Button>
                <Link
                  href={paths.movie(movie.slug)}
                  className="text-center text-sm font-semibold text-cyan-300 hover:underline sm:text-left"
                >
                  Xem chi tiết phim →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </m.div>
    </section>
  );
}
