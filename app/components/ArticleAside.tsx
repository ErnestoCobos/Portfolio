"use client";

import { useState } from "react";

/** Floating share/action panel pinned to the left side of the viewport on
 * wide screens. Mirrors the right-side TOC visually. Hidden below 1280px
 * for the same reason — the article column gets the horizontal real
 * estate that matters. The actions are intentionally lightweight: no
 * tracking, no third-party widgets, just direct intent URLs and the
 * Web Clipboard API. */
export function ArticleAside({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // older browsers / restricted contexts — fall back to tab-open
      window.prompt("Copia el enlace", url);
    }
  };

  const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title
  )}&url=${encodeURIComponent(url)}&via=ErnestoCobos`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    url
  )}`;

  return (
    <aside
      aria-label="Compartir artículo"
      className="article-aside"
      style={{
        position: "fixed",
        top: 120,
        left: 32,
        width: 56,
        zIndex: 30,
        display: "none",
        flexDirection: "column",
        gap: 10,
        alignItems: "center",
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: "var(--text-mono-xs)",
          color: "var(--meta)",
          letterSpacing: "var(--ls-overline)",
          textTransform: "uppercase",
          marginBottom: 4,
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
        }}
      >
        share
      </div>
      <ShareButton
        href={twitter}
        label="Compartir en Twitter / X"
        external
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </ShareButton>
      <ShareButton
        href={linkedin}
        label="Compartir en LinkedIn"
        external
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </ShareButton>
      <ShareButton
        as="button"
        onClick={onCopy}
        label={copied ? "Enlace copiado" : "Copiar enlace"}
        active={copied}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </ShareButton>
    </aside>
  );
}

function ShareButton({
  as = "a",
  href,
  onClick,
  external,
  active,
  label,
  children,
}: {
  as?: "a" | "button";
  href?: string;
  onClick?: () => void;
  external?: boolean;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const style = {
    width: 38,
    height: 38,
    borderRadius: "var(--r-tile)",
    border: `1px solid ${active ? "var(--cyan)" : "var(--hairline-strong)"}`,
    background: active ? "var(--cyan-tint-soft)" : "transparent",
    color: active ? "var(--cyan)" : "var(--meta)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "color .15s, border-color .15s, background .15s",
  } as const;

  if (as === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        style={style}
      >
        {children}
      </button>
    );
  }
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={label}
      title={label}
      style={style}
    >
      {children}
    </a>
  );
}
