"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QrCode, Sparkles } from "lucide-react";

import type { AdminBooking } from "@/api/admin";
import { ApiError } from "@/api/client";
import { fetchMyTickets } from "@/api/tickets";
import { AgeBadge } from "@/components/movies/age-badge";
import { EmptyState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVnd, mockTickets } from "@/data/mock-catalog";
import { useAuth } from "@/hooks/use-auth";
import { useCatalog } from "@/hooks/use-catalog";
import { paths } from "@/routes/paths";
import { cn } from "@/utils/cn";

const statusConfig: Record<string, { label: string; className: string }> = {
  PAID: { label: "Đã thanh toán", className: "border-emerald-400/40 bg-emerald-500/15 text-emerald-300" },
  USED: { label: "Đã vào rạp", className: "border-white/15 bg-white/5 text-gray-400" },
  EXPIRED: { label: "Hết hạn", className: "border-rose-500/30 bg-rose-500/10 text-rose-300" },
  CANCELLED: { label: "Đã hủy", className: "border-rose-500/30 bg-rose-500/10 text-rose-300" },
  REFUNDED: { label: "Đã hoàn tiền", className: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  VOIDED: { label: "Vô hiệu", className: "border-rose-500/30 bg-rose-500/10 text-rose-300" },
};

export function TicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const { getMovieBySlug, getShowtimeById } = useCatalog();
  const [tickets, setTickets] = useState<AdminBooking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTickets([]);
      return;
    }
    let cancelled = false;
    fetchMyTickets()
      .then((data) => {
        if (!cancelled) setTickets(data.tickets);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTickets(
          mockTickets.map((ticket, index) => ({
            id: `mock-${index}`,
            userEmail: user.email,
            createdAt: new Date().toISOString(),
            ...ticket,
          })),
        );
        setError(err instanceof ApiError ? err.message : null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <p className="mt-3 text-sm text-muted-foreground">Đang tải vé của bạn...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-16 text-center">
        <EmptyState title="Cần đăng nhập" description="Đăng nhập để xem danh sách vé QR của bạn." />
        <div className="mt-4">
          <Button asChild className="rounded-xl shadow-lg shadow-cyan-500/25">
            <Link href={paths.loginNext(paths.tickets)}>Đăng nhập ngay</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (tickets.length === 0) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:py-12">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">Digital Wallet</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-white md:text-5xl">Vé của tôi</h1>
        </div>
        <EmptyState title="Chưa có vé xem phim" description="Hãy chọn một bộ phim yêu thích và đặt suất để nhận vé QR tại đây." />
        <div className="text-center">
          <Button asChild className="rounded-xl">
            <Link href={paths.movies}>Khám phá phim đang chiếu</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:py-12">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">Digital Wallet</p>
        <h1 className="font-display text-3xl font-black tracking-tight text-white md:text-5xl">Vé của tôi</h1>
        <p className="text-xs text-gray-400">
          Bạn đang có <span className="font-bold text-cyan-300">{tickets.length}</span> vé điện tử trong ví.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {tickets.map((ticket) => {
          const movie = getMovieBySlug(ticket.movieSlug);
          const showtime = getShowtimeById(ticket.showtimeId);
          if (!movie) return null;

          const st = statusConfig[ticket.status] || { label: ticket.status, className: "border-white/15" };

          return (
            <Link
              key={ticket.code}
              href={paths.ticket(ticket.code)}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cinema-900/80 via-cinema-950/90 to-[#0c101d] p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/15 md:flex-row"
            >
              {/* Holographic accent glow */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative z-10 flex-1 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-display text-[11px] font-bold tracking-wider text-cyan-400 uppercase">
                    <Sparkles className="h-3 w-3" />
                    CineWave Pass
                  </span>
                  <Badge className={cn("text-[10px]", st.className)}>{st.label}</Badge>
                </div>

                <div className="flex items-center gap-2">
                  <AgeBadge rating={movie.rating} />
                  <span className="text-xs text-gray-400">{showtime?.room || "Phòng chiếu 01"}</span>
                </div>

                <h2 className="font-display text-xl font-black text-white group-hover:text-cyan-300 transition-colors">
                  {movie.title}
                </h2>
                <p className="text-xs text-gray-400 line-clamp-1">
                  {showtime ? showtime.cinema : "CineWave Landmark"}
                </p>

                <div className="flex flex-wrap gap-4 pt-1 font-mono text-xs text-gray-300">
                  <div>
                    GHẾ: <span className="font-bold text-white">{ticket.seats.join(", ")}</span>
                  </div>
                  <div>
                    MÃ: <span className="font-bold text-cyan-400">{ticket.code}</span>
                  </div>
                </div>
                <p className="font-display text-sm font-bold text-emerald-400">{formatVnd(ticket.total)}</p>
              </div>

              {/* Perforation divider with miniature notches */}
              <div className="relative my-auto hidden items-center justify-center md:flex">
                <div className="h-full border-r border-dashed border-white/20" />
                <div className="absolute -top-7 h-5 w-5 rounded-full border border-white/10 bg-[#0a0c16]" />
                <div className="absolute -bottom-7 h-5 w-5 rounded-full border border-white/10 bg-[#0a0c16]" />
              </div>

              {/* QR Preview Card */}
              <div className="relative z-10 flex flex-col items-center justify-center rounded-2xl bg-white p-3.5 shadow-md">
                <QrCode className="h-20 w-20 text-zinc-950" />
                <span className="mt-1 font-mono text-[9px] font-bold text-gray-800">{ticket.code}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

export default TicketsPage;
