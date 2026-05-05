import { PROFILE } from "../components/portfolio-data";
import { getAllPosts } from "../lib/posts";

const SITE = "https://cobos.io";

/**
 * Generates llms-full.txt — the complete blog corpus in plain markdown,
 * concatenated, optimized for direct LLM ingestion. Each post is wrapped
 * with metadata (URL, date, category, read time) so the LLM has full
 * provenance. Per https://llmstxt.org/ this is the "full content" sibling
 * of /llms.txt.
 */
function generate(): string {
  const lines: string[] = [];
  const posts = getAllPosts();

  lines.push("# cobos.io · full blog corpus");
  lines.push("");
  lines.push(`Author: ${PROFILE.name} (${PROFILE.role})`);
  lines.push(`Site: ${SITE}`);
  lines.push(`License: All rights reserved · cite the URL when quoting.`);
  lines.push(
    `Generated: ${new Date().toISOString()} · ${posts.length} articles`
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const p of posts) {
    lines.push(`# ${p.title}`);
    lines.push("");
    lines.push(`URL: ${SITE}/blog/${p.slug}`);
    lines.push(`Date: ${p.d} (${p.date})`);
    lines.push(`Category: ${p.category}`);
    lines.push(`Read time: ${p.r}`);
    lines.push(`Author: ${PROFILE.name}`);
    lines.push("");
    lines.push(p.body);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

export function GET() {
  return new Response(generate(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
