"use client";

import { Search } from "lucide-react";

import { openCommandPalette } from "@/components/layout/command-palette";
import { Button } from "@/components/ui/button";

export function SearchTrigger() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="hidden gap-2 rounded-xl border-white/10 bg-cinema-950/50 text-gray-400 md:inline-flex"
      onClick={openCommandPalette}
    >
      <Search className="h-3.5 w-3.5" />
      Tìm phim
      <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">
        Ctrl K
      </kbd>
    </Button>
  );
}
