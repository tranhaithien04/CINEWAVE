"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, Play, Star, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AgeBadge } from "@/components/movies/age-badge";
import { EmptyState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatVnd } from "@/data/mock-catalog";
import { fetchSimilarMovies, type SimilarMovie } from "@/api/catalog";
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

export function MovieDetailPage({ slug }: { slug: string }) {
  const { getMovieBySlug, getShowtimesByMovie, loading } = useCatalog();
  const movie = getMovieBySlug(slug);
  const times = movie ? getShowtimesByMovie(movie.slug) : [];
  const days = useMemo(() => [...new Set(times.map((item) => dayKey(item.startsAt)))], [times]);
  const [day, setDay] = useState("");
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [similar, setSimilar] = useState<SimilarMovie[]>([]);
  const visible = times.filter((item) => dayKey(item.startsAt) === day);

  useEffect(() => {
    if (days.length && !days.includes(day)) {
      setDay(days[0] ?? "");
    }
  }, [day, days]);

  useEffect(() => {
    let cancelled = false;
    if (!movie?.tmdbId) {
      setSimilar([]);
      return;
    }
    fetchSimilarMovies(movie.slug)
      .then((data) => {
        if (!cancelled) setSimilar(data.movies);
      })
      .catch(() => {
        if (!cancelled) setSimilar([]);
      });
    return () => {
      cancelled = true;
    };
  }, [movie?.slug, movie?.tmdbId]);

  if (!movie) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải phim...</p>
        ) : (
          <EmptyState title="Không tìm thấy phim" description="Phim có thể đã bị ẩn hoặc đường dẫn không đúng." />
        )}
      </main>
    );
  }

  return (
    <main className="pb-16">
      <section className="relative h-64 overflow-hidden md:h-[420px]">
        <Image src={movie.backdropUrl} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06070d] via-[#0a0c16]/55 to-black/25" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#06070d]" />
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 md:-mt-36 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
        <Card className="overflow-hidden rounded-2xl border-white/10 shadow-2xl shadow-cyan-500/10">
          <div className="relative aspect-[2/3]">
            <Image src={movie.posterUrl} alt={movie.title} fill sizes="280px" className="object-cover" />
            <AgeBadge rating={movie.rating} className="absolute left-3 top-3" />
          </div>
        </Card>

        <div className="space-y-8 py-4">
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
            <p className="max-w-2xl text-muted-foreground">{movie.description}</p>
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
              <>
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
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {visible.map((showtime) => (
                    <Card
                      key={showtime.id}
                      className="group relative overflow-hidden rounded-2xl border-white/10 bg-cinema-900/70 backdrop-blur-md transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10"
                    >
                      <CardContent className="flex items-center justify-between gap-4 p-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-xl font-black text-white">{formatTime(showtime.startsAt)}</span>
                            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                              IMAX 3D
                            </span>
                          </div>
                          <p className="flex items-center gap-1.5 text-xs text-gray-400">
                            <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                            {showtime.cinema} · {showtime.room}
                          </p>
                          <p className="font-display text-sm font-bold text-cyan-300">{formatVnd(showtime.priceBase)}</p>
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
              </>
            )}
          </div>
        </div>
      </div>

      {similar.length ? (
        <section className="mx-auto mt-12 max-w-6xl px-4">
          <h2 className="font-display text-xl font-semibold tracking-tight text-white">Phim tương tự</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {similar.map((item) => {
              const content = (
                <article className="group overflow-hidden rounded-xl border border-white/10 bg-cinema-900/70">
                  <div className="relative aspect-[2/3] bg-cinema-800">
                    {item.posterUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.posterUrl} alt={item.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-2.5">
                    <p className="line-clamp-2 text-xs font-semibold text-white group-hover:text-cyan-300">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {item.year ?? ""}
                      {item.slug ? " · Đặt vé" : ""}
                    </p>
                  </div>
                </article>
              );
              return item.slug ? (
                <Link key={item.tmdbId} href={paths.movie(item.slug)}>
                  {content}
                </Link>
              ) : (
                <div key={item.tmdbId}>{content}</div>
              );
            })}
          </div>
        </section>
      ) : null}

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

