import { test, expect } from "@playwright/test";

// WebGL-disabled fallback: the atmosphere layer must degrade to the CSS
// gradient (.atmosphere-fallback) and the page must stay intact.
test.use({ launchOptions: { args: ["--disable-webgl"] } });

test("webgl disabled: atmosphere-fallback renders, page intact", async ({
  page,
}) => {
  // Guard: this spec is only meaningful when WebGL is really off.
  const webglAvailable = await page.evaluate(() => {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl");
  });
  test.skip(webglAvailable, "WebGL context still available despite flag");

  await page.goto("/");
  const fallback = page.locator(".atmosphere-fallback#atmosphere");
  await expect(fallback).toBeAttached();
  await expect(page.locator("h1").first()).toBeVisible();
});
