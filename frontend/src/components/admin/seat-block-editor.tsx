"use client";

import { cn } from "@/utils/cn";

const ROWS = ["A", "B", "C", "D", "E", "F"] as const;
const SEATS_PER_ROW = 10;

function seatType(row: string, number: number) {
  if (row === "F") return "VIP";
  if (row === "A" && (number === 5 || number === 6)) return "COUPLE";
  return "STANDARD";
}

type SeatBlockEditorProps = {
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
};

export function SeatBlockEditor({ value, onChange, className }: SeatBlockEditorProps) {
  const blocked = new Set(value.map((seat) => seat.toUpperCase()));

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
        {ROWS.map((row) => (
          <div key={row} className="flex items-center justify-center gap-1.5">
            <span className="w-4 text-center text-[10px] font-mono text-muted-foreground">{row}</span>
            {Array.from({ length: SEATS_PER_ROW }, (_, index) => {
              const number = index + 1;
              const label = `${row}${number}`;
              const type = seatType(row, number);
              const isBlocked = blocked.has(label);
              return (
                <button
                  key={label}
                  type="button"
                  title={isBlocked ? `Mở ghế ${label}` : `Khóa ghế ${label}`}
                  onClick={() => toggle(label)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-semibold transition-colors",
                    isBlocked
                      ? "border border-rose-500/40 bg-rose-500/20 text-rose-200"
                      : type === "VIP"
                        ? "border border-amber-400/40 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25"
                        : type === "COUPLE"
                          ? "border border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"
                          : "border border-white/10 bg-white/5 text-gray-300 hover:border-cyan-500/40 hover:bg-cyan-500/10",
                  )}
                >
                  {number}
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
