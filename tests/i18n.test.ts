import { describe, it, expect } from "vitest";
import {
  getDictionary,
  resolveLocale,
  localePath,
  parseLocaleFromPath,
  DEFAULT_LOCALE,
  LOCALES,
} from "../app/lib/i18n";

/** Recursively collect dotted key paths from a nested plain object so two
 * dictionaries can be compared for structural parity. */
function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const next = prefix ? `${prefix}.${k}` : k;
    out.push(...keyPaths(v, next));
  }
  return out.sort();
}

describe("getDictionary", () => {
  it("returns an object for every known locale", () => {
    for (const loc of LOCALES) {
      expect(getDictionary(loc)).toBeTypeOf("object");
    }
  });

  it("falls back to the default locale for unknown / missing input", () => {
    expect(getDictionary(undefined)).toBe(getDictionary(DEFAULT_LOCALE));
    expect(getDictionary("xx")).toBe(getDictionary(DEFAULT_LOCALE));
  });

  it("keeps es and en dictionaries structurally identical (no missing keys)", () => {
    expect(keyPaths(getDictionary("en"))).toEqual(keyPaths(getDictionary("es")));
  });
});

describe("localePath", () => {
  it("maps the default locale to unprefixed URLs", () => {
    expect(localePath("es", "/")).toBe("/");
    expect(localePath("es", "/blog")).toBe("/blog");
  });
  it("prefixes EN URLs with /en", () => {
    expect(localePath("en", "/")).toBe("/en");
    expect(localePath("en", "/blog")).toBe("/en/blog");
  });
});

describe("parseLocaleFromPath", () => {
  it("extracts the EN locale and strips its prefix", () => {
    expect(parseLocaleFromPath("/en/blog")).toEqual({
      locale: "en",
      pathWithoutLocale: "/blog",
    });
    expect(parseLocaleFromPath("/en")).toEqual({
      locale: "en",
      pathWithoutLocale: "/",
    });
  });
  it("treats unprefixed paths as the default locale", () => {
    expect(parseLocaleFromPath("/blog")).toEqual({
      locale: "es",
      pathWithoutLocale: "/blog",
    });
  });
});

describe("resolveLocale", () => {
  it("normalizes arbitrary input to a known locale", () => {
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("es")).toBe("es");
    expect(resolveLocale("fr")).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
  });
});
