# Codex CLI prompt — Blog comments via Notion (auto-publish + 4-layer filter)

> Hand the contents of the fenced block below verbatim to OpenAI Codex CLI. The
> repo and conventions are already known. Codex should not ask clarifying
> questions; everything it needs is in the prompt.

---

````
You are an autonomous engineer working on the cobosio repo (Next.js 16, App
Router, React 19, bilingual ES + EN, deployed on Vercel team `ecgcore` /
project `portfolio`). Implement a comments feature for blog posts following
this spec exactly. Do not deviate, do not ask for clarification, do not run
the dev server. When you finish, show the diff and stop.

================================================================================
0. CONTEXT — what's already in the repo (do NOT re-architect this)
================================================================================

- Routes: `app/(es)/blog/[slug]/page.tsx` (ES root) and `app/en/blog/[slug]/page.tsx` (EN under /en).
  Both server components delegate rendering to `app/components/blog/BlogArticle.tsx`,
  passing `{ post, locale, prev, next, headings, related }`. The `<Comments>` slot
  goes inside `BlogArticle` so both locales inherit it for free.

- i18n: dictionary-typed via `app/lib/i18n/{es,en,shape,index}.ts`. The shape is
  `type Dictionary = typeof es`, so any string added to `es.ts` becomes REQUIRED
  in `en.ts` (TS error otherwise). Never use `as const` on the dicts.

- Posts loader: `app/lib/posts.ts` exports `getPost(slug, locale)` and
  `getAllPosts(locale)`. Posts are markdown under `content/blog/<slug>/{es,en}.md`,
  populated by a GHA cron from a Notion database (see ADR-002). Keep that pipeline
  untouched.

- Notion SDK: `@notionhq/client` v5 is installed. The v5 split databases into
  containers + data sources. To query, use `notion.databases.retrieve({ database_id })`
  to get the data source id, then `notion.dataSources.query({ data_source_id, filter })`.
  See `scripts/fetch-notion.mjs` for a working example.

- Markdown rendering: `marked` v18 is already a dependency. Use it for comment
  bodies. Sanitize with DOMPurify (add as a new dep).

- Existing env vars (in Vercel): NOTION_TOKEN, NOTION_POSTS_DB, AI_GATEWAY_API_KEY.
  The token already has read+update+insert on the workspace.

- Existing dev server entry: `pnpm dev`. Build: `pnpm build`. Lint: `pnpm lint`.

================================================================================
1. GOAL
================================================================================

Add anonymous-by-default comments to every blog post page. Comments are stored
in a NEW Notion data source called `Comments`. They auto-publish. A 4-layer
filter classifies each submission BEFORE it lands in the data source. The site
reads from Notion at runtime (NOT build-time), with edge caching of 60s. The
post owner moderates reactively from Notion mobile when an obviously-bad
comment slips through; the comment is removed by deleting the Notion row,
which propagates to the site within the cache TTL.

Bilingual: ES posts get Spanish UI, EN posts get English UI, but the comments
THEMSELVES live together (no per-locale split — visitors of either page see
the same comment thread for that slug, in whatever language each comment was
written).

================================================================================
2. PRE-REQS THE USER WILL DO BEFORE THIS PR MERGES (do NOT do these)
================================================================================

a. Create a new Notion data source `Comments` inside the same `Blog Posts`
   page that already hosts COBOS. Schema specified in §3.

b. Share the `Comments` data source with the existing integration `cobos.io
   site sync` (Connections menu in Notion).

c. Create a Cloudflare Turnstile site at https://dash.cloudflare.com/?to=/:account/turnstile
   - Domain: cobos.io + *.vercel.app
   - Widget mode: Managed
   - Capture site key + secret key.

