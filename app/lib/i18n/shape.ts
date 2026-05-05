import { es } from "./es";

/** Supported locales. ES is the default (root URLs); EN lives under
 * `/en/...`. Adding a 3rd locale = add the literal here, create the
 * matching `<code>.ts` dictionary, and register it in `index.ts`. */
export type Locale = "es" | "en";

/** Dictionary shape derived from the Spanish dict so it stays in sync
 * automatically. Adding a key to `es.ts` makes it required in every
 * other locale (TS error). */
export type Dictionary = typeof es;

export const DEFAULT_LOCALE: Locale = "es";
export const LOCALES: Locale[] = ["es", "en"];

/** Locale codes accepted in URL segments. Keep in sync with the
 * `app/(i18n)/[locale]/` rewrite rules. */
export const LOCALE_PATH_PREFIX: Record<Locale, string> = {
  es: "", // ES lives at the root
  en: "/en",
};
