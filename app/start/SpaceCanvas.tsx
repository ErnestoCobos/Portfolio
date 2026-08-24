"use client";

import { useEffect, useRef } from "react";

/**
 * SpaceCanvas — full-viewport cinematic background for start.cobos.io.
 *
 * One canvas, one rAF loop, layers:
 *   1. Milky Way — a faint diagonal galactic band behind everything.
 *   2. Nebulae — two vast soft color clouds that breathe slowly.
 *   3. Parallax starfield — 3 depth layers with temperature-graded colors
 *      (blue-white dwarfs → warm giants), drifting and twinkling.
 *   4. Shooting stars — rare, fast meteors across the upper sky.
 *   5. "Gargantua" — rendered the Interstellar way: volumetric accretion
 *      disk built from additive plasma layers, Doppler beaming (the
 *      approaching side burns white-amber, the receding side sinks to
 *      deep red), multi-frequency turbulence flicker, lensed arcs over
 *      and under the horizon, black event horizon, photon ring, and a
 *      subtle anamorphic lens flare streaking through the frame.
 *   6. ISS — the real station crossing the top of the sky.
 *   7. La tripulación — quiet silhouettes at the bottom, backlit by the
 *      disk's amber rim light; a lone firefly drifts among them.
 *
 * Camera: pointer position drives a smoothed parallax (lerped each
 * frame); when idle (or on touch devices) the camera drifts on a slow
 * Lissajous path — a ship's travelling shot. Depth is encoded by how
 * much each layer shifts: far stars barely move, Gargantua sweeps most.
 *
 * Performance + a11y notes:
 *   - DPR-aware, capped at 2x. No shadowBlur anywhere; glow comes from
 *     radial gradients and additive compositing ("lighter"), which reset
 *     per block.
 *   - prefers-reduced-motion → renders a single static frame, no loop,
 *     no parallax.
 *   - Pauses when the tab is hidden (visibilitychange).
 *
 * Real telemetry props (server-fetched, with sane fallbacks):
 *   - wind: solar wind speed (km/s) → disk spin + starfield drift
 *   - kp: geomagnetic K-index (0–9) → glow/flare intensity
 *   - issLat: real ISS latitude → altitude band of the crossing satellite
 */

/** Volumetric disk profile — radii/widths in units of R (event horizon),
 * base alpha per layer. Inner layers are hotter and brighter. */
