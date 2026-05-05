import { NextRequest, NextResponse } from "next/server";

/**
 * Two responsibilities:
 *
 *   1. Inject a per-request `x-locale` header so the root layout can
 *      render the correct `<html lang>` value without each route having
 *      to thread locale through.
 *
 *   2. Honor the `locale` cookie set by the LocaleSwitcher chip — but
 *      ONLY on the bare root paths `/` and `/en`. Deep links (e.g.
 *      `/blog/foo`, `/en/blog/foo`) always serve the exact requested
 *      URL so shared/bookmarked links land where the sender intended.
 *
 * Why bare-root only:
 *   - SEO: crawlers don't send cookies, so they always see the canonical
 *     URL they crawled — hreflang signals stay consistent.
 *   - Deep-link safety: a friend in Madrid sharing /blog/finops-dashboard
 *     with a friend in Berlin (cookie=en) — the Berlin friend sees the
 *     ES post, exactly what was shared. They can switch via the chip.
 *   - Returning visitor convenience: someone who picked EN previously
 *     types `cobos.io` → cookie=en → 307 → /en. No friction.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Cookie-based redirect on bare root paths only.
  // 307 (Temporary Redirect) preserves method + signals to crawlers
  // that this is a per-user routing decision, not a permanent move.
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

  // Locale header injection (existing behavior).
  const locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "es";

  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-locale", locale);
  reqHeaders.set("x-pathname", pathname);

  return NextResponse.next({ request: { headers: reqHeaders } });
}

export const config = {
  // Skip Next internals, static assets, and API routes — they don't
  // render the root layout. The negative lookahead matches everything
  // except those paths.
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
