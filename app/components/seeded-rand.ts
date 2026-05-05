/**
 * Deterministic seeded PRNG. Same seed string → same number sequence on every
 * render and across server/client. Used for procedural visuals (BlogCover dot
 * fields, StackRadial item placement, TrendSparklines curves, etc.) so
 * patterns stay stable between renders without reaching for `Math.random`.
 *
 * Algorithms: xmur3 to derive a 32-bit seed from the input string, mulberry32
 * for the actual stream. Both are tiny (~10 LoC each), well-tested, and have
 * no dependencies. They're not cryptographic — only use them for visuals.
 */

/** xmur3 — string → 32-bit seed function. Returns a callable that, when
 * invoked, advances and returns the next seed integer. We use it once to
 * produce the initial seed for mulberry32. */
function xmur3(s: string) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

/** mulberry32 — fast, decent-quality 32-bit PRNG. Returns floats in [0, 1). */
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a deterministic random function seeded from any string identifier
 * (slug, name, etc.). Calling the returned function advances the stream. */
export function createRand(seed: string): () => number {
  const seedFn = xmur3(seed);
  return mulberry32(seedFn());
}
