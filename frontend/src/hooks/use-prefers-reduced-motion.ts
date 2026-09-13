"use client";

import { useEffect, useState } from "react";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return reduced;
}

export function useLowPowerScene() {
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 768px)");
    const apply = () => {
      setLowPower(narrow.matches || (navigator.hardwareConcurrency ?? 8) <= 4);
    };
    apply();
    narrow.addEventListener("change", apply);
    return () => narrow.removeEventListener("change", apply);
  }, []);

  return lowPower;
}
