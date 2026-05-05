"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "../lib/i18n";

/**
 * Floating language toggle. Sits bottom-right, terminal-styled to match
 * the rest of the operator-console shell: hairline border, mono font,
 * cyan accent on the active locale, meta-gray on the alternative.
 *
 * Locale is derived from the pathname (`/en/...` → en, else → es) via
 * `usePathname()` so the chip stays reactive on client navigation. The
 * server-injected `x-locale` header informs the root layout's
 * `<html lang>` attr, but Next does NOT re-render shared layouts on
 * client-side Link navigation — so the chip can't trust a prop derived
 * from headers() and must derive locale itself.
 *
 * Clicking the alternative uses a regular `<a>` (not next/link Link)
 * so the navigation triggers a full document fetch — that re-runs the
 * server layout against the new URL, the proxy injects the right
 * x-locale, and `<html lang>` flips correctly. SPA navigation across
 * locales would leave lang/skip-link/RSS-link stuck on the previous
 * locale's values.
 *
 * Persists the choice in a `locale` cookie (1 year, SameSite=Lax). The
 * cookie is informational — proxy.ts intentionally does NOT redirect
 * based on it, so deep links keep working. A future opt-in middleware
 * could honor it on root visits.
 */
export function LocaleSwitcher() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Render the chip only after mount so SSR + hydration match cleanly.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Derive the active locale from the URL — the prop-from-layout path
  // is stale across client navigation. Pathname IS reactive.
  const locale: Locale = pathname.startsWith("/en/") || pathname === "/en" ? "en" : "es";
  const otherLocale: Locale = locale === "en" ? "es" : "en";

  // Build the equivalent URL in the alternative locale.
  //   /en/blog/foo  ↔  /blog/foo
  //   /en           ↔  /
  //   /             ↔  /en
  const otherHref = (() => {
    if (locale === "en") {
      const stripped = pathname.replace(/^\/en(?=\/|$)/, "");
      return stripped === "" ? "/" : stripped;
    }
    return pathname === "/" ? "/en" : `/en${pathname}`;
  })();

  const persistAndGo = () => {
    document.cookie = `locale=${otherLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    // Let the browser handle the navigation; the regular <a> below
    // takes over from here. Cookie writes are synchronous.
  };

  return (
    <div
      role="group"
      aria-label="Language"
      className="locale-switcher mono"
      data-mounted={mounted ? "true" : "false"}
      style={{
        position: "fixed",
        right: "max(20px, env(safe-area-inset-right))",
        bottom: "max(20px, env(safe-area-inset-bottom))",
        zIndex: 30,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        background: "rgba(6,6,10,.78)",
        border: "1px solid var(--hairline-strong)",
        borderRadius: "var(--r-tile)",
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
        fontSize: "var(--text-mono)",
        letterSpacing: "var(--ls-tag)",
        textTransform: "uppercase",
        boxShadow: "0 8px 24px rgba(0,0,0,.35), 0 0 0 1px rgba(0,212,255,.04)",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(8px)",
        transition: "opacity .35s ease-out, transform .35s ease-out",
      }}
    >
      <span
        aria-hidden
        style={{
          color: "var(--meta)",
          letterSpacing: 0,
          opacity: 0.55,
        }}
      >
        ::
      </span>
      <span
        aria-current="true"
        style={{
          color: "var(--cyan)",
          fontWeight: 600,
          textShadow: "0 0 12px rgba(0,212,255,.35)",
        }}
      >
        {locale}
      </span>
      <span
        aria-hidden
        style={{
          color: "var(--meta)",
          opacity: 0.45,
          letterSpacing: 0,
        }}
      >
        |
      </span>
      <a
        href={otherHref}
        onClick={persistAndGo}
        aria-label={`Switch to ${otherLocale}`}
        className="locale-switch-other"
        style={{
          color: "var(--meta)",
          textDecoration: "none",
          padding: "0 2px",
          transition: "color .18s ease-out, text-shadow .18s ease-out",
        }}
      >
        {otherLocale}
      </a>
      <span
        aria-hidden
        style={{
          color: "var(--meta)",
          letterSpacing: 0,
          opacity: 0.55,
        }}
      >
        ::
      </span>
    </div>
  );
}
