import { useEffect, useState, useSyncExternalStore } from "react";

export function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [breakpoint]);
  return mobile;
}

export function useViewportWidth(fallback = 1440) {
  const [w, setW] = useState(fallback);
  useEffect(() => {
    // rAF-coalesced: resize storms collapse to one setState per frame.
    let raf = 0;
    const sync = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setW(window.innerWidth);
      });
    };
    sync();
    window.addEventListener("resize", sync, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", sync);
    };
  }, []);
  return w;
}

/* ─── prefers-reduced-motion ──────────────────────────────────
 * A media query is an external store, so `useSyncExternalStore` is the
 * right primitive: no setState-in-effect, no cascading render, and a
 * mid-session preference flip propagates to every subscriber. The SSR
 * snapshot is `false` — the motionless build is always the safe one to
 * render before we know what the visitor asked for. */
const MOTION_OK = "(prefers-reduced-motion: no-preference)";

function subscribeMotion(onChange: () => void) {
  const mq = window.matchMedia(MOTION_OK);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** `true` when the visitor has NOT asked for reduced motion. */
export function useMotionOk(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(MOTION_OK).matches,
    () => false
  );
}
