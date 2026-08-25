"use client";

import { DecodeText } from "./DecodeText";

/**
 * ChapterMarker — the section's `0N · label` at display scale, decoded on
 * entry with a one-shot scanline sweep: the section "powers on". Rendered
 * above the regular SectionHeader line. Reduced motion: DecodeText renders
 * final text and the scanline keyframes are frozen by the existing
 * prefers-reduced-motion block in globals.css.
 */
export function ChapterMarker({ n, label }: { n: number; label: string }) {
  // Display scale + nowrap only fits the label's FIRST segment — the full
  // "showcase · proyectos" string was guillotined by overflow:hidden at
  // the viewport edge. The small SectionHeader line below keeps the full
  // label. Two-digit pad: "10", not "010".
  const short = label.split("·")[0].trim();
  return (
    <div className="chapter-marker" aria-hidden>
      <span className="chapter-marker-num">{String(n).padStart(2, "0")}</span>
      <span className="chapter-marker-label">
        <DecodeText text={short.toUpperCase()} />
      </span>
      <span className="chapter-marker-scan" />
    </div>
  );
}
