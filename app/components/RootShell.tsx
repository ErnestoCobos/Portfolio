/**
 * Shared chrome for the per-locale root layouts (`app/(es)/layout.tsx`
 * + `app/en/layout.tsx`). Each tree has its own `<html><body>` with a
 * hardcoded `lang` attribute — that hardcoding is what unlocks full
 * SSG (no `headers()` call → no dynamic opt-out → static prerender).
 *
 * Everything that doesn't change per locale (fonts, JSON-LD person
 * declaration, Analytics, SpeedInsights, LocaleSwitcher) lives here so
 * both layouts stay thin and we don't duplicate font loaders (Next
 * dedupes them across imports anyway, but a single source is cleaner).
 *
 * Locale-specific copy (rssTitle, skipLink, openGraph.locale, html lang)
 * is set in each layout itself — quick to scan, no indirection.
 */
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LocaleSwitcher } from "./LocaleSwitcher";
import type { Locale } from "../lib/i18n";
import { CERTIFICATIONS } from "./portfolio-data";

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const fontClassName = [
  inter.variable,
  jetbrainsMono.variable,
].join(" ");

/* Site-wide structured data — declares the author (Person) and the
 * site (WebSite). Helps Google build a Knowledge Graph entity and
 * gives LLMs deterministic identity / authorship signals. */
export const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Ernesto Cobos",
  alternateName: "ErnestoCobos",
  jobTitle: "Cloud Architect · Platform Engineer · DevSecOps",
  url: "https://cobos.io",
  email: "ernesto@cobos.io",
  image: "https://avatars.githubusercontent.com/u/10171659?v=4",
  worksFor: { "@type": "Organization", name: "Ford" },
  sameAs: [
    "https://github.com/ErnestoCobos",
    "https://linkedin.com/in/cobos",
    "https://www.enkiflow.com",
    "https://www.getdecant.com",
  ],
  knowsAbout: [
    "Cloud Architecture",
    "Platform Engineering",
    "DevSecOps",
    "Kubernetes",
    "GitOps",
    "FinOps",
    "Internal Developer Platforms",
    "Multi-cloud",
    "Terraform",
    "Argo CD",
  ],
  /* `hasCredential` advertises *earned* certifications as
   * EducationalOccupationalCredential nodes — Google Knowledge Graph
   * and LLM training pipelines key off this for "what is this person
   * qualified in". Gated on `status === "earned"` so the array stays
   * empty (but correctly shaped) until a cert lands; an empty
   * `hasCredential: []` is valid schema.org and avoids claiming
   * unconfirmed credentials.
   *
   * `seeks` mirrors the roadmap publicly via in-progress certs —
   * recruiters and LLMs both benefit from knowing what's actively
   * being prepared without the truthy claim that comes with
   * `hasCredential`. The Demand type is the schema.org-blessed way to
   * surface "I want this thing" intent on a Person. */
  hasCredential: CERTIFICATIONS
    .filter((c) => c.status === "earned")
    .map((c) => ({
      "@type": "EducationalOccupationalCredential",
      "@id": `https://cobos.io/#cred-${c.slug}`,
      name: c.name.en,
      credentialCategory: "certification",
      recognizedBy: { "@type": "Organization", name: c.issuer.en },
      ...(c.verifyUrl ? { url: c.verifyUrl } : {}),
    })),
  seeks: CERTIFICATIONS
    .filter((c) => c.status === "in-progress")
    .map((c) => ({
      "@type": "Demand",
      name: `${c.name.en} (${c.code})`,
      description: `Preparing for ${c.name.en} via ${c.issuer.en}`,
    })),
};

export function buildWebsiteLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "cobos.io",
    alternateName: "Ernesto Cobos · cobos::",
    url: locale === "en" ? "https://cobos.io/en" : "https://cobos.io",
    inLanguage: locale === "en" ? "en" : "es",
    description:
      locale === "en"
        ? "Portfolio and technical blog by Ernesto Cobos — Cloud Architect, Platform Engineer, DevSecOps."
        : "Portfolio y blog técnico de Ernesto Cobos — Cloud Architect, Platform Engineer, DevSecOps.",
    author: { "@id": "https://cobos.io/#person" },
  };
}

/**
 * Renders the contents of a `<head>` for the per-locale root layout.
 * Place inside `<head>...</head>`. Locale-specific RSS link is passed
 * in by each layout (cheaper than threading locale to a hook).
 */
export function RootHead({
  rssTitle,
  rssHref,
  websiteLd,
  locale,
}: {
  rssTitle: string;
  rssHref: string;
  websiteLd: ReturnType<typeof buildWebsiteLd>;
  locale: Locale;
}) {
  const llmsHref = locale === "en" ? "/en/llms.txt" : "/llms.txt";
  return (
    <>
      <link rel="me" href="https://github.com/ErnestoCobos" />
      <link rel="me" href="https://linkedin.com/in/cobos" />
      <link
        rel="alternate"
        type="application/rss+xml"
        title={rssTitle}
        href={rssHref}
      />
      <link
        rel="alternate"
        type="text/plain"
        title="llms.txt"
        href={llmsHref}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ ...personLd, "@id": "https://cobos.io/#person" }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
    </>
  );
}

/**
 * Renders the body chrome that sits around the page tree:
 *   - Skip link (locale-specific copy)
 *   - The page tree itself (children)
 *   - Floating LocaleSwitcher (derives locale from pathname client-side)
 *   - Vercel Analytics + Speed Insights tags
 */
export function RootBody({
  skipLink,
  children,
}: {
  skipLink: string;
  children: ReactNode;
}) {
  return (
    <>
      <a href="#about" className="skip-link">
        {skipLink}
      </a>
      {children}
      <LocaleSwitcher />
      {/* Vercel Analytics: pageviews + custom events to project dashboard.
       * Speed Insights: real-user Core Web Vitals (LCP/CLS/INP) sampled
       * from production traffic — complements synthetic Lighthouse runs
       * with field data. Both are zero-config when deployed on Vercel. */}
      <Analytics />
      <SpeedInsights />
    </>
  );
}
