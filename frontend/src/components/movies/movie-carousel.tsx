"use client";

import { useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";

import type { Movie } from "@/@types/movie";
import { MovieCard } from "@/components/movies/movie-card";

export function MovieCarousel({ movies }: { movies: Movie[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [viewportRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();

    const root = emblaApi.rootNode();
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          emblaApi.reInit();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, [emblaApi, movies.length]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !emblaApi) return;

    const onWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;

      const goingNext = delta > 0;
      const canNext = emblaApi.canScrollNext();
      const canPrev = emblaApi.canScrollPrev();

      // Đầu/cuối + cuộn tiếp cùng chiều → trả quyền cuộn dọc cho trang (Lenis)
      if (goingNext && !canNext) return;
      if (!goingNext && !canPrev) return;
      if (!canNext && !canPrev) return;

      // Đang cuộn ngang trong carousel → chặn cuộn trang
      event.preventDefault();
      event.stopPropagation();

      const engine = emblaApi.internalEngine();
      engine.scrollBody.useDuration(18).useFriction(0.75);
      engine.scrollTo.distance(delta, false);
    };

    wrap.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => wrap.removeEventListener("wheel", onWheel, { capture: true });
  }, [emblaApi]);

  return (
    <div ref={wrapRef} className="relative">
      <div
        ref={viewportRef}
        className="overflow-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="-ml-4 flex">
          {movies.map((movie, index) => (
            <div
              key={movie.id}
              className="min-w-0 shrink-0 grow-0 basis-[48%] pl-4 sm:basis-[32%] lg:basis-[24%]"
            >
              <MovieCard movie={movie} priority={index < 2} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
