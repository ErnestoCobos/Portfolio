# start.cobos.io — diseño

**Fecha:** 2026-08-23 · **Estado:** implementado en v1

## Propósito

Página de inicio personal (browser start page / nueva pestaña) para Ernesto,
con la estética operator-console de cobos.io. Pública, sin auth, sin secrets.

## Arquitectura

- Vive dentro del proyecto Next.js actual (no repo nuevo).
- `proxy.ts` reescribe por host: `start.*` → árbol `app/start/` (rewrite, no
  redirect; la URL se mantiene limpia). Matcher: `["/", "/en", "/start"]`.
- `app/start/layout.tsx` — root layout propio (`<html lang="es">`, fuentes
  compartidas vía RootShell, Analytics + SpeedInsights). `robots: noindex`.
- `app/start/page.tsx` — server component; chequeo de status con ISR 60s.
- `app/start/StartClock.tsx` — reloj en vivo (cliente, es-MX).
- `app/start/StartSearch.tsx` — prompt de búsqueda; Enter → Google; `/`
  refocus. Hint "⏎ google" oculto < 640px (`.start-hint` en globals.css).

## Contenido v1

- `$ date` — fecha/hora en vivo (es-MX, CDMX).
- `$ search` — input autofocus, Enter → google.com/search.
- `$ ls ./quicklinks` — grupos: dev/ (github, vercel, notion), productos/
  (enkiflow, getdecant, voltaflow, connver), ops/ (gmail, firstbase),
  cobos/ (cobos.io, blog).
- `$ status --watch 60s` — HEAD server-side a enkiflow.com, getdecant.com,
  voltaflow.com, connver.com, cobos.io; código + latencia; fallback a GET
  si HEAD da 405/501; nunca rompe la página (catch → dot rojo).
- Chrome de ventana tipo terminal, status bar `cobos::start · online`.

## Deploy

- Vercel: agregar dominio `start.cobos.io` al proyecto cobosio.
- DNS: `CNAME start → cname.vercel-dns.com`.

## Fuera de scope (v2+)

Métricas reales (Vercel/Stripe APIs), notas del día, versión EN, tema claro.
