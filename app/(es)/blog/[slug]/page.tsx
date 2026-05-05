import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  extractHeadings,
  postExcerpt,
} from "../../../components/ArticleBody";
import { BlogArticle } from "../../../components/blog/BlogArticle";
import {
  getAdjacentPosts,
  getAllPosts,
  getPost,
} from "../../../lib/posts";
import { getDictionary } from "../../../lib/i18n";

const SITE = "https://cobos.io";
const LOCALE = "es" as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts(LOCALE).map((p) => ({ slug: p.slug }));
}

type RouteParams = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug, LOCALE);
  if (!post) {
    const t = getDictionary(LOCALE);
    return { title: `${t.blog.modal.header}::/blog · 404` };
  }
  const description = postExcerpt(post.body, 160);
  const url = `${SITE}/blog/${post.slug}`;
  const enUrl = `${SITE}/en/blog/${post.slug}`;
  const ogImage = post.cover
    ? post.cover.startsWith("http")
      ? post.cover
      : `${SITE}${post.cover.startsWith("/") ? "" : "/"}${post.cover}`
    : `${SITE}/blog/${post.slug}/opengraph-image`;
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
    authors: [{ name: "Ernesto Cobos", url: SITE }],
    alternates: {
      canonical: url,
      languages: {
        "es-MX": url,
        "en-US": enUrl,
        "x-default": url,
      },
      types: {
        "application/rss+xml": [
          { url: `${SITE}/rss.xml`, title: "cobos::/blog · RSS" },
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
      alternateLocale: ["en_US"],
      publishedTime: post.date,
      modifiedTime: post.dateModified ?? post.date,
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
  const post = getPost(slug, LOCALE);
  if (!post) notFound();

  const { prev, next } = getAdjacentPosts(post.slug, LOCALE);

  // Up to 2 related posts: same category, exclude current. If none match,
  // fall back to the next chronological siblings so the section never
  // renders empty (visible only when at least 1 candidate exists).
  const all = getAllPosts(LOCALE);
  const sameCat = all.filter(
    (p) => p.category === post.category && p.slug !== post.slug
  );
  const fallback = all.filter((p) => p.slug !== post.slug);
  const related = (sameCat.length > 0 ? sameCat : fallback).slice(0, 2);

  const headings = extractHeadings(post.body);

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
          : `${SITE}${post.cover.startsWith("/") ? "" : "/"}${post.cover}`
        : `${SITE}/blog/${post.slug}/opengraph-image`,
      width: 1200,
      height: 630,
    },
    author: {
      "@type": "Person",
      "@id": `${SITE}/#person`,
      name: "Ernesto Cobos",
      url: SITE,
    },
    publisher: {
      "@type": "Person",
      "@id": `${SITE}/#person`,
      name: "Ernesto Cobos",
      url: SITE,
    },
    keywords: [post.category, "platform engineering", "devsecops"],
    inLanguage: "es",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE}/blog/${post.slug}`,
    },
    wordCount: post.body.split(/\s+/).filter(Boolean).length,
    articleSection: post.category,
    // Cross-locale alternates for AI/SEO crawlers.
    workTranslation: {
      "@type": "BlogPosting",
      "@id": `${SITE}/en/blog/${post.slug}`,
      inLanguage: "en",
      url: `${SITE}/en/blog/${post.slug}`,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${SITE}/blog/${post.slug}`,
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
      <BlogArticle
        post={post}
        prev={prev}
        next={next}
        headings={headings}
        related={related}
        locale={LOCALE}
      />
    </>
  );
}
