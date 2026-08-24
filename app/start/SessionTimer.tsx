"use client";

import { useEffect, useState } from "react";

/** Mission-clock style session timer: T+ HH:MM:SS since the page loaded.
 * SSR renders a placeholder; the first tick lands via 0ms timeout so the
 * effect never calls setState synchronously. */
export function SessionTimer() {
  const [secs, setSecs] = useState<number | null>(null);

  useEffect(() => {
    const t0 = Date.now();
    const update = () => setSecs(Math.floor((Date.now() - t0) / 1000));
    const immediate = window.setTimeout(update, 0);
    const interval = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(interval);
    };
  }, []);

  const fmt = (s: number) =>
    [
      Math.floor(s / 3600),
      Math.floor((s % 3600) / 60),
      s % 60,
    ]
      .map((n) => n.toString().padStart(2, "0"))
      .join(":");

  return (
    <span style={{ color: "var(--fg)" }}>
      T+ {secs === null ? "--:--:--" : fmt(secs)}
    </span>
  );
}
