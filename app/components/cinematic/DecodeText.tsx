"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "█▓▒░<>/\\|=+*·";

/**
 * DecodeText — resolves scrambled glyphs left-to-right over ~0.8s, like a
 * console decrypting a line. Portfolio variant: arms when the element
 * scrolls into view (the /start page has its own boot-gated version).
 * Renders the final text immediately under reduced motion, without JS,
 * and on the server — so it degrades to plain text everywhere that
 * motion doesn't make sense.
 */
export function DecodeText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [out, setOut] = useState(text);

  useEffect(() => {
    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return;
    }
    if (reduced) return;

    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    let iv: number | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const duration = 800;
        const step = 40;
        const t0 = performance.now();
        iv = window.setInterval(() => {
          const p = (performance.now() - t0) / duration;
          if (p >= 1) {
            setOut(text);
            if (iv) window.clearInterval(iv);
            return;
          }
          const solved = Math.floor(p * text.length);
          setOut(
            text.slice(0, solved) +
              [...text.slice(solved)]
                .map((c) =>
                  c === " "
                    ? " "
                    : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
                )
                .join("")
          );
        }, step);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (iv) window.clearInterval(iv);
    };
  }, [text]);

  return <span ref={ref}>{out}</span>;
}
