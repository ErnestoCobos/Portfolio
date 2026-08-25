"use client";

import { useEffect, useState } from "react";
import { CATEGORY_META, type Post } from "../portfolio-data";
import { useLocale, useT } from "../../lib/i18n/locale-context";
import { ArticleModal } from "../ArticleModal";
import { BlogCover } from "../BlogCover";
import { Section, SectionHeader } from "../chrome/primitives";

/* ─── Blog ───────────────────────────────────────────────── */
export function Blog({ mobile, posts }: { mobile: boolean; posts: Post[] }) {
  const t = useT();
  const locale = useLocale();
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  // Open from URL hash on mount and when hash changes (linkeable: #blog/<slug>)
  useEffect(() => {
    const sync = () => {
      const m = window.location.hash.match(/^#blog\/([\w-]+)$/);
      setOpenSlug(m ? m[1] : null);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const open = openSlug ? posts.find((p) => p.slug === openSlug) ?? null : null;

  const openPost = (slug: string) => {
    setOpenSlug(slug);
    window.history.replaceState(null, "", `#blog/${slug}`);
  };

  const closePost = () => {
    setOpenSlug(null);
    window.history.replaceState(null, "", "#blog");
  };

  return (
    <Section id="blog" fsPath="/blog" mobile={mobile} dark>
      <SectionHeader n={8} t={t.blog.sectionLabel} action={t.blog.action(posts.length)} />
      <div
        className="mono"
        style={{ fontSize: mobile ? 13 : 14, lineHeight: 1.8 }}
      >
        {posts.slice(0, 3).map((p, i) => {
          const accent =
            CATEGORY_META[p.category].accent === "cyan"
              ? "var(--cyan)"
              : "var(--violet)";
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => openPost(p.slug)}
              className="tap"
              style={{
                display: "grid",
                gridTemplateColumns: mobile
                  ? "44px 1fr"
                  : "44px 90px 100px 1fr 70px",
                gap: 14,
                padding: "12px 0",
                borderTop: i ? "1px solid var(--hairline)" : "none",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
                background: "transparent",
                fontFamily: "inherit",
                fontSize: "inherit",
                color: "inherit",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 4,
                  overflow: "hidden",
                  border: "1px solid var(--hairline)",
                  flexShrink: 0,
                }}
              >
                <BlogCover
                  slug={p.slug}
                  category={p.category}
                  variant="thumb"
                />
              </div>
              {mobile ? (
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "var(--text-mono-xs)",
                      color: "var(--muted)",
                      letterSpacing: "var(--ls-tag)",
                      textTransform: "uppercase",
                      display: "flex",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: accent }}>{p.d.toLowerCase()}</span>
                    <span>·</span>
                    <span style={{ color: accent }}>
                      {CATEGORY_META[p.category].label}
                    </span>
                  </div>
                  <span style={{ color: "var(--fg)", fontSize: 14 }}>
                    {p.t}
                  </span>
                </div>
              ) : (
                <>
                  <span style={{ color: "var(--muted)" }}>
                    {p.d.toLowerCase()}
                  </span>
                  <span
                    style={{
                      color: accent,
                      fontSize: "var(--text-mono-xs)",
                      letterSpacing: "var(--ls-tag)",
                      textTransform: "uppercase",
                      padding: "2px 8px",
                      border: `1px solid ${accent}`,
                      borderRadius: "var(--r-chip)",
                      justifySelf: "start",
                    }}
                  >
                    {CATEGORY_META[p.category].label}
                  </span>
                  <span style={{ color: "var(--fg)", fontSize: 16 }}>
                    {p.t}
                  </span>
                  <span style={{ color: accent, textAlign: "right" }}>
                    {p.r} →
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <div
        style={{
          marginTop: mobile ? 24 : 32,
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <a
          href={locale === "en" ? "/en/blog" : "/blog"}
          className="tap mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 18px",
            border: "1px solid var(--cyan)",
            borderRadius: "var(--r-tile)",
            color: "var(--cyan)",
            fontSize: "var(--text-meta)",
            letterSpacing: ".04em",
            textTransform: "uppercase",
            background:
              "linear-gradient(180deg, var(--cyan-tint), transparent)",
          }}
        >
          {t.blog.teaserReadMore}
          <span aria-hidden style={{ fontSize: 14 }}>→</span>
          <span
            style={{ color: "var(--muted)", textTransform: "none", marginLeft: 6 }}
          >
            {t.blog.teaserNotasCount(posts.length)}
          </span>
        </a>
      </div>
      {open && <ArticleModal post={open} onClose={closePost} mobile={mobile} />}
    </Section>
  );
}
