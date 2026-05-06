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

**Giscus** (GitHub Discussions como backend) en una primera fase, con un plan claro de migración a "Notion-backed custom" si la fricción de GitHub auth limita conversión.

Rationale corto:
- Zero backend code, zero DB, zero monthly fee
- Notificaciones nativas via GitHub email + mobile push (ya las uso todo el día)
- Markdown + threading + reactions vienen incluidos
- Spam protection vía GitHub's existing systems
- Login con GitHub es aceptable para audiencia tech
- Implementation = ~2h: instalar `@giscus/react`, embeber en blog post page, configurar repo Discussions
- **Si en 3 meses la tasa de comentarios es < 10/mes por fricción de auth**, migramos a Opción B (Notion-backed con anonymous allow). El switcheo es solo el componente cliente; el resto del código no cambia.

## Options Considered

### Option A — Giscus (GitHub Discussions) ← **PICK**

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

### Option B — Notion-backed custom (anonymous allow)

Frontend: `<Comments postSlug={slug} locale={locale} />` con form (nombre, email opcional, body markdown) + lista renderizada client-side via SWR.

Backend: Vercel Edge Function (`app/api/comments/route.ts`):
- `POST` → valida Cloudflare Turnstile, guarda comment en una NUEVA Notion data source `Comments` (slug, locale, name, email, body, createdAt, status='pending')
- `GET ?slug=...&locale=...` → lee comments donde `status='approved'`

Notificaciones: Notion mobile push nativa cuando se crea una page nueva en `Comments` data source. Yo modero desde Notion (cambio status a `approved` o `spam`). Workflow GHA opcional cada 5min para sync approved → ISR revalidation.

| Dimensión | Assessment |
|---|---|
| Complexity | Med — 1 API route + 1 Notion DB + 1 client component + Turnstile |
| Cost | $0 (Notion API 1k req/day free, Turnstile free, Vercel Edge Functions incluido en hobby) |
| Scalability | OK — Notion API rate-limit a ~3 req/s, fine para mi tráfico |
| Ops burden | Bajo — moderation en Notion mobile como ya hago con posts |
| Notifications | **Native Notion push** (mobile + desktop) cuando llega un comment |
| Identity | Anonymous OK (nombre + email opcional) |
| Anonymous comments | ✅ |
| Markdown / threading | Markdown sí, threading hay que construir (parent_id field) |
| Vendor lock-in | Bajo — comentarios son rows en mi Notion; export trivial |
| Bilingüe handling | Comments per-locale (campo `locale` en cada row) |

