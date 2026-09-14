import type { ReactNode } from "react";

import { CommandPalette } from "@/components/layout/command-palette";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FilmGrain } from "@/components/shared/film-grain";
import { PageAtmosphere } from "@/components/shared/page-atmosphere";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <PageAtmosphere />
      <FilmGrain />
      <SiteHeader />
      <div className="relative flex-1">{children}</div>
      <SiteFooter />
      <CommandPalette />
    </div>
  );
}
