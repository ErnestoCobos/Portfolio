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
    "https://www.linkedin.com/in/ernestocobos/",
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

/* Consulting Service node — the commercial counterpart to the Person.
 * Injected per locale from `RootHead` (which already knows its tree's
 * locale), so crawlers see localized copy on `/` and `/en` while the
 * canonical entity `@id` (`#service-consulting`) stays stable across
 * both trees. No `offers`/price yet: indicative pricing is gated on the
 * B2 roadmap item ("Trabaja conmigo") and inventing figures here would
 * publish unapproved claims to search engines.
 *
 * `provider` references the Person purely by `@id` — same-page graph
 * stitching, exactly like `buildWebsiteLd.author`. */
export function buildServiceLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://cobos.io/#service-consulting",
    name: "Cloud Architecture & Platform Engineering Consulting",
    description:
      locale === "en"
        ? "Consulting in cloud audits, architecture, legacy-to-cloud migrations, FinOps and DevSecOps — delivered remotely, worldwide."
        : "Consultoría en auditorías cloud, arquitectura, migraciones legacy→cloud, FinOps y DevSecOps — remota, a nivel mundial.",
    /* Canonical schema.org terms (English vocabulary regardless of page
     * language) so Google can classify the service type deterministically. */
    serviceType: [
      "Cloud Audit",
      "Cloud Architecture",
      "Cloud Migration",
      "FinOps",
      "DevSecOps",
    ],
    provider: { "@id": "https://cobos.io/#person" },
    areaServed: "Worldwide",
  };
}

/* Pre-paint boot scripts — must run before first paint (no FOUC):
 *  1. `js` class: gates every scroll-reveal hiding rule. Without JS the
 *     page renders fully visible; with JS, [data-reveal] elements start
 *     hidden and animate in on scroll.
 *  2. `intro-boot`: one-shot cinematic veil, once per session, never
 *     under prefers-reduced-motion, and only on the portfolio roots —
 *     landing on /blog must not burn the session flag for an intro the
 *     blog doesn't even render. The <IntroVeil/> component drops the
 *     class when the animation ends. */
const PREPAINT_BOOT_SCRIPT = `try{document.documentElement.classList.add("js");var p=location.pathname;if((p==="/"||p==="/en")&&!sessionStorage.getItem("intro-seen")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){sessionStorage.setItem("intro-seen","1");document.documentElement.classList.add("intro-boot")}}catch(e){}`;

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
      <script dangerouslySetInnerHTML={{ __html: PREPAINT_BOOT_SCRIPT }} />
      <link rel="me" href="https://github.com/ErnestoCobos" />
      <link rel="me" href="https://www.linkedin.com/in/ernestocobos/" />
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildServiceLd(locale)) }}
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
