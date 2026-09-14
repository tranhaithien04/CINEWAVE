"use client";

import type { AgeRating } from "@/@types/movie";
import { AGE_RATINGS } from "@/@types/movie";
import { cn } from "@/utils/cn";

const ratingConfig: Record<
  AgeRating | "ALL",
  { label: string; activeClass: string; inactiveClass: string }
> = {
  ALL: {
    label: "Tất cả phim",
    activeClass: "bg-cyan-500 text-black border-cyan-400 font-bold shadow-lg shadow-cyan-500/30",
    inactiveClass: "bg-white/5 text-gray-300 border-white/10 hover:border-cyan-500/40 hover:text-white",
  },
  P: {
    label: "P · Mọi lứa tuổi",
    activeClass: "bg-emerald-500 text-black border-emerald-400 font-bold shadow-lg shadow-emerald-500/30",
    inactiveClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20",
  },
  K: {
    label: "K · Dưới 13 tuổi",
    activeClass: "bg-blue-500 text-white border-blue-400 font-bold shadow-lg shadow-blue-500/30",
    inactiveClass: "bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20",
  },
  T13: {
    label: "T13 · Từ 13 tuổi",
    activeClass: "bg-amber-500 text-black border-amber-400 font-bold shadow-lg shadow-amber-500/30",
    inactiveClass: "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20",
  },
  T16: {
    label: "T16 · Từ 16 tuổi",
    activeClass: "bg-orange-500 text-black border-orange-400 font-bold shadow-lg shadow-orange-500/30",
    inactiveClass: "bg-orange-500/10 text-orange-300 border-orange-500/30 hover:bg-orange-500/20",
  },
  T18: {
    label: "T18 · 18+ (CCCD)",
    activeClass: "bg-rose-500 text-white border-rose-400 font-bold shadow-lg shadow-rose-500/30",
    inactiveClass: "bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20",
  },
};

export function MovieFilters({
  value,
  onChange,
}: {
  value: AgeRating | "ALL";
  onChange: (value: AgeRating | "ALL") => void;
}) {
  const options = ["ALL", ...AGE_RATINGS] as const;

  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((option) => {
        const conf = ratingConfig[option];
        const isActive = value === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "relative inline-flex items-center justify-center rounded-xl border px-3.5 py-1.5 text-xs transition-[transform,background-color,border-color,color] duration-200 active:scale-95",
              isActive ? conf.activeClass : conf.inactiveClass,
            )}
          >
            {conf.label}
          </button>
        );
      })}
    </div>
  );
}
