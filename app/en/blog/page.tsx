import type { Metadata } from "next";
import BlogClient from "../../blog/blog-client";
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
  return (
    <LocaleProvider locale={LOCALE}>
      <BlogClient posts={posts} />
    </LocaleProvider>
  );
}
