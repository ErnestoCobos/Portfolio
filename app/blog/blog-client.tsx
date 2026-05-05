"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CATEGORY_META,
  type Post,
  type PostCategory,
} from "../components/portfolio-data";
import { ArticleModal } from "../components/ArticleModal";
import { BlogCover } from "../components/BlogCover";

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [breakpoint]);
  return mobile;
}

/** First non-heading paragraph, trimmed to `max` chars. */
function excerpt(body: string, max = 200): string {
  const first = body
    .split(/\n\n+/)
    .map((b) => b.trim())
    .find((b) => b && !b.startsWith("## "));
  if (!first) return "";
  return first.length <= max ? first : first.slice(0, max - 1).trimEnd() + "…";
}

function accentVar(category: Post["category"]) {
  return CATEGORY_META[category].accent === "cyan"
    ? "var(--cyan)"
    : "var(--violet)";
}

export default function BlogClient({ posts }: { posts: Post[] }) {
  const mobile = useIsMobile();
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [filter, setFilter] = useState<PostCategory | null>(null);

  useEffect(() => {
    const sync = () => {
      const m = window.location.hash.match(/^#post\/([\w-]+)$/);
      setOpenSlug(m ? m[1] : null);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const open = openSlug ? posts.find((p) => p.slug === openSlug) ?? null : null;

  const openPost = (slug: string) => {
    setOpenSlug(slug);
    window.history.replaceState(null, "", `#post/${slug}`);
  };

  const closePost = () => {
    setOpenSlug(null);
    window.history.replaceState(null, "", window.location.pathname);
  };

  // Counts per category — used in the filter chips. Built once per render.
  const counts = posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
  const categoryOrder: PostCategory[] = (
    Object.keys(CATEGORY_META) as PostCategory[]
  ).filter((c) => counts[c] > 0);

  const visible = filter ? posts.filter((p) => p.category === filter) : posts;
  const featured = visible[0] ?? null;
  const rest = visible.slice(1);
  const featuredAccent = featured ? accentVar(featured.category) : "var(--cyan)";

  return (
    <div className="cobos-art" style={{ minHeight: "100vh" }}>
      {/* Top chrome */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: mobile ? "12px 16px" : "14px 32px",
          borderBottom: "1px solid var(--hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: "rgba(10,10,15,.78)",
          backdropFilter: "blur(14px) saturate(140%)",
          WebkitBackdropFilter: "blur(14px) saturate(140%)",
        }}
      >
        <Link
          href="/"
          className="mono tap"
          style={{
            fontSize: "var(--text-meta)",
            color: "var(--fg)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            letterSpacing: "-0.01em",
          }}
        >
          <span style={{ color: "var(--muted)" }}>←</span>
          cobos<span style={{ color: "var(--cyan)" }}>::</span>
          <span style={{ color: "var(--cyan)" }}>/blog</span>
        </Link>
        <div
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            fontSize: "var(--text-mono)",
            color: "var(--meta)",
            letterSpacing: "var(--ls-tag)",
            textTransform: "uppercase",
          }}
        >
          <span>ls -la ./blog · {posts.length} notas</span>
          <a
            href="/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="RSS feed del blog"
            title="RSS feed"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--r-chip)",
              color: "var(--cyan)",
              textDecoration: "none",
              fontSize: "var(--text-mono-xs)",
            }}
          >
            <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" aria-hidden>
              <path d="M6.18 17.82A2.18 2.18 0 1 1 4 15.64a2.18 2.18 0 0 1 2.18 2.18zM4 4.44v3.04a12.52 12.52 0 0 1 12.52 12.52h3.04A15.56 15.56 0 0 0 4 4.44zm0 6.05v3.04a6.47 6.47 0 0 1 6.47 6.47h3.04A9.51 9.51 0 0 0 4 10.49z" />
            </svg>
            rss
          </a>
        </div>
      </header>

      <main
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: mobile ? "32px 20px 80px" : "64px 40px 120px",
        }}
      >
        {/* ── Hero copy ────────────────────────────────────── */}
        <section style={{ marginBottom: mobile ? 36 : 56 }}>
          <div
            className="mono"
            style={{
              fontSize: "var(--text-mono)",
              color: "var(--cyan)",
              letterSpacing: "var(--ls-overline)",
              textTransform: "uppercase",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span className="dot" /> notas · field reports
          </div>
          <h1
            style={{
              fontSize: mobile ? 36 : 64,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.02,
              maxWidth: 920,
            }}
          >
            Lo que aprendo construyendo{" "}
            <span style={{ color: "var(--cyan)" }}>plataforma</span> en
            producción.
          </h1>
          <p
            style={{
              marginTop: 18,
              color: "var(--body-soft)",
              fontSize: mobile ? 16 : 18,
              maxWidth: 720,
              lineHeight: 1.55,
            }}
          >
            Apuntes técnicos sobre GitOps regulado, migraciones sin downtime,
            FinOps real y plataformas internas. Sin AI-generated fluff —
            historia, decisiones y los pies-de-página que no salen en el deck.
          </p>
        </section>

        {/* ── Topic filter chips ────────────────────────────── */}
        <section
          aria-label="Filtrar por tema"
          style={{ marginBottom: mobile ? 32 : 44 }}
        >
          <div
            className="mono"
            style={{
              fontSize: "var(--text-mono-xs)",
              color: "var(--muted)",
              letterSpacing: "var(--ls-overline)",
              textTransform: "uppercase",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ color: "var(--cyan)" }}>$</span> grep -l "category:"
            ./blog/*.md | sort -u
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <FilterChip
              label="all"
              count={posts.length}
              active={filter === null}
              accent="var(--cyan)"
              onClick={() => setFilter(null)}
            />
            {categoryOrder.map((cat) => {
              const a =
                CATEGORY_META[cat].accent === "cyan"
                  ? "var(--cyan)"
                  : "var(--violet)";
              return (
                <FilterChip
                  key={cat}
                  label={CATEGORY_META[cat].label}
                  count={counts[cat] ?? 0}
                  active={filter === cat}
                  accent={a}
                  onClick={() => setFilter(filter === cat ? null : cat)}
                />
              );
            })}
          </div>
        </section>

        {/* ── Empty state when filter has no posts ──────────── */}
        {!featured && (
          <section
            style={{
              padding: mobile ? "40px 20px" : "64px 32px",
              border: "1px dashed var(--hairline-strong)",
              borderRadius: "var(--r-card-sm)",
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--muted)",
                letterSpacing: "var(--ls-tag)",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              <span style={{ color: "var(--cyan)" }}>$</span> ls ./blog/{filter}
              /
            </div>
            <p
              style={{
                color: "var(--fg)",
                fontSize: "var(--text-body)",
                marginBottom: 8,
              }}
            >
              0 entradas en esta categoría todavía.
            </p>
            <button
              type="button"
              onClick={() => setFilter(null)}
              className="mono tap"
              style={{
                marginTop: 8,
                color: "var(--cyan)",
                fontSize: 12,
                background: "transparent",
                border: "1px solid var(--cyan)",
                borderRadius: 6,
                padding: "6px 12px",
                letterSpacing: "var(--ls-meta)",
              }}
            >
              ← ver todas
            </button>
          </section>
        )}

        {/* ── Featured hero card ────────────────────────────── */}
        {featured && (
        <section style={{ marginBottom: mobile ? 32 : 48 }}>
          <div
            className="mono"
            style={{
              fontSize: "var(--text-mono-xs)",
              color: "var(--muted)",
              letterSpacing: "var(--ls-overline)",
              textTransform: "uppercase",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ color: featuredAccent }}>●</span> ./latest ·
            featured
          </div>
          <button
            type="button"
            onClick={() => openPost(featured.slug)}
            className="tap"
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: 0,
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--r-card-sm)",
              overflow: "hidden",
              cursor: "pointer",
              background: "var(--surface)",
              color: "inherit",
              fontFamily: "inherit",
              transition: "border-color .2s, box-shadow .2s, transform .12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = featuredAccent;
              e.currentTarget.style.boxShadow = `0 12px 48px ${
                CATEGORY_META[featured.category].accent === "cyan"
                  ? "var(--cyan-tint-loud)"
                  : "var(--violet-tint-loud)"
              }`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--hairline-strong)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: mobile ? "16 / 10" : "21 / 9",
                overflow: "hidden",
              }}
            >
              <BlogCover
                slug={featured.slug}
                category={featured.category}
                variant="hero"
              />
              {/* Bottom gradient for text legibility if we ever overlay */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(10,10,15,0) 55%, rgba(10,10,15,.55) 100%)",
                  pointerEvents: "none",
                }}
              />
              {/* Category pill in corner */}
              <div
                className="mono"
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  padding: "4px 10px",
                  borderRadius: "var(--r-chip)",
                  border: `1px solid ${featuredAccent}`,
                  color: featuredAccent,
                  fontSize: "var(--text-mono-xs)",
                  letterSpacing: "var(--ls-tag)",
                  textTransform: "uppercase",
                  background: "rgba(10,10,15,.55)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                }}
              >
                {CATEGORY_META[featured.category].label}
              </div>
            </div>
            <div
              style={{
                padding: mobile ? "20px 18px 22px" : "28px 32px 30px",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: "var(--text-mono)",
                  color: "var(--muted)",
                  letterSpacing: "var(--ls-tag)",
                  textTransform: "uppercase",
                  display: "flex",
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <span style={{ color: featuredAccent }}>{featured.d}</span>
                <span>·</span>
                <span>{featured.r} read</span>
                <span>·</span>
                <span>./blog/{featured.slug}.md</span>
              </div>
              <h2
                style={{
                  fontSize: mobile ? 26 : 36,
                  fontWeight: 600,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  color: "var(--fg)",
                  marginBottom: 14,
                }}
              >
                {featured.t}
              </h2>
              <p
                style={{
                  color: "var(--body-soft)",
                  fontSize: mobile ? 15 : 16,
                  lineHeight: 1.6,
                  maxWidth: 760,
                  marginBottom: 18,
                }}
              >
                {excerpt(featured.body, mobile ? 160 : 240)}
              </p>
              <span
                className="mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: featuredAccent,
                  fontSize: "var(--text-meta)",
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                }}
              >
                leer artículo →
              </span>
            </div>
          </button>
        </section>
        )}

        {/* ── Manifest list (rest of posts) ─────────────────── */}
        {rest.length > 0 && (
          <section>
            <div
              className="mono"
              style={{
                fontSize: "var(--text-mono-xs)",
                color: "var(--muted)",
                letterSpacing: "var(--ls-overline)",
                textTransform: "uppercase",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <span>
                <span style={{ color: "var(--cyan)" }}>$</span> ls -la ./blog/
                archive
                {filter && (
                  <span style={{ color: "var(--muted)" }}>
                    {" "}
                    | grep {filter}
                  </span>
                )}
              </span>
              <span>{rest.length} entradas</span>
            </div>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                borderTop: "1px solid var(--hairline)",
              }}
            >
              {rest.map((p) => (
                <li key={p.slug}>
                  <ManifestRow
                    post={p}
                    mobile={mobile}
                    onOpen={() => openPost(p.slug)}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer */}
        <footer
          className="mono"
          style={{
            marginTop: mobile ? 56 : 96,
            paddingTop: 24,
            borderTop: "1px solid var(--hairline)",
            fontSize: "var(--text-mono)",
            color: "var(--muted)",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            letterSpacing: "var(--ls-meta)",
          }}
        >
          <span>
            <span style={{ color: "var(--cyan)" }}>$</span> total {posts.length}{" "}
            · ordered by date desc
          </span>
          <Link
            href="/"
            style={{
              color: "var(--cyan)",
              textDecoration: "none",
            }}
          >
            ← cobos::/home
          </Link>
        </footer>
      </main>

      {open && <ArticleModal post={open} onClose={closePost} mobile={mobile} />}
    </div>
  );
}

/* ── Filter chip ────────────────────────────────────────────── */
function FilterChip({
  label,
  count,
  active,
  accent,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="mono tap"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 14px",
        borderRadius: "var(--r-chip)",
        border: `1px solid ${active ? accent : "var(--hairline-strong)"}`,
        color: active ? accent : "var(--muted)",
        background: active
          ? accent === "var(--cyan)"
            ? "var(--cyan-tint-mid)"
            : "var(--violet-tint-mid)"
          : "transparent",
        fontSize: "var(--text-mono)",
        letterSpacing: "var(--ls-tag)",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "color .15s, border-color .15s, background .15s",
      }}
    >
      <span>{label}</span>
      <span
        style={{
          color: active ? accent : "var(--muted)",
          opacity: 0.7,
          fontSize: "var(--text-mono-xs)",
        }}
      >
        {count}
      </span>
    </button>
  );
}

