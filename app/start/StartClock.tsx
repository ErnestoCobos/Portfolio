"use client";

import { useEffect, useState } from "react";

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const timeFmt = new Intl.DateTimeFormat("es-MX", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** Live clock for the start page. SSR/hydration render a stable placeholder
 * (null state); the first tick lands via a 0ms timeout so the effect body
 * never calls setState synchronously. */
export function StartClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    const immediate = window.setTimeout(update, 0);
    const interval = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <span style={{ color: "var(--muted)" }}>
      {now ? (
        <>
          <span style={{ color: "var(--fg)" }}>{dateFmt.format(now)}</span>
          {" · "}
          <span style={{ color: "var(--cyan)" }}>{timeFmt.format(now)}</span>
          {" · cdmx"}
        </>
      ) : (
        // Placeholder keeps the line height stable before hydration.
        <span aria-hidden>···</span>
      )}
    </span>
  );
}
