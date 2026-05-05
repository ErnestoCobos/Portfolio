#!/usr/bin/env node
/**
 * Flip Notion pages from `Status = "Ready to publish"` →
 * `Status = "Published"` after a successful site sync + commit + push.
 *
 * Reads the list of `{ id, slug }` to flip from $PROCESSED env var
 * (a JSON string emitted by `fetch-notion.mjs` and forwarded by the
 * GHA workflow). This is the LAST step in the sync workflow — never
 * runs unless the commit was actually pushed.
 *
 * Idempotent: if a page is already `Published`, the update is a no-op
 * from Notion's side.
 *
 * Required env:
 *   NOTION_TOKEN — internal integration token (same one used by fetch)
 *   PROCESSED    — JSON array `[{ id, slug }, ...]`
 */
import { Client } from "@notionhq/client";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`[notion-mark] missing env var: ${name}`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const notion = new Client({ auth: requireEnv("NOTION_TOKEN") });
  let processed;
  try {
    processed = JSON.parse(process.env.PROCESSED || "[]");
  } catch (err) {
    console.error(`[notion-mark] bad PROCESSED JSON: ${err.message}`);
    process.exit(1);
  }

  if (processed.length === 0) {
    console.log("[notion-mark] nothing to mark — empty processed list");
    return;
  }

  let ok = 0;
  let fail = 0;
  for (const { id, slug } of processed) {
    try {
      await notion.pages.update({
        page_id: id,
        properties: {
          Status: { select: { name: "Published" } },
        },
      });
      console.log(`[notion-mark] ${slug} → Status=Published`);
      ok++;
    } catch (err) {
      console.error(`[notion-mark] ${slug} FAILED: ${err.message}`);
      fail++;
    }
  }

  console.log(`[notion-mark] done. ${ok} marked, ${fail} failed.`);
  // Exit 0 even if some failed — the post is already live, the only
  // consequence of a failed flip is that the next cron retries it
  // (idempotent translator cache hit, no diff, no commit, just retry
  // the flip).
}

main().catch((err) => {
  console.error(`[notion-mark] fatal: ${err.message}`);
  process.exit(1);
});