/* ── Manifest row ───────────────────────────────────────────── */
function ManifestRow({
  post,
  mobile,
  onOpen,
}: {
  post: Post;
  mobile: boolean;
  onOpen: () => void;
}) {
  const accent = accentVar(post.category);
  const [hover, setHover] = useState(false);

  if (mobile) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="tap"
        style={{
          display: "grid",
          gridTemplateColumns: "44px 1fr",
          gap: 14,
          width: "100%",
          textAlign: "left",
          padding: "14px 0",
          borderBottom: "1px solid var(--hairline)",
          background: "transparent",
          color: "inherit",
          fontFamily: "inherit",
          cursor: "pointer",
          alignItems: "start",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 4,
            overflow: "hidden",
            border: "1px solid var(--hairline)",
          }}
        >
          <BlogCover
            slug={post.slug}
            category={post.category}
            variant="thumb"
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            className="mono"
            style={{
              fontSize: "var(--text-mono-xs)",
              color: "var(--muted)",
              letterSpacing: "var(--ls-tag)",
              textTransform: "uppercase",
              display: "flex",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <span style={{ color: accent }}>{post.d.toLowerCase()}</span>
            <span>·</span>
            <span style={{ color: accent }}>
              {CATEGORY_META[post.category].label}
            </span>
          </div>
          <div
            style={{
              fontSize: "var(--text-body)",
              fontWeight: 500,
              letterSpacing: "var(--ls-tight)",
              lineHeight: 1.25,
              color: "var(--fg)",
              marginBottom: 4,
            }}
          >
            {post.t}
          </div>
          <div
            className="mono"
            style={{
              fontSize: "var(--text-mono)",
              color: "var(--muted)",
              letterSpacing: "var(--ls-meta)",
            }}
          >
            {post.r} read · leer <span aria-hidden>→</span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="tap"
      style={{
        display: "grid",
        gridTemplateColumns: "60px 96px 130px 1fr 96px 80px",
        gap: 18,
        width: "100%",
        textAlign: "left",
        padding: "14px 16px",
        borderBottom: "1px solid var(--hairline)",
        background: hover
          ? "linear-gradient(90deg, var(--surface-soft), rgba(255,255,255,0))"
          : "transparent",
        borderLeft: hover
          ? `2px solid ${accent}`
          : "2px solid transparent",
        color: "inherit",
        fontFamily: "inherit",
        cursor: "pointer",
        alignItems: "center",
        transition: "background .15s, border-left-color .15s",
      }}
    >
      {/* Cover thumb */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid var(--hairline)",
          flexShrink: 0,
        }}
      >
        <BlogCover slug={post.slug} category={post.category} variant="thumb" />
      </div>

      {/* Date */}
      <span
        className="mono"
        style={{
          fontSize: 12,
          color: "var(--muted)",
          letterSpacing: "var(--ls-meta)",
        }}
      >
        {post.d.toLowerCase()}
      </span>

      {/* Category */}
      <span
        className="mono"
        style={{
          fontSize: "var(--text-mono-xs)",
          color: accent,
          letterSpacing: "var(--ls-overline)",
          textTransform: "uppercase",
          padding: "3px 10px",
          border: `1px solid ${accent}`,
          borderRadius: "var(--r-chip)",
          justifySelf: "start",
          background: hover
            ? CATEGORY_META[post.category].accent === "cyan"
              ? "rgba(0,212,255,.08)"
              : "rgba(124,58,237,.10)"
            : "transparent",
          transition: "background .15s",
        }}
      >
        {CATEGORY_META[post.category].label}
      </span>

      {/* Title */}
      <span
        style={{
          fontSize: 17,
          fontWeight: 500,
          letterSpacing: "var(--ls-tight)",
          color: "var(--fg)",
          lineHeight: 1.3,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {post.t}
      </span>

      {/* Read time */}
      <span
        className="mono"
        style={{
          fontSize: 12,
          color: "var(--muted)",
          letterSpacing: "var(--ls-meta)",
          textAlign: "right",
        }}
      >
        {post.r} read
      </span>

      {/* Arrow */}
      <span
        className="mono"
        style={{
          fontSize: "var(--text-meta)",
          color: hover ? accent : "var(--muted)",
          letterSpacing: ".1em",
          textTransform: "uppercase",
          textAlign: "right",
          transition: "color .15s",
        }}
      >
        leer <span aria-hidden>→</span>
      </span>
    </button>
  );
}
