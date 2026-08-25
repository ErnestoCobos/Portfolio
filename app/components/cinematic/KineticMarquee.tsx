"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "../portfolio-visuals";

/**
 * KineticMarquee — a single horizontal line of domain words whose
 * translateX follows scroll VELOCITY (drifts back to 0 when idle). Writes
 * transform directly to the DOM: zero React re-renders per frame.
 * Reduced motion: static line, no listeners.
 */
export function KineticMarquee({
  words,
  mobile: _mobile,
}: {
  words: string[];
  mobile: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const track = trackRef.current;
    if (!track) return;
    let lastY = window.scrollY;
    let vel = 0;
    let x = 0;
    let raf = 0;
    const onScroll = () => {
      vel += window.scrollY - lastY;
      lastY = window.scrollY;
    };
    const loop = () => {
      vel *= 0.92; // decay
      x = (x - vel * 0.6) % 1000;
      track.style.transform = `translate3d(${x}px,0,0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const line = words.join("  ·  ") + "  ·  ";
  return (
    <div className="kinetic-marquee" aria-hidden>
      <div ref={trackRef} className="kinetic-marquee-track">
        {/* 4 copies so the 1000px wrap never shows a gap */}
        {[0, 1, 2, 3].map((i) => (
          <span key={i}>{line}</span>
        ))}
      </div>
    </div>
  );
}
