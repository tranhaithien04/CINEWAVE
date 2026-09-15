"use client";

import { cn } from "@/utils/cn";

const FALLBACK_ROWS = ["A", "B", "C", "D", "E", "F"] as const;
const FALLBACK_SEATS_PER_ROW = 10;

type LayoutSeat = {
  label: string;
  row: string;
  number: number;
  type: "STANDARD" | "VIP" | "COUPLE";
};

function fallbackType(row: string, number: number): LayoutSeat["type"] {
  if (row === "F") return "VIP";
  if (row === "A" && (number === 5 || number === 6)) return "COUPLE";
  return "STANDARD";
}

function defaultLayout(): LayoutSeat[] {
  return FALLBACK_ROWS.flatMap((row) =>
    Array.from({ length: FALLBACK_SEATS_PER_ROW }, (_, index) => {
      const number = index + 1;
      return {
        label: `${row}${number}`,
        row,
        number,
        type: fallbackType(row, number),
      };
    }),
  );
}

type SeatBlockEditorProps = {
  value: string[];
  onChange: (next: string[]) => void;
  layoutSeats?: LayoutSeat[];
  className?: string;
};

export function SeatBlockEditor({ value, onChange, layoutSeats, className }: SeatBlockEditorProps) {
  const blocked = new Set(value.map((seat) => seat.toUpperCase()));
  const seats = layoutSeats?.length ? layoutSeats : defaultLayout();
  const rows = new Map<string, LayoutSeat[]>();
  for (const seat of seats) {
    const list = rows.get(seat.row) ?? [];
    list.push(seat);
    rows.set(seat.row, list);
  }
  for (const list of rows.values()) list.sort((a, b) => a.number - b.number);

  function toggle(label: string) {
    const next = new Set(blocked);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    onChange([...next].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="mx-auto h-1.5 w-2/3 rounded-full bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
      <p className="text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Màn hình</p>
      <div className="space-y-1.5">
        {[...rows.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([row, list]) => (
            <div key={row} className="flex items-center justify-center gap-1.5">
              <span className="w-4 text-center text-[10px] font-mono text-muted-foreground">{row}</span>
              {list.map((seat) => {
                const isBlocked = blocked.has(seat.label);
                return (
                  <button
                    key={seat.label}
                    type="button"
                    title={isBlocked ? `Mở ghế ${seat.label}` : `Khóa ghế ${seat.label}`}
                    onClick={() => toggle(seat.label)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-semibold transition-colors",
                      isBlocked
                        ? "border border-rose-500/40 bg-rose-500/20 text-rose-200"
                        : seat.type === "VIP"
                          ? "border border-amber-400/40 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25"
                          : seat.type === "COUPLE"
                            ? "border border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"
                            : "border border-white/10 bg-white/5 text-gray-300 hover:border-cyan-500/40 hover:bg-cyan-500/10",
                    )}
                  >
                    {seat.number}
                  </button>
                );
              })}
            </div>
          ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Click để khóa/mở ghế · Đang khóa:{" "}
        <span className="font-mono text-rose-300">{value.length ? value.join(", ") : "không có"}</span>
      </p>
    </div>
  );
}
