import { describe, it, expect } from "vitest";
import {
  getAllPosts,
  getPost,
  getAdjacentPosts,
  getPostLocales,
} from "../app/lib/posts";

const REQUIRED = [
  "slug",
  "title",
  "d",
  "date",
  "r",
  "category",
  "body",
  "locale",
] as const;

describe("getAllPosts", () => {
  for (const locale of ["es", "en"] as const) {
    it(`returns ${locale} posts sorted by date desc with required fields`, () => {
      const posts = getAllPosts(locale);
      expect(posts.length).toBeGreaterThanOrEqual(1);
      // ISO date strings sort lexicographically — assert non-increasing.
      for (let i = 1; i < posts.length; i++) {
        expect(posts[i - 1].date >= posts[i].date).toBe(true);
      }
      for (const p of posts) {
        for (const key of REQUIRED) {
          expect(p[key], `${p.slug} missing ${key}`).toBeTruthy();
        }
        expect(p.locale).toBe(locale);
      }
    });
  }

  it("has unique slugs within a locale", () => {
    const slugs = getAllPosts("en").map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("getPost", () => {
  it("returns the requested post, or null when missing", () => {
    const first = getAllPosts("en")[0];
    expect(getPost(first.slug, "en")?.slug).toBe(first.slug);
    expect(getPost("does-not-exist", "en")).toBeNull();
  });
});

describe("getAdjacentPosts", () => {
  it("links neighbours consistently with the sorted list", () => {
    const posts = getAllPosts("en");
    if (posts.length < 2) return;
    const mid = Math.floor(posts.length / 2);
    const { prev, next } = getAdjacentPosts(posts[mid].slug, "en");
    // next = newer post (index − 1), prev = older post (index + 1).
    expect(next?.slug).toBe(posts[mid - 1].slug);
    expect(prev?.slug).toBe(posts[mid + 1]?.slug);
  });

  it("returns nulls for an unknown slug", () => {
    expect(getAdjacentPosts("does-not-exist", "en")).toEqual({
      prev: null,
      next: null,
    });
  });
});

describe("getPostLocales", () => {
  it("reports both locales for a fully translated post", () => {
    const first = getAllPosts("en")[0];
    const locales = getPostLocales(first.slug);
    expect(locales).toContain("es");
    expect(locales).toContain("en");
  });
});
