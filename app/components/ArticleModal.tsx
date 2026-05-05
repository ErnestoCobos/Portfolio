"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Post } from "./portfolio-data";
import { useMounted } from "./portfolio-visuals";
import { ArticleBody } from "./ArticleBody";

export function ArticleModal({
  post,
  onClose,
  mobile,
}: {
  post: Post;
  onClose: () => void;
  mobile: boolean;
}) {
  const mounted = useMounted();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "var(--backdrop-deep)",
        backdropFilter: "blur(18px) saturate(140%)",
        WebkitBackdropFilter: "blur(18px) saturate(140%)",
        display: "flex",
        flexDirection: "column",
        animation: "fadeIn .18s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: mobile ? "14px 16px" : "16px 24px",
          borderBottom: "1px solid var(--hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: "var(--backdrop-mid)",
        }}
      >
        <span
          className="mono"
          style={{ fontSize: 13, color: "var(--fg)", letterSpacing: "-0.01em" }}
        >
          cobos<span style={{ color: "var(--cyan)" }}>::</span>blog
          <span style={{ color: "var(--muted)" }}> · {post.slug}</span>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href={`/blog/${post.slug}`}
            onClick={onClose}
            className="mono tap"
            style={{
              color: "var(--cyan)",
              border: "1px solid rgba(0,212,255,.4)",
              borderRadius: "var(--r-tile)",
              padding: "6px 12px",
              fontSize: 12,
              background: "var(--cyan-tint-soft)",
              textDecoration: "none",
              letterSpacing: ".04em",
            }}
          >
            ↗ ver completo
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar artículo"
            className="mono tap"
            style={{
              color: "var(--muted)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--r-tile)",
              padding: "6px 12px",
              fontSize: 12,
              background: "var(--surface-overlay)",
            }}
          >
            ESC ×
          </button>
        </div>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ flex: 1, overflowY: "auto" }}
      >
        <article
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: mobile ? "32px 20px 80px" : "56px 32px 96px",
          }}
        >
          <ArticleBody post={post} mobile={mobile} />
        </article>
      </div>
    </div>,
    document.body
  );
}
