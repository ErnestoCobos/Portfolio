#!/usr/bin/env node
/**
 * Generates content/blog/.modified-dates.json with the last-commit ISO
 * timestamp of every markdown post. Runs as a `prebuild` step so the
 * production bundle gets accurate dateModified values for JSON-LD
 * structured data without needing git available at runtime.
 *
 * Behavior:
 * - If git isn't available (e.g. CI without history, or local install
 *   from a tarball), we still emit an empty JSON object instead of
 *   failing — the downstream loader treats missing entries as
 *   "no modification recorded" and falls back to the frontmatter date.
 * - We use %cI (committer date, ISO-8601 with timezone) so the output
 *   is search-engine-friendly without further parsing.
 */
import { execSync } from "node:child_process";
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const blogDir = path.join(projectRoot, "content", "blog");
const outFile = path.join(blogDir, ".modified-dates.json");

function lastCommitIso(filePath) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return out || null;
  } catch {
    return null;
  }
}

function main() {
  if (!existsSync(blogDir)) {
    console.warn(
      `[git-modified-dates] ${blogDir} does not exist — writing empty index.`
    );
    writeFileSync(outFile, "{}\n");
    return;
  }

  const dates = {};
  const files = readdirSync(blogDir).filter((f) => f.endsWith(".md"));
  for (const f of files) {
    const slug = f.replace(/\.md$/, "");
    const iso = lastCommitIso(path.join(blogDir, f));
    if (iso) dates[slug] = iso;
  }

  writeFileSync(outFile, JSON.stringify(dates, null, 2) + "\n");
  console.log(
    `[git-modified-dates] wrote ${outFile} with ${Object.keys(dates).length} entries`
  );
}

main();