d. Provision Vercel KV for the `portfolio` project (Vercel dashboard → Storage
   → Create → KV). Vercel auto-injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`
   as env vars to all environments.

e. Add to Vercel env vars (all environments):
       NOTION_COMMENTS_DB         = <database id of the Blog Posts page that hosts the Comments data source — same id as NOTION_POSTS_DB if Comments is in the same database, otherwise the new database id>
       NOTION_COMMENTS_DATA_SOURCE = <data source id from "share/copy link" on the Comments collection>
       TURNSTILE_SITE_KEY          = <public site key from Cloudflare>
       TURNSTILE_SECRET_KEY        = <secret key from Cloudflare>
       COMMENT_EDIT_SECRET         = <random 32-byte hex string, generate with: openssl rand -hex 32>

   (TURNSTILE_SITE_KEY MUST be exposed to the client. Either prefix it
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and reference that name, or use Next's
   `experimental.publicRuntimeConfig`. Pick the prefix approach — simpler.)

   Final env-var list to assume the user provisions:
       NOTION_TOKEN                       (existing)
       NOTION_COMMENTS_DB                 (new — DB containing the Comments data source)
       NOTION_COMMENTS_DATA_SOURCE        (new — data source id)
       AI_GATEWAY_API_KEY                 (existing)
       NEXT_PUBLIC_TURNSTILE_SITE_KEY     (new)
       TURNSTILE_SECRET_KEY               (new)
       COMMENT_EDIT_SECRET                (new)
       KV_REST_API_URL                    (auto by Vercel KV)
       KV_REST_API_TOKEN                  (auto by Vercel KV)

================================================================================
3. NOTION DATA SOURCE SCHEMA — `Comments`
================================================================================

Document the schema in `docs/notion-comments-schema.md` (so the user can recreate
it deterministically). Every field's exact name and type matters because the
backend reads them by literal string match.

| Property name        | Type            | Required | Notes                                            |
|----------------------|-----------------|----------|--------------------------------------------------|
| Body                 | Title           | yes      | The comment text (plaintext, max ~5000 chars).  |
| Slug                 | Rich text       | yes      | Post slug, e.g. "gitops-regulados".              |
| Locale               | Select          | yes      | Options: `es`, `en`. The locale of the page where it was submitted. |
| Name                 | Rich text       | no       | Display name. Empty → render "Anónimo".          |
| Email                | Email           | no       | Never shown publicly. Used only for v2 reply-by-email. |
| Status               | Select          | yes      | Options: `approved` (default for ok comments), `spam`, `flagged`. |
| Spam reason          | Rich text       | no       | Which layer flagged it: `regex:viagra`, `llm:promo`, `llm:abuse`, etc. |
| IP hash              | Rich text       | yes      | SHA256(ip + COMMENT_EDIT_SECRET).                |
| User agent           | Rich text       | no       | Truncated to 200 chars.                          |
| Parent               | Rich text       | no       | Comment id for threading (v2). Leave empty for v1. |
| Created at           | Created time    | auto     | Notion-managed.                                  |

================================================================================
4. FILES TO CREATE
================================================================================

Create each file with the EXACT path and contents described. Use TypeScript
strict mode. Add JSDoc comments on every exported symbol.

────────────────────────────────────────────────────────────────────────────────
4.1 `app/lib/comments/types.ts`
────────────────────────────────────────────────────────────────────────────────

Pure types, no runtime imports.

```ts
import type { Locale } from "../i18n/shape";

export type CommentStatus = "approved" | "spam" | "flagged";

/** Server-side row, including private fields. Never sent to the browser. */
export interface CommentRow {
  id: string;
  slug: string;
  locale: Locale;
  name: string | null;        // null → display "Anónimo"
  email: string | null;
  body: string;                // raw markdown as submitted
  status: CommentStatus;
  spamReason: string | null;
  ipHash: string;
  userAgent: string | null;
  parent: string | null;
  createdAt: string;           // ISO 8601
}

/** Public-safe shape sent to the browser. No PII, no email, no IP. */
export interface PublicComment {
  id: string;
  name: string;                // "Anónimo" if anonymous
  bodyHtml: string;            // already sanitized markdown → HTML
  parent: string | null;
  createdAt: string;
}

/** POST /api/comments request body. */
export interface CommentSubmission {
  slug: string;
  locale: Locale;
  body: string;
  name?: string;
  email?: string;
  parent?: string;
  turnstileToken: string;
  /** Honeypot — must be empty. If filled, treat as bot. */
  website?: string;
}

/** POST /api/comments response. */
export interface CommentSubmissionResult {
  id: string;
  status: CommentStatus;
  comment: PublicComment | null;  // null when status === "spam" (silent reject)
  editToken: string | null;       // null when status !== "approved"
}
```

────────────────────────────────────────────────────────────────────────────────
4.2 `app/lib/comments/notion.ts`
────────────────────────────────────────────────────────────────────────────────

Server-only module. Wraps the Notion SDK. Three exported functions:

- `createComment(input: NewCommentInput): Promise<CommentRow>` — creates a row.
- `listApprovedComments(slug: string): Promise<CommentRow[]>` — queries by slug
   filtered to status === "approved", ordered by Created at ASC. Internally
   uses the `notion.databases.retrieve` → `notion.dataSources.query` v5 pattern.
- `deleteComment(id: string): Promise<void>` — calls `notion.pages.update` with
   `archived: true` (Notion's soft-delete).

```ts
import { Client } from "@notionhq/client";
import type { CommentRow, CommentStatus } from "./types";
import type { Locale } from "../i18n/shape";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATA_SOURCE_ID = process.env.NOTION_COMMENTS_DATA_SOURCE!;

export interface NewCommentInput {
  slug: string;
  locale: Locale;
  body: string;
  name: string | null;
  email: string | null;
  status: CommentStatus;
  spamReason: string | null;
  ipHash: string;
  userAgent: string | null;
  parent: string | null;
}

