"use client";

import { useEffect, useState, type RefObject } from "react";

/** Reading progress bar.
 *
 * Default mode (no `scrollRoot` prop): measures the document's scroll
 * position. Renders fixed to the viewport, just under the sticky page
 * header. Used by the dedicated `/blog/<slug>` page.
 *
 * Container mode (`scrollRoot` provided): measures the scroll position
 * of the given element instead of the document, and renders absolutely
 * positioned so it sits at the top of that container. Used by the
 * article modal where the document doesn't scroll — only the modal's
 * own inner viewport does.
 *
 * The bar itself is `aria-hidden` — screen readers infer reading
 * progress from focus/heading position, not a decorative stripe. */
export function ArticleProgress({
  scrollRoot,
}: {
  scrollRoot?: RefObject<HTMLElement | null>;
}) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = scrollRoot?.current ?? null;
      let scrolled = 0;
      let max = 0;
      if (el) {
        scrolled = el.scrollTop;
        max = el.scrollHeight - el.clientHeight;
      } else {
        scrolled = window.scrollY;
        max =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight;
      }
      const next = max > 0 ? Math.min(1, Math.max(0, scrolled / max)) : 0;
      setPct(next);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    const target: EventTarget = scrollRoot?.current ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [scrollRoot]);

  const isContained = !!scrollRoot;

  return (
    <div
      aria-hidden
      style={{
        position: isContained ? "absolute" : "fixed",
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
