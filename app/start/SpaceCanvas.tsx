"use client";

import { useEffect, useRef } from "react";

/**
 * SpaceCanvas — full-viewport cinematic background for start.cobos.io.
 *
 * One canvas, one rAF loop, two layers:
 *   1. Parallax starfield — 3 depth layers drifting slowly left, each star
 *      twinkling on its own phase.
 *   2. "Gargantua" — a black hole rendered the Interstellar way: edge-on
 *      accretion disk (bright amber, dashed strokes rotating via
 *      lineDashOffset), the far side of the disk lensed into arcs above and
 *      below the horizon, black event horizon, and a thin photon ring.
 *
 * Performance + a11y notes:
 *   - DPR-aware, capped at 2x. Gradients rebuilt per frame are cheap enough
 *     at one canvas; shadowBlur is avoided (it's the slow path) in favor of
 *     radial-gradient glows.
 *   - prefers-reduced-motion → renders a single static frame, no loop.
 *   - Pauses when the tab is hidden (visibilitychange).
 */
export function SpaceCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let t = Math.random() * 100; // desync dash phase across reloads

    type Star = { x: number; y: number; z: number; r: number; phase: number };
    let stars: Star[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const count = Math.round((w * h) / 6500); // density scales with viewport
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.25 + Math.random() * 0.75,
        r: 0.4 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    /** Ellipse arc helper: center-relative, flattened by `tilt`. */
    const ellipseArc = (
      cx: number,
      cy: number,
      rx: number,
      tilt: number,
      a0: number,
      a1: number
    ) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, rx * tilt, 0, a0, a1);
    };

    const draw = () => {
      t += 0.016;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // ── Deep space background ─────────────────────────────────
      const bg = ctx.createRadialGradient(
        w * 0.5, h * 0.3, 0,
        w * 0.5, h * 0.3, Math.max(w, h) * 0.9
      );
      bg.addColorStop(0, "#0b0e1a");
      bg.addColorStop(0.55, "#070810");
      bg.addColorStop(1, "#030408");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // ── Starfield (parallax drift + twinkle) ──────────────────
      for (const s of stars) {
        s.x -= s.z * 0.05;
        if (s.x < -2) s.x = w + 2;
        const tw = 0.5 + 0.5 * Math.sin(t * (0.5 + s.z * 1.2) + s.phase);
        ctx.globalAlpha = tw * (0.25 + s.z * 0.75);
        ctx.fillStyle = s.z > 0.82 ? "#e6eeff" : "#93a5c9";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── Gargantua ─────────────────────────────────────────────
      const cx = w / 2;
      const cy = h * (w < 640 ? 0.24 : 0.3);
      const R = Math.max(54, Math.min(w, h) * 0.13); // horizon radius
      const diskRx = R * 2.9;
      const diskTilt = 0.16; // edge-on flattening
      const spin = t * 38; // dash offset — disk rotation

      // Ambient glow around the whole system
      const glow = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 6);
      glow.addColorStop(0, "rgba(255,158,64,.16)");
      glow.addColorStop(0.35, "rgba(255,120,40,.06)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      ctx.lineCap = "round";

      // 1) FAR side of the disk (top half of the flat ellipse) — behind
      //    the horizon. Dim red-orange, rotating with the disk. Only the
      //    widest stroke is dashed (subtle plasma texture); inner strokes
      //    stay solid so the disk reads as a continuous glow, not pills.
      const farGrad = ctx.createLinearGradient(cx - diskRx, cy, cx + diskRx, cy);
      farGrad.addColorStop(0, "rgba(120,40,20,.55)");
      farGrad.addColorStop(0.5, "rgba(255,120,50,.8)");
      farGrad.addColorStop(1, "rgba(120,40,20,.55)");
      ctx.strokeStyle = farGrad;
      for (const [lw, alpha, dashed] of [[16, 0.35, true], [9, 0.6, false], [4, 0.9, false]] as const) {
        ctx.globalAlpha = alpha;
        ctx.lineWidth = lw;
        ctx.setLineDash(dashed ? [64, 44] : []);
        ctx.lineDashOffset = -spin;
        ellipseArc(cx, cy, diskRx, diskTilt, Math.PI, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 2) Lensed arcs — the disk's far side bent over/under the horizon.
      //    Two tight arcs hugging the sphere, brighter than the disk itself.
      const lensGrad = ctx.createLinearGradient(cx, cy - R * 1.6, cx, cy + R * 1.6);
      lensGrad.addColorStop(0, "rgba(255,214,150,.95)");
      lensGrad.addColorStop(0.5, "rgba(255,150,60,.75)");
      lensGrad.addColorStop(1, "rgba(255,214,150,.95)");
      ctx.strokeStyle = lensGrad;
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = 5;
      ellipseArc(cx, cy, R * 1.34, 1, Math.PI * 1.15, Math.PI * 1.85); // top
      ctx.stroke();
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 4;
      ellipseArc(cx, cy, R * 1.34, 1, Math.PI * 0.15, Math.PI * 0.85); // bottom
      ctx.stroke();

      // 3) Event horizon — pure black, eats the center of everything drawn
      //    behind it.
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.98, 0, Math.PI * 2);
      ctx.fill();

      // 4) Photon ring — the thin bright edge of the horizon.
      ctx.strokeStyle = "rgba(255,226,180,.95)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.02, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,170,80,.35)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
      ctx.stroke();

      // 5) NEAR side of the disk (bottom half) — in front, hottest.
      const nearGrad = ctx.createLinearGradient(cx - diskRx, cy, cx + diskRx, cy);
      nearGrad.addColorStop(0, "rgba(150,50,20,.9)");
      nearGrad.addColorStop(0.35, "rgba(255,190,90,1)");
      nearGrad.addColorStop(0.5, "rgba(255,240,200,1)");
      nearGrad.addColorStop(0.65, "rgba(255,190,90,1)");
      nearGrad.addColorStop(1, "rgba(150,50,20,.9)");
      ctx.strokeStyle = nearGrad;
      for (const [lw, alpha, dashed] of [[18, 0.4, true], [10, 0.75, false], [4, 1, false]] as const) {
        ctx.globalAlpha = alpha;
        ctx.lineWidth = lw;
        ctx.setLineDash(dashed ? [64, 44] : []);
        ctx.lineDashOffset = -spin;
        ellipseArc(cx, cy, diskRx, diskTilt, 0, Math.PI);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      if (!running) return;
      draw();
      raf = requestAnimationFrame(loop);
    };

    if (reduced) {
      draw(); // one static frame, no animation loop
    } else {
      loop();
    }

    const onVisibility = () => {
      if (reduced) return;
      running = document.visibilityState === "visible";
      cancelAnimationFrame(raf);
      if (running) loop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}
