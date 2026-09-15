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
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-visible px-4 py-24">
      <m.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 mx-auto w-full max-w-4xl"
      >
        <div className="group relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-cinema-900/60 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl transition-[border-color] duration-500 hover:border-cyan-400">
          <div className="relative aspect-[21/9] min-h-[320px] w-full">
            <Image
              src={movie.backdropUrl}
              alt={movie.title}
              fill
              priority
              sizes="(min-width: 1024px) 80vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-cinema-950 via-cinema-950/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-8 md:p-12">
              <div className="inline-flex flex-col items-start gap-1.5">
                <p className="font-display text-xl font-black leading-none tracking-tight sm:text-2xl md:text-[1.75rem]">
                  <span className="bg-gradient-to-r from-amber-200 via-yellow-50 to-amber-300 bg-clip-text text-transparent">
                    Phim nổi bật tuần này
                  </span>
                </p>
                <span
                  aria-hidden
                  className="h-[2px] w-14 rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-transparent"
                />
              </div>
              <h2 className="mt-3 font-display text-3xl font-black text-white sm:text-5xl">{movie.title}</h2>
              <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-gray-300 md:text-base">{movie.description}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Button type="button" size="lg" className="shadow-lg shadow-cyan-500/30" onClick={onBook}>
                  <Ticket className="mr-2 h-4 w-4" />
                  Đặt vé suất sớm
                </Button>
                <Link href={paths.movie(movie.slug)} className="text-sm font-semibold text-cyan-300 hover:underline">
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
