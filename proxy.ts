import { NextRequest, NextResponse } from "next/server";

/**
 * Inject a per-request `x-locale` header so the root layout can render
 * the correct `<html lang>` value without each route having to thread
 * locale through. Detection is purely path-based: `/en` prefix → en;
 * everything else → es (default).
 *
 * Notes:
 *   - The header lives on the *request* the rendering server sees
 *     (NextResponse.next forwards a clone with the header set), and is
 *     read in app/layout.tsx via headers().
 *   - Static / file / API routes are skipped — they don't render the
 *     root layout and don't care about lang.
 *   - This intentionally does NOT redirect based on Accept-Language.
 *     Auto-redirect breaks deep links and tanks SEO; the user picks
 *     a locale via the switcher (E4) and we persist it via cookie.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
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
