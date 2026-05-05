"use client";

import { useEffect, useState } from "react";

type Heading = { id: string; text: string };

/** Floating Table of Contents fixed to the right of the viewport on
 * wide screens. Highlights the heading currently in view via
 * IntersectionObserver. Hidden below 1280px since it would compete with
 * the article column for horizontal space. */
export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string | null>(
    headings[0]?.id ?? null
  );

  useEffect(() => {
    if (headings.length === 0) return;
    if (typeof IntersectionObserver === "undefined") return;

    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (els.length === 0) return;

    // Top 25% of the viewport counts as "active" — once a heading scrolls
    // into the upper quarter, mark it. The bottom rootMargin pushes the
    // intersection rect up so we activate on approach, not on exit.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: [0, 1] }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="Tabla de contenidos"
      style={{
        position: "fixed",
        top: 120,
        right: 32,
        width: 240,
        maxHeight: "calc(100vh - 200px)",
        overflowY: "auto",
        zIndex: 30,
        // Only show on wide screens — below this the article column would
        // crowd against the TOC. Tailwind v4 class would be cleaner but we
        // stay inline-first per the design system convention.
        display: "none",
      }}
      className="article-toc"
    >
      <div
        className="mono"
        style={{
          fontSize: "var(--text-mono-xs)",
          color: "var(--meta)",
          letterSpacing: "var(--ls-overline)",
          textTransform: "uppercase",
          marginBottom: 12,
          paddingLeft: 12,
        }}
      >
        ./toc
      </div>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          borderLeft: "1px solid var(--hairline)",
        }}
      >
        {headings.map((h) => {
          const isActive = h.id === activeId;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                aria-current={isActive ? "true" : undefined}
                style={{
                  display: "block",
                  padding: "6px 12px",
                  fontSize: "var(--text-meta)",
                  lineHeight: "var(--lh-body)",
                  color: isActive ? "var(--cyan)" : "var(--meta)",
                  borderLeft: isActive
                    ? "2px solid var(--cyan)"
                    : "2px solid transparent",
                  marginLeft: -1,
                  transition: "color .15s, border-left-color .15s",
                  textDecoration: "none",
                }}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
