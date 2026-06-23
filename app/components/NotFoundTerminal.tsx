"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "./portfolio-visuals";
import { createRand } from "./seeded-rand";
import { BlogCover } from "./BlogCover";
import { CATEGORY_META, type PostCategory } from "./portfolio-data";

type Suggestion = {
  slug: string;
  title: string;
  category: PostCategory;
  d: string;
  r: string;
};

type Line = {
  text: string;
  /** CSS color var/hex used for this line. */
  color?: string;
  /** Bold the line (used for the HTTP status line). */
  bold?: boolean;
  /** Pause (ms) before this line starts typing. */
  delay?: number;
};

const TYPING_MS = 18; // ms per character — ~55 cps, fast but readable
const LINE_PAUSE = 180; // ms between lines

/** Build the lines we'll type out. The path is captured client-side after
 * mount; before that we render an empty placeholder so the SSR/hydration
 * payloads match. The trace-id and region are seeded from the path so they
 * stay stable across re-renders for the same URL. */
function buildLines(path: string): Line[] {
  const rand = createRand(path || "/_unknown");
  const traceHex = () =>
    Math.floor(rand() * 0xffff)
      .toString(16)
      .padStart(4, "0");
  const traceId = `${traceHex()}-${traceHex()}-${traceHex()}`;
  const region = "iad1 · cobos-edge";
  const now = new Date().toUTCString();

  return [
    { text: `$ curl -is https://cobos.io${path}`, color: "var(--meta)" },
    { text: "" },
    {
      text: "HTTP/2 404 Not Found",
      color: "var(--violet)",
      bold: true,
      delay: 320,
    },
    { text: `date: ${now}`, color: "var(--meta)" },
    { text: "content-type: text/plain; charset=utf-8", color: "var(--meta)" },
    { text: `x-trace-id: ${traceId}`, color: "var(--meta)" },
    { text: `x-region: ${region}`, color: "var(--meta)" },
    { text: "" },
    {
      text: `path '${path}' not found in this manifest.`,
      color: "var(--fg)",
    },
    {
      text: "no rule matched · check the suggestions below ↓",
      color: "var(--meta)",
    },
  ];
}

