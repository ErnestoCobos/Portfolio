"use client";

import { useEffect, useRef } from "react";

/**
 * SpaceCanvas — full-viewport cinematic background for start.cobos.io.
 *
 * One canvas, one rAF loop, four layers:
 *   1. Parallax starfield — 3 depth layers drifting left, each star
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
 *
 * Real telemetry props (server-fetched, with sane fallbacks):
 *   - wind: solar wind speed (km/s) → disk spin + starfield drift
 *   - kp: geomagnetic K-index (0–9) → glow/lens intensity
 *   - issLat: real ISS latitude → a small satellite crossing the top
 *     of the sky, altitude band follows latitude.
 */
export function SpaceCanvas({
  wind = 420,
  kp = 2,
  issLat = null,
}: {
  wind?: number;
  kp?: number;
  issLat?: number | null;
}) {
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

    // ── La tripulación ──────────────────────────────────────────
    // Xolo mediano café, sphynx oscuro gris azulado y chihuahua
    // blanco — cartoon sprites built from primitives, hopping at the
    // bottom of the viewport chasing a tiny glowing "star" ball.
    type PetSpec = {
      dx: number; // slot: -1 left, 0 center, 1 right
      size: number;
      body: string;
      shade: string;
      earIn: string;
      earH: number; // ear height factor
      phase: number;
      jump: number;
    };
    const pets: PetSpec[] = [
      // xolo — mediano, café, orejas grandes
      { dx: -1, size: 46, body: "#9c6b46", shade: "#7d5334", earIn: "#c98a6d", earH: 1.15, phase: 0.0, jump: 10 },
      // chihuahua — blanco, chiquito, el que más brinca
      { dx: 0, size: 30, body: "#f2efe7", shade: "#d9d2c4", earIn: "#e8b7ae", earH: 1.35, phase: 1.9, jump: 18 },
      // sphynx — gris azulado oscuro
      { dx: 1, size: 40, body: "#7e8da3", shade: "#66738a", earIn: "#b58a94", earH: 1.05, phase: 3.6, jump: 8 },
    ];

    const drawPet = (
      p: PetSpec,
      groundY: number,
      spacing: number,
      ps: number,
      ballX: number
    ) => {
      const size = p.size * ps;
      const x = w / 2 + p.dx * spacing;
      const dir = ballX >= x ? 1 : -1; // face the ball
      const hop = Math.abs(Math.sin(t * 2.3 + p.phase)) * p.jump * ps;
      const gy = groundY - hop;
      const squash = hop < p.jump * ps * 0.25 ? 0.9 : 1; // landing squash

      // ground shadow (shrinks as they hop)
      ctx.globalAlpha = 0.25 * (1 - hop / (p.jump * ps + 24));
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(x, groundY + 2 * ps, size * 0.5, size * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // tail — wagging curve off the rear
      const wag = Math.sin(t * 5.2 + p.phase) * 0.55;
      const tx = x - dir * size * 0.42;
      const ty = gy - size * 0.5;
      ctx.strokeStyle = p.shade;
      ctx.lineWidth = size * 0.09;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(
        tx - dir * size * 0.28,
        ty - size * (0.28 + 0.12 * wag),
        tx - dir * size * 0.34,
        ty - size * (0.5 + 0.2 * wag)
      );
      ctx.stroke();

      // legs — dangling trot, feet touch down when hop = 0
      ctx.strokeStyle = p.shade;
      ctx.lineWidth = size * 0.1;
      for (const [lx, lp] of [[-0.22, 0], [0.22, Math.PI]] as const) {
        const step = Math.sin(t * 6 + p.phase + lp) * size * 0.08;
        ctx.beginPath();
        ctx.moveTo(x + lx * size, gy - size * 0.15);
        ctx.lineTo(x + lx * size + step, gy + size * 0.08);
        ctx.stroke();
      }

      // body
      ctx.fillStyle = p.body;
      ctx.beginPath();
      ctx.ellipse(x, gy - size * 0.38, size * 0.46, size * 0.3 * squash, 0, 0, Math.PI * 2);
      ctx.fill();

      // head (gentle bob)
      const hx = x + dir * size * 0.42;
      const hy = gy - size * 0.66 + Math.sin(t * 4.4 + p.phase) * size * 0.03;

      // ears — big triangles behind the head, slight twitch
      for (const s of [-1, 1] as const) {
        const ex = hx + s * size * 0.11;
        const ey = hy - size * 0.12;
        const tipY = ey - size * 0.34 * p.earH;
        const twitch = Math.sin(t * 3.1 + p.phase + s) * size * 0.025;
        ctx.fillStyle = p.body;
        ctx.beginPath();
        ctx.moveTo(ex - size * 0.1, ey);
        ctx.lineTo(ex + s * size * 0.05 + twitch, tipY);
        ctx.lineTo(ex + size * 0.1, ey);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = p.earIn;
        ctx.beginPath();
        ctx.moveTo(ex - size * 0.045, ey - size * 0.02);
        ctx.lineTo(ex + s * size * 0.04 + twitch * 0.7, tipY + size * 0.1);
        ctx.lineTo(ex + size * 0.045, ey - size * 0.02);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = p.body;
      ctx.beginPath();
      ctx.arc(hx, hy, size * 0.24, 0, Math.PI * 2);
      ctx.fill();
      // muzzle + nose
      ctx.fillStyle = p.shade;
      ctx.beginPath();
      ctx.ellipse(hx + dir * size * 0.19, hy + size * 0.06, size * 0.1, size * 0.075, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2b2b30";
      ctx.beginPath();
      ctx.arc(hx + dir * size * 0.27, hy + size * 0.04, size * 0.035, 0, Math.PI * 2);
      ctx.fill();
      // eye + catchlight
      ctx.fillStyle = "#1c1c22";
      ctx.beginPath();
      ctx.arc(hx + dir * size * 0.07, hy - size * 0.06, size * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.beginPath();
      ctx.arc(hx + dir * size * 0.07 + size * 0.012, hy - size * 0.072, size * 0.013, 0, Math.PI * 2);
      ctx.fill();
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
      // Drift speed follows the real solar wind: calm sun → slow stars.
      const drift = 0.028 + wind * 0.00007;
      for (const s of stars) {
        s.x -= s.z * drift;
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
      const spin = t * (16 + wind * 0.055); // dash offset — disk rotation
                                            // driven by real solar wind

      // Ambient glow around the whole system — Kp index (geomagnetic
      // activity) makes the whole scene storm-brighter.
      const kpGlow = Math.min(0.1 + kp * 0.016, 0.26);
      const glow = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 6);
      glow.addColorStop(0, `rgba(255,158,64,${kpGlow})`);
      glow.addColorStop(0.35, `rgba(255,120,40,${kpGlow * 0.4})`);
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
      ctx.globalAlpha = Math.min(0.8 + kp * 0.03, 1); // storm-bright arcs
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

      // ── ISS — la estación real cruzando el cielo ──────────────
      // Crosses the top band every ~50s; its altitude band follows the
      // real latitude (±51.6°) reported by wheretheiss.at.
      const issCross = 50; // seconds per screen crossing (visual)
      const ix = ((t * (w + 240)) / issCross) % (w + 240) - 120;
      const latN =
        issLat == null
          ? Math.sin(t * 0.08) // offline fallback: gentle wander
          : Math.max(-1, Math.min(1, issLat / 51.6));
      const iy = h * 0.085 + latN * h * 0.045;
      const iu = Math.max(0.6, Math.min(1, w / 1100)); // scale unit

      // faint trail
      ctx.strokeStyle = "rgba(147,197,253,.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ix - 46 * iu, iy + 3 * iu);
      ctx.lineTo(ix - 8 * iu, iy);
      ctx.stroke();

      // hull + solar panels
      ctx.fillStyle = "rgba(230,238,255,.95)";
      ctx.fillRect(ix - 2.4 * iu, iy - 1.6 * iu, 4.8 * iu, 3.2 * iu);
      ctx.fillStyle = "rgba(91,147,227,.85)"; // blue panels
      ctx.fillRect(ix - 9 * iu, iy - 1 * iu, 5.4 * iu, 2 * iu);
      ctx.fillRect(ix + 3.6 * iu, iy - 1 * iu, 5.4 * iu, 2 * iu);
      // beacon blink
      const blink = 0.4 + 0.6 * (Math.sin(t * 6) > 0.4 ? 1 : 0.15);
      ctx.fillStyle = `rgba(255,120,120,${blink})`;
      ctx.beginPath();
      ctx.arc(ix + 3 * iu, iy - 2.4 * iu, 1.1 * iu, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // ── La tripulación jugando abajo ──────────────────────────
      const ps = Math.max(0.55, Math.min(1.05, Math.min(w, h) / 720));
      const groundY = h - Math.max(30, 34 * ps);
      const spacing = Math.min(120 * ps, w * 0.21);
      const ballX = w / 2 + Math.sin(t * 1.15) * spacing * 0.72;
      const ballHop = Math.abs(Math.sin(t * 2.3 + 0.9)) * 30 * ps;
      const ballY = groundY - 8 * ps - ballHop;

      for (const p of pets) drawPet(p, groundY, spacing, ps, ballX);

      // the ball — a tiny glowing star they chase
      const bl = ctx.createRadialGradient(ballX, ballY, 0, ballX, ballY, 11 * ps);
      bl.addColorStop(0, "rgba(255,224,160,.95)");
      bl.addColorStop(0.35, "rgba(255,170,80,.4)");
      bl.addColorStop(1, "rgba(255,170,80,0)");
      ctx.fillStyle = bl;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 11 * ps, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff0d6";
      ctx.beginPath();
      ctx.arc(ballX, ballY, 3 * ps, 0, Math.PI * 2);
      ctx.fill();
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
    // Telemetry props refresh at most once per ISR window; when they do,
    // the effect re-runs and the loop restarts with fresh values.
  }, [issLat, kp, wind]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}
