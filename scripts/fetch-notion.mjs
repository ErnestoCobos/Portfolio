#!/usr/bin/env node
/**
 * Fetch posts from Notion → write `content/blog/<slug>/en.md`.
 *
 * Designed to run in GitHub Actions (see `.github/workflows/sync-notion.yml`)
 * BEFORE `translate-posts.mjs`. The translator picks up any new/changed
 * en.md and produces es.md.
 *
 * Filter: `Status = "Ready to publish"`. The author marks posts as such
 * when finished writing. After this script + commit + push succeed, the
 * follow-up `notion-mark-published.mjs` flips the same pages to
 * `Status = "Published"` so they're not re-processed on the next cron.
 *
 * To re-publish (update an already-live post): change Status back to
 * `Ready to publish` in Notion. Same flow runs.
 *
 * Output to stdout: a JSON line `::set-output name=processed::<json>`
 * is written to $GITHUB_OUTPUT for the workflow to consume. Locally,
 * the same JSON is logged for visibility.
 *
 * Required env:
 *   NOTION_TOKEN      — internal integration token
 *   NOTION_POSTS_DB   — database id (32-char hex from URL)
 *
 * Optional env:
 *   GITHUB_OUTPUT     — auto-set by GHA; we append `processed=<json>`
 */
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const VALID_CATEGORIES = new Set(["gitops", "migrations", "finops", "platform"]);
const VALID_TRANSLATORS = new Set([
  "deepseek-v4-pro",
  "deepseek-v4-flash",
  "claude-sonnet-4-6",
]);
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`[notion] missing env var: ${name}`);
    process.exit(1);
  }
  return v;
}

function plainText(rich) {
  if (!rich) return "";
  return rich.map((t) => t.plain_text).join("");
}

function escYaml(s) {
  // Minimal YAML escape for double-quoted scalars: backslash + double-quote.
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function main() {
  const notion = new Client({ auth: requireEnv("NOTION_TOKEN") });
  const databaseId = requireEnv("NOTION_POSTS_DB");
  const n2m = new NotionToMarkdown({ notionClient: notion });

  console.log(`[notion] querying database ${databaseId} for Status="Ready to publish"`);
  const { results } = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Status",
      select: { equals: "Ready to publish" },
    },
  });
  console.log(`[notion] found ${results.length} page(s) to publish`);

  const processed = [];
  for (const page of results) {
    const props = page.properties;

    const slug = plainText(props.Slug?.rich_text).trim();
    if (!SLUG_REGEX.test(slug)) {
      console.warn(`[notion] skip ${page.id}: invalid slug "${slug}"`);
      continue;
    }

    const title = plainText(props.Title?.title).trim();
    if (!title) {
      console.warn(`[notion] skip ${slug}: missing Title`);
      continue;
    }

    const date = props.Date?.date?.start;
    if (!date) {
      console.warn(`[notion] skip ${slug}: missing Date`);
      continue;
    }

    const d = plainText(props["Display Date"]?.rich_text).trim();
    const r = plainText(props["Read time"]?.rich_text).trim();
    const category = props.Category?.select?.name?.trim();

    if (!d || !r) {
      console.warn(`[notion] skip ${slug}: missing Display Date or Read time`);
      continue;
    }
    if (!category || !VALID_CATEGORIES.has(category)) {
      console.warn(
        `[notion] skip ${slug}: invalid category "${category}". Allowed: ${[...VALID_CATEGORIES].join(", ")}`
      );
      continue;
    }

    const cover = props["Cover URL"]?.url || null;
    const coverAlt = plainText(props["Cover Alt"]?.rich_text).trim() || null;
    const translatorRaw = props["Translator override"]?.select?.name;
    const translator =
      translatorRaw && translatorRaw !== "(default)" && VALID_TRANSLATORS.has(translatorRaw)
        ? translatorRaw
        : null;

    // Convert page body to markdown.
    const blocks = await n2m.pageToMarkdown(page.id);
    const body = n2m.toMarkdownString(blocks).parent ?? "";

    const fmLines = [
      "---",
      `slug: ${slug}`,
      `title: "${escYaml(title)}"`,
      `d: "${escYaml(d)}"`,
      `date: "${date}"`,
      `r: "${escYaml(r)}"`,
      `category: ${category}`,
    ];
    if (cover) fmLines.push(`cover: "${escYaml(cover)}"`);
    if (coverAlt) fmLines.push(`coverAlt: "${escYaml(coverAlt)}"`);
    if (translator) fmLines.push(`translator: ${translator}`);
    fmLines.push("---", "");
    const frontmatter = fmLines.join("\n");

    const dir = path.join("content", "blog", slug);
    mkdirSync(dir, { recursive: true });
    const enPath = path.join(dir, "en.md");
    writeFileSync(enPath, frontmatter + body.trim() + "\n");
    processed.push({ id: page.id, slug });
    console.log(`[notion] wrote ${enPath}`);
  }

  // Emit the processed list for the GHA workflow to consume.
  const json = JSON.stringify(processed);
  console.log(`[notion] processed=${json}`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `processed=${json}\n`);
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `count=${processed.length}\n`
    );
  }
}

main().catch((err) => {
  console.error(`[notion] fatal: ${err.message}`);
  process.exit(1);
});
