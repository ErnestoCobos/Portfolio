"use client";

import { useEffect, useRef, useState } from "react";
import { APPROACH, pick } from "../portfolio-data";
import { useLocale, useT } from "../../lib/i18n/locale-context";
import { useReducedMotion } from "../portfolio-visuals";
import { Section, SectionHeader } from "../chrome/primitives";

/* ─── Approach ───────────────────────────────────────────── */
/** Per-phase running duration (ms). Slightly varied so the cycle feels
 * organic rather than robotic. */
const APPROACH_PHASE_MS = [1100, 1350, 1250, 1050];

type PhaseStatus = "pending" | "running" | "done";

export function Approach({ mobile }: { mobile: boolean }) {
  const locale = useLocale();
  const t = useT();
  const reduceMotion = useReducedMotion();
  // -1 = idle, 0..3 = that index running, 4 = all done.
  // If the user prefers reduced motion, jump straight to "done" so the
  // section stays visually consistent without animation.
  const [phase, setPhase] = useState<number>(reduceMotion ? 4 : -1);
  const [inView, setInView] = useState(false);
  const startedRef = useRef(false);

  // Trigger the pipeline once when the section enters the viewport. In
  // dev React Strict Mode, this effect re-runs on mount; the startedRef
  // gate ensures we only kick off once per page load. We attach the
  // observer to the section's <section> element via id lookup since the
  // shared Section wrapper does not forward refs.
  useEffect(() => {
    if (reduceMotion) {
      // `useReducedMotion()` is a client-side hook that starts from the
      // SERVER snapshot (always `false`) and updates after hydration —
      // so initial state can't see the user's real preference, and we
      // must snap to done here once we learn the truth. Guarded by
      // `phase < 4` so this fires at most once per mount (single render
      // ≠ cascading renders), but the lint rule is categorical — suppress
      // it with explicit reason.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot reduceMotion → done snap, not a cascade
      if (phase < 4) setPhase(4);
      return;
    }
    if (typeof window === "undefined") return;

    const arm = (el: Element) => {
      if (typeof IntersectionObserver === "undefined") {
        // Fallback: just kick the cycle
        if (!startedRef.current) {
          startedRef.current = true;
          setPhase(0);
        }
        return () => {};
      }
      const obs = new IntersectionObserver(
        (entries) => {
          const visible = entries.some((e) => e.isIntersecting);
          if (visible && !startedRef.current) {
            startedRef.current = true;
            setPhase(0);
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0 }
      );
      obs.observe(el);
      return () => obs.disconnect();
    };

    let cleanup: (() => void) | undefined;
    const tryArm = () => {
      const el = document.getElementById("approach");
      if (el) {
        cleanup = arm(el);
        return true;
      }
      return false;
    };
    const armed = tryArm();
    // window.setTimeout returns `number` in browsers; @types/node leaks
    // a Node `Timeout` into the global setTimeout signature, so we just
    // pin the variable to the browser return type explicitly.
    let retryT: number | undefined;
    if (!armed) retryT = window.setTimeout(tryArm, 0);

    // Safety net: if the observer hasn't fired in 600ms (e.g. browser
    // doesn't support it well, or section is already past the viewport),
    // start the pipeline anyway. We're not gating on visibility for
    // correctness, only for niceness.
    const safetyT = window.setTimeout(() => {
      if (!startedRef.current) {
        startedRef.current = true;
        setPhase(0);
      }
    }, 600);

    return () => {
      if (retryT) window.clearTimeout(retryT);
      window.clearTimeout(safetyT);
      cleanup?.();
    };
  }, [reduceMotion]);

  // Step through phases.
  useEffect(() => {
    if (phase < 0 || phase >= 4) return;
    const t = window.setTimeout(
      () => setPhase((p) => p + 1),
      APPROACH_PHASE_MS[phase]
    );
    return () => window.clearTimeout(t);
  }, [phase]);

  // Track viewport visibility for the soft-loop (separate from the kickoff
  // observer above). The loop only restarts the cycle if the user is
  // actively looking at the section.
  useEffect(() => {
    if (reduceMotion) return;
    if (typeof IntersectionObserver === "undefined") return;
    const el = document.getElementById("approach");
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { rootMargin: "0px", threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduceMotion]);

  // Soft-loop: when all 4 phases are done AND the section is still in view,
  // wait 4s and re-kick the cycle. Cancels cleanly if the user scrolls
  // away (inView flips to false). The reset uses a nested setTimeout to
  // briefly show "pending" between cycles — both timers MUST be tracked
  // so a mid-flight unmount doesn't fire setState on a dead component
  // (React 19 logs "Can't perform a React state update on a component
  // that hasn't mounted yet" for that pattern).
  useEffect(() => {
    if (reduceMotion) return;
    if (phase < 4) return;
    if (!inView) return;
    let innerT: number | undefined;
    const outerT = window.setTimeout(() => {
      setPhase(-1);
      innerT = window.setTimeout(() => setPhase(0), 80);
    }, 4000);
    return () => {
      window.clearTimeout(outerT);
      if (innerT !== undefined) window.clearTimeout(innerT);
    };
  }, [phase, inView, reduceMotion]);

  const replay = () => {
    setPhase(-1);
    window.setTimeout(() => setPhase(0), 80);
  };

  const statusFor = (i: number): PhaseStatus => {
    if (phase === -1) return "pending";
    if (phase > i) return "done";
    if (phase === i) return "running";
    return "pending";
  };

  const allDone = phase >= 4;
  const headerAction = allDone ? t.approach.actionReplay : t.approach.action;

  return (
    <Section id="approach" fsPath="/approach" mobile={mobile}>
      <SectionHeader
        n={9}
        t={t.approach.sectionLabel}
        action={headerAction}
        onActionClick={allDone ? replay : undefined}
      />
      <div style={{ marginBottom: mobile ? 40 : 56, maxWidth: 720 }}>
        <h2
          style={{
            fontSize: mobile ? "var(--text-h2-page-m)" : "var(--text-h2-page)",
            fontWeight: 500,
            letterSpacing: "var(--ls-display)",
            lineHeight: 1.05,
          }}
        >
          {t.approach.headline[0]}
          <span style={{ color: "var(--cyan)" }}>{t.approach.headline[1]}</span>
        </h2>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "repeat(4, 1fr)",
          gap: 0,
          borderTop: "1px solid var(--hairline)",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        {APPROACH.map((it, i) => (
          <ApproachCard
            key={it.n}
            n={it.n}
            t={pick(it.t, locale)}
            d={pick(it.d, locale)}
            cmd={it.cmd}
            status={statusFor(i)}
            mobile={mobile}
            isLast={i === APPROACH.length - 1}
            isFirst={i === 0}
          />
        ))}
      </div>
      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span className="mono" style={{ fontSize: "var(--text-mono)", color: "var(--muted)" }}>
          {t.approach.methodLabel}{" "}
          <span style={{ color: "var(--cyan)" }}>
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "var(--r-chip)",
                background: "var(--cyan)",
                marginRight: 8,
                verticalAlign: "middle",
                animation: allDone
                  ? "pipe-iterate 1.6s ease-in-out infinite"
                  : "none",
                opacity: allDone ? undefined : 0.45,
                boxShadow: allDone
                  ? "0 0 10px rgba(0,212,255,.6)"
                  : "none",
              }}
            />
            {t.approach.methodValue}
          </span>
        </span>
        <span className="mono" style={{ fontSize: "var(--text-mono)", color: "var(--muted)" }}>
          {t.approach.deliverablesLabel}{" "}
          <span style={{ color: "var(--fg)" }}>
            {t.approach.deliverablesValue}
          </span>
        </span>
      </div>
    </Section>
  );
}

