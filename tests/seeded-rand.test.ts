import { describe, it, expect } from "vitest";
import { createRand } from "../app/components/seeded-rand";

describe("createRand", () => {
  it("is deterministic for the same seed", () => {
    const a = createRand("cobos");
    const b = createRand("cobos");
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produces different streams for different seeds", () => {
    const a = createRand("alpha");
    const b = createRand("beta");
    expect(a()).not.toBe(b());
  });

  it("returns floats in [0, 1)", () => {
    const rand = createRand("range");
    for (let i = 0; i < 100; i++) {
      const n = rand();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it("advances the stream on each call", () => {
    const rand = createRand("advance");
    expect(rand()).not.toBe(rand());
  });
});
