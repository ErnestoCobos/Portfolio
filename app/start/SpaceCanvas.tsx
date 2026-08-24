"use client";

import { useEffect, useRef } from "react";

/**
 * SpaceCanvas — full-viewport cinematic background for start.cobos.io.
 *
 * One canvas, one rAF loop, layers:
 *   1. Parallax starfield — 3 depth layers drifting left, each star
 *      twinkling on its own phase.
 *   2. Nebulae — two vast soft color clouds (cool indigo + warm ember)
 *      that breathe slowly, giving the void depth.
 *   3. Shooting stars — rare, fast meteors streaking across the upper
 *      sky. A cinematic surprise, not noise.
 *   4. "Gargantua" — a black hole rendered the Interstellar way: edge-on
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

    // ── Nebulae ──────────────────────────────────────────────────
    // Two slow, vast color clouds that give the void depth — a cool
    // indigo drift to the left of Gargantua and a warm ember wash to
    // the right. Recomputed only on resize; opacity breathes in draw().
    type Nebula = { x: number; y: number; rx: number; ry: number; hue: string };
    let nebulae: Nebula[] = [];

    // ── Shooting stars ────────────────────────────────────────────
    // Occasional meteors streak across the upper sky. Rare and short-
    // lived so they stay a cinematic surprise, not noise.
    type Meteor = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number; // 0..1, fades as it flies
      len: number;
    };
    let meteors: Meteor[] = [];

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
          rx: Math.max(w, h) * 0.30,
          ry: Math.max(w, h) * 0.20,
          hue: "200,110,90",
        },
      ];
    };
    resize();
    window.addEventListener("resize", resize);

    /** Spawn a meteor occasionally — descends left-to-right, fast. */
    const maybeSpawnMeteor = () => {
      // ~1 in 240 frames on average → roughly one every few seconds.
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

    // ── La tripulación ──────────────────────────────────────────
    // Xolo mediano café, sphynx gris azulado y chihuahua blanco —
    // side-profile sprites with breed-accurate proportions, muted
    // palette and calm idle motion (breathing, tail sway, ear twitch).
    // They only hop when the little star drifts close — quiet crew.
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
      jump: number;
    };
    const pets: PetSpec[] = [
      // xolo — mediano, café, piernas largas y elegantes
      { dx: -1, size: 34, legRatio: 0.38, body: "#7d5c42", shade: "#644832", earIn: "#a5795f", earH: 1.1, tail: "low", phase: 0.0, jump: 6 },
      // chihuahua — blanco, chiquito, orejas enormes
      { dx: 0, size: 22, legRatio: 0.32, body: "#ded9cd", shade: "#c3bcae", earIn: "#d9aca3", earH: 1.5, tail: "sickle", phase: 1.9, jump: 12 },
      // sphynx — gris azulado oscuro, esbelto
      { dx: 1, size: 30, legRatio: 0.34, body: "#68768c", shade: "#55617a", earIn: "#9d7d88", earH: 1.2, tail: "whip", phase: 3.6, jump: 5 },
    ];

    const drawPet = (
      p: PetSpec,
      groundY: number,
      spacing: number,
      ps: number,
      ballX: number
    ) => {
      const L = p.size * ps;
      const x = w / 2 + p.dx * spacing;
      const dir = ballX >= x ? 1 : -1; // face the star
      const legH = L * p.legRatio;
      const bodyH = L * 0.34; // torso depth
      // hops only when the star is nearby — calm idle otherwise
      const near = Math.abs(ballX - x) < spacing * 0.55;
      const hop = near ? Math.abs(Math.sin(t * 1.7 + p.phase)) * p.jump * ps : 0;
      const gy = groundY - hop; // foot line
      const bodyY = gy - legH; // belly line
      const breath = 1 + Math.sin(t * 1.9 + p.phase) * 0.02;

      // soft ground shadow
      ctx.globalAlpha = 0.18 * (1 - hop / 30);
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(x, groundY + 1.5 * ps, L * 0.5, L * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.92;

      // legs — two-segment quadratic, far pair darker, slight gait
      const shoulderX = x + dir * L * 0.32;
      const hipX = x - dir * L * 0.3;
      const gait = hop > 0 ? Math.sin(t * 5 + p.phase) * L * 0.06 : 0;
      const leg = (rootX: number, footDx: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = L * 0.06;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(rootX, bodyY - bodyH * 0.1);
        ctx.quadraticCurveTo(
          rootX + footDx * 0.4 + dir * L * 0.02,
          bodyY + legH * 0.55,
          rootX + footDx + gait,
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

      // torso — one closed silhouette: rump → back → chest → belly
      ctx.fillStyle = p.body;
      ctx.beginPath();
      ctx.moveTo(x - dir * L * 0.44, bodyY - bodyH * 0.55);
      ctx.quadraticCurveTo(x - dir * L * 0.1, bodyY - bodyH * 1.02 * breath, x + dir * L * 0.38, bodyY - bodyH * 0.72);
      ctx.quadraticCurveTo(x + dir * L * 0.5, bodyY - bodyH * 0.35, x + dir * L * 0.34, bodyY + bodyH * 0.02);
      ctx.quadraticCurveTo(x, bodyY + bodyH * 0.24 * breath, x - dir * L * 0.36, bodyY);
      ctx.quadraticCurveTo(x - dir * L * 0.5, bodyY - bodyH * 0.2, x - dir * L * 0.44, bodyY - bodyH * 0.55);
      ctx.closePath();
      ctx.fill();

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

      // ── Nebulae ───────────────────────────────────────────────
      // Vast soft color clouds that give the void depth. Opacity
      // breathes slowly so they feel alive, not pasted-on. Storm Kp
      // nudges them slightly brighter to match the disk's mood.
      const nebBreath = 0.5 + 0.5 * Math.sin(t * 0.12);
      const nebKp = Math.min(kp * 0.004, 0.03);
      for (const n of nebulae) {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.rx);
        const a = (0.05 + nebBreath * 0.035 + nebKp).toFixed(3);
        g.addColorStop(0, `rgba(${n.hue},${a})`);
        g.addColorStop(0.6, `rgba(${n.hue},${(Number(a) * 0.3).toFixed(3)})`);
        g.addColorStop(1, `rgba(${n.hue},0)`);
        ctx.fillStyle = g;
        ctx.save();
        ctx.translate(n.x, n.y);
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

      // ── La tripulación — quiet idle at the bottom ─────────────
      const ps = Math.max(0.55, Math.min(1.05, Math.min(w, h) / 720));
      const groundY = h - Math.max(30, 34 * ps);
      const spacing = Math.min(120 * ps, w * 0.21);
      const ballX = w / 2 + Math.sin(t * 0.9) * spacing * 0.72;
      const ballHop = Math.abs(Math.sin(t * 1.7 + 0.9)) * 18 * ps;
      const ballY = groundY - 6 * ps - ballHop;

      for (const p of pets) drawPet(p, groundY, spacing, ps, ballX);

      // a tiny drifting star — dim, calm
      const bl = ctx.createRadialGradient(ballX, ballY, 0, ballX, ballY, 8 * ps);
      bl.addColorStop(0, "rgba(255,224,160,.7)");
      bl.addColorStop(0.35, "rgba(255,170,80,.22)");
      bl.addColorStop(1, "rgba(255,170,80,0)");
      ctx.fillStyle = bl;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 8 * ps, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,240,214,.9)";
      ctx.beginPath();
      ctx.arc(ballX, ballY, 2.2 * ps, 0, Math.PI * 2);
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
