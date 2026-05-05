import type { MetadataRoute } from "next";
import { getAllPosts } from "./lib/posts";
import { LOCALES, localePath, type Locale } from "./lib/i18n";

const SITE = "https://cobos.io";

/**
 * Build the cross-product (slug × locale) sitemap. Each entry exposes
 * its alternates so search engines connect ES and EN versions of the
 * same content. Posts that exist in only one locale get only their
 * native URL — `getAllPosts(locale)` already filters by availability.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const out: MetadataRoute.Sitemap = [];

  // Static surfaces: home + blog index per locale.
  for (const locale of LOCALES) {
    const homeUrl = `${SITE}${localePath(locale, "/")}`;
    const blogUrl = `${SITE}${localePath(locale, "/blog")}`;
    out.push({
      url: homeUrl,
      lastModified: now,
      changeFrequency: "monthly",
      priority: locale === "es" ? 1 : 0.95,
      alternates: {
        languages: {
          "es-MX": `${SITE}${localePath("es", "/")}`,
          "en-US": `${SITE}${localePath("en", "/")}`,
          "x-default": `${SITE}${localePath("es", "/")}`,
        },
      },
    });
    out.push({
      url: blogUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: {
          "es-MX": `${SITE}${localePath("es", "/blog")}`,
          "en-US": `${SITE}${localePath("en", "/blog")}`,
          "x-default": `${SITE}${localePath("es", "/blog")}`,
        },
      },
    });
  }

  // Per-post entries. We build a slug→locales map first so each entry
  // can announce its alternates without re-scanning posts.
  const slugLocales = new Map<string, Locale[]>();
  for (const locale of LOCALES) {
    for (const p of getAllPosts(locale)) {
      const arr = slugLocales.get(p.slug) ?? [];
      arr.push(locale);
      slugLocales.set(p.slug, arr);
    }
  }

  for (const locale of LOCALES) {
    for (const p of getAllPosts(locale)) {
      const localesForSlug = slugLocales.get(p.slug) ?? [locale];
      const languages: Record<string, string> = {};
      for (const loc of localesForSlug) {
        const tag = loc === "es" ? "es-MX" : "en-US";
        languages[tag] = `${SITE}${localePath(loc, `/blog/${p.slug}`)}`;
      }
      // x-default points to the ES version when available, otherwise EN.
      languages["x-default"] = localesForSlug.includes("es")
        ? `${SITE}${localePath("es", `/blog/${p.slug}`)}`
        : `${SITE}${localePath("en", `/blog/${p.slug}`)}`;

      out.push({
        url: `${SITE}${localePath(locale, `/blog/${p.slug}`)}`,
        lastModified: new Date(p.dateModified ?? p.date),
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: { languages },
      });
    }
  }

  return out;
}
