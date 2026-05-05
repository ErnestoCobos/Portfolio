import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  ArticleBody,
  extractHeadings,
  postExcerpt,
} from "../../components/ArticleBody";
import { BlogCover } from "../../components/BlogCover";
import { ArticleProgress } from "../../components/ArticleProgress";
import { TableOfContents } from "../../components/TableOfContents";
import { ArticleAside } from "../../components/ArticleAside";
import {
  CATEGORY_META,
  PROFILE,
  type Post,
} from "../../components/portfolio-data";
import { getAdjacentPosts, getAllPosts, getPost } from "../../lib/posts";

const SITE = "https://cobos.io";
const REPO_RAW = "https://github.com/ErnestoCobos/Portfolio/blob/main/content/blog";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

type RouteParams = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Artículo no encontrado · cobos::/blog" };
  const description = postExcerpt(post.body, 160);
  const url = `https://cobos.io/blog/${post.slug}`;
  // If the post supplies a cover image (real photo / curated), prefer
  // it for social sharing — otherwise the dynamic procedural OG route
  // is the canonical preview.
  const ogImage = post.cover
    ? post.cover.startsWith("http")
      ? post.cover
      : `https://cobos.io${post.cover.startsWith("/") ? "" : "/"}${post.cover}`
    : `https://cobos.io/blog/${post.slug}/opengraph-image`;
  return {
    title: `${post.title} · cobos::/blog`,
    description,
    keywords: [
      post.category,
      "cloud platform",
      "devsecops",
      "kubernetes",
      "platform engineering",
      "ernesto cobos",
    ],
    authors: [{ name: "Ernesto Cobos", url: "https://cobos.io" }],
    alternates: {
      canonical: url,
      types: {
        "application/rss+xml": [
          { url: "https://cobos.io/rss.xml", title: "cobos::/blog · RSS" },
        ],
      },
    },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url,
      siteName: "cobos.io",
      locale: "es_MX",
      publishedTime: post.date,
      authors: ["Ernesto Cobos"],
      tags: [post.category, post.title],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${post.title} · cobos::/blog`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      creator: "@ErnestoCobos",
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: RouteParams;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { prev, next } = getAdjacentPosts(post.slug);
  const accent =
    CATEGORY_META[post.category].accent === "cyan"
      ? "var(--cyan)"
      : "var(--violet)";

  // Up to 2 related posts: same category, exclude current. If none match,
  // fall back to the next chronological siblings so the section never
  // renders empty (visible only when at least 1 candidate exists).
  const all = getAllPosts();
  const sameCat = all.filter(
    (p) => p.category === post.category && p.slug !== post.slug
  );
  const fallback = all.filter((p) => p.slug !== post.slug);
  const related = (sameCat.length > 0 ? sameCat : fallback).slice(0, 2);

  const headings = extractHeadings(post.body);

  // BlogPosting structured data — Google rich results require `image`
  // for card-style snippets to render. Point to the dynamic OG image
  // route which is always 1200×630 PNG.
  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: postExcerpt(post.body, 200),
    datePublished: post.date,
    dateModified: post.dateModified ?? post.date,
    image: {
      "@type": "ImageObject",
      url: post.cover
        ? post.cover.startsWith("http")
          ? post.cover
          : `https://cobos.io${post.cover.startsWith("/") ? "" : "/"}${post.cover}`
        : `https://cobos.io/blog/${post.slug}/opengraph-image`,
      width: 1200,
      height: 630,
    },
    author: {
      "@type": "Person",
      "@id": "https://cobos.io/#person",
      name: "Ernesto Cobos",
      url: "https://cobos.io",
    },
    publisher: {
      "@type": "Person",
      "@id": "https://cobos.io/#person",
      name: "Ernesto Cobos",
      url: "https://cobos.io",
    },
    keywords: [post.category, "platform engineering", "devsecops"],
    inLanguage: "es",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://cobos.io/blog/${post.slug}`,
    },
    wordCount: post.body.split(/\s+/).filter(Boolean).length,
    articleSection: post.category,
  };

  // BreadcrumbList — helps search engines render breadcrumbs in SERP
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://cobos.io",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://cobos.io/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://cobos.io/blog/${post.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ArticlePage
        post={post}
        prev={prev}
        next={next}
        accent={accent}
        headings={headings}
        related={related}
      />
    </>
  );
}

