import Link from "next/link";
import Image from "next/image";
import { ArticleBody } from "../ArticleBody";
import { ArticleProgress } from "../ArticleProgress";
import { TableOfContents } from "../TableOfContents";
import { ArticleAside } from "../ArticleAside";
import { BlogCover } from "../BlogCover";
import { CATEGORY_META, PROFILE, type Post } from "../portfolio-data";
import { getDictionary, localePath, type Locale } from "../../lib/i18n";

const SITE = "https://cobos.io";
const REPO_RAW = "https://github.com/ErnestoCobos/Portfolio/blob/main/content/blog";

/**
 * Server component that renders the chrome around an article — header
 * with breadcrumb, hero cover, body slot, related posts, prev/next nav,
 * footer. Locale-parametric so both `/blog/<slug>` (es) and
 * `/en/blog/<slug>` (en) reuse the same layout.
 */
export function BlogArticle({
  post,
  prev,
  next,
  headings,
  related,
  locale,
}: {
  post: Post;
  prev: Post | null;
  next: Post | null;
  headings: { id: string; text: string }[];
  related: Post[];
  locale: Locale;
}) {
  const t = getDictionary(locale).blog.article;
  const accent =
    CATEGORY_META[post.category].accent === "cyan"
      ? "var(--cyan)"
      : "var(--violet)";
  const blogIndexHref = localePath(locale, "/blog");
  const homeHref = localePath(locale, "/");
  const articleHref = localePath(locale, `/blog/${post.slug}`);
  const url = `${SITE}${articleHref}`;

  return (
    <div className="cobos-art" style={{ minHeight: "100vh" }}>
      <ArticleProgress />

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: "14px 32px",
          borderBottom: "1px solid var(--hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: "var(--backdrop-light)",
          backdropFilter: "blur(14px) saturate(140%)",
          WebkitBackdropFilter: "blur(14px) saturate(140%)",
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: "var(--text-meta)",
            color: "var(--fg)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            letterSpacing: "-0.01em",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <Link
            href={homeHref}
            aria-label={t.labelHome}
            style={{ color: "var(--meta)" }}
          >
            {t.breadcrumbHome}
            <span style={{ color: "var(--cyan)" }}>::</span>
          </Link>
          <Link
            href={blogIndexHref}
            className="tap"
            style={{ color: "var(--cyan)" }}
            aria-label={t.labelBlog}
          >
            {t.breadcrumbBlog}
          </Link>
          <span style={{ color: "var(--meta)" }}> · {post.slug}</span>
        </div>
        <span
          className="mono"
          style={{
            fontSize: "var(--text-mono)",
            color: accent,
            letterSpacing: "var(--ls-tag)",
            textTransform: "uppercase",
            padding: "3px 10px",
            border: `1px solid ${accent}`,
            borderRadius: "var(--r-chip)",
            flexShrink: 0,
          }}
        >
          {CATEGORY_META[post.category].label}
        </span>
      </header>

      <ArticleAside url={url} title={post.title} />
      <TableOfContents headings={headings} />

      {/* Hero cover: real image override or procedural BlogCover. */}
      <div
        style={{ maxWidth: 1180, margin: "32px auto 0", padding: "0 32px" }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "21 / 9",
            borderRadius: "var(--r-card-sm)",
            overflow: "hidden",
            border: `1px solid ${accent}`,
            boxShadow:
              CATEGORY_META[post.category].accent === "cyan"
                ? "0 12px 48px rgba(0,212,255,.18)"
                : "0 12px 48px rgba(124,58,237,.22)",
          }}
        >
          {post.cover ? (
            <Image
              src={post.cover}
              alt={post.coverAlt ?? post.title}
              fill
              priority
              sizes="(max-width: 1180px) 100vw, 1180px"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <BlogCover
              slug={post.slug}
              category={post.category}
              variant="hero"
            />
          )}
        </div>
      </div>

      <article
        style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px 64px" }}
      >
        <ArticleBody
          post={post}
          mobile={false}
          headerExtra={<AuthorBlock locale={locale} />}
        />
      </article>

      {related.length > 0 && (
        <section
          aria-label={t.labelBlog}
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "16px 32px 0",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: "var(--text-mono-xs)",
              color: "var(--meta)",
              letterSpacing: "var(--ls-overline)",
              textTransform: "uppercase",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ color: accent }}>$</span> {t.relatedTitle(post.category)}
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gridTemplateColumns: related.length > 1 ? "1fr 1fr" : "1fr",
              gap: 16,
            }}
          >
            {related.map((rp) => {
              const relAccent =
                CATEGORY_META[rp.category].accent === "cyan"
                  ? "var(--cyan)"
                  : "var(--violet)";
              return (
                <li key={rp.slug}>
                  <Link
                    href={localePath(locale, `/blog/${rp.slug}`)}
                    className="tap"
                    style={{
                      display: "block",
                      padding: 20,
                      border: "1px solid var(--hairline-strong)",
                      borderRadius: "var(--r-card-sm)",
                      textDecoration: "none",
                    }}
                  >
                    <div
                      className="mono"
                      style={{
                        fontSize: "var(--text-mono-xs)",
                        color: relAccent,
                        letterSpacing: "var(--ls-overline)",
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      {rp.d.toLowerCase()} · {CATEGORY_META[rp.category].label}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-body)",
                        fontWeight: 500,
                        letterSpacing: "var(--ls-tight)",
                        color: "var(--fg)",
                        lineHeight: 1.3,
                      }}
                    >
                      {rp.title}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {(prev || next) && (
        <nav
          aria-label={t.labelBlog}
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "32px 32px 64px",
            display: "grid",
            gridTemplateColumns: prev && next ? "1fr 1fr" : "1fr",
            gap: 16,
          }}
        >
          {prev && (
            <Link
              href={localePath(locale, `/blog/${prev.slug}`)}
              className="tap"
              aria-label={t.navPrevAria(prev.title)}
              style={{
                padding: 20,
                border: "1px solid var(--hairline-strong)",
                borderRadius: "var(--r-card-sm)",
                textAlign: "left",
                minWidth: 0,
                textDecoration: "none",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: "var(--text-mono-xs)",
                  color: "var(--meta)",
                  letterSpacing: "var(--ls-overline)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {t.navPrevLabel}
              </div>
              <div
                style={{
                  fontSize: "var(--text-body)",
                  fontWeight: 500,
                  letterSpacing: "var(--ls-tight)",
                  color: "var(--fg)",
                  lineHeight: 1.3,
                }}
              >
                {prev.title}
              </div>
            </Link>
          )}
          {next && (
            <Link
              href={localePath(locale, `/blog/${next.slug}`)}
              className="tap"
              aria-label={t.navNextAria(next.title)}
              style={{
                padding: 20,
                border: "1px solid var(--hairline-strong)",
                borderRadius: "var(--r-card-sm)",
                textAlign: "right",
                minWidth: 0,
                textDecoration: "none",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: "var(--text-mono-xs)",
                  color: "var(--meta)",
                  letterSpacing: "var(--ls-overline)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {t.navNextLabel}
              </div>
              <div
                style={{
                  fontSize: "var(--text-body)",
                  fontWeight: 500,
                  letterSpacing: "var(--ls-tight)",
                  color: "var(--fg)",
                  lineHeight: 1.3,
                }}
              >
                {next.title}
              </div>
            </Link>
          )}
        </nav>
      )}

      <footer
        className="mono"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "24px 32px 56px",
          borderTop: "1px solid var(--hairline)",
          fontSize: "var(--text-mono)",
          color: "var(--meta)",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          letterSpacing: "var(--ls-meta)",
        }}
      >
        <span>
          <span style={{ color: "var(--cyan)" }}>$</span>{" "}
          {t.footerCat(post.slug, post.r)}
        </span>
        <span style={{ display: "inline-flex", gap: 16, flexWrap: "wrap" }}>
          <a
            href={`${REPO_RAW}/${post.slug}/${locale}.md`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--cyan)", textDecoration: "none" }}
          >
            {t.editOnGithub} <span aria-hidden>↗</span>
          </a>
          <Link
            href={blogIndexHref}
            style={{ color: "var(--cyan)", textDecoration: "none" }}
          >
            {t.footerBackBlog}
          </Link>
        </span>
      </footer>
    </div>
  );
}

/** Author byline rendered between the H1 and the article body. */
function AuthorBlock({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).blog.article;
  const homeAboutHref = `${localePath(locale, "/")}#about`;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 36,
        paddingBottom: 24,
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      <Link
        href={homeAboutHref}
        aria-label={`${PROFILE.name} — ${t.authorAuthorOf}`}
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--r-tile)",
          overflow: "hidden",
          border: "1px solid var(--cyan)",
          display: "block",
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PROFILE.avatarUrl}
          alt={PROFILE.name}
          width={40}
          height={40}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </Link>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--text-body-sm)",
            color: "var(--fg)",
            fontWeight: 500,
            lineHeight: 1.2,
          }}
        >
          <Link
            href={homeAboutHref}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {PROFILE.name}
          </Link>
        </div>
        <div
          className="mono"
          style={{
            fontSize: "var(--text-mono-xs)",
            color: "var(--meta)",
            letterSpacing: "var(--ls-meta)",
            marginTop: 2,
          }}
        >
          {PROFILE.role}
        </div>
      </div>
    </div>
  );
}
