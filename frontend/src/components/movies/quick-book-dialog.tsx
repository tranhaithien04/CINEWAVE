"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { Movie, Showtime } from "@/@types/movie";
import { AgeBadge } from "@/components/movies/age-badge";
import { EmptyState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatVnd } from "@/data/mock-catalog";
import { useLenis } from "@/components/providers/smooth-scroll-provider";
import { useCatalog } from "@/hooks/use-catalog";
import { paths } from "@/routes/paths";
import { cn } from "@/utils/cn";

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
const dayLabelFmt = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});
const showTimeFmt = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

function dayKey(iso: string) {
  return dayKeyFmt.format(new Date(iso));
}

function formatDay(iso: string) {
  return dayLabelFmt.format(new Date(iso));
}

function formatTime(iso: string) {
  return showTimeFmt.format(new Date(iso));
}

function upcomingShowtimes(showtimes: Showtime[]) {
  const now = Date.now() - 5 * 60 * 1000;
  return showtimes
    .filter((item) => !item.closed && new Date(item.startsAt).getTime() >= now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

type QuickBookDialogProps = {
  movie: Movie | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuickBookDialog({ movie, open, onOpenChange }: QuickBookDialogProps) {
  const lenis = useLenis();
  const { getShowtimesByMovie } = useCatalog();
  const times = useMemo(
    () => (movie ? upcomingShowtimes(getShowtimesByMovie(movie.slug)) : []),
    [getShowtimesByMovie, movie],
  );
  const days = useMemo(() => [...new Set(times.map((item) => dayKey(item.startsAt)))], [times]);
  const [day, setDay] = useState("");
  const visible = times.filter((item) => dayKey(item.startsAt) === day);

  useEffect(() => {
    if (!open) return;
    setDay(days[0] ?? "");
  }, [open, days, movie?.slug]);

  // Lenis chặn wheel của vùng overflow trong dialog — tắt khi mở, bật lại khi đóng
  useEffect(() => {
    if (!lenis) return;
    if (open) {
      lenis.stop();
      return () => {
        lenis.start();
      };
    }
    lenis.start();
  }, [open, lenis]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-lenis-prevent
        className="grid max-h-[min(92vh,760px)] w-[calc(100%-1.5rem)] max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-3xl border-white/10 bg-[#0b0f1c] p-0 shadow-2xl shadow-cyan-500/15 sm:rounded-3xl"
      >
        {movie ? (
          <>
            <div className="relative overflow-hidden">
              <div className="relative h-28 w-full sm:h-36">
                <Image src={movie.backdropUrl} alt="" fill sizes="672px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f1c] via-[#0b0f1c]/55 to-black/20" />
              </div>
              <DialogHeader className="relative z-10 -mt-14 space-y-3 px-5 pb-3 text-left sm:px-6">
                <div className="flex items-end gap-3">
                  <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl border border-white/15 shadow-lg sm:h-28 sm:w-20">
                    <Image src={movie.posterUrl} alt={movie.title} fill sizes="80px" className="object-cover" />
                    <AgeBadge rating={movie.rating} className="absolute left-1.5 top-1.5 scale-90" />
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <DialogTitle className="font-display text-xl font-black tracking-tight text-white sm:text-2xl">
                      {movie.title}
                    </DialogTitle>
                    <DialogDescription className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-cyan-400" />
                        {movie.durationMin} phút
                      </span>
                      {movie.genres.slice(0, 3).map((genre) => (
                        <Badge key={genre} variant="outline" className="rounded-full border-white/15 text-[10px]">
                          {genre}
                        </Badge>
                      ))}
                    </DialogDescription>
                  </div>
                </div>
                <p className="font-display text-sm font-semibold text-cyan-200/90">Chọn ngày & suất · rồi chọn ghế</p>
              </DialogHeader>

              {times.length > 0 ? (
                <div className="border-b border-white/[0.06] px-5 pb-3 pt-1 sm:px-6">
                  <div className="flex flex-wrap gap-2">
                    {days.map((item) => {
                      const sample = times.find((show) => dayKey(show.startsAt) === item);
                      return (
                        <Button
                          key={item}
                          type="button"
                          size="sm"
                          variant={day === item ? "default" : "outline"}
                          className={cn("rounded-xl", day === item && "shadow-lg shadow-cyan-500/25")}
                          onClick={() => setDay(item)}
                        >
                          {sample ? formatDay(sample.startsAt) : item}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div
              data-lenis-prevent
              className="min-h-0 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6"
              onWheel={(event) => event.stopPropagation()}
            >
              {times.length === 0 ? (
                <EmptyState
                  title="Chưa có suất mở bán"
                  description="Phim này chưa có lịch chiếu. Xem trang chi tiết để theo dõi."
                />
              ) : (
                <div className="space-y-2.5">
                  {visible.map((showtime) => (
                    <div
                      key={showtime.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3 transition-[border-color,background-color] hover:border-cyan-400/40 hover:bg-cyan-500/5"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-lg font-black text-white">
                            {formatTime(showtime.startsAt)}
                          </span>
                          <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                            {showtime.room}
                          </span>
                        </div>
                        <p className="flex items-center gap-1.5 truncate text-xs text-gray-400">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                          {showtime.cinema}
                        </p>
                        <p className="font-display text-sm font-bold text-cyan-300">
                          {formatVnd(showtime.priceBase)}
                        </p>
                      </div>
                      <Button asChild size="sm" className="shrink-0 rounded-xl shadow-md shadow-cyan-500/20">
                        <Link href={paths.seats(showtime.id)} onClick={() => onOpenChange(false)}>
                          <Ticket className="h-4 w-4" />
                          Chọn ghế
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-[#0b0f1c] px-5 py-3.5 sm:px-6">
              <Button asChild variant="ghost" className="text-gray-400 hover:text-cyan-300">
                <Link href={paths.movie(movie.slug)} onClick={() => onOpenChange(false)}>
                  Xem trang phim
                </Link>
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
