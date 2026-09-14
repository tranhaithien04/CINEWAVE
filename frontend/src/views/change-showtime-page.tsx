"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CalendarClock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ApiError } from "@/api/client";
import { fetchRescheduleOptions } from "@/api/tickets";
import type { Showtime } from "@/@types/movie";
import { EmptyState } from "@/components/shared/state-views";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/data/mock-catalog";
import { useAuth } from "@/hooks/use-auth";
import { useCatalog } from "@/hooks/use-catalog";
import { paths } from "@/routes/paths";

function formatShow(show: Showtime) {
  const date = new Date(show.startsAt);
  return {
    time: date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    day: date.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }),
  };
}

export function ChangeShowtimePage({ code }: { code: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { getMovieBySlug } = useCatalog();
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [movieSlug, setMovieSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchRescheduleOptions(code)
      .then((data) => {
        if (cancelled) return;
        setShowtimes(data.showtimes);
        setMovieSlug(data.booking.movieSlug);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setShowtimes([]);
        setError(err instanceof ApiError ? err.message : "Không tải được suất đổi");
      });
    return () => {
      cancelled = true;
    };
  }, [code, user]);

  const movie = movieSlug ? getMovieBySlug(movieSlug) : null;

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">Đang tải…</main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
        <EmptyState title="Cần đăng nhập" description="Đăng nhập để đổi suất chiếu." />
        <Button asChild>
          <Link href={paths.loginNext(paths.changeShowtime(code))}>Đăng nhập</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg space-y-5 px-4 py-8 md:py-12">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit px-2 text-gray-400 hover:text-white">
        <Link href={paths.ticket(code)}>
          <ArrowLeft className="h-4 w-4" /> Quay lại vé
        </Link>
      </Button>
      <div>
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cyan-400">
          <CalendarClock className="h-3.5 w-3.5" /> Đổi suất cùng giá
        </p>
        <h1 className="mt-1 font-display text-3xl font-black text-white">{movie?.title ?? "Chọn suất mới"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chỉ hiện suất cùng phim, cùng giá. Sau đó chọn lại ghế — tổng tiền ghế phải bằng vé cũ.
        </p>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {!error && showtimes.length === 0 ? (
        <EmptyState title="Không còn suất cùng giá" description="Hiện chưa có suất khác cùng mức giá để đổi." />
      ) : (
        <div className="space-y-2">
          {showtimes.map((show) => {
            const stamp = formatShow(show);
            return (
              <button
                key={show.id}
                type="button"
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-cyan-400/40"
                onClick={() => router.push(paths.seats(show.id, code))}
              >
                <div>
                  <p className="font-display text-lg font-bold text-white">{stamp.time}</p>
                  <p className="text-xs text-muted-foreground">
                    {stamp.day} · {show.cinema} · {show.room}
                  </p>
                </div>
                <span className="text-sm font-semibold text-cyan-300">{formatVnd(show.priceBase)}</span>
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default ChangeShowtimePage;
