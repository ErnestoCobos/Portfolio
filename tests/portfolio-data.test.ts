import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  PROFILE,
  STACK,
  PROJECTS,
  EXPERIENCE,
  CERTIFICATIONS,
  TRENDS,
  APPROACH,
  NAV,
  CATEGORY_META,
} from "../app/components/portfolio-data";

type Bi = { es: string; en: string };

/** Assert a `{ es, en }` field has both translations as non-empty strings. */
function expectBilingual(field: Bi, label: string) {
  expect(typeof field.es, `${label}.es should be a string`).toBe("string");
  expect(typeof field.en, `${label}.en should be a string`).toBe("string");
  expect(field.es.trim().length, `${label}.es is empty`).toBeGreaterThan(0);
  expect(field.en.trim().length, `${label}.en is empty`).toBeGreaterThan(0);
}

describe("PROFILE", () => {
  it("has the required identity + contact fields", () => {
    expect(PROFILE.name.trim().length).toBeGreaterThan(0);
    expect(PROFILE.email).toContain("@");
    expectBilingual(PROFILE.bio, "PROFILE.bio");
  });
});

describe("STACK", () => {
  it("every group has a name and at least one item", () => {
    for (const g of STACK) {
      expect(g.group.trim().length).toBeGreaterThan(0);
      expect(g.items.length).toBeGreaterThan(0);
      for (const item of g.items) expect(item.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("PROJECTS", () => {
  it("have unique slugs", () => {
    const slugs = PROJECTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("have complete bilingual copy and valid fields", () => {
    for (const p of PROJECTS) {
      expectBilingual(p.tag, `PROJECT ${p.slug} tag`);
      expectBilingual(p.blurb, `PROJECT ${p.slug} blurb`);
      expect(["cyan", "violet"]).toContain(p.accent);
      expect(p.href).toMatch(/^https:\/\//);
    }
  });
});

describe("EXPERIENCE", () => {
  it("every entry is fully bilingual", () => {
    EXPERIENCE.forEach((e, i) => {
      expectBilingual(e.y, `EXPERIENCE[${i}].y`);
      expectBilingual(e.role, `EXPERIENCE[${i}].role`);
      expectBilingual(e.co, `EXPERIENCE[${i}].co`);
      expectBilingual(e.note, `EXPERIENCE[${i}].note`);
    });
  });
});

describe("CERTIFICATIONS", () => {
  const vendors = ["cncf", "aws", "gcp", "azure", "hashicorp"];

  it("have unique slugs", () => {
    const slugs = CERTIFICATIONS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("have valid status, vendor, progress and bilingual copy", () => {
    for (const c of CERTIFICATIONS) {
      expect(["earned", "in-progress"]).toContain(c.status);
      expect(vendors).toContain(c.vendor);
      expectBilingual(c.name, `CERT ${c.slug} name`);
      expectBilingual(c.issuer, `CERT ${c.slug} issuer`);
      if (c.when) expectBilingual(c.when, `CERT ${c.slug} when`);
      if (c.note) expectBilingual(c.note, `CERT ${c.slug} note`);
      if (c.progress !== undefined) {
        expect(c.progress).toBeGreaterThanOrEqual(0);
        expect(c.progress).toBeLessThanOrEqual(100);
      }
      // An earned cert must carry a verify URL so the `hasCredential`
      // JSON-LD (RootShell) emits a real, verifiable credential.
      if (c.status === "earned") {
        expect(c.verifyUrl, `earned cert ${c.slug} needs a verifyUrl`).toBeTruthy();
      }
    }
  });
});

describe("TRENDS", () => {
  it("are fully bilingual", () => {
    TRENDS.forEach((t, i) => {
      expectBilingual(t.t, `TRENDS[${i}].t`);
      expectBilingual(t.d, `TRENDS[${i}].d`);
    });
  });
});

describe("APPROACH", () => {
  it("steps have order, command and bilingual copy", () => {
    APPROACH.forEach((s, i) => {
      expect(s.n.trim().length).toBeGreaterThan(0);
      expect(s.cmd.trim().length).toBeGreaterThan(0);
      expectBilingual(s.t, `APPROACH[${i}].t`);
      expectBilingual(s.d, `APPROACH[${i}].d`);
    });
  });
});

describe("CATEGORY_META", () => {
  it("every category maps to a label and a valid accent", () => {
    for (const [key, meta] of Object.entries(CATEGORY_META)) {
      expect(meta.label.length, key).toBeGreaterThan(0);
      expect(["cyan", "violet"]).toContain(meta.accent);
    }
  });
});

describe("NAV ↔ sections", () => {
  it("every nav id has a matching section anchor in Portfolio.tsx", () => {
    const src = readFileSync(
      path.join(process.cwd(), "app", "components", "Portfolio.tsx"),
      "utf8"
    );
    for (const item of NAV) {
      expect(item.id.trim().length).toBeGreaterThan(0);
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(src, `missing section with id="${item.id}"`).toContain(
        `id="${item.id}"`
      );
    }
  });

  it("nav ids are unique", () => {
    const ids = NAV.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
