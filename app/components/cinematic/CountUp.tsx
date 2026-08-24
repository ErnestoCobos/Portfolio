"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CountUp — eases a number from 0 to `value` (~0.9s, cubic out) the first
 * time it scrolls into view. Portfolio variant of /start's CountUp with
 * an in-view trigger so stats power up as the reader reaches them, not
 * on page load. Static under reduced motion.
 */
export function CountUp({
  value,
  decimals = 0,
  duration = 900,
}: {
  value: number;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(0);

  useEffect(() => {
    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* noop */
    }

    const run = () => {
      let raf = 0;
      const tick = (now: number, t0: number) => {
        const p = Math.min((now - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setV(value * eased);
        if (p < 1) raf = requestAnimationFrame((n) => tick(n, t0));
      };
      if (reduced) {
        raf = requestAnimationFrame(() => setV(value));
        return () => cancelAnimationFrame(raf);
      }
      const t0 = performance.now();
      raf = requestAnimationFrame((n) => tick(n, t0));
      return () => cancelAnimationFrame(raf);
    };

    if (typeof IntersectionObserver === "undefined") return run();

    const el = ref.current;
    if (!el) return;

    let cancel: (() => void) | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        cancel = run();
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancel?.();
    };
  }, [value, duration]);

  return <span ref={ref}>{v.toFixed(decimals)}</span>;
}
