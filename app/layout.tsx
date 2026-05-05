import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { resolveLocale } from "./lib/i18n";
import { LocaleSwitcher } from "./components/LocaleSwitcher";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteDescription =
  "Migraciones legacy → cloud-native, Kubernetes en sectores regulados, multi-cloud, DevSecOps y FinOps. Construyo plataformas como producto.";

export const metadata: Metadata = {
  title: {
    default: "Ernesto Cobos — Cloud Architect · Platform Engineer · DevSecOps",
    template: "%s",
  },
  description: siteDescription,
  metadataBase: new URL("https://cobos.io"),
  authors: [{ name: "Ernesto Cobos", url: "https://cobos.io" }],
  creator: "Ernesto Cobos",
  keywords: [
    "cloud architect",
    "platform engineering",
    "devsecops",
    "kubernetes",
    "gitops",
    "finops",
    "ernesto cobos",
    "cobos.io",
  ],
  alternates: { canonical: "https://cobos.io" },
  openGraph: {
    type: "website",
    siteName: "cobos.io",
    locale: "es_MX",
    url: "https://cobos.io",
    title: "Ernesto Cobos — Cloud Architect · Platform Engineer · DevSecOps",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "Ernesto Cobos — Cloud Architect · Platform Engineer · DevSecOps",
    description: siteDescription,
    creator: "@ErnestoCobos",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

// Next 16 splits `themeColor` and `viewport` out of `metadata` into a
// dedicated `viewport` export. Tells iOS Safari + Android Chrome which
// color to paint the URL bar / status bar with so the chrome blends
// into the dark site instead of flashing white.
export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

/* Site-wide structured data — declares the author (Person) and the
 * site (WebSite). Helps Google build a Knowledge Graph entity and
 * gives LLMs deterministic identity / authorship signals. */
const personLd = {
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
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "cobos.io",
  alternateName: "Ernesto Cobos · cobos::",
  url: "https://cobos.io",
  inLanguage: "es",
  description:
    "Portfolio y blog técnico de Ernesto Cobos — Cloud Architect, Platform Engineer, DevSecOps.",
  author: { "@id": "https://cobos.io/#person" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The middleware sets `x-locale` based on URL prefix so the lang
  // attribute matches the rendered content even though Next doesn't
  // expose route params at the root layout level.
  const h = await headers();
  const locale = resolveLocale(h.get("x-locale") ?? undefined);
  const isEn = locale === "en";

  const rssTitle = isEn
    ? "cobos::/blog · field notes"
    : "cobos::/blog · notas de campo";
  const rssHref = isEn
    ? "https://cobos.io/en/rss.xml"
    : "https://cobos.io/rss.xml";
  const skipLink = isEn ? "↓ skip to content" : "↓ saltar al contenido";

  return (
    <html
      lang={isEn ? "en" : "es"}
      className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="me" href="https://github.com/ErnestoCobos" />
        <link rel="me" href="https://linkedin.com/in/cobos" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={rssTitle}
          href={rssHref}
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
      </head>
      <body>
        <a href="#about" className="skip-link">
          {skipLink}
        </a>
        {children}
        <LocaleSwitcher />
      </body>
    </html>
  );
}
