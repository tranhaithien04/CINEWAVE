"use client";

import { Canvas } from "@react-three/fiber";

import { CinematicHeroScene } from "@/components/three/cinematic-hero-scene";
import { useLowPowerScene, usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

function OverlayGradient() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#030014] via-[#030014]/70 to-[#030014]/10"
    />
  );
}

function StaticFallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#2e1065_0%,_#030014_58%)]"
    >
      <OverlayGradient />
    </div>
  );
}

export function CinematicHeroCanvas() {
  const reduceMotion = usePrefersReducedMotion();
  const lowPower = useLowPowerScene();

  if (reduceMotion) {
    return <StaticFallback />;
  }

  return (
    <div className="absolute inset-0 -z-10" aria-hidden>
      <Canvas
        className="absolute inset-0 -z-10"
        // Cap pixel ratio: 1.5 đủ nét, tránh fill-rate trên màn Retina
        dpr={[1, 1.5]}
        gl={{
          antialias: !lowPower,
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0.2, 8], fov: 48, near: 0.1, far: 80 }}
        frameloop="always"
      >
        <CinematicHeroScene lowPower={lowPower} />
      </Canvas>
      <OverlayGradient />
    </div>
  );
}
