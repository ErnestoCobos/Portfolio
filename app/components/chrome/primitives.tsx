"use client";

import type { ReactNode } from "react";
import { DecodeText } from "../cinematic/DecodeText";
import { Reveal } from "../cinematic/Reveal";

/* ─── shared section primitives ─────────────────────────── */
/** Cursor-tracking spotlight: writes --mx/--my directly to the element so
 * the ::after gradient follows the pointer with zero React re-renders.
 * The CSS side is hover-gated (@media (hover:hover)) so touch devices
 * never paint it. */
export function spotlightMove(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export function SectionHeader({
  n,
  t,
  action,
  onActionClick,
}: {
  n: number;
  t: string;
  action?: string;
  onActionClick?: () => void;
}) {
  // Every section header reveals + decodes as it scrolls into view —
  // one integration point covers all ten sections.
  return (
    <Reveal>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 32,
          paddingBottom: 16,
          borderBottom: "1px solid var(--hairline)",
          flexWrap: "wrap",
        }}
      >
      <div
        className="mono"
        style={{
          fontSize: "var(--text-mono)",
          color: "var(--cyan)",
          letterSpacing: "var(--ls-tag)",
        }}
      >
        <span style={{ color: "var(--muted)" }}>0{n}</span> &nbsp;·&nbsp;{" "}
        <DecodeText text={t} />
      </div>
      {action &&
        (onActionClick ? (
          <button
            type="button"
            onClick={onActionClick}
            className="mono tap"
            style={{
              fontSize: "var(--text-mono)",
              color: "var(--cyan)",
              background: "transparent",
              padding: 0,
              border: "none",
              cursor: "pointer",
              letterSpacing: "var(--ls-meta)",
            }}
          >
            {action}
          </button>
        ) : (
          <div className="mono" style={{ fontSize: "var(--text-mono)", color: "var(--muted)" }}>
            {action}
          </div>
        ))}
      </div>
    </Reveal>
  );
}

export function Section({
  id,
  fsPath,
  children,
  mobile,
  dark,
}: {
  id?: string;
  fsPath?: string;
  children: ReactNode;
  mobile: boolean;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      data-fs-path={fsPath}
      data-fs-type={fsPath ? "dir" : undefined}
      style={{
        padding: mobile ? "48px 16px" : "80px 48px",
        background: dark ? "#08080C" : "transparent",
        borderTop: "1px solid var(--hairline)",
        scrollMarginTop: 52,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>{children}</div>
    </section>
  );
}
