"use client";

import dynamic from "next/dynamic";

const CinematicHeroCanvas = dynamic(
  () => import("@/components/three/cinematic-hero-canvas").then((mod) => mod.CinematicHeroCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#2e1065_0%,_#030014_58%)]"
      />
    ),
  },
);

export function CinematicHeroBackground() {
  return <CinematicHeroCanvas />;
}
