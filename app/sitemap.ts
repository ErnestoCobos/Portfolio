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
  // Home URLs are normalised WITHOUT a trailing slash so they match the
  // `alternates.canonical` declared in `app/(es)/page.tsx` and
  // `app/en/page.tsx` byte-for-byte. A hreflang URL that differs by a
  // single trailing slash from the canonical breaks the cluster.
  const ES_HOME = SITE;
  const EN_HOME = `${SITE}/en`;
  for (const locale of LOCALES) {
    const homeUrl = locale === "es" ? ES_HOME : EN_HOME;
    const blogUrl = `${SITE}${localePath(locale, "/blog")}`;
    out.push({
      url: homeUrl,
      lastModified: now,
      changeFrequency: "monthly",
      priority: locale === "es" ? 1 : 0.95,
      alternates: {
        languages: {
          "es-MX": ES_HOME,
          "en-US": EN_HOME,
          "x-default": ES_HOME,
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

  // /now snapshot — same cluster semantics as home/blog: byte-identical
  // URLs across the hreflang set, matching each page's canonical.
  const NOW_ES = `${SITE}/now`;
  const NOW_EN = `${SITE}/en/now`;
  for (const nowUrl of [NOW_ES, NOW_EN]) {
    out.push({
      url: nowUrl,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: {
          "es-MX": NOW_ES,
          "en-US": NOW_EN,
          "x-default": NOW_ES,
        },
      },
    });
  }

  // /cv printable résumé — same cluster semantics as /now.
  const CV_ES = `${SITE}/cv`;
  const CV_EN = `${SITE}/en/cv`;
  for (const cvUrl of [CV_ES, CV_EN]) {
    out.push({
      url: cvUrl,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: {
          "es-MX": CV_ES,
          "en-US": CV_EN,
          "x-default": CV_ES,
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
