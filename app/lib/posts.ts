import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { cache } from "react";
import type { Post, PostCategory } from "../components/portfolio-data";
import { DEFAULT_LOCALE, type Locale } from "./i18n";

export type { Post };

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const MODIFIED_DATES_FILE = path.join(BLOG_DIR, ".modified-dates.json");

/** Read the prebuild-generated modified-dates JSON, if present. Returns
 * an empty map if the file doesn't exist (e.g. running `next dev` for
 * the first time before `pnpm run build` has ever run). The downstream
 * loader treats missing entries as "no modification info" and falls
 * back to the frontmatter `date`. Cached so we don't re-read the JSON
 * on every getAllPosts() call. */
const loadModifiedDates = cache((): Record<string, string> => {
  if (!existsSync(MODIFIED_DATES_FILE)) return {};
  try {
    return JSON.parse(readFileSync(MODIFIED_DATES_FILE, "utf8"));
  } catch {
    return {};
  }
});

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

function buildPost(
  slug: string,
  fullPath: string,
  locale: Locale,
  modifiedDates: Record<string, string>
): Post {
  const raw = readFileSync(fullPath, "utf8");
  const { data, body } = parseFrontmatter(raw);

  const title = data.title;
  const d = data.d;
  const date = data.date;
  const r = data.r;
  const category = data.category as PostCategory;
  const cover = data.cover || undefined;
  const coverAlt = data.coverAlt || undefined;

  if (!title || !d || !date || !r || !category) {
    throw new Error(
      `Invalid frontmatter in ${fullPath}: missing one of title|d|date|r|category`
    );
  }
  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error(
      `Unknown category "${category}" in ${fullPath}. Allowed: ${VALID_CATEGORIES.join(", ")}`
    );
  }

  // Modified dates are tracked per locale ("<slug>:<locale>") in the
  // prebuild JSON. Falls back to the slug-only key for legacy entries
  // and ultimately to the frontmatter date.
  const dateModified =
    modifiedDates[`${slug}:${locale}`] ??
    modifiedDates[slug] ??
    date;

  return {
    slug,
    title,
    t: title,
    d,
    date,
    dateModified,
    r,
    category,
    body,
    cover,
    coverAlt,
    locale,
  };
}

/**
 * Discover the on-disk path for a `(slug, locale)` pair. Supports two
 * layouts during the bilingual migration:
 *
 *   1. Folder-per-slug (target):  content/blog/<slug>/<locale>.md
 *   2. Flat legacy:               content/blog/<slug>.md   (assumed `es`)
 *
 * Returns null if the post doesn't exist for that locale. The caller
 * decides whether to fall back to the default locale or hide the post
 * from the listing.
 */
function resolvePostPath(slug: string, locale: Locale): string | null {
  const folderPath = path.join(BLOG_DIR, slug, `${locale}.md`);
  if (existsSync(folderPath)) return folderPath;

  // Legacy: only the default locale lives at the flat path.
  if (locale === DEFAULT_LOCALE) {
    const flatPath = path.join(BLOG_DIR, `${slug}.md`);
    if (existsSync(flatPath)) return flatPath;
  }
  return null;
}

/**
 * Discover all post slugs (deduped) regardless of locale. Used to build
 * the union of `(slug, locale)` combinations downstream. */
function discoverSlugs(): string[] {
  const out = new Set<string>();
  for (const entry of readdirSync(BLOG_DIR)) {
    if (entry.startsWith(".")) continue; // skip dotfiles like .modified-dates.json
    const fullPath = path.join(BLOG_DIR, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      out.add(entry);
    } else if (stat.isFile() && entry.endsWith(".md")) {
      out.add(entry.replace(/\.md$/, ""));
    }
  }
  return Array.from(out);
}

/**
 * Load all posts available in the requested locale, sorted by ISO date
 * desc. A post that has no translation in the locale is *omitted*
 * from the listing — better than rendering a cross-language fallback
 * that would confuse SEO and readers.
 *
 * Cached per (locale, request) via React `cache`. Re-reads on each new
 * request in dev so editing a markdown file is reflected without restart.
 */
export const getAllPosts = cache((locale: Locale = DEFAULT_LOCALE): Post[] => {
  const modifiedDates = loadModifiedDates();
  const slugs = discoverSlugs();
  const posts: Post[] = [];
  for (const slug of slugs) {
    const fullPath = resolvePostPath(slug, locale);
    if (fullPath) {
      posts.push(buildPost(slug, fullPath, locale, modifiedDates));
    }
  }
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return posts;
});

export function getPost(slug: string, locale: Locale = DEFAULT_LOCALE): Post | null {
  return getAllPosts(locale).find((p) => p.slug === slug) ?? null;
}

export function getAdjacentPosts(
  slug: string,
  locale: Locale = DEFAULT_LOCALE
): {
  prev: Post | null;
  next: Post | null;
} {
  const posts = getAllPosts(locale);
  const idx = posts.findIndex((p) => p.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: posts[idx + 1] ?? null,
    next: posts[idx - 1] ?? null,
  };
}

/**
 * Return the locales that have a translation for the given slug.
 * Useful for the language switcher: hide / disable EN if the post
 * isn't translated yet. */
export function getPostLocales(slug: string): Locale[] {
  const out: Locale[] = [];
  if (resolvePostPath(slug, "es")) out.push("es");
  if (resolvePostPath(slug, "en")) out.push("en");
  return out;
}
