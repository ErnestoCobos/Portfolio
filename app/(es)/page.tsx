import type { Metadata } from "next";
import Portfolio from "../components/Portfolio";
import { LocaleProvider } from "../lib/i18n/locale-context";
import { getAllPosts } from "../lib/posts";

const SITE = "https://cobos.io";
const LOCALE = "es" as const;

export const metadata: Metadata = {
  alternates: {
    canonical: SITE,
    languages: {
      "es-MX": SITE,
      "en-US": `${SITE}/en`,
      "x-default": SITE,
    },
  },
};

// ProfilePage JSON-LD — pairs with the WebSite + Person blobs already
// emitted by RootShell. Tells Google this URL is a person's profile
// hub (not a generic article/landing) and links back to the #person
// node so the Knowledge Graph stays one entity, not three.
//
// `@id` is locale-specific (the ES profile and EN profile are distinct
// documents) but `mainEntity` both point to the shared `#person` node so
// the underlying identity stays unified.
//
// `dateModified` is a literal date string of the last meaningful profile
// edit — using `new Date()` would re-fire on every build and tell Google
// the profile changed on dates it didn't. Update manually when content
// substantively changes.
const profilePageLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": `${SITE}/#profile`,
  dateCreated: "2024-01-01",
  dateModified: "2026-05-23",
  mainEntity: { "@id": `${SITE}/#person` },
  inLanguage: "es-MX",
};

export default function Home() {
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