export async function createComment(input: NewCommentInput): Promise<CommentRow> {
  const page = await notion.pages.create({
    parent: { type: "data_source_id", data_source_id: DATA_SOURCE_ID },
    properties: {
      Body: { title: [{ text: { content: input.body.slice(0, 2000) } }] },
      Slug: { rich_text: [{ text: { content: input.slug } }] },
      Locale: { select: { name: input.locale } },
      Name: input.name
        ? { rich_text: [{ text: { content: input.name } }] }
        : { rich_text: [] },
      Email: input.email ? { email: input.email } : { email: null },
      Status: { select: { name: input.status } },
      "Spam reason": input.spamReason
        ? { rich_text: [{ text: { content: input.spamReason } }] }
        : { rich_text: [] },
      "IP hash": { rich_text: [{ text: { content: input.ipHash } }] },
      "User agent": input.userAgent
        ? { rich_text: [{ text: { content: input.userAgent.slice(0, 200) } }] }
        : { rich_text: [] },
      Parent: input.parent
        ? { rich_text: [{ text: { content: input.parent } }] }
        : { rich_text: [] },
    },
  });
  return rowFromPage(page);
}

export async function listApprovedComments(slug: string): Promise<CommentRow[]> {
  const { results } = await notion.dataSources.query({
    data_source_id: DATA_SOURCE_ID,
    filter: {
      and: [
        { property: "Slug", rich_text: { equals: slug } },
        { property: "Status", select: { equals: "approved" } },
      ],
    },
    sorts: [{ property: "Created at", direction: "ascending" }],
    page_size: 100,
  });
  return results.map(rowFromPage);
}

export async function deleteComment(id: string): Promise<void> {
  await notion.pages.update({ page_id: id, archived: true });
}

function rowFromPage(page: any): CommentRow {
  // Implement defensive extraction. If a property is missing, fall back to
  // safe defaults. NEVER throw from this function — corrupt rows are
  // possible and should be skipped at the call site.
  const props = page.properties ?? {};
  const text = (rt: any) =>
    Array.isArray(rt?.rich_text)
      ? rt.rich_text.map((t: any) => t.plain_text).join("")
      : "";
  return {
    id: page.id,
    slug: text(props.Slug).trim(),
    locale: (props.Locale?.select?.name ?? "es") as Locale,
    name: text(props.Name).trim() || null,
    email: props.Email?.email ?? null,
    body: props.Body?.title?.map((t: any) => t.plain_text).join("") ?? "",
    status: (props.Status?.select?.name ?? "approved") as CommentStatus,
    spamReason: text(props["Spam reason"]).trim() || null,
    ipHash: text(props["IP hash"]).trim(),
    userAgent: text(props["User agent"]).trim() || null,
    parent: text(props.Parent).trim() || null,
    createdAt: page.created_time ?? new Date().toISOString(),
  };
}
```

────────────────────────────────────────────────────────────────────────────────
4.3 `app/lib/comments/spam-filter.ts`
────────────────────────────────────────────────────────────────────────────────

Four exported functions, one per layer. Each returns
`{ ok: true } | { ok: false, reason: string }`. The orchestrator in the API
route runs them in order and short-circuits on first failure.

```ts
import crypto from "node:crypto";

const TURNSTILE_VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const AI_GATEWAY = "https://ai-gateway.vercel.sh/v1/chat/completions";

const SPAM_REGEX = [
  /\bviagra\b/i,
  /\bcasino\b/i,
  /\b(bit\.ly|tinyurl|t\.me|goo\.gl|ow\.ly)\b/i,
  /\bcrypto.{0,30}(profit|investment|signal|pump)\b/i,
  /<a[\s>]/i,         // raw HTML anchor — markdown links are fine, raw HTML isn't
  /<script/i,
  /(http|https):\/\/[^\s]+(\s|$)(http|https):\/\//i, // 2+ URLs in one comment
];

const MIN_LEN = 5;
const MAX_LEN = 5000;

export async function verifyTurnstile(token: string, ip: string | null): Promise<{ ok: boolean; reason?: string }> {
  if (!token) return { ok: false, reason: "turnstile:missing" };
  const body = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY!,
    response: token,
    ...(ip ? { remoteip: ip } : {}),
  });
  const res = await fetch(TURNSTILE_VERIFY, { method: "POST", body });
  if (!res.ok) return { ok: false, reason: `turnstile:http_${res.status}` };
  const json = await res.json() as { success: boolean; "error-codes"?: string[] };
  if (!json.success) return { ok: false, reason: `turnstile:${(json["error-codes"] ?? []).join(",")}` };
  return { ok: true };
}

