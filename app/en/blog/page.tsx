import type { Metadata } from "next";
import BlogClient from "../../components/blog/BlogClient";
import BlogSubscribe from "../../components/blog/BlogSubscribe";
import { LocaleProvider } from "../../lib/i18n/locale-context";
import { getAllPosts } from "../../lib/posts";

const SITE = "https://cobos.io";
const LOCALE = "en" as const;

const description =
  "Field notes on regulated GitOps, zero-downtime EKS migrations, real-world FinOps, and internal developer platforms. Technical posts on building platforms in production.";

export const metadata: Metadata = {
  title: "Notes · cobos::/blog",
  description,
  alternates: {
    canonical: `${SITE}/en/blog`,
    languages: {
      "es-MX": `${SITE}/blog`,
      "en-US": `${SITE}/en/blog`,
      "x-default": `${SITE}/blog`,
    },
  },
  openGraph: {
    title: "cobos::/blog · field notes",
    description,
    type: "website",
    url: `${SITE}/en/blog`,
    siteName: "cobos.io",
    locale: "en_US",
    alternateLocale: ["es_MX"],
  },
  twitter: {
    card: "summary_large_image",
    title: "cobos::/blog · field notes",
    description,
    creator: "@ErnestoCobos",
  },
};

export default function BlogIndexEn() {
  const posts = getAllPosts(LOCALE);

  /* CollectionPage + ItemList: tells crawlers this URL is a listing over
   * the real post set (not a content page), with stable positions. The
   * Person `@id` reference resolves because the root layout head —
   * rendered on this same page — declares the `#person` node. */
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE}/en/blog#collection`,
    url: `${SITE}/en/blog`,
    name: "cobos::/blog · field notes",
    inLanguage: "en",
    publisher: { "@id": `${SITE}/#person` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/en/blog/${p.slug}`,
        name: p.title,
      })),
    },
  };

  return (
    <LocaleProvider locale={LOCALE}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />
      <BlogClient posts={posts} />
      <BlogSubscribe />
    </LocaleProvider>
  );
}
