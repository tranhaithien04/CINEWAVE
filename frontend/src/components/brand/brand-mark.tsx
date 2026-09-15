"use client";

import Link from "next/link";
import { useId } from "react";

import { paths } from "@/routes/paths";
import { cn } from "@/utils/cn";

type BrandMarkProps = {
  href?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
};

const sizeMap = {
  sm: { box: "h-8 w-8", icon: 18, text: "text-base", gap: "gap-2" },
  md: { box: "h-9 w-9", icon: 20, text: "text-lg", gap: "gap-2.5" },
  lg: { box: "h-11 w-11", icon: 24, text: "text-xl", gap: "gap-3" },
} as const;

function BrandGlyph({ size, markId, waveId }: { size: number; markId: string; waveId: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="relative z-[1]"
    >
      <defs>
        <linearGradient id={markId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67e8f9" />
          <stop offset="0.55" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id={waveId} x1="8" y1="16" x2="26" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a5f3fc" stopOpacity="0.95" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <rect x="5.5" y="6.5" width="21" height="19" rx="3.5" stroke={`url(#${markId})`} strokeWidth="1.6" />
      <rect x="8" y="9.2" width="2.2" height="2.2" rx="0.5" fill={`url(#${markId})`} opacity="0.9" />
      <rect x="8" y="14.9" width="2.2" height="2.2" rx="0.5" fill={`url(#${markId})`} opacity="0.9" />
      <rect x="8" y="20.6" width="2.2" height="2.2" rx="0.5" fill={`url(#${markId})`} opacity="0.9" />
      <rect x="21.8" y="9.2" width="2.2" height="2.2" rx="0.5" fill={`url(#${markId})`} opacity="0.9" />
      <rect x="21.8" y="14.9" width="2.2" height="2.2" rx="0.5" fill={`url(#${markId})`} opacity="0.9" />
      <rect x="21.8" y="20.6" width="2.2" height="2.2" rx="0.5" fill={`url(#${markId})`} opacity="0.9" />
      <path
        d="M11.2 18.2c1.6-3.2 3.2-3.2 4.8 0s3.2 3.2 4.8 0"
        stroke={`url(#${waveId})`}
        strokeWidth="1.85"
        strokeLinecap="round"
        className="brand-wave-stroke"
      />
      <circle cx="16" cy="11.5" r="1.15" fill="#ecfeff" className="brand-lens-dot" />
    </svg>
  );
}

export function BrandMark({
  href = paths.home,
  size = "md",
  showWordmark = true,
  className,
}: BrandMarkProps) {
  const uid = useId().replace(/:/g, "");
  const markId = `cw-mark-${uid}`;
  const waveId = `cw-wave-${uid}`;
  const s = sizeMap[size];

  return (
    <Link
      href={href}
      aria-label="CINEWAVE — Trang chủ"
      className={cn(
        "group inline-flex items-center text-white transition-[transform,filter] duration-300 hover:brightness-110",
        s.gap,
        className,
      )}
    >
      <span
        className={cn(
          "brand-mark-orb relative flex shrink-0 items-center justify-center rounded-xl border border-cyan-400/35 bg-gradient-to-br from-cyan-400/20 via-sky-500/10 to-transparent shadow-neon",
          s.box,
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_25%,rgba(165,243,252,0.35),transparent_55%)]"
        />
        <BrandGlyph size={s.icon} markId={markId} waveId={waveId} />
      </span>
      {showWordmark ? (
        <span className="relative inline-flex flex-col leading-none">
          <span
            className={cn(
              "brand-wordmark font-display font-black tracking-[0.08em] text-transparent",
              s.text,
            )}
          >
            CINEWAVE
          </span>
          <span
            aria-hidden
            className="brand-word-underline mt-1 h-px w-full origin-left bg-gradient-to-r from-cyan-300 via-sky-400/70 to-transparent opacity-70 transition-transform duration-300 group-hover:scale-x-110"
          />
        </span>
      ) : null}
    </Link>
  );
}
