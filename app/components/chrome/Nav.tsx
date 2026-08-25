"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { NAV } from "../portfolio-data";
import { useLocale, useT } from "../../lib/i18n/locale-context";
import { trackEvent } from "../../lib/analytics";
import { CobosLogo, useMounted } from "../portfolio-visuals";

/** NAV ids that are real routes instead of on-page anchors. */
const ROUTES: Record<string, (locale: "es" | "en") => string> = {
  blog: (l) => (l === "en" ? "/en/blog" : "/blog"),
  now: (l) => (l === "en" ? "/en/now" : "/now"),
  /** B4 recruiter funnel — /cv exists per locale (app/(es)/cv, app/en/cv).
   * Kept out of NAV so the center chips don't grow; it gets its own dock
   * slot next to ./contact instead. */
  cv: (l) => (l === "en" ? "/en/cv" : "/cv"),
};

/* ─── Nav ────────────────────────────────────────────────── */
export function useActiveSection(): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const ids = NAV.map((n) => n.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-36px 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75] }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return active;
}

export function MobileMenu({
  active,
  onClose,
}: {
  active: string | null;
  onClose: () => void;
}) {
  const mounted = useMounted();
  const t = useT();
  const locale = useLocale();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handlePick = (id: string) => {
    onClose();
    window.setTimeout(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);
    }, 60);
  };

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(6,6,10,.96)",
        backdropFilter: "blur(18px) saturate(140%)",
        WebkitBackdropFilter: "blur(18px) saturate(140%)",
        display: "flex",
        flexDirection: "column",
        animation: "fadeIn .18s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: "16px 18px",
          borderBottom: "1px solid var(--hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: "var(--text-meta)",
            color: "var(--fg)",
            letterSpacing: "-0.01em",
          }}
        >
          cobos<span style={{ color: "var(--cyan)" }}>::</span>menu
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.nav.ariaCloseMenu}
          className="mono tap"
          style={{
            color: "var(--muted)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--r-tile)",
            padding: "6px 12px",
            fontSize: 12,
            background: "var(--surface-overlay)",
          }}
        >
          ESC ×
        </button>
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ padding: "20px 18px", flex: 1, overflowY: "auto" }}
      >
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--muted)",
            marginBottom: 8,
          }}
        >
          <span style={{ color: "var(--cyan)" }}>$</span> tree /
        </div>
        <div
          className="mono"
          style={{ fontSize: "var(--text-body-sm)", color: "var(--fg)", marginBottom: 8 }}
        >
          cobos.io/
        </div>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* B4: ./cv.pdf is appended after this list and closes the
           * tree, so no NAV item draws the final └── branch anymore. */}
          {NAV.map((n) => {
            const branch = "├──";
            const isActive = active === n.id;
            const linkStyle = {
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 8px",
              fontSize: 15,
              color: isActive ? "var(--cyan)" : "var(--fg)",
              background: isActive
                ? "var(--cyan-tint)"
                : "transparent",
              borderRadius: "var(--r-tile)",
            } as const;
            const href = ROUTES[n.id]?.(locale);
            if (href) {
              return (
                <li key={n.id}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className="mono tap"
                    style={linkStyle}
                  >
                    <span style={{ color: "var(--muted)", fontSize: 13 }}>
                      {branch}
                    </span>
                    <span
                      style={{
                        color: isActive ? "var(--cyan)" : "var(--muted)",
                      }}
                    >
                      /
                    </span>
                    <span>{n.label.toLowerCase()}</span>
                    {isActive && (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: "var(--text-mono)",
                          color: "var(--cyan)",
                        }}
                      >
                        {t.nav.menuActiveHere}
                      </span>
                    )}
                  </Link>
                </li>
              );
            }
            return (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePick(n.id);
                  }}
                  className="mono tap"
                  style={linkStyle}
                >
                  <span
                    style={{
                      color: "var(--muted)",
                      fontSize: "var(--text-meta)",
                    }}
                  >
                    {branch}
                  </span>
                  <span style={{ color: isActive ? "var(--cyan)" : "var(--muted)" }}>
                    /
                  </span>
                  <span>{n.label.toLowerCase()}</span>
                  {isActive && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "var(--text-mono)",
                        color: "var(--cyan)",
                      }}
                    >
                      {t.nav.menuActiveHere}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
          {/* B4: CV closes the tree — visible route, not an anchor. */}
          <li>
            <Link
              href={ROUTES.cv?.(locale) ?? "/cv"}
              onClick={onClose}
              className="mono tap"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 8px",
                fontSize: 15,
                color: "var(--fg)",
                borderRadius: "var(--r-tile)",
              }}
            >
              <span style={{ color: "var(--muted)", fontSize: "var(--text-meta)" }}>
                └──
              </span>
              <span style={{ color: "var(--muted)" }}>/</span>
              <span>{t.nav.cvLink.replace(/^\.\//, "")}</span>
            </Link>
          </li>
        </ul>
        <div
          className="mono"
          style={{
            marginTop: 24,
            fontSize: "var(--text-mono)",
            color: "var(--muted)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span>{t.nav.menuEntries(NAV.length)}</span>
          {/* Locale chip — mirrors the desktop dock chip so phones aren't the
           *  only viewport without a persistent language indicator. The
           *  floating switcher still handles the toggle. */}
          <span
            aria-label={`current locale ${locale}`}
            style={{
              color: "var(--cyan)",
              padding: "2px 7px",
              border: "1px solid rgba(0,212,255,.22)",
              background: "var(--cyan-tint-soft)",
              borderRadius: 4,
              fontSize: "var(--text-mono-xs)",
              letterSpacing: "var(--ls-tag)",
              textTransform: "uppercase",
            }}
          >
            lang: {locale}
          </span>
          <span style={{ color: "var(--cyan)" }}>● {t.nav.online}</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Reading-progress hairline pinned to the bottom edge of the nav dock.
 * Writes scaleX directly to the node from a rAF-coalesced passive scroll
 * listener — zero React re-renders while scrolling. */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const el = barRef.current;
      if (!el) return;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      el.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div
      ref={barRef}
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -1,
        height: 2,
        background: "linear-gradient(90deg, var(--cyan), var(--violet))",
        transformOrigin: "0 50%",
        transform: "scaleX(0)",
        zIndex: 1,
        pointerEvents: "none",
      }}
    />
  );
}

