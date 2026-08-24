import { NextRequest, NextResponse } from "next/server";

/**
 * Cookie-based locale redirect on bare root paths only.
 *
 * Returning visitors who picked EN previously type `cobos.io` and want
 * to land on `/en` directly — this honors that. Symmetric for `/en` →
 * `/` when their cookie is `es`.
 *
 * Deep links (`/blog/<slug>`, `/en/blog/<slug>`, etc.) are never
 * touched: shared/bookmarked URLs always serve the exact requested
 * locale, and the floating LocaleSwitcher chip handles the toggle.
 *
 * Why bare-root only:
 *   - SEO: crawlers don't send cookies, always see canonical URLs.
 *   - Deep-link safety: a friend in Madrid sharing /blog/finops-dashboard
 *     with a friend in Berlin (cookie=en) — Berlin lands on the ES post
 *     they were sent.
 *
 * NOTE: this proxy used to also inject an `x-locale` header for the
 * root layout to read via `headers()`. Removed when route groups gave
 * each locale its own root layout with hardcoded `lang` — the layout
 * no longer needs runtime-derived locale, and removing `headers()`
 * unlocked full static SSG for every page.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";

  // start.cobos.io → /start subtree. Host-based rewrite (not redirect) so
  // the URL stays clean. Matched paths on that host serve the start page;
  // on the main host this branch never fires. Local testing: /start works
  // directly on localhost without any host trickery.
  if (host.startsWith("start.")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/" ? "/start" : `/start${pathname}`;
    return NextResponse.rewrite(url);
  }

  const cookieLocale = req.cookies.get("locale")?.value;

  if (pathname === "/" && cookieLocale === "en") {
    const url = req.nextUrl.clone();
    url.pathname = "/en";
    return NextResponse.redirect(url, 307);
  }
  if (pathname === "/en" && cookieLocale === "es") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next();
}

export const config = {
  // Only run on the paths that need logic: the two locale-redirect paths,
  // plus every start-host entry point (the start page is a single screen,
  // so "/" covers it; "/start" stays reachable directly for local dev).
  // Skipping everything else means proxy adds zero latency to /blog,
  // /en/blog, RSS, sitemap, etc.
  matcher: ["/", "/en", "/start"],
};
