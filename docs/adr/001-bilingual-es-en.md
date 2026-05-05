# ADR-001: Bilingüe es/en — URL strategy, content storage, SEO

**Status:** Accepted
**Date:** 2026-05-05
**Deciders:** ernesto@cobos.io

## Context

cobos.io es 100% en español: UI, los 4 posts, SEO metadata, 404/500, RSS, llms.txt, OG images. Stack: Next.js 16 App Router + markdown source of truth en `content/blog/<slug>.md` + JSON-LD per post + sitemap + dynamic OG + RSS feed. Locale declarado en metadata: `es_MX`.

Hacer el sitio bilingüe afecta 8 superficies: routing, ~120 UI strings inline, los 4 posts, SEO metadata, JSON-LD `inLanguage`, OG images con texto, feeds (sitemap/RSS/llms), y rutas especiales (404/500/raw/manifest).

**Forces clave:**
- Zero-break en URLs existentes (preservar tracción SEO)
- hreflang correcto + canonical per-locale + sitemap per-locale
- Translation workflow sostenible (no tocar 5 archivos por post nuevo)
- Switcher UX mínima, persistente vía cookie

## Decision

Estrategia híbrida co-located:

1. **URL**: ES en `/` (sin prefijo), EN bajo `/en/...`. App Router con `(i18n)/[locale]` opcional segment. Zero breaking change para URLs existentes.
2. **Content**: archivos co-located por slug — `content/blog/<slug>/{es.md, en.md, cover.jpg}`. Loader detecta legacy `<slug>.md` durante migración para back-compat.
3. **UI strings**: dictionary tipado por locale en `app/lib/i18n/{es.ts, en.ts}` con shape compartido. Server-side por default, hook `useT()` para client components.
4. **Translation workflow**: LLM-assisted draft + revisión manual del autor. Los 4 posts existentes → drafts EN generados con context técnico, revisados antes de commit.

## Trade-offs aceptados

- **Asimetría URL**: ES sin prefijo, EN prefijado. Mitigado con `hreflang="x-default"` apuntando a la versión ES — Google entiende.
- **Posts sin traducción**: si un post solo tiene `es.md`, NO aparece en `/en/blog`. El switcher detecta y muestra "sólo disponible en ES". Mejor que contenido medio-traducido.
- **Hand-rolled vs i18n library**: `next-intl` o `react-i18next` agregan ~30kb runtime para 120 strings sin plurales complejos. No vale. Si llegamos a 3+ locales o necesitamos plurales, migrar a `next-intl` (trivial).
- **Sitemap/RSS/llms duplicados**: el código DRY (template + loop por locale) pero el output es 2x. Aceptable.

## Consequences

**Becomes easier:**
- Agregar 3er locale: copiá `es.ts` → `de.ts`, agregá `de.md` por post.
- Posts parcialmente traducidos: comportamiento explícito en lugar de fallar silenciosamente.

**Becomes harder:**
- Cada post nuevo: ~2x trabajo (ES + EN draft).
- UI copy changes: tocar 2 dictionaries en lock-step (mitigado con TS — falta key tira error).
- Build time: 2x de páginas SSG (8 articles + 8 OG images).

**To revisit:**
- Si tracción EN supera ES → invertir default
- Si posts >10 → consider serving locale-specific RSS feeds
- Si necesitamos ICU plurales → migrar a `next-intl`

## Implementation phases

| Phase | Scope | Effort |
|---|---|---|
| 1 | i18n scaffold + dictionary extraction (zero behavior change) | 2h |
| 2 | Content migration to folder + post translations | 4h |
| 3 | `/en/...` routing + SEO hreflang + per-locale feeds/OG | 3h |
| 4 | Language switcher + cookie persistence + middleware | 1.5h |
| 5 | Polish (PROFILE bio, error messages, form labels, etc) | 1h |

Total estimado: ~11.5h.
