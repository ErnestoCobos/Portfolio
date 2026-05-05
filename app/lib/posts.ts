import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { cache } from "react";
import type { Post, PostCategory } from "../components/portfolio-data";

export type { Post };

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/** Minimal YAML frontmatter parser. Handles `key: value`, optional quoting,
 * one level deep — no nested objects or arrays. Sufficient for our schema. */
function parseFrontmatter(text: string): {
  data: Record<string, string>;
  body: string;
} {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  const data: Record<string, string> = {};
  for (const raw of m[1].split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, body: m[2].trim() };
}

const VALID_CATEGORIES: PostCategory[] = [
  "gitops",
  "migrations",
  "finops",
  "platform",
];

function loadPostFromFile(filename: string): Post {
  const slugFromFile = filename.replace(/\.md$/i, "");
  const fullPath = path.join(BLOG_DIR, filename);
  const raw = readFileSync(fullPath, "utf8");
  const { data, body } = parseFrontmatter(raw);

  const slug = data.slug ?? slugFromFile;
  const title = data.title;
  const d = data.d;
  const date = data.date;
  const r = data.r;
  const category = data.category as PostCategory;

  if (!title || !d || !date || !r || !category) {
    throw new Error(
      `Invalid frontmatter in content/blog/${filename}: missing one of title|d|date|r|category`
    );
  }
  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error(
      `Unknown category "${category}" in ${filename}. Allowed: ${VALID_CATEGORIES.join(", ")}`
    );
  }

  return { slug, title, t: title, d, date, r, category, body };
}

/** Load all posts from content/blog/*.md, sorted by ISO date desc.
 * Cached per request via React `cache`. Re-reads on each new request in
 * dev so editing a markdown file is reflected without restart. */
export const getAllPosts = cache((): Post[] => {
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  const posts = files.map(loadPostFromFile);
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return posts;
});

export function getPost(slug: string): Post | null {
  return getAllPosts().find((p) => p.slug === slug) ?? null;
}

export function getAdjacentPosts(slug: string): {
  prev: Post | null;
  next: Post | null;
} {
  const posts = getAllPosts();
  const idx = posts.findIndex((p) => p.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: posts[idx + 1] ?? null,
    next: posts[idx - 1] ?? null,
  };
}
