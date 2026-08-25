"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../portfolio-visuals";

/**
 * MagneticCursor — crosshair reticle that lerps after the real pointer
 * (the native cursor is never hidden) and magnetizes [data-magnetic]
 * elements: cursor snaps toward them, target translates ≤4px toward the
 * pointer. All DOM writes, zero re-renders per frame.
 */
export function MagneticCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const sync = () => setFine(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !fine) return;
    let px = -100;
    let py = -100;
    let cx = -100;
    let cy = -100;
    let target: HTMLElement | null = null;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
    };
    const onOver = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest?.("[data-magnetic]");
      if (target && target !== t) target.style.transform = "";
      target = (t as HTMLElement) ?? null;
      el.dataset.state = target ? "locked" : "free";
    };

    const loop = () => {
      if (!document.hidden) {
        let gx = px;
        let gy = py;
        if (target) {
          const r = target.getBoundingClientRect();
          const tx = r.left + r.width / 2;
          const ty = r.top + r.height / 2;
          const dist = Math.hypot(tx - px, ty - py);
          if (dist < 120) {
            const pull = 1 - dist / 120;
            gx = px + (tx - px) * pull * 0.5;
            gy = py + (ty - py) * pull * 0.5;
            const ox = Math.max(-4, Math.min(4, (px - tx) * 0.08));
            const oy = Math.max(-4, Math.min(4, (py - ty) * 0.08));
            target.style.transform = `translate(${ox}px,${oy}px)`;
          } else {
            target.style.transform = "";
          }
        }
        cx += (gx - cx) * 0.18;
        cy += (gy - cy) * 0.18;
        el.style.transform = `translate3d(${cx - 12}px,${cy - 12}px,0)`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      target?.style.removeProperty("transform");
    };
  }, [reduced, fine]);

  if (reduced || !fine) return null;
  return <div id="magnetic-cursor" ref={ref} aria-hidden data-state="free" />;
}
