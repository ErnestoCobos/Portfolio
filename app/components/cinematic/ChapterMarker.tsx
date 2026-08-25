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
  return (
    <div className="chapter-marker" aria-hidden>
      <span className="chapter-marker-num">0{n}</span>
      <span className="chapter-marker-label">
        <DecodeText text={label.toUpperCase()} />
      </span>
      <span className="chapter-marker-scan" />
    </div>
  );
}
