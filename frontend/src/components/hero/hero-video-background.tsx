"use client";

import { useEffect, useRef, useState } from "react";

import { LightRaysBackground } from "@/components/three/light-rays-background";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const VIDEO_SRC = "/videos/hero-cinematic.mp4";

export function HeroVideoBackground() {
  const reduced = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function reveal() {
      setReady(true);
      void video?.play().catch(() => undefined);
    }

    if (video.readyState >= 2) reveal();
    video.addEventListener("canplay", reveal);
    video.addEventListener("loadeddata", reveal);
    return () => {
      video.removeEventListener("canplay", reveal);
      video.removeEventListener("loadeddata", reveal);
    };
  }, []);

  if (reduced || failed) {
    return <LightRaysBackground />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#06070d]" />
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onError={() => setFailed(true)}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-r from-[#06070d]/55 via-[#06070d]/10 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#06070d] via-transparent to-[#06070d]/15" />
    </div>
  );
}
