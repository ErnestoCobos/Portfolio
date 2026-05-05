import { Marked } from "marked";
import type { Post } from "./portfolio-data";

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

/** Pull H2 headings out of a markdown body for the Table of Contents.
 * Cheap line-scan that only matches `## ` at line start — same syntax
 * marked recognises as level-2 ATX headings. We don't reuse marked's
 * tokenizer because TOC is needed by both server and client paths and
 * the lighter scan keeps the client bundle slim. */
export function extractHeadings(
  body: string
): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];
  for (const raw of body.split(/\r?\n/)) {
    if (raw.startsWith("## ")) {
      const text = raw.slice(3).trim();
      if (text) out.push({ id: slugifyHeading(text), text });
    }
  }
  return out;
}

/** First non-heading paragraph from the body, trimmed to `max` chars at the
 * last word boundary so we never cut mid-syllable. Used for SEO descriptions,
 * RSS items, manifest list excerpts. We strip markdown emphasis so the
 * excerpt doesn't carry **stars** or [link](syntax). */
export function postExcerpt(body: string, max = 200): string {
  const first = body
    .split(/\n\n+/)
    .map((b) => b.trim())
    .find((b) => b && !b.startsWith("## "));
  if (!first) return "";
  // Strip basic markdown so the excerpt reads as prose.
  const stripped = first
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) → text
    .replace(/`([^`]+)`/g, "$1") // `code` → code
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **bold** → bold
    .replace(/\*([^*]+)\*/g, "$1"); // *italic* → italic
  if (stripped.length <= max) return stripped;
  const window = stripped.slice(0, max - 1);
  const lastSpace = window.lastIndexOf(" ");
  const cut = lastSpace > max * 0.6 ? window.slice(0, lastSpace) : window;
  return cut.replace(/[\s,;:.!?-]+$/, "") + "…";
}

/** Pre-configured marked instance for cobos posts. GFM enabled (tables,
 * task lists, autolinks). We hook the heading renderer to inject our
 * slugified IDs (matches `extractHeadings`) and the link renderer to
 * tag external links with `target="_blank" rel="noopener noreferrer"`.
 * Single shared instance — marked is stateful across instances but each
 * render is independent, so reuse is safe. */
const marked = new Marked({
  gfm: true,
  breaks: false,
  pedantic: false,
});

marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const plain = tokens
        .map((t) => ("text" in t ? t.text : ""))
        .join("");
      const id = slugifyHeading(plain);
      return `<h${depth} id="${id}">${text}</h${depth}>\n`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const isExternal = /^https?:\/\//i.test(href);
      const titleAttr = title ? ` title="${title.replace(/"/g, "&quot;")}"` : "";
      const targetAttrs = isExternal
        ? ` target="_blank" rel="noopener noreferrer"`
        : "";
      return `<a href="${href}"${titleAttr}${targetAttrs}>${text}</a>`;
    },
  },
});

/** Render markdown body to HTML once (server-side). Output is fed into
 * `dangerouslySetInnerHTML` — safe because the source is our own trusted
 * markdown in `content/blog`, not user-generated content. */
export function renderArticleHtml(body: string): string {
  return marked.parse(body, { async: false });
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
  const html = renderArticleHtml(post.body);

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
        <time dateTime={post.date} style={{ color: "var(--cyan)" }}>
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

      {/* Article body: HTML rendered by marked. Styling lives in
       * globals.css under `.article-prose` so we can target h2/p/code/
       * pre/img/ul/etc consistently without duplicating inline styles. */}
      <div
        className="article-prose"
        style={{
          fontSize: mobile ? 15 : 17,
          lineHeight: 1.75,
          color: "var(--fg)",
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

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
