import { LocaleProvider } from "../../lib/i18n/locale-context";
import { getAllPosts } from "../../lib/posts";
import BlogClient from "../../components/blog/BlogClient";
import BlogSubscribe from "../../components/blog/BlogSubscribe";

const SITE = "https://cobos.io";

const LOCALE = "es" as const;

export default function BlogIndex() {
  const posts = getAllPosts(LOCALE);

  /* CollectionPage + ItemList: tells crawlers this URL is a listing over
   * the real post set (not a content page), with stable positions. The
   * Person `@id` reference resolves because the root layout head —
   * rendered on this same page — declares the `#person` node. */
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE}/blog#collection`,
    url: `${SITE}/blog`,
    name: "cobos::/blog · notas de campo",
    inLanguage: "es",
    publisher: { "@id": `${SITE}/#person` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/blog/${p.slug}`,
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
