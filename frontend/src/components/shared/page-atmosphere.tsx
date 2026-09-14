"use client";

import { usePathname } from "next/navigation";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/utils/cn";

function FilmRail({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={cn(
        "absolute top-0 hidden h-full w-14 md:block lg:w-16",
        side === "left" ? "left-0" : "right-0",
      )}
    >
      <div className="absolute inset-y-0 inset-x-2 rounded-sm bg-gradient-to-b from-cyan-500/20 via-white/[0.06] to-sky-600/15" />
      <div
        className="absolute inset-y-3 inset-x-3 opacity-80"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0 14px, rgba(7,9,18,0.92) 14px 28px)",
        }}
      />
      <div
        className={cn(
          "absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-cyan-300/40 to-transparent",
          side === "left" ? "right-1" : "left-1",
        )}
      />
    </div>
  );
}

/** Rich cinematic backdrop for all routes except the home hero. */
export function PageAtmosphere() {
  const pathname = usePathname() || "/";
  const reduced = usePrefersReducedMotion();
  if (pathname === "/") return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Base stage */}
      <div className="absolute inset-0 bg-[#05060d]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,rgba(14,116,144,0.35),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_100%_40%,rgba(37,99,235,0.22),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_80%,rgba(8,145,178,0.2),transparent_45%)]" />

      {/* Drifting color masses */}
      <div
        className={cn(
          "absolute -left-24 top-[-10%] h-[42rem] w-[42rem] rounded-full bg-cyan-400/25 blur-[110px]",
          !reduced && "animate-atmosphere-drift",
        )}
      />
      <div
        className={cn(
          "absolute -right-16 top-[18%] h-[36rem] w-[36rem] rounded-full bg-sky-500/20 blur-[120px]",
          !reduced && "animate-atmosphere-drift [animation-delay:-6s]",
        )}
      />
      <div
        className={cn(
          "absolute bottom-[-20%] left-[20%] h-[30rem] w-[48rem] rounded-full bg-blue-700/25 blur-[130px]",
          !reduced && "animate-pulse-glow",
        )}
      />

      {/* Projector light beams */}
      <div
        className={cn(
          "absolute left-[18%] top-[-20%] h-[140%] w-40 origin-top bg-gradient-to-b from-cyan-300/25 via-cyan-400/8 to-transparent blur-2xl",
          !reduced && "animate-atmosphere-beam",
        )}
      />
      <div
        className={cn(
          "absolute right-[22%] top-[-25%] h-[140%] w-28 origin-top bg-gradient-to-b from-sky-200/20 via-blue-400/8 to-transparent blur-2xl",
          !reduced && "animate-atmosphere-beam [animation-delay:-4s]",
        )}
      />

      {/* Diagonal sheen */}
      <div className="absolute inset-0 opacity-40 mix-blend-screen">
        <div className="absolute -left-1/4 top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
        <div className="absolute right-0 top-1/4 h-2/3 w-1/3 -rotate-12 bg-gradient-to-l from-transparent via-cyan-300/[0.05] to-transparent" />
      </div>

      {/* Perspective floor grid */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55%] opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to top, rgba(34,211,238,0.18), transparent 70%),
            linear-gradient(rgba(34,211,238,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 48px 48px, 48px 48px",
          transform: "perspective(700px) rotateX(58deg)",
          transformOrigin: "center bottom",
          maskImage: "linear-gradient(to top, black 10%, transparent 85%)",
          WebkitMaskImage: "linear-gradient(to top, black 10%, transparent 85%)",
        }}
      />

      {/* Soft HUD grid overhead */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 15%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 15%, transparent 70%)",
        }}
      />

      {/* Film sprocket rails */}
      <FilmRail side="left" />
      <FilmRail side="right" />

      {/* Giant watermark */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <p className="select-none font-display text-[18vw] font-black leading-none tracking-[-0.06em] text-white/[0.035]">
          CINEWAVE
        </p>
      </div>

      {/* Horizon glow line */}
      <div className="absolute inset-x-[8%] top-[42%] h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent blur-[1px]" />
      <div className="absolute inset-x-[20%] top-[42%] h-8 -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent blur-xl" />

      {/* Speck lights */}
      <div className="absolute left-[18%] top-[22%] h-1.5 w-1.5 rounded-full bg-cyan-200/80 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
      <div className="absolute right-[24%] top-[30%] h-1 w-1 rounded-full bg-sky-100/70 shadow-[0_0_10px_rgba(125,211,252,0.8)]" />
      <div className="absolute left-[62%] top-[58%] h-1 w-1 rounded-full bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.7)]" />

      {/* Vignette + stage framing */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,6,13,0.35)_45%,rgba(5,6,13,0.92)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#05060d] via-[#05060d]/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#03040a] via-[#05060d]/80 to-transparent" />
    </div>
  );
}
