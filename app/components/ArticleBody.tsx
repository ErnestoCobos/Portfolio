import type { Post } from "./portfolio-data";

/** Parse the body into paragraph + h2 blocks. Headings are lines that start
 * with `## `; everything else becomes a paragraph. Blank lines split blocks. */
export function parsePostBody(
  body: string
): { kind: "h2" | "p"; text: string }[] {
  return body
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) =>
      block.startsWith("## ")
        ? { kind: "h2" as const, text: block.slice(3).trim() }
        : { kind: "p" as const, text: block }
    );
}

/** First non-heading paragraph from the body, trimmed to `max` chars.
 * Useful for SEO descriptions and excerpts. */
export function postExcerpt(body: string, max = 200): string {
  const first = body
    .split(/\n\n+/)
    .map((b) => b.trim())
    .find((b) => b && !b.startsWith("## "));
  if (!first) return "";
  return first.length <= max ? first : first.slice(0, max - 1).trimEnd() + "…";
}

/** Renders the article content (meta header + title + body + signoff).
 * Modal and dedicated page wrap this in their own chrome. */
export function ArticleBody({
  post,
  mobile,
}: {
  post: Post;
  mobile: boolean;
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
        <span style={{ color: "var(--cyan)" }}>{post.d}</span>
        <span>·</span>
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
          marginBottom: 32,
        }}
      >
        {post.t}
      </h1>

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
              style={{
                fontSize: mobile ? 18 : 22,
                fontWeight: 600,
                letterSpacing: "var(--ls-tight)",
                color: "var(--cyan)",
                marginTop: i === 0 ? 0 : 36,
                marginBottom: 14,
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
