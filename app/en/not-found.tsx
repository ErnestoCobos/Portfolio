import type { Metadata } from "next";
import { NotFoundTerminal } from "../components/NotFoundTerminal";
import { LocaleProvider } from "../lib/i18n/locale-context";
import { getDictionary } from "../lib/i18n";
import { getAllPosts } from "../lib/posts";

const LOCALE = "en" as const;

export const metadata: Metadata = {
  title: getDictionary(LOCALE).notFound.title,
  description: getDictionary(LOCALE).notFound.description,
  robots: { index: false, follow: false },
};

export default function NotFoundEn() {
  const suggestions = getAllPosts(LOCALE)
    .slice(0, 3)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      d: p.d,
      r: p.r,
    }));

  return (
    <LocaleProvider locale={LOCALE}>
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
    </LocaleProvider>
  );
}