const DISK_LAYERS = [
  { r: 2.92, w: 0.3, a: 0.085 },
  { r: 2.68, w: 0.26, a: 0.14 },
  { r: 2.42, w: 0.22, a: 0.22 },
  { r: 2.16, w: 0.185, a: 0.32 },
  { r: 1.9, w: 0.145, a: 0.44 },
  { r: 1.66, w: 0.105, a: 0.58 },
  { r: 1.44, w: 0.07, a: 0.72 },
] as const;

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

    // ── Camera parallax ─────────────────────────────────────────
    // Target from the pointer (-1..1), smoothed every frame. `lastInput`
    // timestamps the last pointer move; after ~4s idle (or on touch-only
    // devices that never fire it) the camera wanders on its own.
    let mx = 0;
    let my = 0;
    let px = 0;
    let py = 0;
    let lastInput = -10;
    const onPointer = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
      lastInput = t;
    };
    window.addEventListener("mousemove", onPointer);

    type Star = { x: number; y: number; z: number; r: number; phase: number; col: string };
    let stars: Star[] = [];

    // ── Nebulae ──────────────────────────────────────────────────
    type Nebula = { x: number; y: number; rx: number; ry: number; hue: string };
    let nebulae: Nebula[] = [];

    // ── Shooting stars ────────────────────────────────────────────
    type Meteor = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      len: number;
    };
    const meteors: Meteor[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const count = Math.round((w * h) / 6500);
      stars = Array.from({ length: count }, () => {
        const z = 0.25 + Math.random() * 0.75;
        // Temperature-graded color: far dwarfs burn blue-white, near
        // giants glow amber — like a real color-magnitude diagram.
        const col = z > 0.8 ? "#ffe2b8" : z > 0.55 ? "#f4f2ee" : "#cfe0ff";
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          z,
          r: 0.4 + Math.random() * 1.2,
          phase: Math.random() * Math.PI * 2,
          col,
        };
      });
      nebulae = [
        {
          x: w * 0.26,
          y: h * 0.34,
          rx: Math.max(w, h) * 0.34,
          ry: Math.max(w, h) * 0.24,
          hue: "110,140,220",
        },
        {
          x: w * 0.78,
          y: h * 0.22,
          rx: Math.max(w, h) * 0.3,
          ry: Math.max(w, h) * 0.2,
          hue: "200,110,90",
        },
      ];
    };
    resize();
    window.addEventListener("resize", resize);

    /** Spawn a meteor occasionally — descends left-to-right, fast. */
    const maybeSpawnMeteor = () => {
      if (Math.random() > 0.0042 || meteors.length > 2) return;
      const startX = Math.random() * w * 0.7;
      meteors.push({
        x: startX,
        y: Math.random() * h * 0.4,
        vx: 7 + Math.random() * 4,
        vy: 2.4 + Math.random() * 1.6,
        life: 1,
        len: 90 + Math.random() * 60,
      });
    };

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

    /** Multi-frequency turbulence — sum of slow sines reads as churning
     * plasma; random per-frame noise would just look like a glitch. */
    const flicker = (i: number) =>
      0.82 +
      0.1 * Math.sin(t * 2.1 + i * 1.7) +
      0.08 * Math.sin(t * 4.3 + i * 2.9);

    // ── La tripulación ──────────────────────────────────────────
    // Silhouettes first: muted, darker palette so they read as shapes
    // against the void, backlit by a faint amber rim from the disk.
    // Calm idle only — breath, tail sway, ear twitch. No hops.
    type PetSpec = {
      dx: number; // slot: -1 left, 0 center, 1 right
      size: number; // torso length unit
      legRatio: number; // leg length / size
      body: string;
      shade: string;
      earIn: string;
      earH: number; // ear height factor
      tail: "low" | "whip" | "sickle";
      phase: number;
    };
    const pets: PetSpec[] = [
      // xolo — mediano, café oscuro, piernas largas
      { dx: -1, size: 24, legRatio: 0.38, body: "#463527", shade: "#372a1f", earIn: "#57432f", earH: 1.1, tail: "low", phase: 0.0 },
      // chihuahua — claro apagado, chiquito, orejas enormes
      { dx: 0, size: 16, legRatio: 0.32, body: "#8f887a", shade: "#766f63", earIn: "#6d5d55", earH: 1.5, tail: "sickle", phase: 1.9 },
      // sphynx — gris azulado profundo, esbelto
      { dx: 1, size: 21, legRatio: 0.34, body: "#3b4556", shade: "#303947", earIn: "#4c3f46", earH: 1.2, tail: "whip", phase: 3.6 },
    ];

    /** Torso silhouette as a reusable path (filled dark, stroked as rim). */
    const torsoPath = (
      x: number,
      dir: number,
      bodyY: number,
      bodyH: number,
      L: number,
      breath: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(x - dir * L * 0.44, bodyY - bodyH * 0.55);
      ctx.quadraticCurveTo(x - dir * L * 0.1, bodyY - bodyH * 1.02 * breath, x + dir * L * 0.38, bodyY - bodyH * 0.72);
      ctx.quadraticCurveTo(x + dir * L * 0.5, bodyY - bodyH * 0.35, x + dir * L * 0.34, bodyY + bodyH * 0.02);
      ctx.quadraticCurveTo(x, bodyY + bodyH * 0.24 * breath, x - dir * L * 0.36, bodyY);
      ctx.quadraticCurveTo(x - dir * L * 0.5, bodyY - bodyH * 0.2, x - dir * L * 0.44, bodyY - bodyH * 0.55);
      ctx.closePath();
    };

    const drawPet = (
      p: PetSpec,
      groundY: number,
      spacing: number,
      ps: number,
      flyX: number
    ) => {
      const L = p.size * ps;
      const x = w / 2 + p.dx * spacing;
      const dir = flyX >= x ? 1 : -1; // gently track the firefly
      const legH = L * p.legRatio;
      const bodyH = L * 0.34;
      const gy = groundY;
      const bodyY = gy - legH;
      const breath = 1 + Math.sin(t * 1.9 + p.phase) * 0.02;

      // soft ground shadow
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(x, groundY + 1.5 * ps, L * 0.5, L * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.94;

      // legs — two-segment quadratic, far pair darker, subtle weight shift
      const shoulderX = x + dir * L * 0.32;
      const hipX = x - dir * L * 0.3;
      const shift = Math.sin(t * 0.8 + p.phase) * L * 0.012;
      const leg = (rootX: number, footDx: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = L * 0.06;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(rootX, bodyY - bodyH * 0.1);
        ctx.quadraticCurveTo(
          rootX + footDx * 0.4 + dir * L * 0.02,
          bodyY + legH * 0.55,
          rootX + footDx + shift,
          gy
        );
        ctx.stroke();
      };
      leg(hipX - L * 0.02, -L * 0.03, p.shade); // far hind
      leg(shoulderX - L * 0.02, -L * 0.02, p.shade); // far front

      // tail — breed carriage, slow sway (behind torso)
      const sway = Math.sin(t * 1.6 + p.phase) * 0.18;
      const tailX = x - dir * L * 0.44;
      const tailY = bodyY - bodyH * 0.5;
      ctx.strokeStyle = p.body;
      ctx.lineWidth = L * 0.05;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      if (p.tail === "low") {
        ctx.quadraticCurveTo(
          tailX - dir * L * 0.28, tailY + L * (0.1 + sway * 0.2),
          tailX - dir * L * 0.42, tailY + L * (0.34 - sway * 0.3)
        );
      } else if (p.tail === "whip") {
        ctx.quadraticCurveTo(
          tailX - dir * L * 0.3, tailY - L * (0.05 + sway),
          tailX - dir * L * 0.46, tailY - L * (0.3 + sway)
        );
      } else {
        ctx.quadraticCurveTo(
          tailX - dir * L * 0.2, tailY - L * (0.3 + sway * 0.4),
          tailX - dir * L * 0.05, tailY - L * (0.42 + sway * 0.4)
        );
      }
      ctx.stroke();

      // torso — filled silhouette…
      ctx.fillStyle = p.body;
      torsoPath(x, dir, bodyY, bodyH, L, breath);
      ctx.fill();

      // …backlit by the disk: faint amber rim along the outline
      ctx.strokeStyle = "rgba(255,178,102,.14)";
      ctx.lineWidth = 1;
      torsoPath(x, dir, bodyY, bodyH, L, breath);
      ctx.stroke();

      // near legs over the torso
      leg(hipX + L * 0.02, L * 0.02, p.body); // near hind
      leg(shoulderX + L * 0.02, L * 0.03, p.body); // near front

      // neck + head
      const neckX = x + dir * L * 0.36;
      const neckY = bodyY - bodyH * 0.6;
      const hx = x + dir * L * 0.58;
      const hy = bodyY - bodyH * 1.3 + Math.sin(t * 1.9 + p.phase) * L * 0.015;
      ctx.strokeStyle = p.body;
      ctx.lineWidth = bodyH * 0.42;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(neckX, neckY);
      ctx.lineTo(hx - dir * L * 0.05, hy + bodyH * 0.1);
      ctx.stroke();

      const hr = L * 0.14; // skull radius
      // ears — breed scale, slight twitch
      for (const s of [-1, 1] as const) {
        const ex = hx + s * L * 0.055;
        const ey = hy - hr * 0.55;
        const tipY = ey - hr * 1.7 * p.earH;
        const twitch = Math.sin(t * 2.7 + p.phase + s) * L * 0.012;
        ctx.fillStyle = p.body;
        ctx.beginPath();
        ctx.moveTo(ex - L * 0.05, ey);
        ctx.quadraticCurveTo(ex + s * L * 0.02 + twitch, (ey + tipY) / 2, ex + s * L * 0.035 + twitch, tipY);
        ctx.quadraticCurveTo(ex + s * L * 0.05 + twitch, (ey + tipY) / 2, ex + L * 0.05, ey);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = p.earIn;
        ctx.beginPath();
        ctx.moveTo(ex - L * 0.022, ey - L * 0.01);
        ctx.lineTo(ex + s * L * 0.025 + twitch * 0.7, tipY + hr * 0.5);
        ctx.lineTo(ex + L * 0.022, ey - L * 0.01);
        ctx.closePath();
        ctx.fill();
      }
      // skull
      ctx.fillStyle = p.body;
      ctx.beginPath();
      ctx.arc(hx, hy, hr, 0, Math.PI * 2);
      ctx.fill();
      // muzzle — tapered wedge
      ctx.beginPath();
      ctx.moveTo(hx + dir * hr * 0.3, hy - hr * 0.35);
      ctx.quadraticCurveTo(hx + dir * hr * 1.7, hy - hr * 0.1, hx + dir * hr * 1.55, hy + hr * 0.28);
      ctx.quadraticCurveTo(hx + dir * hr * 0.9, hy + hr * 0.75, hx + dir * hr * 0.15, hy + hr * 0.6);
      ctx.closePath();
      ctx.fill();
      // nose
      ctx.fillStyle = "#23232a";
      ctx.beginPath();
      ctx.arc(hx + dir * hr * 1.5, hy + hr * 0.12, L * 0.018, 0, Math.PI * 2);
      ctx.fill();
      // eye
      ctx.fillStyle = "#15151a";
      ctx.beginPath();
      ctx.arc(hx + dir * hr * 0.35, hy - hr * 0.18, L * 0.02, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
    };

    const draw = () => {
      t += 0.016;

      // ── Camera smoothing ───────────────────────────────────────
      // Pointer target while active; slow Lissajous wander when idle —
      // the travelling shot of a ship that never fully stops.
      const idle = reduced || t - lastInput > 4;
      const targetX = idle ? Math.sin(t * 0.05) * 0.35 : mx;
      const targetY = idle ? Math.cos(t * 0.037) * 0.22 : my;
      px += (targetX - px) * 0.04;
      py += (targetY - py) * 0.04;

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

      // ── Milky Way ─────────────────────────────────────────────
      // A rotated, squashed radial gradient reads as a galactic band
      // without costing more than one fill. Barely there — depth cue.
      ctx.save();
      ctx.translate(w * 0.5 - px * 3, h * 0.42 - py * 2);
      ctx.rotate(-0.32);
      ctx.scale(1, 0.3);
      const mw = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(w, h) * 0.75);
      mw.addColorStop(0, "rgba(178,192,232,.05)");
      mw.addColorStop(0.42, "rgba(150,165,215,.034)");
      mw.addColorStop(0.72, "rgba(212,172,140,.02)");
      mw.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = mw;
      ctx.fillRect(-w * 1.5, -h * 1.5, w * 3, h * 3);
      ctx.restore();

      // ── Nebulae ───────────────────────────────────────────────
      const nebBreath = 0.5 + 0.5 * Math.sin(t * 0.12);
      const nebKp = Math.min(kp * 0.004, 0.03);
      for (const n of nebulae) {
        const nx = n.x - px * 7;
        const ny = n.y - py * 4;
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.rx);
        const a = (0.05 + nebBreath * 0.035 + nebKp).toFixed(3);
        g.addColorStop(0, `rgba(${n.hue},${a})`);
        g.addColorStop(0.6, `rgba(${n.hue},${(Number(a) * 0.3).toFixed(3)})`);
        g.addColorStop(1, `rgba(${n.hue},0)`);
        ctx.fillStyle = g;
        ctx.save();
        ctx.translate(nx, ny);
        ctx.scale(1, n.ry / n.rx);
        ctx.beginPath();
        ctx.arc(0, 0, n.rx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ── Shooting stars ────────────────────────────────────────
      if (!reduced) maybeSpawnMeteor();
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life -= 0.012;
        if (m.life <= 0 || m.x > w + 100 || m.y > h + 100) {
          meteors.splice(i, 1);
          continue;
        }
        const tailX = m.x - m.vx * m.len * 0.12;
        const tailY = m.y - m.vy * m.len * 0.12;
        const mg = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        mg.addColorStop(0, `rgba(230,238,255,${m.life})`);
        mg.addColorStop(1, "rgba(147,197,253,0)");
        ctx.strokeStyle = mg;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }

      // ── Starfield (parallax drift + twinkle + temperature) ────
      const drift = 0.028 + wind * 0.00007;
      for (const s of stars) {
        s.x -= s.z * drift;
        if (s.x < -2) s.x = w + 2;
        // Depth-encoded parallax: near stars sweep wider than far ones.
        const f = 4 + s.z * s.z * 10;
        const sx = s.x - px * f;
        const sy = s.y - py * f * 0.6;
        const tw = 0.5 + 0.5 * Math.sin(t * (0.5 + s.z * 1.2) + s.phase);
        ctx.globalAlpha = tw * (0.25 + s.z * 0.75);
        ctx.fillStyle = s.col;
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── Gargantua ─────────────────────────────────────────────
      const cx = w / 2 - px * 16;
      const cy = h * (w < 640 ? 0.24 : 0.3) - py * 10;
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

      // Doppler beaming — plasma orbiting at relativistic speed beams
      // brighter where it approaches (left), dimmer where it recedes
      // (right). Encoded once as linear gradients across the disk.
      const nearGrad = ctx.createLinearGradient(cx - diskRx, cy, cx + diskRx, cy);
      nearGrad.addColorStop(0, "rgba(255,240,214,1)");
      nearGrad.addColorStop(0.22, "rgba(255,196,110,1)");
      nearGrad.addColorStop(0.55, "rgba(255,150,64,1)");
      nearGrad.addColorStop(0.8, "rgba(212,84,36,1)");
      nearGrad.addColorStop(1, "rgba(150,52,26,1)");
      const farGrad = ctx.createLinearGradient(cx - diskRx, cy, cx + diskRx, cy);
      farGrad.addColorStop(0, "rgba(255,190,130,1)");
      farGrad.addColorStop(0.4, "rgba(255,130,60,.85)");
      farGrad.addColorStop(0.75, "rgba(190,70,35,.7)");
      farGrad.addColorStop(1, "rgba(120,40,22,.6)");

      ctx.globalCompositeOperation = "lighter";

      // 1) FAR side of the disk (top half of the flat ellipse) — behind
      //    the horizon. Dimmed, reddened half of the volumetric stack.
      ctx.strokeStyle = farGrad;
      for (let i = 0; i < DISK_LAYERS.length; i++) {
        const l = DISK_LAYERS[i];
        ctx.globalAlpha = l.a * 0.5 * flicker(i + 3);
        ctx.lineWidth = l.w * R;
        ellipseArc(cx, cy, l.r * R, diskTilt, Math.PI, Math.PI * 2);
        ctx.stroke();
      }
      // one dashed highlight keeps the orbital motion readable
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = R * 0.045;
      ctx.setLineDash([60, 46]);
      ctx.lineDashOffset = spin;
      ellipseArc(cx, cy, R * 2.3, diskTilt, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2) Lensed arcs — the disk's far side bent over/under the horizon,
      //    with the same Doppler asymmetry.
      const lensGrad = ctx.createLinearGradient(cx - R * 1.34, cy, cx + R * 1.34, cy);
      lensGrad.addColorStop(0, "rgba(255,236,200,.95)");
      lensGrad.addColorStop(0.5, "rgba(255,170,80,.7)");
      lensGrad.addColorStop(1, "rgba(220,110,50,.55)");
      ctx.strokeStyle = lensGrad;
      ctx.setLineDash([]);
      ctx.globalAlpha = Math.min(0.8 + kp * 0.03, 1);
      ctx.lineWidth = 5;
      ellipseArc(cx, cy, R * 1.34, 1, Math.PI * 1.15, Math.PI * 1.85); // top
      ctx.stroke();
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 4;
      ellipseArc(cx, cy, R * 1.34, 1, Math.PI * 0.15, Math.PI * 0.85); // bottom
      ctx.stroke();

      ctx.globalCompositeOperation = "source-over";

      // 3) Event horizon — pure black, eats everything drawn behind it.
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

      // 5) NEAR side of the disk (bottom half) — in front, hottest, full
      //    Doppler contrast, additive so layers fuse into plasma.
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = nearGrad;
      for (let i = 0; i < DISK_LAYERS.length; i++) {
        const l = DISK_LAYERS[i];
        ctx.globalAlpha = l.a * flicker(i);
        ctx.lineWidth = l.w * R;
        ellipseArc(cx, cy, l.r * R, diskTilt, 0, Math.PI);
        ctx.stroke();
      }
      // dashed orbital highlight on the near side too
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "rgba(255,220,160,.9)";
      ctx.lineWidth = R * 0.035;
      ctx.setLineDash([60, 46]);
      ctx.lineDashOffset = -spin;
      ellipseArc(cx, cy, R * 2.05, diskTilt, 0, Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      // 6) Anamorphic flare — a horizontal blue-amber streak bleeding
      //    through the frame, scaling with geomagnetic activity.
      const fa = Math.min(0.06 + kpGlow * 0.35, 0.17);
      const fx0 = cx - w * 0.42;
      const fg = ctx.createLinearGradient(fx0, cy, cx + w * 0.42, cy);
      fg.addColorStop(0, "rgba(91,227,216,0)");
      fg.addColorStop(0.38, `rgba(120,190,205,${fa})`);
      fg.addColorStop(0.5, `rgba(255,214,170,${Math.min(fa * 1.6, 0.28)})`);
      fg.addColorStop(0.62, `rgba(120,190,205,${fa})`);
      fg.addColorStop(1, "rgba(91,227,216,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = fg;
      ctx.fillRect(fx0, cy - 1, w * 0.84, 2); // core line
      ctx.globalAlpha = 0.4;
      ctx.fillRect(fx0, cy - 5, w * 0.84, 10); // soft halo
      ctx.globalAlpha = 0.18;
      ctx.fillRect(fx0, cy - 13, w * 0.84, 26); // wide bloom
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      // ── ISS — la estación real cruzando el cielo ──────────────
      const issCross = 50; // seconds per screen crossing (visual)
      const ix = (((t * (w + 240)) / issCross) % (w + 240)) - 120 - px * 5;
      const latN =
        issLat == null
          ? Math.sin(t * 0.08) // offline fallback: gentle wander
          : Math.max(-1, Math.min(1, issLat / 51.6));
      const iy = h * 0.085 + latN * h * 0.045 - py * 3;
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

      // ── La tripulación — quiet silhouettes at the bottom ──────
      const ps = Math.max(0.55, Math.min(1.05, Math.min(w, h) / 720));
      const groundY = h - Math.max(30, 34 * ps);
      const spacing = Math.min(110 * ps, w * 0.2);

      // a lone firefly — dim ember wandering low over the deck
      const flyX = w / 2 + Math.sin(t * 0.35) * spacing * 1.15 + Math.sin(t * 0.13) * 20 * ps;
      const flyY =
        groundY -
        (16 + Math.sin(t * 0.5) * 6 + Math.sin(t * 1.1) * 3) * ps;
      const pulse = 0.55 + 0.35 * Math.sin(t * 2.2);

      for (const p of pets) drawPet(p, groundY, spacing, ps, flyX);

      const fl = ctx.createRadialGradient(flyX, flyY, 0, flyX, flyY, 7 * ps);
      fl.addColorStop(0, `rgba(255,214,150,${pulse * 0.65})`);
      fl.addColorStop(0.4, `rgba(255,160,80,${pulse * 0.2})`);
      fl.addColorStop(1, "rgba(255,160,80,0)");
      ctx.fillStyle = fl;
      ctx.beginPath();
      ctx.arc(flyX, flyY, 7 * ps, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,235,200,${pulse})`;
      ctx.beginPath();
      ctx.arc(flyX, flyY, 1.5 * ps, 0, Math.PI * 2);
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
      window.removeEventListener("mousemove", onPointer);
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