export function runHeuristics(body: string): { ok: boolean; reason?: string } {
  const trimmed = body.trim();
  if (trimmed.length < MIN_LEN) return { ok: false, reason: "heuristic:too_short" };
  if (trimmed.length > MAX_LEN) return { ok: false, reason: "heuristic:too_long" };
  for (const re of SPAM_REGEX) {
    if (re.test(trimmed)) return { ok: false, reason: `heuristic:${re.source.slice(0, 30)}` };
  }
  return { ok: true };
}

/** Calls DeepSeek V4 Flash via Vercel AI Gateway. ~$0.0001 per call.
 * Returns ok:false with the reason if the model classifies the comment
 * as spam, abuse, or off-topic. Failures (timeout, 5xx) fail OPEN —
 * the comment is allowed and will be visible. The owner moderates
 * reactively if needed.
 */
export async function runLLMCheck(body: string, postTitle: string): Promise<{ ok: boolean; reason?: string }> {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) return { ok: true }; // fail open if not configured

  const prompt = [
    {
      role: "system",
      content:
        "You moderate comments for a technical blog about cloud architecture, GitOps, FinOps, and DevSecOps. Reply with EXACTLY one word, no punctuation, no explanation. APPROVE if the comment is on-topic technical commentary, a question, constructive disagreement, or a personal anecdote relevant to the post. SPAM if it's promotional, contains suspicious links, looks bot-generated, or is unrelated solicitation. ABUSE if it contains personal attacks, threats, hate speech, or harassment. OFFTOPIC if it's coherent but unrelated to the post (rare — be lenient).",
    },
    {
      role: "user",
      content: `Post: "${postTitle}"\n\nComment:\n${body.slice(0, 1500)}`,
    },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-v3.2-exp",
        messages: prompt,
        max_tokens: 5,
        temperature: 0,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { ok: true }; // fail open on 5xx
    const json = await res.json() as { choices?: { message?: { content?: string } }[] };
    const verdict = (json.choices?.[0]?.message?.content ?? "").trim().toUpperCase();
    if (verdict === "APPROVE") return { ok: true };
    if (verdict === "SPAM") return { ok: false, reason: "llm:spam" };
    if (verdict === "ABUSE") return { ok: false, reason: "llm:abuse" };
    if (verdict === "OFFTOPIC") return { ok: false, reason: "llm:offtopic" };
    return { ok: true }; // fail open on unparseable verdict
  } catch (err) {
    clearTimeout(timeout);
    return { ok: true }; // fail open on timeout/network error
  }
}

export function hashIp(ip: string): string {
  return crypto.createHash("sha256")
    .update(ip + ":" + process.env.COMMENT_EDIT_SECRET!)
    .digest("hex");
}
```

────────────────────────────────────────────────────────────────────────────────
4.4 `app/lib/comments/rate-limit.ts`
────────────────────────────────────────────────────────────────────────────────

Sliding-window rate limit using Vercel KV REST API directly (no SDK to keep
deps light). Window: 1 hour. Limit: 5 submissions per IP. Key:
`comment:rl:${ipHash}:${currentHour}`. INCR + EXPIRE.

```ts
const KV_URL = process.env.KV_REST_API_URL!;
const KV_TOKEN = process.env.KV_REST_API_TOKEN!;
const LIMIT = 5;
const WINDOW_SECONDS = 3600;

async function kv(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(KV_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`KV error: ${res.status}`);
  const json = await res.json() as { result?: unknown };
  return json.result;
}

export async function checkRateLimit(ipHash: string): Promise<{ ok: boolean; reason?: string }> {
  if (!KV_URL || !KV_TOKEN) return { ok: true }; // fail open if KV not configured (dev/preview)
  const hour = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
  const key = `comment:rl:${ipHash}:${hour}`;
  try {
    const count = (await kv(["INCR", key])) as number;
    if (count === 1) await kv(["EXPIRE", key, WINDOW_SECONDS]);
    if (count > LIMIT) return { ok: false, reason: "rate_limit:too_many" };
    return { ok: true };
  } catch {
    return { ok: true }; // fail open on KV outage
  }
}
```

────────────────────────────────────────────────────────────────────────────────
4.5 `app/lib/comments/render.ts`
────────────────────────────────────────────────────────────────────────────────

Markdown → safe HTML for comment bodies. Use `marked` (already installed) and
DOMPurify (new dep). Strip raw HTML, keep markdown links/code/emphasis. Add
`rel="noopener noreferrer nofollow"` to all links.

```ts
import { marked } from "marked";
import createDOMPurify from "isomorphic-dompurify";

const DOMPurify = createDOMPurify();

const ALLOWED_TAGS = ["p", "br", "strong", "em", "code", "pre", "blockquote", "ul", "ol", "li", "a"];
const ALLOWED_ATTR = ["href", "rel", "target"];

