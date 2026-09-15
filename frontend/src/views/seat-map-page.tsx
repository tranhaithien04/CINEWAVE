"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Box, LayoutGrid } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { Showtime } from "@/@types/movie";
import type { Seat } from "@/@types/seat";
import { BookingSummary } from "@/components/booking/booking-summary";
import { HoldTimer } from "@/components/booking/hold-timer";
import { SeatMap } from "@/components/seats/seat-map";
import { EmptyState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { holdSeats } from "@/api/bookings";
import { fetchShowtime, fetchShowtimeSeats } from "@/api/catalog";
import { rescheduleMyTicket } from "@/api/tickets";
import { buildSeatMap, seatPrice } from "@/data/mock-catalog";
import { useAuth } from "@/hooks/use-auth";
import { useCatalog } from "@/hooks/use-catalog";
import { paths } from "@/routes/paths";
import { couplePartner, isSeatTaken, MAX_SEATS_PER_BOOKING } from "@/utils/seat";

const HOLD_MS = 4.5 * 60 * 1000;

const SeatMap3D = dynamic(
  () => import("@/components/seats/seat-map-3d").then((mod) => mod.SeatMap3D),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] animate-pulse rounded-2xl border border-white/10 bg-[#06070d] md:h-[560px] lg:h-[620px]" />
    ),
  },
);

const legend = [
  { label: "Ghế trống", className: "bg-slate-600 border border-slate-500/50" },
  { label: "Đang chọn", className: "bg-emerald-500 border border-emerald-400 shadow-sm shadow-emerald-500/50" },
  { label: "Đang giữ", className: "bg-amber-500/80 border border-amber-400 animate-pulse" },
  { label: "Đã đặt", className: "bg-slate-900 border border-white/5 opacity-50" },
  { label: "Ghế VIP", className: "bg-amber-400 border border-amber-300 text-amber-950 font-bold" },
  { label: "Ghế đôi Sweetbox", className: "bg-rose-500 border border-rose-400 text-white font-bold" },
];

