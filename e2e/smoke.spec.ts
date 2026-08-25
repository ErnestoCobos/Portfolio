import { expect, test } from "@playwright/test";

test("home loads with title and h1", async ({ page }) => {
  const consoleErrors: { url: string; text: string }[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push({ url: msg.location().url, text: msg.text() });
    }
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/Ernesto Cobos/);
  await expect(page.locator("h1").first()).toBeVisible();

  // Vercel analytics beacons 404 outside production deployments — ignore.
  // The URL lives in msg.location(), not in the error text itself.
  const unexpected = consoleErrors.filter(
    (e) => !e.url.includes("_vercel") && !e.text.includes("_vercel")
  );
  expect(unexpected).toEqual([]);
});

test("no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  // Entry animations transiently exceed the viewport; wait for layout
  // to settle (fails via timeout if the overflow is permanent).
  await page.waitForFunction(
    () => {
      const el = document.scrollingElement;
      return !!el && el.scrollWidth <= window.innerWidth;
    },
    undefined,
    { timeout: 10_000 }
  );
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
    innerWidth: window.innerWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
});

test("work section has exactly 6 project cards", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-fs-path^="/work/"]')).toHaveCount(6);
});

test("/en home renders english h1 and /blog lists posts", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("h1").first()).toContainText("cloud_architect");

  await page.goto("/blog");
  await expect(page.locator("ul > li").first()).toBeVisible();
  expect(await page.locator("ul > li").count()).toBeGreaterThan(0);
});

test("locale switcher navigates /en to /", async ({ page }) => {
  await page.goto("/en");
  // The chip's decorative shell has pointer-events:none; the link itself
  // re-enables pointer-events:auto so a normal click lands on it.
  await page.click(".locale-switch-other");
  await page.waitForURL((url) => url.pathname === "/");
  expect(new URL(page.url()).pathname).toBe("/");
});

test("/now responds and renders an h1", async ({ page }) => {
  const res = await page.goto("/now");
  expect(res?.status()).toBe(200);
  const hasH1 = await page.evaluate(() => !!document.querySelector("h1"));
  expect(hasH1).toBe(true);
});

test("atmosphere layer exists and page still renders h1", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#atmosphere")).toBeAttached();
  await expect(page.locator("h1").first()).toBeVisible();
});

test("every section renders a chapter marker", async ({ page }) => {
  await page.goto("/");
  // Deviation from plan (expected 11): Testimonials returns null while
  // TESTIMONIALS is intentionally empty, so the live page has 10 sections.
  // Assert one marker per rendered section instead of a magic number.
  const sections = await page.locator("#main-scene section[id]").count();
  expect(sections).toBe(10);
  await expect(page.locator(".chapter-marker")).toHaveCount(sections);
});

test("kinetic marquees divide section groups", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".kinetic-marquee")).toHaveCount(3);
});

test("hero shows telemetry strip with placeholders before hydration", async ({ page }) => {
  await page.goto("/");
  const strip = page.locator("#telemetry-strip");
  await expect(strip).toBeAttached();
  // Network may be unavailable in CI — assert structure, not live values.
  await expect(strip.locator("span").first()).toBeVisible();
});

test("power rail lists every section as a node", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  // Deviation from plan (expected 11): Testimonials returns null while
  // TESTIMONIALS is intentionally empty → 10 sections → 10 rail nodes.
  const sections = await page.locator("#main-scene section[id]").count();
  expect(sections).toBe(10);
  await expect(page.locator(".power-rail-node")).toHaveCount(sections);
});
