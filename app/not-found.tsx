import type { Metadata } from "next";
import { NotFoundTerminal } from "./components/NotFoundTerminal";
import { getAllPosts } from "./lib/posts";

export const metadata: Metadata = {
  title: "404 · cobos::",
  description:
    "Esa ruta no existe en este manifiesto. Volvé al home o explorá las notas técnicas.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
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
      {/* Ambient gradient halo behind the terminal — same accent rotation
       * the home hero uses, just dimmer. Keeps the page from feeling like
       * an empty error screen. */}
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
  );
}