/* ── Page chrome (server-rendered with two small client islands for
 * scroll-driven UI: ArticleProgress, TableOfContents, ArticleAside) */
function ArticlePage({
  post,
  prev,
  next,
  accent,
  headings,
  related,
}: {
  post: Post;
  prev: Post | null;
  next: Post | null;
  accent: string;
  headings: { id: string; text: string }[];
  related: Post[];
}) {
  const url = `${SITE}/blog/${post.slug}`;

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
          <Link href="/" aria-label="Ir al home" style={{ color: "var(--meta)" }}>
            cobos<span style={{ color: "var(--cyan)" }}>::</span>
          </Link>
          <Link
            href="/blog"
            className="tap"
            style={{ color: "var(--cyan)" }}
            aria-label="Volver al índice del blog"
          >
            /blog
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

      {/* Hero cover. If the post defines a `cover` field in frontmatter,
       * render that real image (next/image, optimized). Otherwise fall
       * back to the procedural BlogCover so the article still has a
       * visual anchor that matches its featured-card preview in /blog. */}
      <div
        style={{
          maxWidth: 1180,
          margin: "32px auto 0",
          padding: "0 32px",
        }}
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
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "40px 32px 64px",
        }}
      >
        <ArticleBody
          post={post}
          mobile={false}
          headerExtra={<AuthorBlock />}
        />
      </article>

      {/* Related posts — same category if any, otherwise chronological. */}
      {related.length > 0 && (
        <section
          aria-label="Más artículos relacionados"
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
            <span style={{ color: accent }}>$</span> grep -l "category:{" "}
            {post.category}" ./blog/*.md
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
                    href={`/blog/${rp.slug}`}
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

      {/* Prev / next navigation. Empty slots collapse instead of leaving
       * a hollow grid cell — the existing post becomes full-width. */}
      {(prev || next) && (
        <nav
          aria-label="Navegación entre artículos"
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "32px 32px 64px",
            display: "grid",
            gridTemplateColumns:
              prev && next ? "1fr 1fr" : "1fr",
            gap: 16,
          }}
        >
          {prev && (
            <Link
              href={`/blog/${prev.slug}`}
              className="tap"
              aria-label={`Anterior: ${prev.title}`}
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
                <span aria-hidden>←</span> anterior · más viejo
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
              href={`/blog/${next.slug}`}
              className="tap"
              aria-label={`Siguiente: ${next.title}`}
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
                siguiente · más nuevo <span aria-hidden>→</span>
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
          <span style={{ color: "var(--cyan)" }}>$</span> cat ./blog/{post.slug}
          .md · {post.r} read
        </span>
        <span style={{ display: "inline-flex", gap: 16, flexWrap: "wrap" }}>
          <a
            href={`${REPO_RAW}/${post.slug}.md`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--cyan)", textDecoration: "none" }}
          >
            edit on github <span aria-hidden>↗</span>
          </a>
          <Link
            href="/blog"
            style={{ color: "var(--cyan)", textDecoration: "none" }}
          >
            <span aria-hidden>←</span> cobos::/blog
          </Link>
        </span>
      </footer>
    </div>
  );
}

/** Author byline rendered between the H1 and the article body. Avatar
 * links to /about so readers can scope him beyond the post. */
function AuthorBlock() {
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
        href="/#about"
        aria-label={`${PROFILE.name} — sobre el autor`}
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
            href="/#about"
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