function ApproachCard({
  n,
  t,
  d,
  cmd,
  status,
  mobile,
  isLast,
  isFirst,
}: {
  n: string;
  t: string;
  d: string;
  cmd: string;
  status: PhaseStatus;
  mobile: boolean;
  isLast: boolean;
  isFirst: boolean;
}) {
  const isRunning = status === "running";
  const isDone = status === "done";
  const isPending = status === "pending";

  const numberColor = isPending
    ? "rgba(0,212,255,.35)"
    : "var(--cyan)";

  const cmdBorder = isRunning
    ? "1px solid rgba(0,212,255,.7)"
    : isDone
      ? "1px solid var(--border-cyan-soft)"
      : "1px solid rgba(255,255,255,.08)";

  const cmdBg = isRunning
    ? "var(--cyan-tint)"
    : isDone
      ? "var(--cyan-tint-soft)"
      : "var(--surface-overlay)";

  const cmdColor = isPending
    ? "rgba(148,163,184,.6)"
    : "var(--cyan)";

  return (
    <div
      style={{
        position: "relative",
        padding: mobile ? "24px 0" : `32px 24px 32px ${isFirst ? 0 : 24}px`,
        borderRight: !mobile && !isLast ? "1px solid var(--hairline)" : "none",
        borderTop: mobile && !isFirst ? "1px solid var(--hairline)" : "none",
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 0.4s ease",
      }}
    >
      {/* Status row — small mono indicator at the top of each card */}
      <div
        className="mono"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "var(--text-mono-xs)",
          letterSpacing: "var(--ls-tag)",
          textTransform: "uppercase",
          marginBottom: 12,
          color: isRunning
            ? "var(--cyan)"
            : isDone
              ? "rgba(34,197,94,.95)"
              : "var(--muted)",
          transition: "color 0.3s ease",
        }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "var(--r-chip)",
            background: isRunning
              ? "var(--cyan)"
              : isDone
                ? "#22c55e"
                : "rgba(148,163,184,.5)",
            boxShadow: isRunning
              ? "0 0 10px rgba(0,212,255,.6)"
              : isDone
                ? "0 0 8px rgba(34,197,94,.5)"
                : "none",
            animation: isRunning
              ? "pipe-dot 0.9s ease-in-out infinite"
              : "none",
          }}
        />
        {isRunning ? "running" : isDone ? "done" : "pending"}
      </div>

      {/* Phase number */}
      <div
        className="mono"
        style={{
          fontSize: "var(--text-mono)",
          color: numberColor,
          letterSpacing: "var(--ls-tag)",
          marginBottom: 14,
          textShadow: isRunning
            ? "0 0 12px rgba(0,212,255,.5)"
            : "none",
          transition: "color 0.3s ease, text-shadow 0.3s ease",
        }}
      >
        {n}
      </div>

      <h3
        style={{
          fontSize: mobile ? "var(--text-h3-sm-m)" : "var(--text-h3-sm)",
          fontWeight: 500,
          letterSpacing: "var(--ls-tight)",
          marginBottom: 12,
          lineHeight: 1.2,
        }}
      >
        {t}
      </h3>
      <p
        style={{
          color: "var(--muted)",
          fontSize: "var(--text-body-sm)",
          lineHeight: 1.55,
          marginBottom: 18,
        }}
      >
        {d}
      </p>

      {/* Command box — animates while running */}
      <div
        className="mono"
        style={{
          fontSize: "var(--text-mono-xs)",
          color: cmdColor,
          padding: "6px 10px",
          border: cmdBorder,
          borderRadius: 4,
          background: cmdBg,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          letterSpacing: ".02em",
          animation: isRunning
            ? "pipe-pulse 1.1s ease-in-out infinite"
            : "none",
          transition: "background 0.3s ease, border-color 0.3s ease",
        }}
      >
        <span>$ {cmd}</span>
        {isRunning && (
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 6,
              height: 11,
              background: "var(--cyan)",
              animation: "pipe-cursor 0.9s steps(1) infinite",
            }}
          />
        )}
        {isDone && (
          <span aria-hidden style={{ color: "#22c55e" }}>
            ✓
          </span>
        )}
      </div>
    </div>
  );
}
