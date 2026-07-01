"use client";

import { useEffect, useState } from "react";

/**
 * Floating dark/light toggle, top-right. The site is dark-first: light is
 * strictly opt-in (we never auto-follow the OS preference), so the brand's
 * default first impression stays the operator-console dark. The choice
 * persists in localStorage; the no-flash script in RootHead applies it before
 * paint so there's no flash-of-wrong-theme on reload.
 */
export function ThemeToggle({ label }: { label: string }) {
  // SSR + first client render assume dark (matches the no-flash default);
  // the effect reconciles with the actual attribute after mount.
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      if (next === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      localStorage.setItem("theme", next);
    } catch {
      /* private mode / storage disabled — toggle still works for the session */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={theme === "light"}
      className="theme-toggle mono"
      style={{
        position: "fixed",
        top: "max(16px, env(safe-area-inset-top))",
        right: "max(16px, env(safe-area-inset-right))",
        zIndex: 30,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: "var(--r-chip)",
        background: "var(--panel-glass)",
        border: "1px solid var(--hairline-strong)",
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
        color: "var(--cyan)",
        fontSize: 15,
        lineHeight: 1,
        boxShadow: "0 8px 24px rgba(0,0,0,.35)",
      }}
    >
      <span aria-hidden>{theme === "light" ? "☀" : "☾"}</span>
    </button>
  );
}
