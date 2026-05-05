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
      "es-MX": `${SITE}/`,
      "en-US": `${SITE}/en`,
      "x-default": `${SITE}/`,
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

export default function HomeEn() {
  const posts = getAllPosts(LOCALE);
  return (
    <LocaleProvider locale={LOCALE}>
      <Portfolio posts={posts} />
    </LocaleProvider>
  );
}