export function SeatMapPage({ showtimeId, changeTicket }: { showtimeId: string; changeTicket?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { getMovieBySlug, getShowtimeById } = useCatalog();
  const catalogShow = getShowtimeById(showtimeId);
  const [showtime, setShowtime] = useState<Showtime | null>(catalogShow);
  const [loadingShow, setLoadingShow] = useState(!catalogShow);
  const movie = showtime ? getMovieBySlug(showtime.movieSlug) : null;
  const [seats, setSeats] = useState<Seat[]>(() => buildSeatMap());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [view, setView] = useState<"3d" | "2d">("3d");
  const [holding, setHolding] = useState(false);
  const [holdUntil, setHoldUntil] = useState(() => new Date(Date.now() + HOLD_MS));
  const [holdExpired, setHoldExpired] = useState(false);
  const changing = Boolean(changeTicket);

  const handleHoldExpire = useCallback(() => {
    setHoldExpired(true);
    setSelectedIds([]);
    toast.error("Hết thời gian giữ ghế. Chọn lại giúp bạn.");
  }, []);

  useEffect(() => {
    if (catalogShow) {
      setShowtime(catalogShow);
      setLoadingShow(false);
      return;
    }
    let cancelled = false;
    setLoadingShow(true);
    void fetchShowtime(showtimeId)
      .then((data) => {
        if (!cancelled) setShowtime(data.showtime);
      })
      .catch(() => {
        if (!cancelled) setShowtime(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingShow(false);
      });
    return () => {
      cancelled = true;
    };
  }, [catalogShow, showtimeId]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void fetchShowtimeSeats(showtimeId)
        .then((data) => {
          if (!cancelled && data.seats?.length) setSeats(data.seats);
        })
        .catch(() => {
          /* keep layout fallback */
        });
    };
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [showtimeId]);

  const selectedSeats = useMemo(() => {
    const selected = new Set(selectedIds);
    return seats.filter((seat) => selected.has(seat.id));
  }, [seats, selectedIds]);

  function beginFreshHoldWindow() {
    if (!holdExpired) return;
    setHoldExpired(false);
    setHoldUntil(new Date(Date.now() + HOLD_MS));
  }

  function toggle(seat: Seat) {
    if (isSeatTaken(seat)) return;
    beginFreshHoldWindow();

    const partner = couplePartner(seats, seat);
    const bundle = partner ? [seat, partner] : [seat];
    const currentSet = new Set(selectedIds);

    if (currentSet.has(seat.id)) {
      const remove = new Set(bundle.map((item) => item.id));
      setSelectedIds((current) => current.filter((id) => !remove.has(id)));
      return;
    }

    if (partner && isSeatTaken(partner)) {
      toast.error("Ghế đôi phải chọn cả cặp còn trống.");
      return;
    }

    const addIds = bundle.map((item) => item.id).filter((id) => !currentSet.has(id));
    if (selectedIds.length + addIds.length > MAX_SEATS_PER_BOOKING) {
      toast.error(`Tối đa ${MAX_SEATS_PER_BOOKING} ghế mỗi lần đặt.`);
      return;
    }

    setSelectedIds((current) => {
      const seen = new Set(current);
      const merged = [...current];
      for (const id of addIds) {
        if (!seen.has(id)) {
          seen.add(id);
          merged.push(id);
        }
      }
      return merged;
    });
  }

  if (loadingShow) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12 text-sm text-muted-foreground">Đang tải sơ đồ ghế…</main>
    );
  }

  if (!showtime || !movie || showtime.closed) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <EmptyState title="Không tìm thấy suất" description="Suất chiếu đã đóng hoặc không tồn tại." />
      </main>
    );
  }

  const backHref = changing && changeTicket ? paths.changeShowtime(changeTicket) : paths.movie(movie.slug);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 pb-32 md:pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit px-2 text-gray-400 hover:text-white">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              {changing ? "Quay lại chọn suất" : "Quay lại phim"}
            </Link>
          </Button>
          <p className="text-sm text-cyan-400">{movie.title}</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            {changing ? "Chọn ghế suất mới" : "Chọn ghế"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {showtime.cinema} · {showtime.room}
            {changing ? " · Đổi suất cùng giá, tổng ghế phải bằng vé cũ." : null}
          </p>
          {changing ? null : (
            <HoldTimer expiresAt={holdUntil} onExpire={handleHoldExpire} />
          )}
        </div>
        <div className="flex rounded-xl border border-white/10 bg-cinema-900/70 p-1 backdrop-blur-md">
          <Button
            type="button"
            size="sm"
            variant={view === "3d" ? "default" : "ghost"}
            className="rounded-lg"
            onClick={() => setView("3d")}
          >
            <Box className="mr-1.5 h-4 w-4" />
            3D
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "2d" ? "default" : "ghost"}
            className="rounded-lg"
            onClick={() => setView("2d")}
          >
            <LayoutGrid className="mr-1.5 h-4 w-4" />
            2D
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {legend.map((item) => (
          <Badge key={item.label} variant="outline" className="gap-2 rounded-full">
            <span className={`h-2.5 w-2.5 rounded-sm ${item.className}`} />
            {item.label}
          </Badge>
        ))}
      </div>

      {view === "3d" ? (
        <SeatMap3D seats={seats} selectedIds={selectedIds} priceBase={showtime.priceBase} onToggle={toggle} />
      ) : (
        <SeatMap seats={seats} selectedIds={selectedIds} onToggle={toggle} />
      )}

      <BookingSummary
        seats={selectedSeats}
        priceBase={showtime.priceBase}
        pending={holding}
        continueLabel={changing ? "Xác nhận đổi suất" : "Tiếp tục"}
        pendingLabel={changing ? "Đang đổi suất…" : "Đang giữ ghế…"}
        onContinue={() => {
          if (!user) {
            toast.error("Đăng nhập để giữ ghế.");
            router.push(paths.loginNext(paths.seats(showtimeId, changeTicket)));
            return;
          }
          if (holding) return;
          setHolding(true);
          const labels = selectedSeats.map((seat) => `${seat.row}${seat.number}`);
          if (changing && changeTicket) {
            void rescheduleMyTicket(changeTicket, { showtimeId: showtime.id, seats: labels })
              .then((data) => {
                toast.success(`Đã đổi suất. Ghế ${data.ticket.seats.join(", ")}.`);
                router.push(paths.ticket(data.ticket.code));
              })
              .catch((error) => {
                toast.error(error instanceof Error ? error.message : "Không đổi được suất");
              })
              .finally(() => setHolding(false));
            return;
          }
          const total = selectedSeats.reduce((sum, seat) => sum + seatPrice(showtime.priceBase, seat.type), 0);
          void holdSeats({
            showtimeId: showtime.id,
            movieSlug: movie.slug,
            seats: labels,
            total,
          })
            .then((data) => {
              toast.success("Đã giữ ghế 4,5 phút.");
              router.push(paths.checkout(data.booking.id));
            })
            .catch((error) => {
              toast.error(error instanceof Error ? error.message : "Không giữ được ghế");
            })
            .finally(() => setHolding(false));
        }}
      />
    </main>
  );
}

export default SeatMapPage;
