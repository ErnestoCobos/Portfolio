"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "./portfolio-visuals";
import { createRand } from "./seeded-rand";

type Line = {
  text: string;
  color?: string;
  bold?: boolean;
  delay?: number;
};

const TYPING_MS = 18;
const LINE_PAUSE = 180;

/** Build a fake `tail -f` log trace for the given runtime error.
 * Deterministic per error message so retries don't shuffle the trace-id. */
function buildLines(message: string, digest: string): Line[] {
  const seed = `${digest || "no-digest"}::${message}`;
  const rand = createRand(seed);
  const hex = (n: number) =>
    Math.floor(rand() * 16 ** n)
      .toString(16)
      .padStart(n, "0");
  const traceId = `${hex(4)}-${hex(4)}-${hex(4)}`;
  const pid = 1000 + Math.floor(rand() * 8000);
  const truncated =
    message.length > 120 ? message.slice(0, 117).trimEnd() + "…" : message;

  return [
    {
      text: "$ tail -f /var/log/cobos.io/runtime.log",
      color: "var(--meta)",
    },
    { text: "" },
    {
      text: `[${new Date().toISOString()}] level=error pid=${pid}`,
      color: "var(--meta)",
      delay: 240,
    },
    {
      text: `FATAL: ${truncated}`,
      color: "var(--violet)",
      bold: true,
      delay: 200,
    },
    { text: `panic: x-trace-id=${traceId}`, color: "var(--meta)" },
    {
      text: digest
        ? `        digest=${digest}`
        : "        digest=<redacted>",
      color: "var(--meta)",
    },
    { text: "" },
    {
      text: "process exited with status 1.",
      color: "var(--fg)",
    },
    {
      text: "↻ retry below — or report it on github if it keeps happening.",
      color: "var(--meta)",
    },
  ];
}

export function ErrorTerminal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const reduced = useReducedMotion();
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(reduced);

  // Lines memoized on the error identity so the typewriter doesn't reset
  // every render (or every retry attempt that still shows the same error).
  const lines = useMemo(
    () => buildLines(error.message ?? "Unknown error", error.digest ?? ""),
    [error.message, error.digest]
  );

  useEffect(() => {
    if (reduced) {
      setDone(true);
      return;
    }
    if (done) return;
    const current = lines[lineIdx];
    if (!current) {
      setDone(true);
      return;
    }
    if (charIdx < current.text.length) {
      const t = window.setTimeout(
        () => setCharIdx((c) => c + 1),
        TYPING_MS
      );
      return () => window.clearTimeout(t);
    }
    if (lineIdx >= lines.length - 1) {
      setDone(true);
      return;
    }
    const pause = (lines[lineIdx + 1]?.delay ?? 0) + LINE_PAUSE;
    const t = window.setTimeout(() => {
      setLineIdx((i) => i + 1);
      setCharIdx(0);
    }, pause);
    return () => window.clearTimeout(t);
  }, [reduced, done, charIdx, lineIdx, lines]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 760,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}
    >
      {/* Terminal frame — same chrome as 404 but with "exit code 500" title
       * and a violet glow stroke that reads as warning */}
      <div
        style={{
          position: "relative",
          border: "1px solid var(--violet)",
          borderRadius: "var(--r-card-sm)",
          overflow: "hidden",
          background: "var(--surface)",
          boxShadow:
            "0 0 0 1px var(--violet-tint-strong), 0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,.012) 3px, rgba(255,255,255,.012) 4px)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Window chrome */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "10px 14px",
            borderBottom: "1px solid var(--hairline)",
            background: "var(--surface-elev)",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <span
              aria-hidden
              style={{
                width: 12,
                height: 12,
                borderRadius: "var(--r-chip)",
                background: "#ff5f57",
              }}
            />
            <span
              aria-hidden
              style={{
                width: 12,
                height: 12,
                borderRadius: "var(--r-chip)",
                background: "#febc2e",
              }}
            />
            <span
              aria-hidden
              style={{
                width: 12,
                height: 12,
                borderRadius: "var(--r-chip)",
                background: "#28c840",
              }}
            />
          </div>
          <div
            className="mono"
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "var(--text-meta)",
              color: "var(--meta)",
              letterSpacing: "var(--ls-meta)",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            ~/cobos.io — zsh — exit code 500
          </div>
          <div
            className="mono"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "var(--text-mono-xs)",
              color: "var(--violet)",
              padding: "3px 10px",
              border: "1px solid var(--violet)",
              borderRadius: "var(--r-chip)",
              letterSpacing: "var(--ls-tag)",
              textTransform: "uppercase",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: "var(--r-chip)",
                background: "var(--violet)",
                boxShadow: "0 0 8px var(--violet-glow)",
                animation: reduced
                  ? "none"
                  : "pipe-dot 1.2s ease-in-out infinite",
              }}
            />
            500
          </div>
        </div>

        {/* Body */}
        <div
          className="mono"
          style={{
            position: "relative",
            zIndex: 2,
            padding: "28px 24px 32px",
            fontSize: "var(--text-meta)",
            lineHeight: "var(--lh-prose)",
            color: "var(--fg)",
            minHeight: 280,
          }}
        >
          {lines.map((line, i) => {
            const isPast = i < lineIdx || done;
            const isCurrent = i === lineIdx && !done;
            const isFuture = i > lineIdx && !done;
            if (isFuture) return null;
            const visibleText = isPast
              ? line.text
              : line.text.slice(0, charIdx);
            const showCursor =
              !done && isCurrent && charIdx <= line.text.length;
            return (
              <div
                key={i}
                style={{
                  color: line.color ?? "var(--fg)",
                  fontWeight: line.bold ? 600 : 400,
                  minHeight: "1.2em",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  textShadow: line.color === "var(--violet)"
                    ? "0 0 8px var(--violet-glow)"
                    : "none",
                }}
              >
                {visibleText || " "}
                {showCursor && (
                  <span
                    aria-hidden
                    style={{
                      display: "inline-block",
                      width: "0.55em",
                      height: "1em",
                      verticalAlign: "text-bottom",
                      marginLeft: 1,
                      background: "var(--violet)",
                      animation: reduced
                        ? "none"
                        : "pipe-cursor 0.85s steps(1) infinite",
                      boxShadow: "0 0 6px var(--violet-glow)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action row — fades in once the typewriter completes */}
      <div
        style={{
          opacity: done ? 1 : 0,
          transform: done ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
          pointerEvents: done ? "auto" : "none",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={reset}
          className="tap mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            border: "1px solid var(--violet)",
            borderRadius: "var(--r-chip)",
            color: "var(--violet)",
            background: "var(--violet-tint-soft)",
            fontSize: "var(--text-mono)",
            letterSpacing: "var(--ls-meta)",
            cursor: "pointer",
          }}
        >
          ↻ retry
        </button>
        <Link
          href="/"
          className="tap mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "10px 18px",
            border: "1px solid var(--cyan)",
            borderRadius: "var(--r-chip)",
            color: "var(--cyan)",
            background: "var(--cyan-tint-soft)",
            fontSize: "var(--text-mono)",
            letterSpacing: "var(--ls-meta)",
            textDecoration: "none",
          }}
        >
          ↩ home
        </Link>
        <a
          href="https://github.com/ErnestoCobos/Portfolio/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="tap mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "10px 18px",
            border: "1px solid var(--hairline-strong)",
            borderRadius: "var(--r-chip)",
            color: "var(--meta)",
            fontSize: "var(--text-mono)",
            letterSpacing: "var(--ls-meta)",
            textDecoration: "none",
          }}
        >
          report on github ↗
        </a>
      </div>
    </div>
  );
}
