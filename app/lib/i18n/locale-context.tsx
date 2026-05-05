"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getDictionary } from "./index";
import type { Dictionary, Locale } from "./shape";

type LocaleContextValue = {
  locale: Locale;
  dict: Dictionary;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Provider for client subtrees that need locale-aware content. Server
 * pages render this with the locale resolved from URL/cookie/header,
 * then any nested client component reads it via `useT()` / `useLocale()`.
 *
 * The dict is cached by locale in `getDictionary` so passing `locale`
 * alone (instead of pre-resolving the dict) is fine — the provider does
 * the lookup once on mount.
 */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const dict = getDictionary(locale);
  return (
    <LocaleContext.Provider value={{ locale, dict }}>
      {children}
    </LocaleContext.Provider>
  );
}

/** Read the entire dictionary in a client component. Throws in dev if
 * called outside a LocaleProvider — that's a bug in composition, not a
 * recoverable runtime state. */
export function useT(): Dictionary {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error(
      "useT() called outside <LocaleProvider>. Wrap the client subtree in a provider with the resolved locale."
    );
  }
  return ctx.dict;
}

/** Read just the active locale code. Useful for building localized
 * URLs (`localePath(useLocale(), '/blog')`). */
export function useLocale(): Locale {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale() called outside <LocaleProvider>.");
  }
  return ctx.locale;
}
