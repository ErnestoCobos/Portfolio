import { ImageResponse } from "next/og";
import { getAllPosts, getPost } from "../../../lib/posts";
import { CATEGORY_META } from "../../../components/portfolio-data";

const LOCALE = "en" as const;

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Article on cobos::/blog";

export function generateStaticParams() {
  return getAllPosts(LOCALE).map((p) => ({ slug: p.slug }));
}

export default async function PostOpengraphImageEn({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug, LOCALE);
  if (!post) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", background: "#0A0A0F" }} />,
      size
    );
  }

  const accent =
    CATEGORY_META[post.category].accent === "cyan" ? "#00D4FF" : "#7C3AED";

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
          padding: 72,
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
            background: accent,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 200,
            left: -200,
            width: 700,
            height: 700,
            borderRadius: 999,
            background: accent,
            opacity: 0.06,
            filter: "blur(2px)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily: "ui-monospace, monospace",
            fontSize: 22,
            color: "#94A3B8",
            marginBottom: 32,
          }}
        >
          <span style={{ color: "#F8FAFC" }}>cobos</span>
          <span style={{ color: "#00D4FF" }}>::</span>
          <span style={{ color: "#00D4FF" }}>/blog</span>
          <span style={{ color: "#475569" }}>/</span>
          <span style={{ color: accent }}>{post.category}</span>
          <span style={{ color: "#475569" }}>·</span>
          <span style={{ color: "#94A3B8" }}>en</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontFamily: "ui-monospace, monospace",
            fontSize: 18,
            color: "#94A3B8",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 36,
          }}
        >
          <span style={{ color: accent }}>{post.d}</span>
          <span>·</span>
          <span>{post.r} read</span>
          <span>·</span>
          <span>./{post.slug}.md</span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: post.title.length > 60 ? 64 : 76,
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
            color: "#F8FAFC",
            maxWidth: 1056,
          }}
        >
          {post.title}
        </div>
        <div
          style={{
            position: "absolute",
            left: 72,
            right: 72,
            bottom: 56,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "ui-monospace, monospace",
            fontSize: 22,
            color: "#94A3B8",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: accent,
              }}
            />
            <span>Ernesto Cobos · cobos.io</span>
          </span>
          <span
            style={{
              padding: "6px 14px",
              border: `1px solid ${accent}`,
              borderRadius: 999,
              color: accent,
              fontSize: 16,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {CATEGORY_META[post.category].label}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
