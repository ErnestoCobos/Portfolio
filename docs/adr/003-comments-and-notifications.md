# ADR-003: Blog comments — backend, identity, notifications

**Status:** Proposed
**Date:** 2026-05-06
**Deciders:** ernesto@cobos.io

## Context

cobos.io tiene 4 posts (ES + EN), audiencia técnica (cloud architects, platform engineers, DevSecOps). Quiero:

1. **Comentarios por post** — al final del artículo, lectores pueden dejar feedback / preguntas / corrections.
2. **Notificaciones para mí** cuando llega un comentario nuevo — sin que tenga que hacer pull periódico al sitio.
3. **Cero monthly fee fijo** y mantenimiento operativo bajo (soy solo yo).
4. **Hard constraint: no Supabase** — quiero entender qué estoy dejando en la mesa, no usarlo.

**Stack actual ya provisto:**
- Next.js 16 SSG bilingüe (`(es)` + `/en`) en Vercel team `ecgcore`, project `portfolio`
- GHA cron `Sync from Notion` 7am/7pm CT (PR #8/#9/#10 mergeados)
- Notion COBOS database + integración `cobos.io site sync` con read+update+insert
- Vercel AI Gateway con DeepSeek V4 Pro (translator)
- Repo público GitHub `ErnestoCobos/Portfolio`

**Forces clave:**
- Audiencia técnica → fricción de "login con GitHub" es aceptable (la mayoría ya tienen cuenta)
- Sitio es SSG estático → cualquier comment system tiene que ser client-side render o ISR
- Quiero notificaciones nativas (mobile push o email) sin construir un sistema de email yo mismo
- Aesthetic terminal-style del sitio → comentarios markdown encajan, threading rico no
- Bilingüe → comentarios deberían ser per-locale o globales con language tag (decidir después)

## Decision

**Notion-backed custom comments con auto-publish + 4-layer filter.**

Comments anónimos por default, almacenados en una nueva Notion data source `Comments`. Cada submission pasa por 4 capas de filtrado antes de aparecer en el sitio:

1. **Cloudflare Turnstile** — bloquea bots automatizados (free, invisible)
2. **Rate limit por IP** (Vercel KV) — max 5 comments/hora/IP
3. **Heurística regex** — blocklist de keywords obvios + URL count + length
4. **LLM classifier** vía Vercel AI Gateway (DeepSeek V4 Flash, ~$0.0001/call) — detecta spam/abuse/off-topic más sofisticado

Si los 4 filtros pasan → `status: "approved"` → visible inmediatamente.
Si alguno falla → `status: "spam"` → guardado en Notion para analytics, nunca visible.

Moderación es **reactiva, no preventiva**: la app de Notion mobile (que el autor ya usa todo el día) recibe push notification por cada comment approved. Si algo se cuela el filtro, 1 swipe → archive el row → cache CDN expira (max 60s) → invisible.

Rationale corto:
- Reusa la infra de Notion ya provista (DB + integration + token + push notifs)
- Anonymous-by-default → 100% audiencia puede comentar (no excluye no-GitHub-users)
- Notion mobile push notifications nativas — no extra wiring
- Data ownership total (rows en mi workspace, exportables anytime)
- Visual aesthetic 100% custom (encaja con la estética terminal del sitio, sin pelear contra CSS de un iframe)
- Bilingüe limpio: campo `Locale` per-row, comments mezclados o filtrados según prefiera
- Migración out trivial: export Notion DB → JSON

Pivot vs versión anterior del ADR (Giscus): la versión inicial recomendaba Giscus por time-to-ship (~2h vs ~6h Notion-backed). Tras review, las 4h extra se amortizan en 5-10% de visitantes anónimos que NO querían crear GitHub account, más data ownership, más alineación con el resto del stack ya construido.

Implementation prompt completo en `docs/codex-prompts/003-blog-comments.md` (listo para Codex CLI).

## Options Considered

### Option B — Notion-backed con auto-publish + 4-layer filter ← **PICK**

Frontend: `<Comments postSlug={slug} locale={locale} />` con form (body required, name + email opcionales) + lista renderizada client-side. Honeypot field invisible para bots ingenuos.

Backend: Edge/Node API routes en Next.js:
- `POST /api/comments` — pipeline de 4 capas + escritura a Notion + retorno con edit-token JWT (5min TTL)
- `GET /api/comments/list?slug=...` — query a Notion filtrada a `Status="approved"`, cache CDN 60s
- `PATCH/DELETE /api/comments/[id]` — autorizado por edit-token, ventana 5min para que el autor edite/borre su propio comment

Notificaciones: push nativa de Notion mobile cuando se crea page nueva en `Comments` data source. Sin email systems, sin Slack webhooks que mantener.

Spam strategy: capas defensivas en orden de costo creciente.

| Layer | Cost | Latency | Catches |
|---|---|---|---|
| Turnstile | $0 | ~50ms | Automated bots (~99%) |
| Rate limit (Vercel KV) | $0 | ~10ms | Flooding humano y abuso de mismo origen |
| Regex heuristic | $0 | <1ms | Spam obvio (viagra, casino, shorteners, multi-URL) |
| LLM (DeepSeek V4 Flash via AI Gateway) | ~$0.0001/call | ~500-700ms | Spam sutil, abuse, off-topic |

| Dimensión | Assessment |
|---|---|
| Complexity | Med — 3 API routes + 1 client component + 6 lib modules + 1 Notion DB |
| Cost | $0 base + ~$1-3/mes en LLM calls al volumen previsto |
| Scalability | OK — Notion API rate limit 3 req/s; cache CDN 60s amortiza GETs |
| Ops burden | Bajo — moderation reactiva en Notion mobile (~minutos/día worst case) |
| Notifications | **Native Notion push** (mobile + desktop) por cada approved comment |
| Identity | Anonymous OK — name + email opcionales |
| Anonymous comments | ✅ |
| Markdown / threading | Markdown sí (marked + DOMPurify); threading flat en v1, parent_id field reservado para v2 |
| Vendor lock-in | Bajo — comentarios son rows en mi Notion; export trivial |
| Bilingüe handling | Per-locale via `Locale` field; comments compartidos entre `/blog/<slug>` y `/en/blog/<slug>` (mismo thread, idiomas mezclados) |

**Pros:**
- 100% audiencia puede comentar (sin GitHub login required)
- Reusa infra de Notion ya construida (cero nuevo SaaS)
- Notification path nativo (la app de Notion ya está en mi celular)
- Data ownership 100%: rows en mi workspace
- Match visual perfecto con estética del sitio (componente custom, no iframe)
- Auto-publish = UX excelente para commenter (instant feedback)
- Filtros defensivos en orden de costo creciente — solo el LLM cuesta plata, y solo si las capas baratas pasan
- Edit window de 5min para autocorrección sin login
- Hashed IPs (no raw IP persiste — privacy correcta)
- Reactive moderation = vos no estás en el critical path

**Cons:**
- ~6-8h implementation effort (vs ~2h Giscus)
- Spam sutil que pase los 4 filtros queda visible hasta que vos lo veas en mobile (~minutos worst case)
- LLM calls añaden ~500ms de latencia al POST (aceptable)
- Si Notion API tiene outage, comments no cargan (mitigable: stale-while-revalidate cache hit sigue sirviendo)
- Mantenimiento del filtro regex: hay que actualizar blocklist ocasionalmente

---

### Option A — Giscus (GitHub Discussions) [previously the pick, now alternative]

Embed iframe que apunta a una categoría de GitHub Discussions del repo `ErnestoCobos/Portfolio` (o un repo dedicado `cobosio-comments` si quiero separar el ruido del repo principal). Cada blog post mapea 1:1 a un Discussion thread (lazy-created en el primer comentario, mediante mapping por path).

| Dimensión | Assessment |
|---|---|
| Complexity | Low — `@giscus/react` ~3kb, un componente |
| Cost | $0 forever (GitHub Discussions es free incluso en repos públicos) |
| Scalability | Ilimitado — no es mi infra |
| Ops burden | Cero — moderation via GitHub UI; spam handled by GitHub |
| Notifications | **Native** — email + mobile push de GitHub cuando alguien comenta en mi repo |
| Identity | GitHub OAuth (visitor needs cuenta) |
| Anonymous comments | ❌ No (por diseño) |
| Markdown / threading / reactions | ✅ Built-in |
| Vendor lock-in | Bajo — comentarios son Discussions, exportables via GitHub API |
| Bilingüe handling | Mismo Discussion para ES + EN del mismo post (mapping por slug, no por full path) |

**Pros:**
- Implementación más barata posible (1 componente, sin API routes, sin DB)
- Notificaciones que YA recibo (no tengo que provisionar Resend/Slack webhook)
- Audiencia técnica = la fricción de GitHub login es aceptable (ya están loggeados)
- Markdown comments encajan con la estética terminal/dev del sitio
- Si Ernesto quiere "approve" antes de mostrar, GitHub Discussions soporta moderation
- Migración out: trivial — los Discussions persisten aunque quites Giscus del frontend

**Cons:**
- Visitantes no-tech NO pueden comentar (audience real es ~95% tech para cobos.io, pero aun así)
- No comments anónimos (algunos prefieren no revelar identidad)
- iframe ≠ contenido del HTML — comments NO indexados por Google (no es objetivo de SEO)
- Si decido sunset GitHub repo público, los comments se van con él (mitigación: mantenerlo público)

---

### Option C — Vercel KV + Resend (full custom, ownership máximo)

Storage: Vercel KV (Redis) con keys `comment:<slug>:<id>` y secondary index `comments:<slug>` (sorted set).
Notifications: Resend (transactional email API) → email a `ernesto@cobos.io` en cada POST.
Frontend: igual que B.

| Dimensión | Assessment |
|---|---|
| Complexity | High — KV schema + Resend integration + admin UI for moderation |
| Cost | KV free tier 30k commands/day; Resend free 100 emails/day ($0 mientras no escalamos) |
| Scalability | Excelente — Redis es bestia |
| Ops burden | Alto — sin moderation UI built-in, hay que construirlo |
| Notifications | Email via Resend (extra signup + API key + DNS verify) |
| Identity | Anonymous OK |
| Anonymous comments | ✅ |
| Markdown / threading | Lo que construya |
| Vendor lock-in | Medio — KV ↔ Redis migration es trivial; Resend ↔ otro provider trivial |
| Bilingüe handling | Igual que B |

**Pros:**
- Full ownership, full control
- Redis es subsegundos, escalable
- Si quiero realtime pushed updates después, Vercel Live + KV pubsub me lo da

**Cons:**
- Más servicios para operar (KV + Resend = 2 more dashboards)
- Tengo que construir: admin UI para moderation, threading recursive, archivado, CSV export
- Resend free tier es 100 emails/día — ok para mi escala pero un día hay que pagar
- Más código = más bugs + más mantenimiento
- "Notificación = email" es 2x más fricción que push nativo

---

### What Supabase WOULD give (rejected per constraint, analysis only)

Si abriéramos Supabase, sería:
- **Postgres** con un schema `comments(id, post_slug, locale, author_name, body, parent_id, status, created_at)`
- **Row-Level Security**: SELECT solo `status='approved'`, INSERT permitido a `anon` con rate limit
- **Auth** opcional: anonymous, magic link, OAuth (GitHub, Google) — todo built-in
- **Realtime subscriptions**: WebSocket que pushea live updates al comments list (los visitantes ven nuevos comments aparecer sin refresh)
- **Edge Functions** for moderation hooks
- **DB Webhooks** → Slack o email automático en INSERT
- **Studio** dashboard para moderar visualmente

| Dimensión | Supabase Free | Supabase Pro |
|---|---|---|
| DB size | 500MB | 8GB+ |
| Bandwidth | 5GB/mo | 250GB |
| Auth users | 50k MAU | 100k MAU |
| Realtime | Sí | Sí |
| Cost | $0 | $25/mo per project |

**Lo que perdés al no usar Supabase:**
1. **Realtime live updates** — comments aparecen sin refresh. Es un *nice-to-have* para blogs, no esencial.
2. **Auth turnkey** (anon + OAuth + magic link) — si después quiero gated content u otro feature, Supabase auth es plug-and-play. Por ahora no lo necesito.
3. **Admin Studio** — vista visual para moderar. Notion + GitHub Discussions ya me dan eso.
4. **Postgres power** (full-text search, joins, transactions) — para 10-1000 comments por post, KV o Notion alcanzan.

**Lo que NO perdés:**
1. Storage de comments — KV/Notion/SQLite/lo-que-sea funciona
2. Rate limiting + spam — Turnstile + middleware en Vercel funcionan igual
3. Notifications — webhooks + email son externos al storage, agnostic
4. Postgres específicamente — Neon, Vercel Postgres, Turso, todos free tiers > suficientes

**Veredicto:** Supabase es excelente cuando vas a usar 3+ de sus features (DB + Auth + Realtime + Storage + Edge Functions). Para *solo* "comments con notif", es overkill. Constraint del usuario es correcto.

## Trade-off Analysis

| Eje | Notion-backed (B) ← pick | Giscus (A) | KV+Resend (C) |
|---|---|---|---|
| Time to ship | 6-8h | **2h** | 8h+ |
| Mantenimiento ongoing | ~30min/mo (delete obvious slips) | **0h/mo** | 3h/mo (build admin UI) |
| Fricción para comentar | **Baja** (form anon) | Alta (login GH) | Baja |
| Notification quality | **Native push Notion** | **Native push GH** | Email |
| Data ownership | **Alto** (mi Notion) | Medio (GitHub) | **Alto** (mi KV) |
| Visual aesthetic | **Custom (encaja)** | iframe GitHub-styled | Custom |
| Migración out | Trivial (Notion → JSON export) | Trivial (GitHub Discussions API) | Trivial |
| Risk si vendor cambia precio | Bajo (Notion API estable) | Cero (GitHub no va a cobrar) | Bajo |

Decisivo: **anonymous-by-default + reusa Notion infra + match aesthetic**. Las 4h extra vs Giscus se amortizan en (a) ~5-10% de visitantes anónimos que SÍ van a comentar, (b) data ownership real, (c) componente visual cohesivo con el sitio. El 4-layer filter cubre el ops gap que Giscus llenaba con GitHub auth.

## Consequences

**Becomes easier:**
- Anyone can comment — sin requisitos de cuenta externa
- Notion mobile push notifications nativas en cada approved comment
- Moderation reactiva con UX Notion mobile (1 swipe → archive row)
- Component visual 100% custom (sin pelear contra CSS de iframe externo)
- Bilingüe sano: campo `Locale` separa cuando hace falta

**Becomes harder:**
- Más código que mantener (vs zero código de Giscus): 3 API routes + 1 client component + 6 lib modules
- Spam sutil que pase los 4 filtros queda visible hasta que vos lo veas (ventana de minutos)
- Notion API rate limit (3 req/s): cubierto por cache CDN 60s + fail-open en LLM
- Implementación toma 6-8h (vs 2h Giscus)

**Lo que vamos a revisitar:**
- Después de 3 meses: si ratio false-positive del LLM > 5%, ajustar prompt o reemplazar el clasificador
- Si volumen aumenta a > 100 comments/día: agregar threading (parent_id ya reservado en schema)
- Si Notion API hits rate limit consistente: introducir queue layer en Vercel KV
- Si quiero realtime updates (live comments aparecen sin refresh): Server-Sent Events (no necesita WebSocket)

## Action Items

### Setup manual del usuario (one-time)

1. [ ] En Notion, dentro de la page "Blog Posts" (la misma que aloja COBOS), crear nueva data source `Comments` con el schema de §3 del prompt en `docs/codex-prompts/003-blog-comments.md`
2. [ ] Connections menu → agregar la integration `cobos.io site sync` a la nueva data source
3. [ ] Cloudflare → crear Turnstile site (cobos.io + *.vercel.app, modo Managed) → guardar site key + secret
4. [ ] Vercel project `portfolio` → Storage → Create KV (auto-injecta `KV_REST_API_URL` + `KV_REST_API_TOKEN`)
5. [ ] Generar `COMMENT_EDIT_SECRET`: `openssl rand -hex 32`
6. [ ] Vercel env vars (all environments): NOTION_COMMENTS_DB, NOTION_COMMENTS_DATA_SOURCE, NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, COMMENT_EDIT_SECRET

### Implementación (vía Codex)

7. [ ] Hand `docs/codex-prompts/003-blog-comments.md` a Codex CLI
8. [ ] Review el diff que produce — verificar 4 capas + IP hashing + edit window
9. [ ] PR review + merge
10. [ ] Probar en preview: submit 1 comment legit, 1 spam obvio (BUY VIAGRA NOW), 1 borderline → verificar status correcto en Notion
11. [ ] Suscribirse a la data source `Comments` en Notion mobile (notifications)

## Appendix — Codex CLI implementation prompt

El prompt completo y self-contained vive en [`docs/codex-prompts/003-blog-comments.md`](../codex-prompts/003-blog-comments.md). Implementa los 4 layers, los 3 API routes, el client component, sanitización con marked + DOMPurify, edit window con jose JWT, IP hashing, rate limit en Vercel KV, y los strings i18n para ES + EN.

Listo para `codex` o `claude` CLI desde la raíz del repo:

```
cat docs/codex-prompts/003-blog-comments.md | pbcopy   # mac
# luego pegar en tu CLI de elección
```

(Sigue abajo el prompt original del Giscus path, conservado por si querés un fallback rápido.)

### Fallback alternativo — Giscus prompt (descartado, conservado for reference)

```
You are working in the repo cobosio (Next.js 16, App Router, bilingual ES + EN with route groups, deployed on Vercel). Add a Giscus-based comments section to every blog post. Follow this spec exactly:

## Goal
Add comment functionality to blog posts via Giscus (GitHub Discussions backend). Same component for both ES and EN posts. Notifications to repo owner happen via GitHub natively, no extra wiring needed.

## Pre-reqs the user has already done (DO NOT do these — assume done)
- Created GitHub Discussions on the repo with category "Blog comments"
- Installed Giscus GitHub App on the repo (https://github.com/apps/giscus)
- Has the following config from https://giscus.app (will be passed via env vars):
    NEXT_PUBLIC_GISCUS_REPO            (e.g. "ErnestoCobos/Portfolio")
    NEXT_PUBLIC_GISCUS_REPO_ID         (e.g. "R_kgDOXXXXXX")
    NEXT_PUBLIC_GISCUS_CATEGORY        (e.g. "Blog comments")
    NEXT_PUBLIC_GISCUS_CATEGORY_ID     (e.g. "DIC_kwDOXXXXXX")

## Files to create
1. `app/components/Comments.tsx` — client component, "use client" directive, default export.
   - Props: { slug: string, locale: "es" | "en" }
   - Use `@giscus/react` (install via pnpm).
   - Configuration:
       repo            = process.env.NEXT_PUBLIC_GISCUS_REPO
       repoId          = process.env.NEXT_PUBLIC_GISCUS_REPO_ID
       category        = process.env.NEXT_PUBLIC_GISCUS_CATEGORY
       categoryId      = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID
       mapping         = "specific"
       term            = `post:${slug}`     // bilingual: same Discussion for ES + EN
       reactionsEnabled = "1"
       emitMetadata    = "0"
       inputPosition   = "top"
       lang            = locale
       loading         = "lazy"
       theme           = "transparent_dark"  // matches site dark theme
   - If any of the 4 env vars is missing, render a discreet `<aside>` saying "Comments are not configured yet." instead of the iframe — never throw, never break SSG build.
   - Wrap the component in a `<section aria-label="Comments">` with class names matching the existing article layout (look at `ArticleBody.tsx` and `app/globals.css` `.article-prose` for styling cues).

## Files to modify
2. The blog post page(s). Find them via:
       grep -rn "post.body\\|getPost(" app/
   You'll find them under `app/(es)/blog/[slug]/page.tsx` and `app/en/blog/[slug]/page.tsx` (or similar — the route group structure may differ slightly; trust grep).
   At the END of the article body (after the prev/next nav, before the closing `<main>` / `</article>`), import and render:
       <Comments slug={post.slug} locale={locale} />
   - On the server-component blog post page, importing a client component is fine. Pass plain string props.
   - Make sure `locale` is available — read from the function-level `params` or from `parseLocaleFromPath(pathname)` if needed.

3. `package.json` — add to `dependencies`:
       "@giscus/react": "^3.1.0"
   Then run `pnpm install` (do NOT change other deps).

4. `.env.example` — add the 4 env var names with empty values + a comment block explaining where to get them (link to https://giscus.app).

5. `next.config.ts` — verify (don't change unless needed) that `NEXT_PUBLIC_*` vars don't need explicit `env:` block (they are auto-inlined by Next).

## Constraints (HARD)
- Do NOT add a backend route, API endpoint, DB, KV, or Redis. Giscus is iframe-only.
- Do NOT add a third-party comment library other than @giscus/react.
- Do NOT change the build output mode — site must remain SSG.
- Do NOT remove or rename any existing exports in app/ or app/lib/.
- Lint clean: `pnpm lint` must pass.
- Type clean: `pnpm exec tsc --noEmit` must pass (Next 16 strict TS).
- Build clean: `pnpm build` must complete with no warnings (besides the punycode deprecation already present).

## Acceptance criteria
1. `pnpm dev`: navigate to /blog/gitops-regulados (ES) and /en/blog/gitops-regulados (EN). Both pages show the Giscus iframe at the bottom, with the Spanish UI and English UI respectively. Clicking the iframe loads GitHub auth flow.
2. `pnpm build`: succeeds, the blog post pages remain in the static (○) prerender list (NOT dynamic ƒ).
3. Lighthouse: blog post page accessibility score stays ≥ 95 (the new section has aria-label).
4. Mobile (375px): the iframe is responsive, no horizontal scroll.
5. If env vars are missing on a Vercel preview deploy, the page still renders — comments section shows the fallback "Comments are not configured yet." message.

## Verify before opening PR
- `pnpm lint && pnpm exec tsc --noEmit && pnpm build`
- Open both /blog/<slug> and /en/blog/<slug> for at least 2 posts and visually confirm the comments section appears.

## Commit message
"feat: blog comments via Giscus (GitHub Discussions backend)"

## PR body
- Mention ADR-003 in the description
- Note that 4 env vars (NEXT_PUBLIC_GISCUS_*) need to be set in Vercel project settings before merging — list them
- Note that GitHub Discussions must be enabled on the repo + Giscus app installed (one-time setup)

Stop. Show me the diff. Do not push or merge.
```

## Open questions / future work

- **Threading recursivo**: el schema reserva `Parent` field pero el render v1 es flat. Si los comments empiezan a tener replies frecuentes, agregar render recursivo + UI "reply" (~2h).
- **Reactions** (👍 ❤️): no implementadas en v1. Si las quiero, agregar campo `Reactions` JSON a la data source + un endpoint POST para incrementar — sin auth (rate-limited por IP). 1-2h.
- **Email notification al commenter cuando recibe reply**: opcional v2. Usaría el campo `Email` que ya capturamos (privado). Resend free tier 100 emails/día sobra. Solo si threading se activa.
- **Auto-spam tuning**: si false-positive rate del LLM sube > 5%, ajustar el prompt de `runLLMCheck` o cambiar a `deepseek/deepseek-v4-pro` (más caro pero más preciso).
- **Comment search en el sitio**: actualmente no hay full-text search de comments. Si llegan a ser muchos, agregar un endpoint GET con query param `q=`. Notion API soporta full-text search vía `notion-search`. Backlog.
- **Trusted commenter promotion**: tras 1 comment approved, marcar el `IpHash` como "trusted" en KV → skip layers 3+4 en próximas submissions del mismo IP. Reduce latencia + costo. Backlog para v2.
- **Migración a Opción A (Giscus)**: condicional inverso — si moderation reactiva consume > 30min/día por volumen de spam que se cuela, swap del componente cliente a Giscus. La data de Notion se queda como historical archive.
