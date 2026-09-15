"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock, MapPin, Play, Star, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AgeBadge } from "@/components/movies/age-badge";
import { EmptyState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatVnd } from "@/data/mock-catalog";
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

function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const longEnough = text.trim().length > 180;

  useEffect(() => {
    setExpanded(false);
  }, [text]);

  if (!text) return null;

  return (
    <div className="max-w-2xl space-y-1.5">
      <p className={cn("text-muted-foreground", !expanded && longEnough && "line-clamp-3")}>{text}</p>
      {longEnough ? (
        <button
          type="button"
          className="text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
        </button>
      ) : null}
    </div>
  );
}

export function MovieDetailPage({ slug }: { slug: string }) {
  const { getMovieBySlug, getShowtimesByMovie, loading } = useCatalog();
  const movie = getMovieBySlug(slug);
  const times = movie ? getShowtimesByMovie(movie.slug) : [];
  const days = useMemo(() => [...new Set(times.map((item) => dayKey(item.startsAt)))], [times]);
  const [day, setDay] = useState("");
  const [trailerOpen, setTrailerOpen] = useState(false);
  const visible = times.filter((item) => dayKey(item.startsAt) === day);

  useEffect(() => {
    if (days.length && !days.includes(day)) {
      setDay(days[0] ?? "");
    }
  }, [day, days]);

  if (!movie) {
    return (
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-12">
        <Link
          href={paths.movies}
          className="group inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] transition-[border-color,transform] duration-200 group-hover:-translate-x-0.5 group-hover:border-white/30">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
          Danh sách phim
        </Link>
        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải phim...</p>
        ) : (
          <EmptyState title="Không tìm thấy phim" description="Phim có thể đã bị ẩn hoặc đường dẫn không đúng." />
        )}
      </main>
    );
  }

  return (
    <main className="relative pb-16">
      {/* Backdrop decorative only — never clips poster/content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] md:h-[520px]"
      >
        <Image
          src={movie.backdropUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_20%]"
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(10,12,22,0.35) 0%, rgba(10,12,22,0.72) 45%, #0a0c16 100%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-4 md:pt-6">
        <Link
          href={paths.movies}
          className="group inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-white/75 transition-[color,background-color,transform] duration-200 hover:bg-black/35 hover:text-white"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/25 backdrop-blur-sm transition-[border-color,background-color,transform] duration-200 group-hover:-translate-x-0.5 group-hover:border-white/30 group-hover:bg-black/40">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
          <span className="tracking-wide">
            Danh sách phim
            <span
              aria-hidden
              className="mt-0.5 block h-px origin-left scale-x-0 bg-white/50 transition-transform duration-200 group-hover:scale-x-100"
            />
          </span>
        </Link>
      </div>

      <div className="mx-auto mt-8 grid max-w-6xl items-start gap-6 px-4 md:mt-12 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
        <Card className="relative z-10 self-start overflow-hidden rounded-2xl border-white/10 shadow-2xl shadow-cyan-500/10">
          <div className="relative aspect-[2/3]">
            <Image src={movie.posterUrl} alt={movie.title} fill sizes="280px" className="object-cover" />
            <AgeBadge rating={movie.rating} className="absolute left-3 top-3" />
          </div>
        </Card>

        <div className="space-y-8 py-1 md:py-2">
          <div className="space-y-3">
            <h1 className="font-display text-3xl font-black tracking-tight text-white md:text-5xl">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              {typeof movie.imdbRating === "number" ? (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                  <Star className="h-4 w-4 fill-current" />
                  {movie.imdbRating.toFixed(1)}
                  {movie.imdbVotes ? (
                    <span className="font-normal text-gray-500">
                      ({movie.imdbVotes.toLocaleString("vi-VN")} votes)
                    </span>
                  ) : null}
                </span>
              ) : null}
              {movie.year ? <span>{movie.year}</span> : null}
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4 text-cyan-400" />
                {movie.durationMin} phút
              </span>
              {movie.genres.map((genre) => (
                <Badge key={genre} variant="outline" className="rounded-full border-white/15">
                  {genre}
                </Badge>
              ))}
            </div>
            {movie.director || movie.actors ? (
              <p className="flex items-start gap-2 text-sm text-gray-400">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                <span>
                  {movie.director ? <span className="text-gray-300">Đạo diễn: {movie.director}. </span> : null}
                  {movie.actors ? `Diễn viên: ${movie.actors}` : null}
                </span>
              </p>
            ) : null}
            <ExpandableDescription text={movie.description} />
            <Button
              type="button"
              variant="outline"
              className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
              onClick={() => setTrailerOpen(true)}
            >
              <Play className="mr-2 h-4 w-4" />
              Xem trailer
            </Button>
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold tracking-tight text-white">Chọn ngày & suất</h2>
            {times.length === 0 ? (
              <EmptyState title="Chưa có suất" description="Phim này chưa mở bán." />
            ) : (
              <div className="relative">
                <div className="sticky top-16 z-20 -mx-1 mb-1 border-b border-white/[0.04] bg-[#0a0c16]/90 px-1 pb-4 pt-2 backdrop-blur-md">
                  <div className="flex flex-wrap gap-2">
                    {days.map((item) => {
                      const sample = times.find((show) => dayKey(show.startsAt) === item);
                      return (
                        <Button
                          key={item}
                          type="button"
                          variant={day === item ? "default" : "outline"}
                          className={cn(day === item && "shadow-lg shadow-cyan-500/25")}
                          onClick={() => setDay(item)}
                        >
                          {sample ? formatDay(sample.startsAt) : item}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  {visible.map((showtime) => (
                    <Card
                      key={showtime.id}
                      className="group relative overflow-hidden rounded-2xl border-white/10 bg-cinema-900/70 backdrop-blur-md transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10"
                    >
                      <CardContent className="flex items-center justify-between gap-4 p-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-xl font-black text-white">
                              {formatTime(showtime.startsAt)}
                            </span>
                            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                              IMAX 3D
                            </span>
                          </div>
                          <p className="flex items-center gap-1.5 text-xs text-gray-400">
                            <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                            {showtime.cinema} · {showtime.room}
                          </p>
                          <p className="font-display text-sm font-bold text-cyan-300">
                            {formatVnd(showtime.priceBase)}
                          </p>
                        </div>
                        {showtime.closed ? (
                          <Badge variant="outline" className="rounded-full border-white/15 text-gray-500">
                            Đã đóng
                          </Badge>
                        ) : (
                          <Button asChild size="sm" className="rounded-xl shadow-md shadow-cyan-500/20">
                            <Link href={paths.seats(showtime.id)}>Chọn ghế →</Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={trailerOpen} onOpenChange={setTrailerOpen}>
        <DialogContent className="max-w-3xl overflow-hidden rounded-2xl border-white/10 p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Trailer · {movie.title}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-black">
            {movie.trailerUrl ? (
              <iframe
                title={`Trailer ${movie.title}`}
                src={movie.trailerUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Trailer sẽ mở khi nhà phát hành cấp phép.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default MovieDetailPage;