/**
 * tmux-style status dock: fixed at the bottom of the viewport, ~36px tall,
 * always visible. Left segment shows the active section as a path indicator
 * (cobos:: > /work), center holds the navigation chips, right shows status
 * (online · ./contact). Mobile collapses to logo + path + ≡ trigger.
 */
export function Nav({ mobile }: { mobile: boolean }) {
  const t = useT();
  const locale = useLocale();
  const active = useActiveSection();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeLabel =
    NAV.find((n) => n.id === active)?.label.toLowerCase() ?? "/";
  const blogHref = locale === "en" ? "/en/blog" : "/blog";

  return (
    <>
      <div
        role="navigation"
        aria-label={t.nav.ariaSections}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          height: 36,
          padding: mobile ? "0 10px" : "0 14px",
          display: "flex",
          alignItems: "center",
          gap: mobile ? 8 : 14,
          background: "rgba(6,6,10,.85)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderTop: "1px solid var(--hairline-strong)",
          borderBottom: "1px solid var(--hairline-strong)",
          boxShadow: "0 8px 24px rgba(0,0,0,.45)",
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "var(--text-mono)",
        }}
      >
        {/* LEFT: logo + active-path */}
        <a
          href="#top"
          aria-label={t.nav.ariaBackToTop}
          className="tap"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 4,
            padding: "4px 8px 4px 4px",
            background: "var(--cyan-tint-soft)",
            border: "1px solid rgba(0,212,255,.22)",
            color: "var(--fg)",
            flexShrink: 0,
          }}
        >
          <span style={{ width: 16, height: 16, display: "block" }}>
            <CobosLogo />
          </span>
          <span
            style={{
              fontSize: "var(--text-mono)",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            cobos<span style={{ color: "var(--cyan)" }}>::</span>
          </span>
        </a>

        {/* Active locale chip — always visible while scrolling so the
         *  language identity is never ambiguous, even before the eye
         *  notices the floating switcher. Desktop only; mobile relies on
         *  the floating switcher to avoid cramping the 36px dock. */}
        {!mobile && (
          <span
            className="mono"
            aria-label={`current locale ${locale}`}
            style={{
              fontSize: "var(--text-mono-xs)",
              letterSpacing: "var(--ls-tag)",
              textTransform: "uppercase",
              color: "var(--cyan)",
              padding: "3px 7px",
              border: "1px solid rgba(0,212,255,.22)",
              background: "var(--cyan-tint-soft)",
              borderRadius: 4,
              flexShrink: 0,
            }}
          >
            {locale}
          </span>
        )}

        {/* path indicator (active section) */}
        <span
          className="mono"
          style={{
            color: "var(--muted)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <span style={{ color: "var(--cyan)" }}>›</span>{" "}
          <span style={{ color: "var(--fg)" }}>/{activeLabel}</span>
        </span>

        {/* CENTER: chips (desktop only) */}
        {!mobile && (
          <nav
            style={{
              display: "flex",
              gap: 1,
              marginLeft: "auto",
              marginRight: "auto",
              alignItems: "center",
            }}
          >
            {NAV.map((n) => {
              const isActive = active === n.id;
              const chipStyle = {
                padding: "5px 10px",
                fontSize: "var(--text-mono)",
                color: isActive ? "var(--cyan)" : "var(--muted)",
                background: isActive ? "rgba(0,212,255,.10)" : "transparent",
                borderRadius: 4,
                cursor: "pointer",
              } as const;
              const href = ROUTES[n.id]?.(locale);
              if (href) {
                return (
                  <Link
                    key={n.id}
                    href={href}
                    data-magnetic
                    data-active={isActive ? "true" : undefined}
                    className="mono nav-chip"
                    style={chipStyle}
                  >
                    /{n.label.toLowerCase()}
                  </Link>
                );
              }
              return (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  data-magnetic
                  data-active={isActive ? "true" : undefined}
                  className="mono nav-chip"
                  style={chipStyle}
                >
                  /{n.label.toLowerCase()}
                </a>
              );
            })}
          </nav>
        )}

        {/* mobile spacer */}
        {mobile && <span style={{ flex: 1 }} />}

        {/* RIGHT: online + ./contact + (mobile) menu */}
        {!mobile && (
          <span
            style={{
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "var(--r-chip)",
                background: "var(--cyan)",
                boxShadow: "0 0 8px var(--cyan)",
              }}
            />
            {t.nav.online}
          </span>
        )}

        {/* B4: CV route link — recruiter funnel. Kept OUT of the center
         * chips (no new NAV entry → no dock crowding) and left of
         * ./contact so the commercial CTA keeps its edge position. */}
        {!mobile && (
          <Link
            href={ROUTES.cv?.(locale) ?? "/cv"}
            data-magnetic
            className="mono tap"
            onClick={() => trackEvent("cv_open")}
            style={{
              padding: "5px 10px",
              color: "var(--muted)",
              borderRadius: 4,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {t.nav.cvLink}
          </Link>
        )}

        <a
          href="#contact"
          className="mono tap"
          style={{
            padding: mobile ? "5px 10px" : "5px 12px",
            border: "1px solid var(--cyan)",
            color: "var(--cyan)",
            borderRadius: 4,
            background: "var(--cyan-tint)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            fontSize: "var(--text-mono)",
          }}
        >
          {t.nav.contactCta}
        </a>

        {mobile && (
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t.nav.ariaOpenMenu}
            aria-expanded={menuOpen}
            className="mono tap"
            style={{
              width: 32,
              height: 26,
              padding: 0,
              border: "1px solid var(--hairline-strong)",
              color: "var(--fg)",
              borderRadius: 4,
              background: "rgba(255,255,255,.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <span aria-hidden style={{ fontSize: "var(--text-body-sm)", lineHeight: 1 }}>
              ≡
            </span>
          </button>
        )}
        <ScrollProgress />
      </div>
      {mobile && menuOpen && (
        <MobileMenu active={active} onClose={() => setMenuOpen(false)} />
      )}
    </>
  );
}
