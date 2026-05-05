import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody, postExcerpt } from "../../components/ArticleBody";
import { CATEGORY_META, type Post } from "../../components/portfolio-data";
import { getAdjacentPosts, getAllPosts, getPost } from "../../lib/posts";

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
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url,
      siteName: "cobos.io",
      locale: "es_MX",
      publishedTime: post.date,
      authors: ["Ernesto Cobos"],
      tags: [post.category],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      creator: "@ErnestoCobos",
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

  // BlogPosting structured data — Google rich results
  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: postExcerpt(post.body, 200),
    datePublished: post.date,
    dateModified: post.date,
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
      <ArticlePage post={post} prev={prev} next={next} accent={accent} />
    </>
  );
}

/* ── Page chrome (server-rendered, no client hooks) ─────────── */
function ArticlePage({
  post,
  prev,
  next,
  accent,
}: {
  post: Post;
  prev: Post | null;
  next: Post | null;
  accent: string;
}) {
  return (
    <div className="cobos-art" style={{ minHeight: "100vh" }}>
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
        <Link
          href="/blog"
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
          <span style={{ color: "var(--muted)" }}> · {post.slug}</span>
        </Link>
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
          }}
        >
          {CATEGORY_META[post.category].label}
        </span>
      </header>

      <article
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "56px 32px 64px",
        }}
      >
        <ArticleBody post={post} mobile={false} />
      </article>

      {/* Prev / next navigation */}
      <nav
        aria-label="Navegación entre artículos"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "32px 32px 64px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {prev ? (
          <Link
            href={`/blog/${prev.slug}`}
            className="tap"
            style={{
              padding: 20,
              border: "1px solid var(--hairline-strong)",
              borderRadius: 8,
              textAlign: "left",
              minWidth: 0,
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: "var(--text-mono-xs)",
                color: "var(--muted)",
                letterSpacing: "var(--ls-overline)",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              ← anterior · más viejo
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
              {prev.t}
            </div>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/blog/${next.slug}`}
            className="tap"
            style={{
              padding: 20,
              border: "1px solid var(--hairline-strong)",
              borderRadius: 8,
              textAlign: "right",
              minWidth: 0,
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: "var(--text-mono-xs)",
                color: "var(--muted)",
                letterSpacing: "var(--ls-overline)",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              siguiente · más nuevo →
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
              {next.t}
            </div>
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <footer
        className="mono"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "0 32px 56px",
          borderTop: "1px solid var(--hairline)",
          paddingTop: 24,
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
          <span style={{ color: "var(--cyan)" }}>$</span> cat ./blog/{post.slug}
          .md · {post.r} read
        </span>
        <Link
          href="/blog"
          style={{ color: "var(--cyan)", textDecoration: "none" }}
        >
          ← cobos::/blog
        </Link>
      </footer>
    </div>
  );
}
