"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

import { formatHoldCountdown } from "@/hooks/use-hold-countdown";
import { cn } from "@/utils/cn";

export function HoldTimer({ expiresAt, onExpire }: { expiresAt: Date; onExpire?: () => void }) {
  const [label, setLabel] = useState(() => formatHoldCountdown(expiresAt));
  const expired = label === "00:00";

  useEffect(() => {
    let expiredOnce = false;
    const tick = () => {
      const next = formatHoldCountdown(expiresAt);
      setLabel(next);
      if (next === "00:00" && !expiredOnce) {
        expiredOnce = true;
        onExpire?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt, onExpire]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 font-mono text-xs text-amber-300",
        expired && "border-rose-500/40 bg-rose-500/10 text-rose-300",
      )}
    >
      <Clock className={cn("h-4 w-4 text-amber-400", !expired && "animate-pulse")} />
      <span>Thời gian giữ ghế:</span>
      <span className="text-sm font-bold text-white">{label}</span>
    </div>
  );
}
