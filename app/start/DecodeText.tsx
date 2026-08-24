"use client";

import { useEffect, useState } from "react";

const GLYPHS = "█▓▒░<>/\\|=+*·";

/**
 * DecodeText — resolves scrambled glyphs left-to-right over ~0.9s, like
 * a console decrypting its status line during the intro. Renders static
 * text unless the intro is actually playing this page load (detected via
 * the live `start-intro-boot` class the pre-paint script added) — so
 * repeat visits stay calm even though the sessionStorage flag exists.
 */
export function DecodeText({ text }: { text: string }) {
  const [out, setOut] = useState(text);

  useEffect(() => {
    let reduced = false;
    let booting = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      booting = document.documentElement.classList.contains("start-intro-boot");
    } catch {
      return;
    }
    if (!booting || reduced) return;

    const duration = 900;
    const step = 40;
    const t0 = performance.now();
    const iv = window.setInterval(() => {
      const p = (performance.now() - t0) / duration;
      if (p >= 1) {
        setOut(text);
        window.clearInterval(iv);
        return;
      }
      const solved = Math.floor(p * text.length);
      setOut(
        text.slice(0, solved) +
          [...text.slice(solved)]
            .map((c) =>
              c === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
            )
            .join("")
      );
    }, step);
    return () => window.clearInterval(iv);
  }, [text]);

  return <>{out}</>;
}
