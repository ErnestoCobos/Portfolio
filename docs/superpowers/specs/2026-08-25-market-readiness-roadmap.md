# Market-Readiness Roadmap — cobos.io

**Date:** 2026-08-25 · **Status:** approved by user · **Source:** 4-way holistic audit (market research, content/conversion, technical/SEO, design trends)

## Thesis

The site is top-decile technically but sub-sells: it demonstrates competence, not results, and offers no transactional path. The winning move is not more effect — it is **real data + measurable proof + restricted craft**, culminating in the site's unique defensible idea: a control plane showing telemetry from Ernesto's own production systems.

## Phase A — Credibility (highest impact)

- **A1 ProofStrip:** replace vanity metrics (9+ years, 29 tools, 4 certs) with outcome metrics (uptime managed, SaaS users, FinOps savings, migration scale). *Needs real numbers from Ernesto.*
- **A2 Trends de-mock:** the section's sparklines/rollouts/tenant counts are seeded-rand fakes. Replace with real cited data (CNCF adoption) or own telemetry; never present generated numbers as real. *No user data needed.*
- **A3 Testimonials:** populate `TESTIMONIALS` (currently `[]`) with 2-3 real attributed quotes. *Needs quotes from Ernesto.*
- **A4 Experience with results:** one-line outcomes with real figures (services migrated, downtime, cost delta). *Needs real figures; conservative ranges acceptable if flagged as such.*

## Phase B — Conversion

- **B1 Dual hero CTA:** keep `./view-work.sh`, add `./book-intro.sh` → Cal.com/Calendly 30min. *Needs booking link.*
- **B2 "Trabaja conmigo" block in Contact:** availability, engagement model (diagnóstico → arquitectura → migración), indicative pricing. *Needs availability/pricing.*
- **B3 Contact form with real backend** (Next.js API route + Resend or similar) with mailto fallback; the current "mail client opened" message lies when no client opens. *No user data needed (needs a Resend API key at deploy time — env var).*
- **B4 CV link in nav/hero** for the recruiter funnel. *No user data needed.*
- **B5 Conversion events** in Vercel Analytics: email click, CV view/download, booking click, SaaS outbound links, GitHub/LinkedIn. *No user data needed.*

## Phase C — Discovery

- **C1 FAQPage JSON-LD + visible FAQ section (ES/EN)** with commercial niche questions (migration, regulated Kubernetes, FinOps, DevSecOps audits). *Content drafted by agent, approved by Ernesto.*
- **C2 Service/Offer schema** for consulting + `/about` consolidation page + `BreadcrumbList` on blog posts + `CollectionPage` on indexes. *No user data needed.*
- **C3 llms.txt enriched** with outcome cases (numbers, not adjectives).
- **C4 Case study page** `/work/cases/monolito-a-eks` (Problema→Solución→Resultado) built from the existing blog post. *No user data needed.*

## Phase D — Defensible differentiation

- **D1 Real SaaS telemetry in the control plane** (public status/uptime/deploys of enkiflow/getdecant/connver) — the operator-console aesthetic stops being a metaphor.
- **D2 Effect audit:** cursor/marquee/grain must each justify itself commercially or be reduced.
- **D3 Variable-font kinetic type** (weight bound to scroll) replacing transform-only marquee.

## Phase E — Hygiene

- **E1 Lighthouse CI blocking** (after threshold tuning).
- **E2 Degrade AtmosphereCanvas on low-end** (`hardwareConcurrency <= 4` / `pointer: coarse` → CSS fallback).
- **E3 SEO e2e:** sitemap URLs return 200, JSON-LD parses, canonicals unique.
- **E4 Locale-specific OG image** (EN shares currently render the ES card).

## Constraints (inherited from living-control-plane spec)

Zero new dependencies except where a backend service is unavoidable (Resend SDK or raw fetch — prefer raw fetch); static export preserved where possible (B3 requires a serverless function — Vercel-compatible, breaks pure static export: acceptable, flag it); tokens only; reduced-motion gates everything; sections not rewritten — additive changes via data files and wrappers; commit style `type(scope): message`.

## Execution order

E2+E5(B5) and A2 and C2/C4 can start immediately (no user data). A1/A3/A4, B1/B2 wait for Ernesto's real figures. B3 needs an API key at deploy.
