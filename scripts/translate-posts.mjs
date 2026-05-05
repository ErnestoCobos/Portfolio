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
 * Concurrency: posts that need translation run IN PARALLEL via
 * Promise.allSettled — the LLM API tolerates concurrent calls fine,
 * and at 4 posts × ~120s/post serial would be ~8 min vs ~2 min
 * parallel. Cached/overridden/skipped posts return immediately, so
 * the parallelism only kicks in for actual API calls. Concurrency cap
 * (TRANSLATOR_CONCURRENCY env, default 6) gates per-host load if the
 * corpus grows large enough to matter.
 *
 * The cache file `content/blog/.translator-cache.json` is committed
 * to git so Vercel builds skip the API entirely on unchanged posts.
 *
 * Failure mode: API errors mark the post as failed but the run
 * continues for the remaining posts. Process exits 1 if any failed.
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

const CONCURRENCY = Math.max(
  1,
  Number.parseInt(process.env.TRANSLATOR_CONCURRENCY ?? "6", 10) || 6
);

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

/**
 * Per-slug planning: figure out what to do with each post BEFORE
 * touching the network. Returns one of:
 *   { kind: "skip" }                       — no en.md
 *   { kind: "override", esPath, override } — copy override
 *   { kind: "cached", slug }                — hash matches, no work
 *   { kind: "translate", slug, enPath, esPath, enText, model }
 *   { kind: "configError", slug, model }    — bad translator value
 */
function planSlug(slug, cache) {
  const slugPath = path.join(BLOG_DIR, slug);
  const slugStat = statSync(slugPath);
  if (!slugStat.isDirectory()) return { kind: "skip" };

  const enPath = path.join(slugPath, "en.md");
  const esPath = path.join(slugPath, "es.md");
  const overridePath = path.join(slugPath, "es.override.md");

  if (!existsSync(enPath)) return { kind: "skip" };

  if (existsSync(overridePath)) {
    return {
      kind: "override",
      slug,
      esPath,
      overrideContent: readFileSync(overridePath, "utf8"),
    };
  }

  const enText = readFileSync(enPath, "utf8");
  const { data: fm } = parseFrontmatter(enText);
  const model = fm.translator || DEFAULT_MODEL;

  if (!PROVIDERS[model]) {
    return { kind: "configError", slug, model };
  }

  const fresh = !shouldRetranslate(slug, enText, model, cache);
  if (fresh && existsSync(esPath)) {
    return { kind: "cached", slug };
  }

  return { kind: "translate", slug, enPath, esPath, enText, model };
}

/** Run an async worker over an array with a concurrency cap. */
async function pMapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      try {
        results[i] = { ok: true, value: await worker(items[i], i) };
      } catch (err) {
        results[i] = { ok: false, err };
      }
    }
  });
  await Promise.all(runners);
  return results;
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

  // Phase 1: plan every slug synchronously. Cheap I/O + cache lookup.
  const plans = [];
  for (const slug of readdirSync(BLOG_DIR)) {
    if (slug.startsWith(".")) continue;
    const plan = planSlug(slug, cache);
    if (plan.kind === "skip") continue;
    stats.total++;
    plans.push(plan);
  }

  // Phase 2: handle the cheap cases inline (overrides + cached + config
  // errors), so the parallel worker pool only does network calls.
  const toTranslate = [];
  for (const plan of plans) {
    if (plan.kind === "override") {
      writeFileSync(plan.esPath, plan.overrideContent);
      stats.overridden++;
      console.log(`[translate] ${plan.slug}: using es.override.md (manual)`);
    } else if (plan.kind === "cached") {
      stats.cached++;
    } else if (plan.kind === "configError") {
      console.error(
        `[translate] ${plan.slug}: unknown translator "${plan.model}". Allowed: ${Object.keys(PROVIDERS).join(", ")}`
      );
      stats.failed++;
    } else if (plan.kind === "translate") {
      toTranslate.push(plan);
    }
  }

  // Phase 3: parallel API calls for the slugs that actually need work.
  if (toTranslate.length > 0) {
    const concurrency = Math.min(CONCURRENCY, toTranslate.length);
    console.log(
      `[translate] ${toTranslate.length} post(s) need translation; running ${concurrency}-way parallel`
    );
    const startedAt = Date.now();

    await pMapLimit(toTranslate, concurrency, async (plan) => {
      const { slug, enPath, esPath, enText, model } = plan;
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
          `[translate]   ${slug}: ${usage.input} in + ${usage.output} out tokens, ${fmtCost(cost)}`
        );
      } catch (err) {
        // Resiliency: if es.md already exists, the build can still
        // succeed with stale ES content. We warn loudly but don't fail.
        // Lets a Vercel build without the API key set still ship.
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
      // Avoid swallowing in pMapLimit — we already classified to stats.
      enPath; // silence unused-var lint when imports change
    });

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`[translate] parallel batch finished in ${elapsed}s`);
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
