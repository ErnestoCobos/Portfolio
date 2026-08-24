"use client";

import { useEffect, useRef, useState } from "react";

type RevealState = "out" | "in";

/**
 * Scroll-triggered reveal wrapper. The element starts hidden (only when
 * JS is present — CSS gates every hiding rule on `html.js`) and plays a
 * blur-rise animation, staggered by `delayMs`, the first time it enters
 * the viewport. Refs are read exclusively inside effects, which keeps
 * the React Compiler's `react-hooks/refs` rule satisfied.
 *
 * `fill` makes the wrapper a flex container at 100% height so grid cards
 * keep their equal-height stretch through the extra DOM node.
 *
 * No-JS → never hidden. Reduced motion → global reset + observer snap
 * make reveals instant.
 */
export function Reveal({
  children,
  delayMs = 0,
  fill = false,
  className,
  style,
}: {
  children: React.ReactNode;
  delayMs?: number;
  fill?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RevealState>("out");

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* noop */
    }
    if (reduced || typeof IntersectionObserver === "undefined") {
      setState("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={elRef}
      data-reveal={state}
      className={[fill ? "reveal-fill" : "", className ?? ""]
        .filter(Boolean)
        .join(" ") || undefined}
      style={{
        ["--reveal-delay" as string]: `${delayMs}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
