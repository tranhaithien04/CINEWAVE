"use client";

import { Canvas } from "@react-three/fiber";

import { LightRaysScene } from "@/components/three/light-rays-scene";
import { useLowPowerScene, usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

function OverlayGradient() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06070d] via-[#06070d]/55 to-[#06070d]/08"
    />
  );
}

function StaticFallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.28)_0%,_#06070d_62%)]"
    >
      <OverlayGradient />
    </div>
  );
}

export function LightRaysCanvas() {
  const reduceMotion = usePrefersReducedMotion();
  const lowPower = useLowPowerScene();

  if (reduceMotion) {
    return <StaticFallback />;
  }

  return (
    <div className="absolute inset-0 -z-10" aria-hidden>
      <Canvas
        className="absolute inset-0 -z-10"
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0.15, 7.2], fov: 46, near: 0.1, far: 40 }}
        frameloop="always"
      >
        <LightRaysScene lowPower={lowPower} />
      </Canvas>
      <OverlayGradient />
    </div>
  );
}
