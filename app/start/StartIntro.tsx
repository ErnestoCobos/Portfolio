"use client";

import { useEffect, useRef } from "react";

/**
 * StartIntro — one-shot cinematic boot: a black veil fades out while the
 * scene settles from a slight zoom. Runs once per browser session.
 *
 * The decision happens in an inline pre-paint script in layout.tsx,
 * which adds `start-intro-boot` to <html> (no FOUC, no setState dance).
 * This component just renders the veil and removes the class when the
 * animation ends, so hover/fixed behavior returns to normal afterwards.
 * Under reduced motion (or repeat visits) the class never lands and
 * everything stays inert.
 */
export function StartIntro() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("start-intro-boot")) return;
    const el = ref.current;
    const finish = () => root.classList.remove("start-intro-boot");
    // animationend is the precise signal; the timeout is a safety net.
    el?.addEventListener("animationend", finish, { once: true });
    const safety = window.setTimeout(finish, 2400);
    return () => {
      el?.removeEventListener("animationend", finish);
      window.clearTimeout(safety);
    };
  }, []);

  return <div ref={ref} aria-hidden className="start-intro-overlay" />;
}
