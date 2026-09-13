"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, Film, QrCode, Share2, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import type { AdminBooking } from "@/api/admin";
import { fetchMyTicket } from "@/api/tickets";
import { AgeBadge } from "@/components/movies/age-badge";
import { EmptyState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVnd, getTicketByCode } from "@/data/mock-catalog";
import { useAuth } from "@/hooks/use-auth";
import { useCatalog } from "@/hooks/use-catalog";
import { paths } from "@/routes/paths";

export function TicketDetailPage({ code }: { code: string }) {
  const { user, loading: authLoading } = useAuth();
  const { getMovieBySlug, getShowtimeById } = useCatalog();
  const [ticket, setTicket] = useState<AdminBooking | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    if (!user) {
      const mock = getTicketByCode(code);
      if (!cancelled) {
        setTicket(
          mock
            ? {
                id: mock.code,
                userEmail: null,
                createdAt: new Date().toISOString(),
                ...mock,
              }
            : null,
        );
        setLoaded(true);
      }
      return;
    }
    fetchMyTicket(code)
      .then((data) => {
        if (!cancelled) setTicket(data.ticket);
      })
      .catch(() => {
        if (!cancelled) setTicket(null);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, code, user]);

  const movie = ticket ? getMovieBySlug(ticket.movieSlug) : null;
  const showtime = ticket ? getShowtimeById(ticket.showtimeId) : null;

  if (authLoading || !loaded) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <p className="mt-3 text-sm text-muted-foreground">Đang tải vé điện tử...</p>
      </main>
    );
  }

  if (!ticket || !movie) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <EmptyState title="Không tìm thấy vé" description="Mã vé không tồn tại hoặc đã bị thu hồi." />
        <div className="mt-4 text-center">
          <Button asChild variant="outline">
            <Link href={paths.tickets}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại vé của tôi
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10 md:py-16">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="text-gray-400 hover:text-white">
          <Link href={paths.tickets}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Vé của tôi
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl border-white/10"
            onClick={() => {
              void navigator.clipboard.writeText(window.location.href);
              toast.success("Đã sao chép liên kết vé!");
            }}
          >
            <Share2 className="mr-1.5 h-3.5 w-3.5" /> Chia sẻ
          </Button>
          <Button
            size="sm"
            className="rounded-xl bg-cyan-500 font-semibold text-black hover:bg-cyan-400 shadow-md shadow-cyan-500/20"
            onClick={() => {
              window.print();
            }}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> In vé
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NOTCHED BOARDING PASS TICKET CONTAINER                                    */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-cinema-900/90 via-cinema-950/95 to-[#0e1322] shadow-2xl backdrop-blur-xl">
        {/* Holographic Sheen Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-purple-500/5 to-transparent opacity-60" />

        <div className="relative z-10 flex flex-col md:flex-row">
          {/* Main Info Section (Left) */}
          <div className="flex-1 space-y-4 p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-display text-xs font-bold tracking-widest text-cyan-400">
                <Sparkles className="h-3.5 w-3.5" />
                CINEWAVE IMAX PASS
              </div>
              <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Đã xác nhận
              </Badge>
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2">
                <AgeBadge rating={movie.rating} />
                <span className="font-mono text-xs text-cyan-300">Phòng {showtime?.room || "IMAX Laser 01"}</span>
              </div>
              <h1 className="font-display text-2xl font-black text-white sm:text-3xl">{movie.title}</h1>
              <p className="mt-1 text-sm text-gray-400">
                {showtime ? showtime.cinema : "CineWave Landmark Cyber Cinema"}
              </p>
            </div>

            {/* Ticket Specs Grid */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs font-mono">
              <div>
                <span className="text-gray-400">GHẾ NGỒI:</span>
                <p className="font-display text-base font-black text-cyan-300">{ticket.seats.join(", ")}</p>
              </div>
              <div>
                <span className="text-gray-400">MÃ VÉ:</span>
                <p className="font-display text-base font-black text-white">{ticket.code}</p>
              </div>
              <div>
                <span className="text-gray-400">THỜI LƯỢNG:</span>
                <p className="font-semibold text-gray-200">{movie.durationMin} phút</p>
              </div>
              <div>
                <span className="text-gray-400">TỔNG TIỀN:</span>
                <p className="font-display font-black text-emerald-400">{formatVnd(ticket.total)}</p>
              </div>
            </div>
          </div>

          {/* Perforated Divider with Circular Tear Notches */}
          <div className="relative flex items-center justify-center">
            <div className="hidden h-full border-r border-dashed border-white/20 md:block" />
            <div className="w-full border-b border-dashed border-white/20 md:hidden" />

            {/* Desktop Top Notch */}
            <div className="absolute -top-3.5 hidden h-7 w-7 rounded-full border border-white/15 bg-[#0a0c16] md:block" />
            {/* Desktop Bottom Notch */}
            <div className="absolute -bottom-3.5 hidden h-7 w-7 rounded-full border border-white/15 bg-[#0a0c16] md:block" />

            {/* Mobile Left Notch */}
            <div className="absolute -left-3.5 h-7 w-7 rounded-full border border-white/15 bg-[#0a0c16] md:hidden" />
            {/* Mobile Right Notch */}
            <div className="absolute -right-3.5 h-7 w-7 rounded-full border border-white/15 bg-[#0a0c16] md:hidden" />
          </div>

          {/* QR Check-in Section (Right) */}
          <div className="flex flex-col items-center justify-center p-6 md:p-8 md:min-w-[190px]">
            <div className="relative rounded-2xl bg-white p-3.5 shadow-xl">
              <QrCode className="h-32 w-32 text-zinc-950" aria-label={`QR vé ${ticket.code}`} />
            </div>
            <span className="mt-3 font-mono text-xs font-bold tracking-wider text-cyan-400">
              SCAN TẠI CỔNG
            </span>
            <span className="text-[10px] text-gray-400">Mã QR hợp lệ cho {ticket.seats.length} khán giả</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default TicketDetailPage;