marked.setOptions({ gfm: true, breaks: true });

export function renderCommentBody(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false }) as string;
  const safe = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_ATTR: ["onclick", "onload", "onerror"],
  });
  // Force-add rel/target on anchors (defensive — DOMPurify config doesn't enforce)
  return safe.replace(
    /<a\s+href="([^"]+)"/g,
    '<a href="$1" rel="noopener noreferrer nofollow" target="_blank"'
  );
}

export function publicShape(row: { id: string; name: string | null; body: string; parent: string | null; createdAt: string }) {
  return {
    id: row.id,
    name: row.name?.trim() || "Anónimo",
    bodyHtml: renderCommentBody(row.body),
    parent: row.parent,
    createdAt: row.createdAt,
  };
}
```

────────────────────────────────────────────────────────────────────────────────
4.6 `app/lib/comments/edit-token.ts`
────────────────────────────────────────────────────────────────────────────────

JWT (HS256) signing/verification using `jose` (new dep). 5-minute TTL. Used
to authorize edits/deletes by the original commenter without requiring login.

```ts
import { SignJWT, jwtVerify } from "jose";

const ISSUER = "cobosio:comments";
const TTL_SECONDS = 300;

function key(): Uint8Array {
  return new TextEncoder().encode(process.env.COMMENT_EDIT_SECRET!);
}

export async function signEditToken(commentId: string): Promise<string> {
  return await new SignJWT({ id: commentId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(key());
}

export async function verifyEditToken(token: string, commentId: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, key(), { issuer: ISSUER });
    return payload.id === commentId;
  } catch {
    return false;
  }
}
```

────────────────────────────────────────────────────────────────────────────────
4.7 `app/api/comments/route.ts`
────────────────────────────────────────────────────────────────────────────────

POST handler. Node runtime (the Notion SDK uses Node primitives). Implements
the full pipeline.

```ts
import { NextRequest, NextResponse } from "next/server";
import { getPost } from "@/app/lib/posts";
import { createComment } from "@/app/lib/comments/notion";
import {
  hashIp,
  runHeuristics,
  runLLMCheck,
  verifyTurnstile,
} from "@/app/lib/comments/spam-filter";
import { checkRateLimit } from "@/app/lib/comments/rate-limit";
import { publicShape } from "@/app/lib/comments/render";
import { signEditToken } from "@/app/lib/comments/edit-token";
import type { CommentSubmission, CommentSubmissionResult, CommentStatus } from "@/app/lib/comments/types";
import type { Locale } from "@/app/lib/i18n/shape";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0"
  );
}

