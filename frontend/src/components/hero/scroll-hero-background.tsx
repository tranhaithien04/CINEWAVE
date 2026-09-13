"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { LightRaysBackground } from "@/components/three/light-rays-background";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const TOTAL_FRAMES = 120;
const INITIAL_BATCH = 20;

function getFrameUrl(index: number) {
  const padded = index.toString().padStart(4, "0");
  return `/frames/frame_${padded}.webp`;
}

interface ScrollHeroBackgroundProps {
  containerRef: RefObject<HTMLElement | null>;
}

export function ScrollHeroBackground({ containerRef }: ScrollHeroBackgroundProps) {
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [failed, setFailed] = useState(false);
  const [firstFrameLoaded, setFirstFrameLoaded] = useState(false);

  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const isDestroyedRef = useRef(false);

  useEffect(() => {
    if (reduced || failed || typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    isDestroyedRef.current = false;
    let animFrameId: number | null = null;
    let scrollTriggerInstance: ScrollTrigger | null = null;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }

    // Auto-resize canvas with Retina / HiDPI support
    function handleResize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      render();
    }
    window.addEventListener("resize", handleResize);

    // Find nearest loaded frame if current frame is still fetching
    function getNearestLoadedImage(targetIdx: number): HTMLImageElement | null {
      const imgs = imagesRef.current;
      if (imgs[targetIdx]?.complete) return imgs[targetIdx];

      for (let offset = 1; offset < 15; offset++) {
        const prev = targetIdx - offset;
        if (prev >= 0 && imgs[prev]?.complete) return imgs[prev];
        const next = targetIdx + offset;
        if (next < TOTAL_FRAMES && imgs[next]?.complete) return imgs[next];
      }
      return imgs[0]?.complete ? imgs[0] : null;
    }

    // Sub-pixel Optical Crossfade Blending for True 120 FPS
    function render() {
      if (!canvas || !ctx) return;
      const cw = canvas.width;
      const ch = canvas.height;
      if (!cw || !ch) return;

      const currentF = currentProgressRef.current * (TOTAL_FRAMES - 1);
      const indexA = Math.floor(currentF);
      const indexB = Math.min(indexA + 1, TOTAL_FRAMES - 1);
      const blend = currentF - indexA;

      const imgA = getNearestLoadedImage(indexA);
      const imgB = getNearestLoadedImage(indexB);
      if (!imgA) return;

      const nw = imgA.naturalWidth || 1280;
      const nh = imgA.naturalHeight || 720;
      const scale = Math.max(cw / nw, ch / nh);
      const dw = nw * scale;
      const dh = nh * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;

      // Draw base frame
      ctx.globalAlpha = 1.0;
      ctx.drawImage(imgA, dx, dy, dw, dh);

      // Optical dissolve into next frame for continuous motion
      if (blend > 0.001 && imgB && imgA !== imgB) {
        ctx.globalAlpha = blend;
        ctx.drawImage(imgB, dx, dy, dw, dh);
        ctx.globalAlpha = 1.0;
      }
    }

    // Physics Animation Loop with Exponential Damping
    function physicsLoop() {
      if (isDestroyedRef.current) return;

      const delta = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(delta) > 0.00001) {
        currentProgressRef.current += delta * 0.08; // Ultra-silky inertia
        render();
      }

      animFrameId = requestAnimationFrame(physicsLoop);
    }

    // Image Preloader helper
    function preloadImage(idx: number): Promise<HTMLImageElement> {
      return new Promise((resolve) => {
        if (imagesRef.current[idx]) {
          return resolve(imagesRef.current[idx]!);
        }
        const img = new Image();
        img.src = getFrameUrl(idx);
        img.onload = () => {
          if (!isDestroyedRef.current) {
            imagesRef.current[idx] = img;
          }
          resolve(img);
        };
        img.onerror = () => {
          resolve(img);
        };
      });
    }

    // Background streaming of remaining frames
    function streamRemainingFrames() {
      let currentIdx = INITIAL_BATCH;

      function step(deadline: IdleDeadline) {
        while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && currentIdx < TOTAL_FRAMES) {
          preloadImage(currentIdx);
          currentIdx++;
        }
        if (currentIdx < TOTAL_FRAMES && !isDestroyedRef.current) {
          if ("requestIdleCallback" in window) {
            requestIdleCallback(step);
          } else {
            setTimeout(() => step({ timeRemaining: () => 10, didTimeout: false } as any), 35);
          }
        }
      }

      if ("requestIdleCallback" in window) {
        requestIdleCallback(step);
      } else {
        setTimeout(() => step({ timeRemaining: () => 10, didTimeout: false } as any), 35);
      }
    }

    async function initializeEngine() {
      // 1. Load frame 0 immediately to display instantly
      await preloadImage(0);
      setFirstFrameLoaded(true);
      handleResize();
      render();

      // 2. Setup ScrollTrigger on container
      const triggerEl = containerRef.current || document.body;
      scrollTriggerInstance = ScrollTrigger.create({
        trigger: triggerEl,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          targetProgressRef.current = self.progress;
        },
      });

      animFrameId = requestAnimationFrame(physicsLoop);

      // 3. Load initial batch of 20 frames
      const initialPromises = [];
      for (let i = 1; i < INITIAL_BATCH; i++) {
        initialPromises.push(preloadImage(i));
      }
      await Promise.all(initialPromises);
      ScrollTrigger.refresh();

      // 4. Stream the remaining 100 frames in background
      streamRemainingFrames();
    }

    handleResize();
    void initializeEngine();

    return () => {
      isDestroyedRef.current = true;
      window.removeEventListener("resize", handleResize);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (scrollTriggerInstance) scrollTriggerInstance.kill();
    };
  }, [containerRef, reduced, failed]);

  if (reduced || failed) {
    return <LightRaysBackground />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Base Cinema Dark Atmosphere */}
      <div className="absolute inset-0 bg-[#06070d]" />

      {/* 120 FPS Sub-pixel Optical Canvas */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          firstFrameLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{
          transform: "translateZ(0)",
          willChange: "transform",
          backfaceVisibility: "hidden",
        }}
      />

      {/* Cinematic Vignette Overlays for Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#06070d]/80 via-[#06070d]/30 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#06070d] via-transparent to-[#06070d]/40 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,7,13,0)_0%,_rgba(6,7,13,0.75)_100%)] pointer-events-none" />
    </div>
  );
}

