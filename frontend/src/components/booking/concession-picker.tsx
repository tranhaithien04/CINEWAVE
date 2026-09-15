"use client";

import { Minus, Plus, Popcorn } from "lucide-react";

import type { ConcessionItem } from "@/api/catalog";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/data/mock-catalog";

export function ConcessionPicker({
  items,
  qty,
  disabled,
  onChange,
}: {
  items: ConcessionItem[];
  qty: Record<string, number>;
  disabled?: boolean;
  onChange: (id: string, next: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Popcorn className="h-4 w-4 text-amber-300" />
        Thêm bắp nước (không bắt buộc)
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const count = qty[item.id] ?? 0;
          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-3 ${
                count > 0 ? "border-amber-400/40 bg-amber-500/10" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <p className="text-sm font-semibold text-white">{item.name}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{item.description}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-display text-sm font-bold text-amber-200">{formatVnd(item.price)}</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 rounded-lg"
                    disabled={disabled || count <= 0}
                    aria-label={`Giảm ${item.name}`}
                    onClick={() => onChange(item.id, count - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-5 text-center font-mono text-sm text-white">{count}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 rounded-lg"
                    disabled={disabled || count >= 8}
                    aria-label={`Tăng ${item.name}`}
                    onClick={() => onChange(item.id, count + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