export async function POST(req: NextRequest) {
  // 0. Origin check (cheap CSRF-ish defense)
  const origin = req.headers.get("origin") ?? "";
  const allowed = ["https://cobos.io", "http://localhost:3000"];
  const isVercelPreview = /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);
  if (!allowed.includes(origin) && !isVercelPreview) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: CommentSubmission;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }

  // Honeypot: silently accept and discard
  if (body.website && body.website.length > 0) {
    return NextResponse.json({ id: "honeypot", status: "spam" as CommentStatus, comment: null, editToken: null } as CommentSubmissionResult);
  }

  // Validate basic shape
  if (typeof body.slug !== "string" || !body.slug
   || typeof body.body !== "string" || !body.body
   || (body.locale !== "es" && body.locale !== "en")
   || typeof body.turnstileToken !== "string") {
    return NextResponse.json({ error: "bad_input" }, { status: 400 });
  }

  // Confirm post exists (so we don't accept comments for arbitrary slugs)
  const post = getPost(body.slug, body.locale as Locale);
  if (!post) return NextResponse.json({ error: "unknown_slug" }, { status: 404 });

  const ip = getIp(req);
  const ipHash = hashIp(ip);
  const userAgent = req.headers.get("user-agent");

  // Layer 1: Turnstile
  const turnstile = await verifyTurnstile(body.turnstileToken, ip);
  if (!turnstile.ok) return NextResponse.json({ error: "verification_failed" }, { status: 400 });

  // Layer 2: Rate limit
  const rl = await checkRateLimit(ipHash);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  // Layer 3: Heuristics
  const heur = runHeuristics(body.body);
  // Layer 4: LLM (only if heuristics passed — saves cost)
  const llm = heur.ok ? await runLLMCheck(body.body, post.title) : { ok: true } as const;

  let status: CommentStatus = "approved";
  let spamReason: string | null = null;
  if (!heur.ok) { status = "spam"; spamReason = heur.reason ?? "heuristic"; }
  else if (!llm.ok) { status = "spam"; spamReason = llm.reason ?? "llm"; }

  // Reserved-name protection
  const RESERVED = ["ernesto", "ernesto cobos", "cobos", "admin", "moderator", "owner"];
  const cleanedName = (body.name ?? "").trim().slice(0, 60);
  const finalName = RESERVED.includes(cleanedName.toLowerCase()) ? null : (cleanedName || null);

  // Persist
  const row = await createComment({
    slug: body.slug,
    locale: body.locale as Locale,
    body: body.body.trim(),
    name: finalName,
    email: (body.email ?? "").trim().slice(0, 200) || null,
    status,
    spamReason,
    ipHash,
    userAgent,
    parent: body.parent ?? null,
  });

  const result: CommentSubmissionResult = {
    id: row.id,
    status: row.status,
    comment: row.status === "approved" ? publicShape(row) : null,
    editToken: row.status === "approved" ? await signEditToken(row.id) : null,
  };
  return NextResponse.json(result);
}
```

────────────────────────────────────────────────────────────────────────────────
4.8 `app/api/comments/list/route.ts`
────────────────────────────────────────────────────────────────────────────────

GET handler. Cached at edge for 60s. Returns approved comments for a slug.

```ts
import { NextRequest, NextResponse } from "next/server";
import { listApprovedComments } from "@/app/lib/comments/notion";
import { publicShape } from "@/app/lib/comments/render";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug)) {
    return NextResponse.json({ error: "bad_slug" }, { status: 400 });
  }
  const rows = await listApprovedComments(slug);
  const comments = rows.map(publicShape);
  return NextResponse.json(
    { comments },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
```

────────────────────────────────────────────────────────────────────────────────
4.9 `app/api/comments/[id]/route.ts`
────────────────────────────────────────────────────────────────────────────────

PATCH and DELETE for the original commenter (within 5min window via edit token).

```ts
import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { verifyEditToken } from "@/app/lib/comments/edit-token";
import { renderCommentBody } from "@/app/lib/comments/render";

export const runtime = "nodejs";
const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function authorize(req: NextRequest, id: string): Promise<boolean> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return verifyEditToken(token, id);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await authorize(req, id))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json() as { body?: string };
  if (typeof body.body !== "string" || body.body.trim().length < 5) {
    return NextResponse.json({ error: "bad_input" }, { status: 400 });
  }
  await notion.pages.update({
    page_id: id,
    properties: {
      Body: { title: [{ text: { content: body.body.slice(0, 2000) } }] },
    },
  });
  return NextResponse.json({ id, bodyHtml: renderCommentBody(body.body) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await authorize(req, id))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await notion.pages.update({ page_id: id, archived: true });
  return NextResponse.json({ id, deleted: true });
}
```

────────────────────────────────────────────────────────────────────────────────
4.10 `app/components/comments/Comments.tsx`
────────────────────────────────────────────────────────────────────────────────

Client component, "use client". Top-level wrapper. Renders the Turnstile
script lazily, fetches the comment list with SWR-style stale-while-revalidate
manually (don't add SWR as a dep), shows the form, handles optimistic UI.

Props: `{ slug: string; locale: Locale; postTitle: string }`.

Use `useT()` from `app/lib/i18n/locale-context.tsx` for labels (verify the
file exists; if not, import directly from `app/lib/i18n` and pass dict).

The component:

1. On mount: fetches `/api/comments/list?slug=${slug}` and renders the list.
2. Loads Turnstile script: `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />` — render once via a `useEffect` that injects it if not already present.
3. Renders form with: name (optional), email (optional), body (required, textarea, max 5000), website (HONEYPOT, hidden), turnstile widget mounted via `<div className="cf-turnstile" data-sitekey="${env}" data-callback="...">`.
4. Submission handler:
   a. Reads turnstile token from `window.turnstile.getResponse()` (loaded by the script).
   b. POSTs to `/api/comments`.
   c. On status === "approved": prepends new comment to local state (optimistic), saves edit token to localStorage as `comment-edit-${id}`, resets form.
   d. On status === "spam": shows generic friendly success message ("comment submitted, will appear after review") — do NOT reveal it was flagged.
   e. On error: shows error message in current locale.
5. Each comment in the list checks `localStorage[\`comment-edit-${id}\`]` and shows an "Edit" / "Delete" button if present and not expired (parse the JWT exp client-side; jose's `decodeJwt` works in browser).

Add basic styles in `app/globals.css` under a new section `/* === Comments === */` matching the terminal-style aesthetic of the site (mono labels, cyan accent on buttons, sharp borders). Don't add Tailwind utilities inline beyond what the rest of the components do.

Key UI strings (add to dictionaries — see §4.11):
- t.comments.heading = "Comments" / "Comentarios"
- t.comments.formNamePlaceholder = "Name (optional)" / "Nombre (opcional)"
- t.comments.formEmailPlaceholder = "Email (private, never shown)" / "Email (privado, nunca se muestra)"
- t.comments.formBodyPlaceholder = "Write a comment in markdown..." / "Escribí un comentario en markdown..."
- t.comments.submit = "Send" / "Enviar"
- t.comments.anonymous = "Anonymous" / "Anónimo"
- t.comments.empty = "No comments yet. Be the first." / "Aún no hay comentarios. Sé el primero."
- t.comments.successApproved = "Comment posted." / "Comentario publicado."
- t.comments.successSpam = "Comment submitted; will appear after review." / "Comentario enviado; aparecerá tras revisión."
- t.comments.errorRateLimited = "Too many comments from your network. Try again later." / "Demasiados comentarios desde tu red. Intentá más tarde."
- t.comments.errorGeneric = "Something failed. Try again." / "Algo falló. Intentá de nuevo."
- t.comments.edit = "Edit" / "Editar"
- t.comments.delete = "Delete" / "Borrar"
- t.comments.editWindowExpired = "Edit window expired (5 min)." / "Ventana de edición vencida (5 min)."
- t.comments.relativeTimeNow = "just now" / "hace un momento"
- t.comments.relativeTimeMinutes = (n) => `${n}m ago` / `hace ${n}m`
- t.comments.relativeTimeHours = (n) => `${n}h ago` / `hace ${n}h`
- t.comments.relativeTimeDays = (n) => `${n}d ago` / `hace ${n}d`

Make the relative-time helpers return a string from a `Date` argument; implement once in `app/lib/comments/format-time.ts`.

────────────────────────────────────────────────────────────────────────────────
4.11 Dictionary updates — `app/lib/i18n/{es,en}.ts`
────────────────────────────────────────────────────────────────────────────────

Append a `comments: { ... }` block to the `es` dict. Then mirror in `en` so
the `Dictionary` shape stays satisfied.

The exact keys are the ones listed in §4.10. Functions stay as functions
(typeof preserves the signature).

────────────────────────────────────────────────────────────────────────────────
4.12 `app/components/comments/CommentList.tsx`, `CommentItem.tsx`, `CommentForm.tsx`
────────────────────────────────────────────────────────────────────────────────

Split the Comments wrapper into 3 child components for testability and re-render
isolation. The list re-renders when a comment is posted, but the form doesn't
have to re-mount Turnstile.

────────────────────────────────────────────────────────────────────────────────
4.13 `docs/notion-comments-schema.md`
────────────────────────────────────────────────────────────────────────────────

A copy of the schema table from §3 above, plus the manual Notion setup steps
the user follows once.

================================================================================
5. FILES TO MODIFY
================================================================================

5.1 `app/components/blog/BlogArticle.tsx`
   - Import `Comments` (lazy/dynamic to keep server bundle clean: use
     `import dynamic from "next/dynamic"` with `ssr: true, loading: () => null`).
   - Render `<Comments slug={post.slug} locale={locale} postTitle={post.title} />`
     AFTER the prev/next navigation, BEFORE the closing tag of the article wrapper.

5.2 `package.json` — add to dependencies:
       "isomorphic-dompurify": "^2.18.0"
       "jose": "^6.1.1"
   Run `pnpm install`. Do not change other deps.

5.3 `.env.example` — add the new env vars at the bottom with comments:

       # Comments — required for /api/comments/* endpoints
       NOTION_COMMENTS_DB=
       NOTION_COMMENTS_DATA_SOURCE=
       NEXT_PUBLIC_TURNSTILE_SITE_KEY=
       TURNSTILE_SECRET_KEY=
       COMMENT_EDIT_SECRET=
       # Vercel KV — used for rate limiting; auto-injected by Vercel KV integration
       KV_REST_API_URL=
       KV_REST_API_TOKEN=

5.4 `app/globals.css` — add a `/* === Comments === */` section near the bottom
   with styles for `.cobos-comments`, `.cobos-comments__list`, `.cobos-comments__item`,
   `.cobos-comments__form`, `.cobos-comments__error`. Use existing CSS tokens
   (--surface-1, --surface-2, --accent-cyan, --text-mono, --motion-fast). Sharp
   borders, no rounded corners > 4px (matches existing aesthetic).

5.5 If `tsconfig.json` doesn't already alias `@/*`, add `"paths": { "@/*": ["./*"] }`
   so the new modules can `import "@/app/lib/..."`. Verify before adding.

================================================================================
6. CONSTRAINTS — ALL HARD
================================================================================

a. SSG must be preserved. Blog post pages must remain in the static prerender
   list (○) in `pnpm build` output, NOT dynamic (ƒ). The Comments component
   is client-only and fetches at runtime; the page itself is still static.

b. Do NOT add: Disqus, Giscus, Cusdis, Hyvor, Supabase, Firebase, MongoDB,
   Prisma, GraphQL, Drizzle, any auth library. The stack is exactly: Notion +
   Turnstile + Vercel KV + Vercel AI Gateway + jose + DOMPurify + marked.

c. Do NOT introduce any client-side state library (no Redux, Zustand, Jotai).
   Plain `useState` + `useReducer` only.

d. Do NOT add SWR or react-query. Implement fetch + state manually.

e. Do NOT log IPs, emails, or comment bodies in plaintext anywhere
   (console.log, sentry, etc.). The Notion row is the only persistent record.

f. `pnpm lint` must pass with no warnings.
   `pnpm exec tsc --noEmit` must pass with no errors.
   `pnpm build` must succeed and complete in <60s on the local machine.

g. The Comments component must NOT block initial paint. Either lazy-load via
   `next/dynamic` with `ssr: false` and a sub-200ms placeholder, OR render
   server-side with the list fetched via the GET endpoint and progressive
   hydration. Pick the simpler option (`ssr: false` with placeholder).

h. Mobile: 375px viewport, no horizontal scroll. Tap target ≥44px.

i. Accessibility: form has labels, errors are announced via aria-live="polite",
   the comments list is a `<ol>` with `aria-label`. Lighthouse accessibility
   score on a blog post page must stay ≥95.

j. The hashed IP is the only IP-derived value persisted. Raw IP must NEVER
   reach Notion. Verify by grep at the end.

================================================================================
7. ACCEPTANCE CRITERIA — TESTABLE
================================================================================

After implementation, run the dev server (`pnpm dev`) and verify:

1. /blog/gitops-regulados shows a comments section at the bottom labeled
   "Comentarios", with a form below an empty list ("Aún no hay comentarios").
2. /en/blog/gitops-regulados shows the same with English labels.
3. Submitting a comment "Esto está buenísimo" with no name → row created in
   Notion data source `Comments` with Status=approved, Name empty. Comment
   appears in the list optimistically with display name "Anónimo".
4. Submitting "BUY VIAGRA NOW CASINO ROYALE" → returns 200 success with the
   friendly "appears after review" message, but the comment does NOT appear
   in the list. Notion row created with Status=spam, Spam reason=`heuristic:viagra`.
5. Submitting 6 comments rapidly from the same browser → 6th request returns
   429 with the rate-limit error message rendered in the UI.
6. After submitting an approved comment, an "Edit" button appears next to it.
   Clicking it allows editing the body. After 5 minutes (or after manually
   clearing localStorage), the button no longer appears.
7. Clicking Delete on a comment within the edit window → comment archived in
   Notion (`archived: true`) → removed from the visible list within 60s on
   refresh.
8. Network tab: `/api/comments/list?slug=...` response has
   `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.
9. `pnpm build` output: `app/(es)/blog/[slug]` and `app/en/blog/[slug]` are
   marked `●` (SSG with revalidation) or `○` (pure SSG) — NOT `ƒ` (dynamic).
10. `pnpm lint` and `pnpm exec tsc --noEmit` pass clean.
11. With `unset NEXT_PUBLIC_TURNSTILE_SITE_KEY` (or any required env missing),
    the comments section renders a graceful "Comments are temporarily
    unavailable" notice instead of crashing.

================================================================================
8. VERIFICATION COMMANDS
================================================================================

Before opening the PR:

    pnpm install
    pnpm lint
    pnpm exec tsc --noEmit
    pnpm build
    grep -r "console.log" app/lib/comments app/api/comments app/components/comments  # must be empty
    grep -rn "x-forwarded-for\|x-real-ip" app/api app/lib  # only in spam-filter.ts and route.ts

================================================================================
9. COMMIT + PR
================================================================================

Branch: feat/blog-comments-impl

Commit message:
"""
feat: blog comments via Notion + 4-layer auto-publish filter

Anonymous-by-default comments stored in a Notion data source. Submissions
pass through Turnstile + IP rate limit + regex heuristics + DeepSeek LLM
classifier (via Vercel AI Gateway). Approved comments appear immediately;
spam is silently rejected (status=spam in Notion). Owner moderates
reactively from Notion mobile.

5-minute edit window via signed JWT (jose, HS256) stored in browser
localStorage. Hashed IPs (no raw IP persisted). Comments list cached at
edge for 60s.

See ADR-003 for the design rationale and rejected alternatives.
"""

PR body:
- Reference ADR-003 and `docs/codex-prompts/003-blog-comments.md`.
- List the env vars the user must provision in Vercel before merging.
- Note the manual Notion setup (data source `Comments` schema in
  `docs/notion-comments-schema.md`).
- Note the Turnstile + Vercel KV integrations the user must enable.
- Include screenshots of the comments section live on a blog post.

DO NOT push or merge yourself. Stop after committing locally. Show the diff
and the file tree of new/modified files.
````
