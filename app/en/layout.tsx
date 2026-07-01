import type { Metadata, Viewport } from "next";
import "../globals.css";
import {
  RootBody,
  RootHead,
  buildWebsiteLd,
  fontClassName,
} from "../components/RootShell";

const siteDescription =
  "Legacy → cloud-native migrations, Kubernetes in regulated sectors, multi-cloud, DevSecOps and FinOps. I build platforms as a product.";

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
  alternates: { canonical: "https://cobos.io/en" },
  openGraph: {
    type: "website",
    siteName: "cobos.io",
    locale: "en_US",
    alternateLocale: ["es_MX"],
    url: "https://cobos.io/en",
    title: "Ernesto Cobos — Cloud Architect · Platform Engineer · DevSecOps",
    description: siteDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Ernesto Cobos — Cloud Architect · Platform Engineer · DevSecOps",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ernesto Cobos — Cloud Architect · Platform Engineer · DevSecOps",
    description: siteDescription,
    creator: "@ErnestoCobos",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

/**
 * English-tree root layout. Lives at `app/en/...` (literal segment, so
 * `/en/...` URLs). Hardcoded `lang="en"` — no `headers()` call, full
 * SSG eligible.
 *
 * Sibling to `app/(es)/layout.tsx` (the route-group default tree). Two
 * independent root layouts are allowed in Next when each owns a
 * distinct branch of the file tree.
 */
export default function EnRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // suppressHydrationWarning: the no-flash theme script sets data-theme on
  // <html> before hydration, so this one element legitimately differs from the
  // server render. Suppression is scoped to <html>'s own attributes.
  return (
    <html lang="en" className={fontClassName} suppressHydrationWarning>
      <head>
        <RootHead
          rssTitle="cobos::/blog · field notes"
          rssHref="https://cobos.io/en/rss.xml"
          websiteLd={buildWebsiteLd("en")}
          locale="en"
        />
      </head>
      <body>
        <RootBody skipLink="↓ skip to content" themeLabel="Toggle light/dark theme">
          {children}
        </RootBody>
      </body>
    </html>
  );
}
