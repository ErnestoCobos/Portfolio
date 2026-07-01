"use client";

import { useEffect } from "react";

/**
 * Last-resort error boundary used when the root layout itself throws.
 * Has to render its own <html> / <body> because the normal layout chain
 * is gone. Intentionally minimal: no external assets, no fonts, no
 * design tokens — just inline styles. If we relied on globals.css
 * variables here and the CSS pipeline was the thing that broke, this
 * would render unstyled.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[cobos] global runtime error:", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0A0A0F",
          color: "#F8FAFC",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 14,
          lineHeight: 1.55,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 640,
            border: "1px solid #7C3AED",
            borderRadius: 10,
            padding: "24px 24px 28px",
            background: "#111118",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#7C3AED",
              marginBottom: 14,
            }}
          >
            cobos.io · exit code 500
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#F8FAFC",
              marginBottom: 12,
            }}
          >
            Algo se rompió en el shell raíz.
          </div>
          <div style={{ color: "#A8B5C7", marginBottom: 18 }}>
            {error.message || "Unknown error."}
            {error.digest && (
              <span
                style={{
                  display: "block",
                  marginTop: 6,
                  fontSize: 12,
                  opacity: 0.7,
                }}
              >
                digest: {error.digest}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                cursor: "pointer",
                padding: "10px 18px",
                border: "1px solid #7C3AED",
                borderRadius: 999,
                color: "#7C3AED",
                background: "transparent",
                fontFamily: "inherit",
                fontSize: 12,
                letterSpacing: "0.05em",
              }}
            >
              ↻ retry
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full reload is intentional in an error boundary: it resets the broken app tree rather than SPA-navigating into it */}
            <a
              href="/"
              style={{
                padding: "10px 18px",
                border: "1px solid #00D4FF",
                borderRadius: 999,
                color: "#00D4FF",
                fontSize: 12,
                letterSpacing: "0.05em",
                textDecoration: "none",
              }}
            >
              ↩ home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
