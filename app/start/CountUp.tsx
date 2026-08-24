"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CountUp — eases a number from 0 to `value` on mount (~0.8s, cubic
 * out). Server telemetry arrives as final numbers; this makes the readout
 * feel like instruments powering up. Static under reduced motion.
 */
export function CountUp({
  value,
  decimals = 0,
  duration = 800,
}: {
  value: number;
  decimals?: number;
  duration?: number;
}) {
  const [v, setV] = useState(0);
  const t0 = useRef(0);

  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - t0.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Reduced motion → jump straight to the value, still via rAF so
      // setState never runs synchronously inside the effect body.
      raf = requestAnimationFrame(() => setV(value));
      return () => cancelAnimationFrame(raf);
    }
    t0.current = performance.now();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{v.toFixed(decimals)}</>;
}
