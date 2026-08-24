import type { Metadata, Viewport } from "next";
import "../globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { fontClassName } from "../components/RootShell";

export const metadata: Metadata = {
  title: "start · cobos::",
  description:
    "Página de inicio personal de Ernesto Cobos — buscador, links rápidos y status de sistemas.",
  // Personal tool, not content: keep it out of search indexes.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

/**
 * Root layout for the start.cobos.io subtree. Owns its own <html>/<body>
 * like the per-locale layouts do. Deliberately thin: no JSON-LD, no
 * LocaleSwitcher, no RSS — this is a personal tool page, not content.
 */
export default function StartLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={fontClassName}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
