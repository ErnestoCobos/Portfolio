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
    const copy = track.children[0];
    let w = copy ? (copy as HTMLElement).offsetWidth : 0;
    // Coverage: the wrap window is one copy wide, so the track must span
    // viewport + one copy. Clone copies in the DOM on ultrawide screens
    // (no React re-render churn).
    const ensureCoverage = () => {
      if (!copy || w <= 0) return;
      while (track.scrollWidth < window.innerWidth + w) {
        track.appendChild(copy.cloneNode(true));
      }
    };
    ensureCoverage();
    const onResize = () => {
      w = copy ? (copy as HTMLElement).offsetWidth : 0;
      ensureCoverage();
    };
    let lastY = window.scrollY;
    let vel = 0;
    let x = 0;
    let raf = 0;
    const onScroll = () => {
      vel += window.scrollY - lastY;
      lastY = window.scrollY;
    };
    const loop = () => {
      if (!document.hidden) {
        vel *= 0.92; // decay
        if (w > 0) {
          // Wrap modulo the real copy width, pinned to (-w, 0]: the old
          // fixed % 1000 snapped whenever the copy wasn't 1000px wide.
          x = (((x - vel * 0.6) % w) + w) % w - w;
          track.style.transform = `translate3d(${x}px,0,0)`;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const line = words.join("  ·  ") + "  ·  ";
  return (
    <div className="kinetic-marquee" aria-hidden>
      <div ref={trackRef} className="kinetic-marquee-track">
        {/* 4 copies cover most viewports; the effect clones more when an
         * ultrawide needs them (wrap window = one copy width). */}
        {[0, 1, 2, 3].map((i) => (
          <span key={i}>{line}</span>
        ))}
      </div>
    </div>
  );
}
