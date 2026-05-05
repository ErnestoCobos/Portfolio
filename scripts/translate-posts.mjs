#!/usr/bin/env node
/**
 * Build-time EN→ES translation pipeline.
 *
 * Workflow per blog post:
 *  1. If `content/blog/<slug>/en.md` is missing → skip.
 *  2. If `content/blog/<slug>/es.override.md` exists → copy it as es.md
 *     (manual escape hatch, no LLM involved).
 *  3. Otherwise read the EN frontmatter for an optional `translator:`
 *     model override; default to PROVIDERS DEFAULT_MODEL (V4 Pro).
 *  4. If the (slug, model, hash(en.md)) triple matches the cache and
 *     es.md exists on disk → skip (no API call).
 *  5. Else call the LLM, write es.md, update the cache.
 *
 * The script is idempotent: a clean run translates 0 posts when nothing
 * has changed since the last successful run.
 *
 * Cost reporting: prints per-post and total token + dollar usage.
 *
 * Failure mode: API errors mark the post as failed but the run continues
 * for the remaining posts. Process exits 1 if any post failed.
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

// Auto-load .env.local before anything else, so provider configs see
// AI_GATEWAY_API_KEY without the user having to source the file or
// prefix the command. Mirrors the behavior Next.js gives the app at
// runtime. Silent if the file doesn't exist (Vercel uses OIDC).
{
  const envPath = path.resolve(".env.local");
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}

import {
  BLOG_DIR,
  DEFAULT_MODEL,
  PROVIDERS,
} from "../app/lib/translator/config.mjs";
import {
  hashContent,
  loadCache,
  saveCache,
  shouldRetranslate,
} from "../app/lib/translator/cache.mjs";
import { callProvider } from "../app/lib/translator/providers.mjs";

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {} };
  const data = {};
  for (const raw of m[1].split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data };
}

function fmtCost(usd) {
  if (usd >= 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(6)}`;
}

async function main() {
  if (!existsSync(BLOG_DIR)) {
    console.warn(
      `[translate] ${BLOG_DIR} does not exist — nothing to translate.`
    );
    return;
  }

  const cache = loadCache();
  const stats = {
    total: 0,
    cached: 0,
    overridden: 0,
    translated: 0,
    stale: 0,
    failed: 0,
    costUsd: 0,
    inputTokens: 0,
    outputTokens: 0,
  };

  for (const slug of readdirSync(BLOG_DIR)) {
    if (slug.startsWith(".")) continue;
    const slugPath = path.join(BLOG_DIR, slug);
    const slugStat = statSync(slugPath);
    if (!slugStat.isDirectory()) continue;

    const enPath = path.join(slugPath, "en.md");
    const esPath = path.join(slugPath, "es.md");
    const overridePath = path.join(slugPath, "es.override.md");

    if (!existsSync(enPath)) continue;
    stats.total++;

    if (existsSync(overridePath)) {
      writeFileSync(esPath, readFileSync(overridePath, "utf8"));
      stats.overridden++;
      console.log(`[translate] ${slug}: using es.override.md (manual)`);
      continue;
    }

    const enText = readFileSync(enPath, "utf8");
    const { data: fm } = parseFrontmatter(enText);
    const model = fm.translator || DEFAULT_MODEL;

    if (!PROVIDERS[model]) {
      console.error(
        `[translate] ${slug}: unknown translator "${model}". Allowed: ${Object.keys(PROVIDERS).join(", ")}`
      );
      stats.failed++;
      continue;
    }

    const fresh = !shouldRetranslate(slug, enText, model, cache);
    if (fresh && existsSync(esPath)) {
      stats.cached++;
      continue;
    }

    console.log(`[translate] ${slug} → ${model}`);
    try {
      const { text, usage } = await callProvider(model, enText);
      writeFileSync(esPath, text.endsWith("\n") ? text : text + "\n");
      cache[slug] = {
        hash: hashContent(enText, model),
        model,
        translatedAt: new Date().toISOString(),
        tokensUsed: usage,
      };
      const provider = PROVIDERS[model];
      const cost =
        (usage.input * provider.inputCostPerM +
          usage.output * provider.outputCostPerM) /
        1_000_000;
      stats.translated++;
      stats.costUsd += cost;
      stats.inputTokens += usage.input;
      stats.outputTokens += usage.output;
      console.log(
        `[translate]   ${usage.input} in + ${usage.output} out tokens, ${fmtCost(cost)}`
      );
    } catch (err) {
      // Resiliency: if es.md already exists, the build can still succeed
      // with stale ES content. We warn loudly but don't fail. This lets
      // a Vercel build without the API key set still ship — the previously
      // committed es.md is used. If es.md is missing, that's a hard fail.
      if (existsSync(esPath)) {
        stats.stale++;
        console.warn(
          `[translate] ${slug} WARN: ${err.message}. Falling back to existing es.md (may be stale).`
        );
      } else {
        stats.failed++;
        console.error(
          `[translate] ${slug} FAILED: ${err.message}. No es.md exists — cannot fall back.`
        );
      }
    }
  }

  saveCache(cache);

  const summary = [
    `${stats.cached} cached`,
    `${stats.overridden} override`,
    `${stats.translated} translated`,
  ];
  if (stats.stale > 0) summary.push(`${stats.stale} stale`);
  if (stats.failed > 0) summary.push(`${stats.failed} failed`);
  console.log(`[translate] done. ${summary.join(", ")}`);

  if (stats.translated > 0) {
    console.log(
      `[translate] usage: ${stats.inputTokens} in + ${stats.outputTokens} out tokens, ${fmtCost(stats.costUsd)}`
    );
  }

  // Hard fail only when a post has no es.md AND can't be translated.
  // Stale fallbacks are a warning, not a fail — keeps the build green
  // when the API key isn't set in CI for read-only deploys.
  if (stats.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(`[translate] fatal: ${err.message}`);
  process.exit(1);
});
