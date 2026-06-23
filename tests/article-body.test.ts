import { describe, it, expect } from "vitest";
import {
  slugifyHeading,
  extractHeadings,
  postExcerpt,
} from "../app/components/ArticleBody";

describe("slugifyHeading", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyHeading("Hello World")).toBe("hello-world");
  });
  it("strips accents and punctuation", () => {
    expect(slugifyHeading("¿Diseño en producción?")).toBe(
      "diseno-en-produccion"
    );
  });
  it("trims leading/trailing hyphens", () => {
    expect(slugifyHeading("  --GitOps--  ")).toBe("gitops");
  });
});

describe("extractHeadings", () => {
  it("pulls level-2 headings with slugified ids", () => {
    const body = "intro\n\n## First Heading\n\nbody\n\n## Second\n\nmore";
    expect(extractHeadings(body)).toEqual([
      { id: "first-heading", text: "First Heading" },
      { id: "second", text: "Second" },
    ]);
  });
  it("ignores non-h2 lines", () => {
    const body = "# Title\n\n### Sub\n\ntext ## not a heading";
    expect(extractHeadings(body)).toEqual([]);
  });
});

describe("postExcerpt", () => {
  it("returns the first non-heading paragraph", () => {
    const body = "## Heading\n\nFirst paragraph here.\n\nSecond.";
    expect(postExcerpt(body)).toBe("First paragraph here.");
  });
  it("strips markdown emphasis and links", () => {
    const body = "A **bold** word and a [link](https://x.com) and `code`.";
    expect(postExcerpt(body)).toBe("A bold word and a link and code.");
  });
  it("truncates long text at a word boundary with an ellipsis", () => {
    const body = "word ".repeat(100).trim();
    const ex = postExcerpt(body, 50);
    expect(ex.length).toBeLessThanOrEqual(50);
    expect(ex.endsWith("…")).toBe(true);
    expect(ex).not.toContain("  ");
  });
});
