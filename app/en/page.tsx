import type { Metadata } from "next";
import Portfolio from "../components/Portfolio";
import { LocaleProvider } from "../lib/i18n/locale-context";
import { getAllPosts } from "../lib/posts";

const SITE = "https://cobos.io";
const LOCALE = "en" as const;

export const metadata: Metadata = {
  alternates: {
    canonical: `${SITE}/en`,
    languages: {
      // No trailing slash on ES — matches the canonical declared in
      // `(es)/page.tsx` and avoids a hreflang URL mismatch between ES
      // canonical and EN's reciprocal reference (Google requires
      // byte-identical URLs across hreflang clusters).
      "es-MX": SITE,
      "en-US": `${SITE}/en`,
      "x-default": SITE,
    },
  },
  openGraph: {
    type: "website",
    siteName: "cobos.io",
    locale: "en_US",
    alternateLocale: ["es_MX"],
    url: `${SITE}/en`,
  },
};

// ProfilePage JSON-LD — mirrors the ES home with a locale-specific
// `@id` (the two profile pages are distinct documents) but the same
// `mainEntity` so the underlying Person stays unified across locales.
// `dateModified` is a literal date string of the last meaningful edit,
// not `new Date()` (which would lie about update frequency across
// builds).
const profilePageLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": `${SITE}/en/#profile`,
  dateCreated: "2024-01-01",
  dateModified: "2026-05-23",
  mainEntity: { "@id": `${SITE}/#person` },
  inLanguage: "en-US",
};

export default function HomeEn() {
  const posts = getAllPosts(LOCALE);
  return (
    <LocaleProvider locale={LOCALE}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageLd) }}
      />
      <Portfolio posts={posts} />
    </LocaleProvider>
  );
}
