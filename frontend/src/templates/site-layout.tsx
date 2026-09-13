import type { ReactNode } from "react";

import { CommandPalette } from "@/components/layout/command-palette";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FilmGrain } from "@/components/shared/film-grain";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <FilmGrain />
      <SiteHeader />
      {children}
      <SiteFooter />
      <CommandPalette />
    </div>
  );
}
