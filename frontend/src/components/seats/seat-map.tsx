import { useMemo } from "react";

import type { Seat } from "@/@types/seat";
import { SeatButton } from "@/components/seats/seat-button";

export function SeatMap({
  seats,
  selectedIds,
  onToggle,
}: {
  seats: Seat[];
  selectedIds: string[];
  onToggle: (seat: Seat) => void;
}) {
  const rows = [...new Set(seats.map((seat) => seat.row))];
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-cinema-900/70 p-4 shadow-xl backdrop-blur-md md:p-6">
      {/* Màn chiếu cong IMAX với quầng sáng chiếu xuống khán phòng */}
      <div className="relative mb-12 flex w-full max-w-xl mx-auto flex-col items-center">
        <div className="relative flex h-10 w-full items-center justify-center">
          <div className="h-3 w-full rounded-[100%] border-t-4 border-cyan-400 shadow-[0_4px_30px_rgba(6,182,212,0.8)]" />
          <div className="pointer-events-none absolute top-3 h-16 w-3/4 bg-gradient-to-b from-cyan-500/20 via-cyan-500/5 to-transparent blur-md" />
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
          Màn chiếu cong IMAX Laser (Screen)
        </p>
      </div>
      <div className="mx-auto flex w-max flex-col gap-2">
        {rows.map((row) => (
          <div key={row} className="flex items-center gap-2">
            <span className="w-4 font-display text-xs text-cyan-400">{row}</span>
            <div className="flex gap-1.5">
              {seats
                .filter((seat) => seat.row === row)
                .map((seat) => (
                  <SeatButton
                    key={seat.id}
                    seat={seat}
                    selected={selectedSet.has(seat.id)}
                    onToggle={onToggle}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
