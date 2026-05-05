"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "../lib/i18n";

/**
 * Floating language toggle. Sits bottom-right, terminal-styled to match
 * the rest of the operator-console shell: hairline border, mono font,
 * cyan accent on the active locale, meta-gray on the alternative.
 *
 * Clicking the alternative navigates to the equivalent URL in the other
 * locale (preserves the path; hashes are dropped — `usePathname` doesn't
 * expose them and we don't need them for the home anchors anyway).
 *
 * Persists the choice in a `locale` cookie (1 year, SameSite=Lax). The
 * cookie is informational — proxy.ts is intentionally NOT redirecting
 * based on it, so deep links keep working. A future opt-in middleware
 * could honor it on root visits.
 *
 * Locale comes in as a prop (resolved at the layout level from the
 * x-locale header set by proxy.ts) so this component doesn't require
 * a LocaleProvider wrapper — works on every route, including the
 * blog article pages that render fully on the server.
 */
export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Render the chip only after mount so SSR + hydration match cleanly.
  // The body of the page is the priority above-the-fold; a 200ms-delayed
  // entry doesn't affect anyone but lines up nicely with the hero
  // typewriter cursor settling.
  useEffect(() => {
    setMounted(true);
  }, []);

  const otherLocale = locale === "en" ? "es" : "en";
  // Build the equivalent URL in the alternative locale.
  // /en/blog/foo  ↔  /blog/foo
  // /en           ↔  /
  // /             ↔  /en
  const otherHref = (() => {
    if (locale === "en") {
      const stripped = pathname.replace(/^\/en(?=\/|$)/, "");
      return stripped === "" ? "/" : stripped;
    }
    return pathname === "/" ? "/en" : `/en${pathname}`;
  })();

  const persistAndGo = () => {
    document.cookie = `locale=${otherLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
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
      <Link
        href={otherHref}
        onClick={persistAndGo}
        prefetch={false}
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
      </Link>
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
