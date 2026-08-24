"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

/** Terminal-prompt search box. Enter sends the query to Google. `/` from
 * anywhere on the page refocuses the input — start-page muscle memory. */
export function StartSearch() {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  };

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="start-search-line"
      style={{ width: "100%" }}
    >
      <label
        htmlFor="start-search"
        className="mono"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          fontSize: 15,
        }}
      >
        <span style={{ color: "var(--cyan)", flexShrink: 0 }}>$ search</span>
        <input
          id="start-search"
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="buscar…"
          aria-label="Buscar en Google"
          className="mono"
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--fg)",
            fontSize: 15,
            caretColor: "var(--cyan)",
            padding: "4px 0",
          }}
        />
        <span
          aria-hidden
          className="mono start-hint"
          style={{ color: "var(--meta)", fontSize: 12, flexShrink: 0 }}
        >
          ⏎ google
        </span>
      </label>
    </form>
  );
}
