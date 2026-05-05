import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { CACHE_FILE } from "./config.mjs";

/**
 * Hash-based translation cache. Stored at content/blog/.translator-cache.json
 * (gitignored). Key = post slug. Value = { hash, model, translatedAt, tokensUsed }.
 *
 * The hash combines the EN source text AND the model name, so changing
 * either invalidates the cache and triggers a retranslation. This means
 * switching from Flash to Pro for a post will retranslate, even if the
 * EN text is unchanged — the right behavior since output will differ.
 */
export function loadCache() {
  if (!existsSync(CACHE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
}

export function saveCache(cache) {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2) + "\n");
}

export function hashContent(text, model) {
  return createHash("sha256").update(`${model}::${text}`).digest("hex");
}

export function shouldRetranslate(slug, enText, model, cache) {
  const expected = hashContent(enText, model);
  return cache[slug]?.hash !== expected;
}
