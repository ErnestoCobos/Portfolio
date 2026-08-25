import { expect, test } from "@playwright/test";

/**
 * SEO e2e (roadmap E3): the sitemap, JSON-LD blocks and canonical links
 * are consumed by crawlers, so a malformed entry silently costs ranking
 * instead of throwing in a browser console. These tests fetch/parse the
 * machine-facing surfaces directly.
 *
 * All checks are read-only GETs, hence idempotent across both projects
 * (Desktop/Mobile Chrome run the full suite 2x).
 *
 * The sitemap emits absolute production URLs (https://cobos.io/...) but
 * the suite runs against the local webServer, so every <loc> is mapped
 * back to its pathname before fetching.
 */

const SITEMAP_URL_LIMIT = 30;

/** Fetch a site-relative path via Playwright's baseURL-bound request context. */
async function getLocal(request: import("@playwright/test").APIRequestContext, path: string) {
  const res = await request.get(path);
  return { status: res.status(), body: await res.text() };
}

/**
 * Zero-dependency XML extraction: <loc> values are plain URLs with no
 * nesting or attributes, so a regex parse is sufficient — adding an XML
 * parser would violate the no-new-deps constraint for one tag type.
 */
function extractSitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

test("sitemap.xml lists URLs that all respond 200", async ({ request }) => {
  const { status, body } = await getLocal(request, "/sitemap.xml");
  expect(status).toBe(200);

  const locs = extractSitemapLocs(body);
  // An empty sitemap means the generator broke silently — that is worse
  // than a missing file, since crawlers keep the stale cache.
  expect(locs.length).toBeGreaterThan(0);
  // Cap the crawl: this is a smoke check for 200s, not a full audit,
  // and the suite runs twice (one per project).
  for (const loc of locs.slice(0, SITEMAP_URL_LIMIT)) {
    // Strip the production origin; query/hash never appear in sitemap URLs.
    const localPath = new URL(loc).pathname;
    const res = await request.get(localPath);
    // Fail with the offending URL in the message, not just a bare status.
    expect(res.status(), `sitemap loc ${loc}`).toBe(200);
  }
});

for (const homePath of ["/", "/en"]) {
  test(`JSON-LD blocks on ${homePath} are valid JSON`, async ({ page }) => {
    await page.goto(homePath);
    const rawBlocks = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll('script[type="application/ld+json"]')
      ).map((s) => s.textContent ?? "")
    );
    // A locale homepage without any structured data is itself an SEO
    // regression (C1/C2 add FAQPage/Service schema here).
    expect(rawBlocks.length).toBeGreaterThan(0);
    for (const raw of rawBlocks) {
      // JSON.parse throws on trailing commas, HTML-escaped entities left
      // unescaped, etc. — exactly what we want this test to catch.
      expect(() => JSON.parse(raw)).not.toThrow();
    }
  });
}

test("canonical link is present, absolute and unique on key pages", async ({
  page,
  request,
}) => {
  // Pick the blog post from the sitemap rather than scraping /blog DOM:
  // post slugs change with content, the sitemap is the canonical source.
  const sitemap = await getLocal(request, "/sitemap.xml");
  const postLoc = extractSitemapLocs(sitemap.body)
    .filter((loc) => /\/blog\/[^/]+$/.test(new URL(loc).pathname))
    .sort()[0];
  expect(postLoc).toBeTruthy();
  const postPath = new URL(postLoc!).pathname;

  for (const path of ["/", "/en", "/blog", postPath]) {
    await page.goto(path);
    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('link[rel="canonical"]')).map(
        (el) => (el as HTMLLinkElement).href
      )
    );
    // Exactly one canonical: duplicates make Google pick arbitrarily
    // between them, defeating the purpose of declaring it.
    expect(hrefs.length, `canonical count on ${path}`).toBe(1);
    // Must be absolute (scheme + host) or crawlers resolve it against
    // whatever URL they crawled with, splitting signals across variants.
    expect(hrefs[0]).toMatch(/^https?:\/\//);
  }
});

for (const llmsPath of ["/llms.txt", "/en/llms.txt"]) {
  test(`llms.txt at ${llmsPath} responds and mentions the site`, async ({
    request,
  }) => {
    const { status, body } = await getLocal(request, llmsPath);
    expect(status).toBe(200);
    // 'cobos' proves the route serves real content and not an empty
    // shell or a fallback HTML error page rendered as text/plain.
    expect(body).toContain("cobos");
  });
}
