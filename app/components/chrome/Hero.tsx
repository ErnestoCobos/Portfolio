"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "../../lib/i18n/locale-context";
import {
  CloudTopology,
  IsoCloud,
  useMounted,
  useReducedMotion,
} from "../portfolio-visuals";
import { useViewportWidth } from "../hooks";

/** Format session uptime. <1min: `12.3s`. ≥1min: `1m 23s`. Fed by
 * SessionClock's 10Hz interval so it always reads as "real time". */
export function fmtSession(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

/* ─── Hero time-islands ──────────────────────────────────── */
/** The hero used to own ONE 60fps ticker for everything (boot log, session
 * clock, orbiting pills, connector lines), re-rendering the entire section
 * — headline, terminal chrome, SVG lattice — every frame, forever. These
 * islands invert that: each time-driven concern owns its own clock, lives
 * in its own tiny subtree, and STOPS when its job is done:
 *   - BootLog    → rAF only while typing; cancels itself on completion.
 *   - SessionClock → setInterval @ 10Hz; re-renders one <span>.
 *   - OrbitSystem  → zero JS per frame; pure CSS rotation + highlight cycle.
 */

export const BOOT_LINES = (prompt: string) => [
  { k: "cmd" as const, v: `${prompt} whoami` },
  {
    k: "out" as const,
    v: "ernesto.cobos · cloud_architect+platform_engineer+devsecops",
  },
  { k: "cmd" as const, v: `${prompt} uptime` },
  {
    k: "out" as const,
    v: "9 years, 4 months · current sprint:  enkiflow.com (saas · prod)",
  },
  { k: "cmd" as const, v: `${prompt} ls ./expertise` },
  {
    k: "out" as const,
    v: "aws/  gcp/  azure/  k8s/  argo/  vault/  opa/  terraform/  istio/",
  },
  { k: "cmd" as const, v: `${prompt} echo $POSITION` },
  {
    k: "out" as const,
    v: "one of the cloud architects you actually want answering at 3am.",
  },
  { k: "cmd" as const, v: `${prompt} ` },
];

export function BootLog({ mobile }: { mobile: boolean }) {
  const reduced = useReducedMotion();
  // 0 everywhere on the first paint (server AND hydration pass — keeps
  // them identical); reduced-motion users are snapped to the finished
  // log post-mount instead.
  const [progress, setProgress] = useState(0);
  const lines = BOOT_LINES("$");
  const total = lines.reduce((a, l) => a + l.v.length, 0);

  useEffect(() => {
    if (reduced) {
      // One-shot reduceMotion → finished-log snap, not a cascade (same
      // pattern as the Approach pipeline's reduce-motion handling).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- documented one-shot snap
      setProgress(Infinity);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const p = Math.min(total, ((now - t0) / 1000) * 55);
      setProgress(p);
      if (p < total) {
        raf = requestAnimationFrame(loop);
      }
      // else: done — rAF never re-armed, component goes permanently quiet.
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, total]);

  const typed: { k: "cmd" | "out"; v: string }[] = [];
  let used = 0;
  for (const l of lines) {
    const remaining = progress - used;
    if (remaining <= 0) break;
    typed.push({
      ...l,
      v: l.v.slice(0, Math.floor(Math.min(l.v.length, remaining))),
    });
    used += l.v.length;
  }

  return (
    <>
      {typed.map((l, i) => (
        <div
          key={i}
          className="mono"
          style={{
            fontSize: mobile ? 12 : 14,
            lineHeight: 1.7,
            color: l.k === "cmd" ? "#00D4FF" : "var(--fg)",
            whiteSpace: "pre-wrap",
          }}
        >
          {l.v}
          {i === typed.length - 1 && <span className="hero-caret" aria-hidden />}
        </div>
      ))}
    </>
  );
}

export function SessionClock() {
  const t = useT();
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const iv = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - started) / 100) / 10);
    }, 100);
    return () => window.clearInterval(iv);
  }, []);
  return (
    <span
      className="mono"
      style={{
        fontSize: 12,
        color: "var(--meta)",
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
      }}
      aria-label={t.hero.sessionAria(Math.floor(seconds))}
    >
      <span className="dot green" aria-hidden /> {t.hero.sessionLabel} ·{" "}
      {fmtSession(seconds)}
    </span>
  );
}

export const ORBIT_LABELS = ["EKS", "GKE", "AKS", "Argo CD", "Vault", "OPA"];
/** Ellipse geometry — drawn as a circle of radius RX, squashed to RY by
 * `.orbit-scale { transform: scaleY(var(--orbit-squash)) }`. Must match
 * the original JS-orbit proportions (rx 165 / ry 100). */
export const ORBIT_STAGE = 340;
export const ORBIT_RX = 165;
export const ORBIT_SQUASH = 100 / 165;

/**
 * CSS-only orbital system. A spinning layer rotates the whole assembly
 * (connector SVG + six pill anchors) while nested counter-rotation keeps
 * every label upright through the scaleY squash that turns the circle
 * into the original ellipse. The "active" highlight cycles via a shared
 * 12s keyframe timeline staggered per slot — all animation work happens
 * on the compositor; React renders this exactly once.
 */
