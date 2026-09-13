"use client";

import dynamic from "next/dynamic";

const LightRaysCanvas = dynamic(
  () => import("@/components/three/light-rays-canvas").then((mod) => mod.LightRaysCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.28)_0%,_#06070d_62%)]"
      />
    ),
  },
);

export function LightRaysBackground() {
  return <LightRaysCanvas />;
}
