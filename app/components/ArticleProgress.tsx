"use client";

import { useEffect, useState } from "react";

/** Reading progress bar fixed to the top of the viewport. Computes the
 * fraction of `document.documentElement.scrollHeight` that has been
 * scrolled past, smoothed via rAF. The article body is the dominant
 * content of these pages, so doc-level scroll is a fine proxy without
 * needing to measure the article container specifically.
 *
 * Visually a 2px cyan stripe right under the sticky header. `aria-hidden`
 * since it's purely decorative for screen readers — the article itself
 * is the source of truth for progress. */
export function ArticleProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const scrolled = window.scrollY;
      const max = doc.scrollHeight - doc.clientHeight;
      const next = max > 0 ? Math.min(1, Math.max(0, scrolled / max)) : 0;
      setPct(next);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 41,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct * 100}%`,
          background:
            "linear-gradient(90deg, var(--cyan), var(--violet))",
          boxShadow: "0 0 8px var(--cyan-glow)",
          transition: "width 0.06s linear",
        }}
      />
    </div>
  );
}
