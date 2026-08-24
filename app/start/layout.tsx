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
 *
 * The inline pre-paint script arms the cinematic intro (adds
 * `start-intro-boot` to <html>) before first paint, so the black veil is
 * there from frame zero — the same trick used for theme flash. It runs
 * once per browser session (sessionStorage) and never under reduced
 * motion.
 */
const INTRO_BOOT_SCRIPT = `try{if(!sessionStorage.getItem("start-intro-seen")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.classList.add("start-intro-boot");sessionStorage.setItem("start-intro-seen","1")}}catch(e){}`;

export default function StartLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={fontClassName}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT_SCRIPT }} />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