export function OrbitSystem() {
  const accent = "#00D4FF";
  const violet = "#7C3AED";
  const cxy = ORBIT_STAGE / 2;
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <div
        className="orbit-scale"
        style={{
          width: ORBIT_STAGE,
          height: ORBIT_STAGE,
          ["--orbit-squash" as string]: ORBIT_SQUASH,
        }}
      >
        <div className="orbit-spin">
          {/* Connector lines — static geometry, drawn once. The spin layer
              rotates them; the slot-cycle keyframes brighten each line in
              its 2s window. */}
          <svg
            width={ORBIT_STAGE}
            height={ORBIT_STAGE}
            viewBox={`0 0 ${ORBIT_STAGE} ${ORBIT_STAGE}`}
            style={{ position: "absolute", inset: 0 }}
          >
            {ORBIT_LABELS.map((_, i) => {
              const a = (i * Math.PI * 2) / 6 - Math.PI / 2;
              const x = cxy + Math.cos(a) * ORBIT_RX;
              const y = cxy + Math.sin(a) * ORBIT_RX;
              const c = i % 2 === 0 ? accent : violet;
              return (
                <line
                  key={i}
                  className="orbit-line"
                  style={{ ["--slot" as string]: i, color: c }}
                  x1={cxy}
                  y1={cxy}
                  x2={x}
                  y2={y}
                  stroke={c}
                />
              );
            })}
          </svg>
          {ORBIT_LABELS.map((label, i) => {
            const ang = (i * 360) / 6;
            const c = i % 2 === 0 ? accent : violet;
            return (
              <div
                key={label}
                className="orbit-node orbit-pos"
                style={{
                  ["--ang" as string]: `${ang}deg`,
                  ["--r" as string]: `${ORBIT_RX}px`,
                  left: cxy,
                  top: cxy,
                }}
              >
                <div className="orbit-node orbit-anti">
                  <div
                    className="orbit-node"
                    style={{ transform: `rotate(-${ang}deg)` }}
                  >
                    <div className="orbit-node orbit-descale">
                      <span
                        className="orbit-pill mono"
                        style={{
                          ["--slot" as string]: i,
                          color: c,
                          borderColor: `${c}55`,
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Hero (terminal chrome + animated boot log + iso lattice) ── */
export function Hero({ mobile }: { mobile: boolean }) {
  const dict = useT();
  const mounted = useMounted();
  const reduced = useReducedMotion();
  const vw = useViewportWidth();
  const accent = "#00D4FF";
  const violet = "#7C3AED";
  const topoW = mobile ? Math.min(vw, 600) : Math.min(vw - 96, 1440);
  const topoH = mobile ? 720 : 1000;

  // Mouse parallax — writes --px/--py on the section node; layers consume
  // them via calc() transforms. Zero React state, desktop + motion only.
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (mobile || reduced) return;
    const el = sectionRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      el.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    };
    el.addEventListener("mousemove", onMove, { passive: true });
    return () => el.removeEventListener("mousemove", onMove);
  }, [mobile, reduced]);

  return (
    // Hero is intentionally <100vh so the next section's header peeks ~60px
    // below the fold — turns scrolling from a decision into a consequence.
    <section
      ref={sectionRef}
      style={{
        padding: mobile ? "20px 16px 32px" : "24px 48px 56px",
        height: mobile ? "auto" : "calc(85vh - 36px)",
        minHeight: mobile ? "auto" : 640,
        maxHeight: mobile ? "none" : 920,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div
          className="aurora"
          style={{
            position: "absolute",
            inset: "-8%",
            background: `radial-gradient(ellipse at 70% 15%, ${accent}24, transparent 55%), radial-gradient(ellipse at 15% 85%, ${violet}26, transparent 55%)`,
          }}
        />
        <div
          className="hero-parallax-bg"
          style={{ position: "absolute", inset: 0, opacity: 0.5 }}
        >
          <CloudTopology
            width={topoW}
            height={topoH}
            density={mobile ? 0.5 : 0.9}
            animate={!reduced}
          />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(var(--surface-soft) 1px, transparent 1px), linear-gradient(90deg, var(--surface-soft) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1280,
          margin: "0 auto",
          width: "100%",
          flex: 1,
          border: "1px solid var(--hairline-strong)",
          borderRadius: 14,
          overflow: "hidden",
          background: "rgba(6,6,10,.78)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: `0 30px 80px rgba(0,0,0,.5), 0 0 80px ${accent}1A`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderBottom: "1px solid var(--hairline)",
            background: "var(--surface-overlay)",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "var(--r-chip)",
              background: "#444",
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "var(--r-chip)",
              background: "#444",
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "var(--r-chip)",
              background: accent,
              boxShadow: `0 0 12px ${accent}`,
            }}
          />
          <span
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginLeft: 12,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {mobile ? dict.hero.terminalTitleMobile : dict.hero.terminalTitle}
          </span>
          <SessionClock />
        </div>

        <div
          className="hero-bootlog"
          style={{
            padding: mobile ? "16px 18px 10px" : "20px 36px 14px",
            borderBottom: "1px solid var(--hairline)",
          }}
        >
          <BootLog mobile={mobile} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "1.1fr 1fr",
            gap: mobile ? 28 : 44,
            padding: mobile ? "28px 18px 24px" : "40px 40px 32px",
            alignItems: "center",
            flex: 1,
            minHeight: mobile ? 0 : 380,
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: "var(--text-mono)",
                color: "var(--muted)",
                marginBottom: 16,
              }}
            >
              <span style={{ color: accent }}>›</span> {dict.hero.versionLine.replace(/^›\s*/, "")}
            </div>
            <h1
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: mobile ? 38 : 64,
                lineHeight: mobile ? 0.98 : 0.98,
                letterSpacing: "-0.04em",
                fontWeight: 500,
                marginBottom: 20,
              }}
            >
              {mobile ? (
                <>
                  cobos<span style={{ color: accent }}>::</span>
                  <br />
                  <span style={{ color: "var(--muted)" }}>cloud_</span>
                  <wbr />
                  architect
                  <br />
                  <span style={{ color: violet }}>+</span>{" "}
                  <span style={{ color: "var(--muted)" }}>devsecops</span>
                </>
              ) : (
                <>
                  cobos<span style={{ color: accent }}>::</span>cloud_architect
                  <br />
                  <span style={{ color: violet }}>+</span>{" "}
                  <span style={{ color: "var(--muted)" }}>devsecops</span>
                </>
              )}
            </h1>
            <p
              style={{
                color: "var(--muted)",
                fontSize: mobile ? 15 : 16,
                maxWidth: 540,
                marginBottom: 22,
                lineHeight: 1.55,
              }}
            >
              {dict.hero.subhead}
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="#work" className="btn-primary">
                {dict.hero.cta}
              </a>
              <a href="#contact" className="btn-secondary mono" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                {dict.hero.ctaContact}
              </a>
            </div>
          </div>

          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: mobile ? 220 : 320,
            }}
          >
            <div
              className="hero-parallax-bg"
              style={{
                position: "absolute",
                inset: mobile ? -20 : -32,
                background: `radial-gradient(circle, ${accent}26, transparent 60%)`,
                filter: "blur(20px)",
              }}
            />
            <div
              className="hero-parallax-cube"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {mounted && (
                <IsoCloud size={mobile ? 200 : 320} animate={!reduced} />
              )}
            </div>
            {/* Orbital pills + connector lines — pure CSS rotation (see
             *  OrbitSystem). Desktop only; phones get the static chip row. */}
            {!mobile && <OrbitSystem />}
            {mobile && mounted && (
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  right: 12,
                  bottom: 8,
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 8,
                  zIndex: 2,
                }}
              >
                {["EKS", "GKE", "AKS", "Argo CD", "Vault", "OPA"].map((l, i) => {
                  const c = i % 2 === 0 ? accent : violet;
                  return (
                    <div
                      key={l}
                      className="mono"
                      style={{
                        fontSize: "var(--text-mono-xs)",
                        color: c,
                        padding: "4px 8px",
                        background: "rgba(6,6,10,.82)",
                        border: `1px solid ${c}55`,
                        borderRadius: 5,
                        boxShadow: `0 0 12px ${c}22`,
                        letterSpacing: "var(--ls-meta)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {l}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--hairline)",
            padding: mobile ? "10px 14px" : "12px 18px",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            background: "var(--surface-overlay)",
          }}
        >
          <span className="mono" style={{ fontSize: "var(--text-mono)", color: "var(--muted)" }}>
            eks-prod · eu-west-1
          </span>
          <span className="mono" style={{ fontSize: "var(--text-mono)", color: "var(--muted)" }}>
            argo cd: synced
          </span>
          <span className="mono" style={{ fontSize: "var(--text-mono)", color: accent }}>
            p95 118ms
          </span>
          <span className="mono" style={{ fontSize: "var(--text-mono)", color: "#22c55e" }}>
            ● healthy
          </span>
        </div>
      </div>

      {!mobile && (
        <button
          type="button"
          aria-label="Scroll to next section"
          onClick={() => {
            document
              .getElementById("about")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="tap"
          style={{
            position: "absolute",
            left: "50%",
            bottom: 12,
            transform: "translateX(-50%)",
            zIndex: 5,
            width: 32,
            height: 32,
            borderRadius: "999px",
            background: "rgba(6,6,10,.85)",
            border: `1px solid ${accent}55`,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(14px) saturate(140%)",
            WebkitBackdropFilter: "blur(14px) saturate(140%)",
            boxShadow: `0 0 0 4px var(--cyan-tint-soft), 0 0 24px ${accent}33, 0 8px 24px rgba(0,0,0,.45)`,
            animation: reduced ? undefined : "hero-bounce 1.6s ease-in-out infinite",
            cursor: "pointer",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M3.5 6 L8 10.5 L12.5 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

    </section>
  );
}
