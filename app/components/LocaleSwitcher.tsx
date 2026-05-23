"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getDictionary, type Locale } from "../lib/i18n";

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
  const [pulse, setPulse] = useState(false);

  // Render the chip only after mount so SSR + hydration match cleanly.
  // Also: fire a one-shot discovery pulse for visitors who haven't
  // chosen a locale yet (no `locale` cookie). Returning users who
  // already picked don't see it — they know the chip is there.
  useEffect(() => {
    setMounted(true);

    if (typeof document === "undefined") return;
    const hasCookie = /(?:^|;\s*)locale=/.test(document.cookie);
    if (hasCookie) return;

    // Delay the pulse slightly so it lands AFTER the entry fade-in,
    // not concurrent — gives the eye time to settle on content first.
    const startT = window.setTimeout(() => setPulse(true), 1400);
    const stopT = window.setTimeout(() => setPulse(false), 1400 + 2400);
    return () => {
      window.clearTimeout(startT);
      window.clearTimeout(stopT);
    };
  }, []);

  // Derive the active locale from the URL — the prop-from-layout path
  // is stale across client navigation. Pathname IS reactive.
  const locale: Locale = pathname.startsWith("/en/") || pathname === "/en" ? "en" : "es";
  const otherLocale: Locale = locale === "en" ? "es" : "en";
  const t = getDictionary(locale).nav;

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
      aria-label={t.ariaLanguageGroup}
      className="locale-switcher mono"
      data-mounted={mounted ? "true" : "false"}
      data-pulse={pulse ? "true" : "false"}
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
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {/* Leading glowing dot — the same `● online` motif used in the nav
         *  status — makes the active locale unambiguous at a glance even
         *  before the eye registers the colour difference. */}
        <span
          aria-hidden
          className="dot"
          style={{
            background: "var(--cyan)",
            boxShadow: "0 0 8px var(--cyan-glow)",
          }}
        />
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
        aria-label={t.ariaSwitchTo(otherLocale)}
        className="locale-switch-other"
        style={{
          color: "var(--meta)",
          textDecoration: "none",
          // Padding sized so the entire glyph + breathing room is the
          // hit area — meets WCAG 2.1 AAA touch-target (44×44 effective
          // when combined with the chip's outer padding) without making
          // the chip visually heavier.
          padding: "10px 12px",
          margin: "-10px -8px",
          borderRadius: "var(--r-tile)",
          transition: "color .18s ease-out, text-shadow .18s ease-out, background .18s ease-out",
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