**Pros:**
- Anyone can comment — no GitHub login required
- Notion as backend: usa infra que YA tengo, integración + token YA provistos
- Notification path nativo (la app de Notion ya está en mi celular)
- Moderation UX excellent (Notion's own UI)
- Data ownership 100%: rows en mi workspace, exportables a CSV/Markdown anytime
- Reusa el patrón de pipeline ya validado: Notion → consumed by Next.js

**Cons:**
- ~6h implementation effort (vs ~2h Giscus)
- Spam: Cloudflare Turnstile maneja bots, pero spam humano queda — necesita la moderación manual
- No threading sin trabajo extra (parent_id + recursive render)
- Notion API rate limits: 3 req/s. Con burst de comments en un viral post podría hit el cap. Mitigación: queue en Vercel KV.
- Sin OAuth = no se puede saber "este es ese tipo de Twitter" — feedback queda más anónimo

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

| Eje | Giscus (A) | Notion (B) | KV+Resend (C) |
|---|---|---|---|
| Time to ship | **2h** | 6h | 8h+ |
| Mantenimiento ongoing | **0h/mo** | 1h/mo (moderar) | 3h/mo (moderar + ops) |
| Fricción para comentar | Alta (login GH) | **Baja** (form anon) | Baja |
| Notification quality | **Native push GH** | **Native push Notion** | Email |
| Data ownership | Medio (GitHub) | **Alto** (mi Notion) | **Alto** (mi KV) |
| Migración out | Trivial | Trivial | Trivial |
| Risk si vendor cambia precio | Cero (GitHub no va a cobrar Discussions) | Cero (Notion API estable) | Bajo |

Decisivo: **time-to-ship + zero ops + notification calidad**. La fricción de GitHub login para audiencia técnica es aceptable hasta que se demuestre lo contrario. Si los datos muestran que hay comentadores potenciales que abandonan al ver "Sign in with GitHub", migramos a B en una tarde — y los Discussions existentes los exporto via API.

## Consequences

**Becomes easier:**
- Tener canal de feedback en cada post sin construir backend
- Recibir notificaciones de comments nuevos sin instrumentar email
- Si decido abrir un repo separado `cobosio-comments` para no contaminar el repo principal, Giscus apunta ahí trivialmente
- Moderation: GitHub Discussions tiene "lock thread", "delete", "mark as off-topic"

**Becomes harder:**
- Conversión de visitantes no-GitHub (~5% de la audiencia) — no van a comentar
- Reusing comments si el día de mañana cobos.io migra fuera de GitHub-as-CMS — Discussions queda como historical archive en GitHub, no se mueve
- SEO de comments: cero. Los comments en iframe NO son indexables. Para mi caso de uso (blog técnico, no Q&A site) no importa, pero documentado

**Lo que vamos a revisitar:**
- Después de 3 meses live: si ratio comments/views < 1%, asumir fricción GitHub es bloqueante → migrar a B
- Si lanzo features que requieran user auth (gated content, paid tiers, etc.), reconsiderar todo — Supabase vuelve a la mesa porque la auth + DB + realtime amortizan

## Action Items

1. [ ] Crear repo separado `ErnestoCobos/cobosio-comments` (o usar `Portfolio` direct) — separación opcional
2. [ ] Habilitar GitHub Discussions en el repo elegido + crear category `Blog comments`
3. [ ] Instalar Giscus app en el repo: https://github.com/apps/giscus
4. [ ] Generar config en https://giscus.app — guardar `data-repo`, `data-repo-id`, `data-category`, `data-category-id`, `data-mapping=pathname`
5. [ ] Crear `app/components/Comments.tsx` (client component) usando `@giscus/react`
6. [ ] Embeber `<Comments slug={post.slug} locale={locale} />` al final de `app/(es)/blog/[slug]/page.tsx` y `app/en/blog/[slug]/page.tsx` (o donde sea que viva el blog post page)
7. [ ] Theme toggle: Giscus tiene built-in `theme` prop — usar `transparent_dark` o un custom CSS file en `public/giscus-theme.css` que match el sitio
8. [ ] Confirmar que mobile renders OK (iframe responsive)
9. [ ] PR con label `feature` + screenshot del componente live
10. [ ] Después de merge, suscribirse a all activity en el repo de Discussions para recibir notifs (Settings → Notifications → Watching)

## Appendix — Codex CLI implementation prompt

Copy-paste lo siguiente a Codex CLI (`codex` o `claude` o lo que uses). Asume que el usuario corre Codex desde la raíz del repo `cobosio` (Next.js 16 App Router).

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

- **Comment notifications via mobile**: GitHub mobile already does this. If en algún momento quiero a Slack channel también, agregar un GitHub Action `on: discussion: types: [created]` que postee a Slack webhook (10 líneas YAML).
- **Spam moderación bulk**: si el volumen sube, Discussions tiene "Block user" y "Lock conversation". No hay un dashboard de "approve all" — pero a la escala mía, fine.
- **Comment search**: Giscus no indexa search en el sitio. Si quiero, puedo extraer comments via GitHub Discussions API + indexar en el sitemap. Backlog.
- **Migración a Opción B (Notion-backed)**: condicional sobre métricas. Definir "trigger metric" precisa: e.g., "si en 3 meses rate de comments por view < 0.5%, migrar". Trackear via Vercel Analytics + GitHub Discussions count.
