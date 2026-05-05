import { en } from "./en";
import { es } from "./es";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_PATH_PREFIX,
  type Dictionary,
  type Locale,
} from "./shape";

const DICTS: Record<Locale, Dictionary> = { es, en };

/** Resolve a dictionary by locale. Falls back to the default if an
 * unknown string sneaks past the type system (e.g., third-party crawler
 * sends a bogus header). Server- and client-safe. */
export function getDictionary(locale: Locale | string | undefined): Dictionary {
  if (locale && (LOCALES as string[]).includes(locale)) {
    return DICTS[locale as Locale];
  }
  return DICTS[DEFAULT_LOCALE];
}

/** Normalize an arbitrary value to a known Locale (or default). */
export function resolveLocale(input: string | undefined): Locale {
  return input && (LOCALES as string[]).includes(input)
    ? (input as Locale)
    : DEFAULT_LOCALE;
}

/** Build a localized URL. Pass a path that starts with `/` (without any
 * locale prefix). Returns `/<path>` for the default locale and
 * `/<locale>/<path>` for the rest. Empty/root path returns the locale
 * root. */
export function localePath(locale: Locale, path = "/"): string {
  const prefix = LOCALE_PATH_PREFIX[locale] ?? "";
  if (path === "/" || path === "") return prefix || "/";
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${prefix}${clean}`;
}

/** The opposite of `localePath`: extract a Locale from a request URL.
 * Returns `["en", "/blog"]` for `/en/blog`, `["es", "/blog"]` for
 * `/blog`, etc. Useful in middleware. */
export function parseLocaleFromPath(pathname: string): {
  locale: Locale;
  pathWithoutLocale: string;
} {
  for (const loc of LOCALES) {
    const prefix = LOCALE_PATH_PREFIX[loc];
    if (prefix && (pathname === prefix || pathname.startsWith(prefix + "/"))) {
      return {
        locale: loc,
        pathWithoutLocale: pathname.slice(prefix.length) || "/",
      };
    }
  }
  return { locale: DEFAULT_LOCALE, pathWithoutLocale: pathname };
}

export { DEFAULT_LOCALE, LOCALES, LOCALE_PATH_PREFIX };
export type { Dictionary, Locale };
