"use client";

import { useMemo, useState } from "react";
import { Box, LayoutGrid } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { Seat } from "@/@types/seat";
import { BookingSummary } from "@/components/booking/booking-summary";
import { HoldTimer } from "@/components/booking/hold-timer";
import { SeatMap } from "@/components/seats/seat-map";
import { EmptyState } from "@/components/shared/state-views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { holdSeats } from "@/api/bookings";
import { buildSeatMap, seatPrice } from "@/data/mock-catalog";
import { useAuth } from "@/hooks/use-auth";
import { useCatalog } from "@/hooks/use-catalog";
import { paths } from "@/routes/paths";
import { couplePartner, isSeatTaken, MAX_SEATS_PER_BOOKING } from "@/utils/seat";

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

export function SeatMapPage({ showtimeId }: { showtimeId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { getMovieBySlug, getShowtimeById } = useCatalog();
  const showtime = getShowtimeById(showtimeId);
  const movie = showtime ? getMovieBySlug(showtime.movieSlug) : null;
  const seats = useMemo(() => buildSeatMap(), []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [view, setView] = useState<"3d" | "2d">("3d");
  const [holding, setHolding] = useState(false);
  const [holdUntil] = useState(() => new Date(Date.now() + 8 * 60 * 1000));

  const selectedSeats = seats.filter((seat) => selectedIds.includes(seat.id));

  function toggle(seat: Seat) {
    if (isSeatTaken(seat)) return;

    setSelectedIds((current) => {
      const partner = couplePartner(seats, seat);
      const bundle = partner ? [seat, partner] : [seat];

      if (current.includes(seat.id)) {
        return current.filter((id) => !bundle.some((item) => item.id === id));
      }

      if (partner && isSeatTaken(partner)) {
        toast.error("Ghế đôi phải chọn cả cặp còn trống.");
        return current;
      }

      const addIds = bundle.map((item) => item.id).filter((id) => !current.includes(id));
      const next = [...current, ...addIds];
      if (next.length > MAX_SEATS_PER_BOOKING) {
        toast.error(`Tối đa ${MAX_SEATS_PER_BOOKING} ghế mỗi lần đặt.`);
        return current;
      }
      return next;
    });
  }

  if (!showtime || !movie || showtime.closed) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <EmptyState title="Không tìm thấy suất" description="Suất chiếu đã đóng hoặc không tồn tại." />
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 pb-32 md:pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-cyan-400">{movie.title}</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Chọn ghế</h1>
          <p className="text-sm text-muted-foreground">
            {showtime.cinema} · {showtime.room}
          </p>
          <HoldTimer
            expiresAt={holdUntil}
            onExpire={() => toast.error("Hết thời gian giữ ghế. Chọn lại giúp bạn.")}
          />
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
        onContinue={() => {
          if (!user) {
            toast.error("Đăng nhập để giữ ghế.");
            router.push(paths.loginNext(paths.seats(showtimeId)));
            return;
          }
          if (holding) return;
          setHolding(true);
          const total = selectedSeats.reduce((sum, seat) => sum + seatPrice(showtime.priceBase, seat.type), 0);
          void holdSeats({
            showtimeId: showtime.id,
            movieSlug: movie.slug,
            seats: selectedSeats.map((seat) => `${seat.row}${seat.number}`),
            total,
          })
            .then((data) => {
              toast.success("Đã giữ ghế 8 phút.");
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

