import type { Metadata } from "next";
import "./globals.css";
import { NotFoundTerminal } from "./components/NotFoundTerminal";
import {
  RootBody,
  RootHead,
  buildWebsiteLd,
  fontClassName,
} from "./components/RootShell";
import { getAllPosts } from "./lib/posts";

export const metadata: Metadata = {
  title: "404 · cobos::",
  description:
    "Esa ruta no existe en este manifiesto. Volvé al home o explorá las notas técnicas.",
  robots: { index: false, follow: false },
};

/**
 * Root-level 404. Both locale trees ((es) and en/) carry their own root
 * layout, so URLs outside those trees previously fell through to Next's
 * default white 404. global-not-found renders its own <html>/<body> and
 * reuses the same terminal-styled page as the per-locale not-found, in
 * Spanish (the site's default locale).
 */
export default function GlobalNotFound() {
  const suggestions = getAllPosts()
    .slice(0, 3)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      d: p.d,
      r: p.r,
    }));

  return (
    <html lang="es" className={fontClassName}>
      <head>
        <RootHead
          rssTitle="cobos::/blog · notas de campo"
          rssHref="https://cobos.io/rss.xml"
          websiteLd={buildWebsiteLd("es")}
          locale="es"
        />
      </head>
      <body>
        <RootBody skipLink="↓ saltar al contenido">
          <main
            className="cobos-art"
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "56px 24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: "10% -10% 10% -10%",
                background:
                  "radial-gradient(circle at 30% 40%, var(--violet-tint-soft) 0%, transparent 55%), radial-gradient(circle at 70% 60%, var(--cyan-tint-soft) 0%, transparent 55%)",
                filter: "blur(40px)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", width: "100%" }}>
              <NotFoundTerminal suggestions={suggestions} />
            </div>
          </main>
        </RootBody>
      </body>
    </html>
  );
}
