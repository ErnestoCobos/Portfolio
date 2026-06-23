import type { Metadata, Viewport } from "next";
import "../globals.css";
import {
  RootBody,
  RootHead,
  buildWebsiteLd,
  fontClassName,
} from "../components/RootShell";

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

// Next 16 splits `themeColor` and `viewport` out of `metadata` into a
// dedicated `viewport` export. Tells iOS Safari + Android Chrome which
// color to paint the URL bar / status bar with so the chrome blends
// into the dark site instead of flashing white.
export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

/**
 * Spanish-tree root layout. ES is the default locale so this serves
 * unprefixed URLs (`/`, `/blog`, `/blog/<slug>`, etc.) via the `(es)`
 * route group (no URL segment). EN lives at `app/en/...` with its own
 * root layout.
 *
 * Hardcoded `lang="es"` (no `headers()` call) is what unlocks SSG —
 * every page in this tree can be statically prerendered.
 */
export default function EsRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // suppressHydrationWarning: the no-flash theme script sets data-theme on
  // <html> before hydration, so this one element legitimately differs from the
  // server render. Suppression is scoped to <html>'s own attributes.
  return (
    <html lang="es" className={fontClassName} suppressHydrationWarning>
      <head>
        <RootHead
          rssTitle="cobos::/blog · notas de campo"
          rssHref="https://cobos.io/rss.xml"
          websiteLd={buildWebsiteLd("es")}
          locale="es"
        />
      </head>
      <body>
        <RootBody skipLink="↓ saltar al contenido" themeLabel="Cambiar tema claro/oscuro">
          {children}
        </RootBody>
      </body>
    </html>
  );
}
