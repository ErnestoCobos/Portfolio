import { ImageResponse } from "next/og";
import { getAllPosts } from "../../lib/posts";

const LOCALE = "en" as const;

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "cobos::/blog · field notes";

export default function BlogOpengraphImageEn() {
  const posts = getAllPosts(LOCALE);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A0F",
          color: "#F8FAFC",
          display: "flex",
          flexDirection: "column",
          padding: 80,
          position: "relative",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #00D4FF 0%, #7C3AED 100%)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily: "ui-monospace, monospace",
            fontSize: 24,
            color: "#94A3B8",
            marginBottom: 56,
          }}
        >
          <span style={{ color: "#F8FAFC" }}>cobos</span>
          <span style={{ color: "#00D4FF" }}>::</span>
          <span style={{ color: "#00D4FF" }}>/blog</span>
          <span style={{ color: "#475569" }}>·</span>
          <span style={{ color: "#94A3B8" }}>en</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 88,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.02,
            color: "#F8FAFC",
            marginBottom: 32,
            maxWidth: 1040,
          }}
        >
          <span>Field notes</span>
          <span>
            on <span style={{ color: "#00D4FF" }}>platforms</span>.
          </span>
        </div>
        <div
          style={{
            color: "#94A3B8",
            fontSize: 28,
            lineHeight: 1.4,
            maxWidth: 1000,
          }}
        >
          Regulated GitOps, zero-downtime migrations, real-world FinOps, IDPs.
          Technical notes from production.
        </div>
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            bottom: 64,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "ui-monospace, monospace",
            fontSize: 22,
            color: "#94A3B8",
          }}
        >
          <span>
            <span style={{ color: "#00D4FF" }}>$ </span>ls -la ./blog ·{" "}
            {posts.length} posts
          </span>
          <span>cobos.io/en/blog</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
