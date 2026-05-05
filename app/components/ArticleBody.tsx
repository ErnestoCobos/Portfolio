import type { Post } from "./portfolio-data";

export type ParsedBlock =
  | { kind: "h2"; text: string; id: string }
  | { kind: "p"; text: string };

/** Slugify a heading text into an HTML-safe anchor id. Lowercases, strips
 * accents, replaces non-alphanumeric runs with single hyphens. Used both
 * by ArticleBody (renders `<h2 id={id}>`) and TableOfContents (links to it). */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Parse the body into paragraph + h2 blocks. Headings are lines that start
 * with `## `; everything else becomes a paragraph. Blank lines split blocks. */
export function parsePostBody(body: string): ParsedBlock[] {
  return body
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (block.startsWith("## ")) {
        const text = block.slice(3).trim();
        return { kind: "h2" as const, text, id: slugifyHeading(text) };
      }
      return { kind: "p" as const, text: block };
    });
}

/** Pull just the h2 entries from a parsed body for use in a Table of
 * Contents. Returns shallow copies so callers can pass to client components. */
export function extractHeadings(
  blocks: ParsedBlock[]
): { id: string; text: string }[] {
  return blocks
    .filter((b): b is Extract<ParsedBlock, { kind: "h2" }> => b.kind === "h2")
    .map((b) => ({ id: b.id, text: b.text }));
}

/** First non-heading paragraph from the body, trimmed to `max` chars at the
 * last word boundary so we never cut mid-syllable. Used for SEO descriptions,
 * RSS items, manifest list excerpts. */
export function postExcerpt(body: string, max = 200): string {
  const first = body
    .split(/\n\n+/)
    .map((b) => b.trim())
    .find((b) => b && !b.startsWith("## "));
  if (!first) return "";
  if (first.length <= max) return first;
  // Cut at last whitespace before max-1 so we end on a word, not "regula…"
  const window = first.slice(0, max - 1);
  const lastSpace = window.lastIndexOf(" ");
  const cut = lastSpace > max * 0.6 ? window.slice(0, lastSpace) : window;
  return cut.replace(/[\s,;:.!?-]+$/, "") + "…";
}

/** Renders the article content (meta header + title + body + signoff).
 * Modal and dedicated page wrap this in their own chrome. The optional
 * `headerExtra` slot is rendered between the H1 and the body — used by
 * the dedicated /blog/<slug> page to host the author block (modal skips
 * it to keep the focused-reading vibe). */
export function ArticleBody({
  post,
  mobile,
  headerExtra,
}: {
  post: Post;
  mobile: boolean;
  headerExtra?: React.ReactNode;
}) {
  const blocks = parsePostBody(post.body);

  return (
    <>
      <div
        className="mono"
        style={{
          fontSize: "var(--text-mono)",
          color: "var(--muted)",
          letterSpacing: "var(--ls-tag)",
          textTransform: "uppercase",
          display: "flex",
          gap: 14,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <time
          dateTime={post.date}
          style={{ color: "var(--cyan)" }}
        >
          {post.d}
        </time>
        <span aria-hidden>·</span>
        <span>{post.r} read</span>
      </div>

      <h1
        id="article-title"
        style={{
          fontSize: mobile ? 28 : 40,
          fontWeight: 600,
          letterSpacing: "var(--ls-heading)",
          lineHeight: 1.1,
          color: "var(--fg)",
          marginBottom: headerExtra ? 20 : 32,
        }}
      >
        {post.t}
      </h1>

      {headerExtra}

      <div
        style={{
          fontSize: mobile ? 15 : 17,
          lineHeight: 1.75,
          color: "var(--fg)",
        }}
      >
        {blocks.map((b, i) =>
          b.kind === "h2" ? (
            <h2
              key={i}
              id={b.id}
              style={{
                fontSize: mobile ? 18 : 22,
                fontWeight: 600,
                letterSpacing: "var(--ls-tight)",
                color: "var(--cyan)",
                marginTop: i === 0 ? 0 : 36,
                marginBottom: 14,
                // Push the heading down on anchor jump so the sticky header
                // (52px on this site) doesn't overlap it.
                scrollMarginTop: 80,
              }}
            >
              {b.text}
            </h2>
          ) : (
            <p
              key={i}
              style={{
                color: "var(--body-soft)",
                marginBottom: 18,
              }}
            >
              {b.text}
            </p>
          )
        )}
      </div>

      <div
        className="mono"
        style={{
          marginTop: 56,
          paddingTop: 24,
          borderTop: "1px solid var(--hairline)",
          fontSize: 12,
          color: "var(--muted)",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span>
          <span style={{ color: "var(--cyan)" }}>$</span> cat ./blog/
          {post.slug}.md
        </span>
        <span>— ernesto.cobos</span>
      </div>
    </>
  );
}