export function NotFoundTerminal({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  const reduced = useReducedMotion();
  const [path, setPath] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);

  // Capture the requested path on the client. SSR renders with empty path
  // so the static HTML stays cacheable; the typewriter animation kicks in
  // once we know the URL.
  useEffect(() => {
    // Capture the requested URL on mount (SSR renders empty for cacheable
    // HTML). Both are intentional one-shot effect-init writes that the
    // react-hooks/set-state-in-effect rule over-flags.
    /* eslint-disable react-hooks/set-state-in-effect */
    setPath(window.location.pathname);
    if (reduced) {
      // Skip animation entirely — render fully revealed state.
      setDone(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [reduced]);

  // Memoize the lines array so its identity only changes when `path`
  // changes — otherwise the typewriter effect would re-run every tick
  // (the deps array would reference a fresh array each render, looping
  // setTimeout schedules and breaking the animation).
  const lines = useMemo(() => buildLines(path), [path]);

  // Typewriter loop: tick char-by-char, pause between lines, mark done at end.
  useEffect(() => {
    if (reduced || done) return;
    if (path === "") return; // wait for path capture

    const current = lines[lineIdx];
    if (!current) {
      // Terminal state once the typewriter exhausts every line — intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [reduced, done, charIdx, lineIdx, path, lines]);

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
      {/* Terminal frame */}
      <div
        style={{
          position: "relative",
          border: "1px solid var(--hairline-strong)",
          borderRadius: "var(--r-card-sm)",
          overflow: "hidden",
          background: "var(--surface)",
          boxShadow:
            "0 0 0 1px var(--cyan-tint-soft), 0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Subtle scan-line overlay — adds CRT vibe without being heavy */}
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
            ~/cobos.io — zsh — exit code 404
          </div>
          {/* Right-side status badge with the 404 — mono, violet, pulsing dot */}
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
            404
          </div>
        </div>

        {/* Terminal body */}
        <div
          className="mono"
          style={{
            position: "relative",
            zIndex: 2,
            padding: "28px 24px 32px",
            fontSize: "var(--text-meta)",
            lineHeight: "var(--lh-prose)",
            color: "var(--fg)",
            minHeight: 320,
          }}
        >
          {lines.map((line, i) => {
            const isPast = i < lineIdx || done;
            const isCurrent = i === lineIdx && !done;
            const isFuture = i > lineIdx && !done;
            const visibleText = isPast
              ? line.text
              : isCurrent
                ? line.text.slice(0, charIdx)
                : "";
            // Don't reserve vertical space for future lines so the terminal
            // doesn't look hollow during typing — they push down as they
            // appear.
            if (isFuture) return null;

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
                  textShadow:
                    line.color === "var(--cyan)" ||
                    line.color === "var(--violet)"
                      ? `0 0 8px ${
                          line.color === "var(--cyan)"
                            ? "var(--cyan-glow)"
                            : "var(--violet-glow)"
                        }`
                      : "none",
                }}
              >
                {visibleText || " "}
                {showCursor && (
                  <span
                    aria-hidden
                    style={{
                      display: "inline-block",
                      width: "0.55em",
                      height: "1em",
                      verticalAlign: "text-bottom",
                      marginLeft: 1,
                      background: "var(--cyan)",
                      animation: reduced
                        ? "none"
                        : "pipe-cursor 0.85s steps(1) infinite",
                      boxShadow: "0 0 6px var(--cyan-glow)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggestions — fade in once typing completes */}
      <section
        aria-label="Sugerencias"
        style={{
          opacity: done ? 1 : 0,
          transform: done ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
          pointerEvents: done ? "auto" : "none",
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: "var(--text-mono-xs)",
            color: "var(--meta)",
            letterSpacing: "var(--ls-overline)",
            textTransform: "uppercase",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ color: "var(--cyan)" }}>$</span> ls ./suggestions
        </div>

        {/* Quick links row: home + /blog */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <SuggestionChip href="/" label="↩ home" accent="var(--cyan)" />
          <SuggestionChip
            href="/blog"
            label="/blog · notas de campo"
            accent="var(--cyan)"
          />
        </div>

        {/* Latest posts */}
        {suggestions.length > 0 && (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gridTemplateColumns: `repeat(${suggestions.length}, 1fr)`,
              gap: 12,
            }}
          >
            {suggestions.map((p) => {
              const accent =
                CATEGORY_META[p.category].accent === "cyan"
                  ? "var(--cyan)"
                  : "var(--violet)";
              return (
                <li key={p.slug}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="tap"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      padding: 14,
                      border: "1px solid var(--hairline-strong)",
                      borderRadius: "var(--r-card-sm)",
                      textDecoration: "none",
                      background: "var(--surface-overlay)",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "16 / 9",
                        borderRadius: "var(--r-tile)",
                        overflow: "hidden",
                        border: "1px solid var(--hairline)",
                      }}
                    >
                      <BlogCover
                        slug={p.slug}
                        category={p.category}
                        variant="thumb"
                      />
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: "var(--text-mono-xs)",
                        color: accent,
                        letterSpacing: "var(--ls-tag)",
                        textTransform: "uppercase",
                      }}
                    >
                      {p.d.toLowerCase()} · {CATEGORY_META[p.category].label}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-body-sm)",
                        fontWeight: 500,
                        color: "var(--fg)",
                        letterSpacing: "var(--ls-tight)",
                        lineHeight: 1.3,
                      }}
                    >
                      {p.title}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function SuggestionChip({
  href,
  label,
  accent,
}: {
  href: string;
  label: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="tap mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        border: `1px solid ${accent}`,
        borderRadius: "var(--r-chip)",
        color: accent,
        textDecoration: "none",
        fontSize: "var(--text-mono)",
        letterSpacing: "var(--ls-meta)",
        background:
          accent === "var(--cyan)"
            ? "var(--cyan-tint-soft)"
            : "var(--violet-tint-soft)",
      }}
    >
      {label}
    </Link>
  );
}
