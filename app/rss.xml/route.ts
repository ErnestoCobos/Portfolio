import { PROFILE } from "../components/portfolio-data";
import { getAllPosts } from "../lib/posts";
import { postExcerpt } from "../components/ArticleBody";

const SITE = "https://cobos.io";
const FEED_TITLE = "cobos::/blog · notas de campo";
const FEED_DESCRIPTION =
  "Notas técnicas sobre GitOps regulado, migraciones a EKS sin downtime, FinOps real y plataformas internas. Apuntes desde producción por Ernesto Cobos.";

/** XML escape — only the 5 entities relevant inside text content / CDATA. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RFC 822 date format required by RSS 2.0. Posts have human "Mar 2026" plus
 * ISO "2026-03-15" — we use the ISO. */
function rfc822(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

function build(): string {
  const posts = getAllPosts();
  const lastBuild = posts[0]?.date
    ? rfc822(posts[0].date)
    : new Date().toUTCString();

  const items = posts
    .map((p) => {
      const url = `${SITE}/blog/${p.slug}`;
      const description = postExcerpt(p.body, 280);
      return [
        "    <item>",
        `      <title>${esc(p.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${rfc822(p.date)}</pubDate>`,
        `      <category>${esc(p.category)}</category>`,
        `      <author>${PROFILE.email} (${esc(PROFILE.name)})</author>`,
        `      <description>${esc(description)}</description>`,
        `      <content:encoded><![CDATA[${p.body}]]></content:encoded>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">`,
    `  <channel>`,
    `    <title>${esc(FEED_TITLE)}</title>`,
    `    <link>${SITE}/blog</link>`,
    `    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />`,
    `    <description>${esc(FEED_DESCRIPTION)}</description>`,
    `    <language>es-MX</language>`,
    `    <lastBuildDate>${lastBuild}</lastBuildDate>`,
    `    <managingEditor>${PROFILE.email} (${esc(PROFILE.name)})</managingEditor>`,
    `    <webMaster>${PROFILE.email} (${esc(PROFILE.name)})</webMaster>`,
    `    <generator>cobos.io · markdown-driven Next.js feed</generator>`,
    items,
    `  </channel>`,
    `</rss>`,
  ].join("\n");
}

export function GET() {
  return new Response(build(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
