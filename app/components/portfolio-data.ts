/**
 * Source: github.com/ErnestoCobos public profile + repos.
 * Bio: cloud platform @ford · founder of @enkiflow + @getdecant.
 *
 * Bilingual fields use the shape `{ es, en }` and are resolved via
 * `pick(value, locale)` at the consumer. Stable references (URLs,
 * emails, identifiers, brand names) stay flat — they don't translate.
 */
import type { Locale } from "../lib/i18n";

/** Resolve a bilingual field by locale, falling back to ES. Useful when
 * a consumer wants a single string out of `{ es, en }`. */
export function pick<T>(field: { es: T; en: T }, locale: Locale): T {
  return locale === "en" ? field.en : field.es;
}

export type Bilingual = { es: string; en: string };

export const PROFILE = {
  name: "Ernesto Cobos",
  handle: "ErnestoCobos",
  role: "Cloud Architect · Platform Engineer · DevSecOps",
  loc: "México",
  email: "ernesto@cobos.io",
  github: "github.com/ErnestoCobos",
  linkedin: "linkedin.com/in/ernestocobos",
  blog: "cobos.io",
  company: "@Ford",
  founded: "@enkiflow + @getdecant",
  avatarUrl: "https://avatars.githubusercontent.com/u/10171659?v=4",
  bio: {
    es: "Cloud platform & DevSecOps en Ford. Fundador de @enkiflow & @getdecant. Builder persiguiendo ideas que se convierten en herramientas útiles.",
    en: "Cloud platform & DevSecOps at Ford. Founder of @enkiflow & @getdecant. Builder chasing ideas that turn into useful tools.",
  } satisfies Bilingual,
};

/**
 * Conversion placeholders (wave 2 · B1/B2). All three are EMPTY-or-plain
 * strings on purpose: nothing commercial renders until Ernesto fills them
 * in — no invented pricing, no dead links.
 */
/** B1 — booking link for the hero's `./book-intro.sh` CTA. Empty string
 * hides the CTA entirely; set e.g. "https://cal.com/ernestocobos/intro30"
 * to enable it (fires the reserved `cta_book` analytics event). */
export const BOOKING_URL = "";

/** B2 — availability line rendered verbatim in Contact's "work with me"
 * block. Placeholder until edited by hand. */
export const AVAILABILITY_NOTE = "2 slots Q4 2026";

/** B2 — indicative pricing note in Contact. Empty string HIDES the pricing
 * row completely (the default: no invented figures). */
export const PRICING_NOTE = "";

export const STACK = [
  { group: "Cloud", items: ["AWS", "GCP", "Azure", "Cloudflare"] },
  { group: "Platform", items: ["Kubernetes", "Argo CD", "Flux", "Terraform", "Pulumi"] },
  { group: "Runtime", items: ["Docker", "Istio", "Linkerd", "Envoy"] },
  { group: "Code", items: ["Next.js", "Vue/Nuxt", "TypeScript", "Laravel", "Django"] },
  { group: "Security", items: ["OPA", "Trivy", "Falco", "Vault", "SOPS"] },
  { group: "Observability", items: ["Prometheus", "Grafana", "OTel", "Loki", "Tempo"] },
];

/**
 * A1 outcome metrics for the ProofStrip. Replaces the old vanity stats
 * (years / project count / tool count / cert count): every figure here
 * is an ORDER-OF-MAGNITUDE claim a prospect can verify elsewhere on this
 * site — no invented users, MRR or uptime. Sources:
 *   - 3 SaaS → EnkiFlow, GetDecant, Connver (all live in PROJECTS).
 *   - 210k messages → apple-mail-mcp's own repo/site ("FTS5 over a real
 *     210k-message mailbox"); it is an INDEX size, so the label says so.
 *   - 9 years regulated sectors → EXPERIENCE (banking, automotive,
 *     enterprise retail).
 * `count` animates via CountUp; when absent, `raw` renders verbatim at
 * display size. Labels are dictionary keys under `proof.metrics` so the
 * ES/EN copy lives with all other copy in lib/i18n. */
export type ProofMetric = {
  /** Numeric part of the big value — animated by CountUp. */
  count?: number;
  /** Violet suffix rendered right after the count (e.g. "+", "k+"). */
  suffix?: string;
  /** Non-numeric big value rendered verbatim when there is no count. */
  raw?: string;
  /** Key into the `proof.metrics` dictionary namespace. */
  labelKey: string;
};

export const PROOF_METRICS: ProofMetric[] = [
  { count: 3, labelKey: "saas" },
  { count: 210, suffix: "k+", labelKey: "mailIndexed" },
  { count: 9, labelKey: "regulatedYears" },
  { raw: "multi-cloud", labelKey: "multicloud" },
];

export type Project = {
  slug: string;
  name: string;
  url: string;
  href: string;
  tag: Bilingual;
  blurb: Bilingual;
  accent: "cyan" | "violet";
  repo?: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "enkiflow",
    name: "EnkiFlow",
    url: "www.enkiflow.com",
    href: "https://www.enkiflow.com",
    tag: { es: "SaaS · AI time tracking", en: "SaaS · AI time tracking" },
    blurb: {
      es: "Time tracker con enfoque AI para builders: analiza páginas, captura contexto por voz o video y sincroniza trabajo entre web, desktop, Chrome Extension y VS Code.",
      en: "AI-focused time tracker for builders: analyzes pages, captures context via voice or video, and syncs work across web, desktop, Chrome Extension, and VS Code.",
    },
    accent: "cyan",
  },
  {
    slug: "getdecant",
    name: "GetDecant",
    url: "www.getdecant.com",
    href: "https://www.getdecant.com",
    tag: { es: "SaaS · scent retail", en: "SaaS · scent retail" },
    blurb: {
      es: "SaaS premium para perfumería con POS táctil, inventario por mililitro, pricing por presentación y operación multi-sucursal con roles, traslados y superadmin.",
      en: "Premium SaaS for perfume retail: touch POS, milliliter-level inventory, per-presentation pricing, and multi-store operation with roles, transfers, and super-admin.",
    },
    accent: "violet",
  },
  {
    slug: "connver",
    name: "Connver",
    url: "www.connver.com",
    href: "https://www.connver.com",
    tag: { es: "SaaS · WhatsApp CRM", en: "SaaS · WhatsApp CRM" },
    blurb: {
      es: "CRM de WhatsApp para negocios que venden por mensaje: inbox compartido, ficha y embudo por cliente, y seguimiento automatizado —cotizaciones sin respuesta, guías de envío, avisos de pedido— con asistencia de IA. Sin campañas masivas.",
      en: "WhatsApp CRM for businesses that sell over chat: shared inbox, per-client records and pipeline, and automated follow-up —unanswered quotes, shipping guides, order notices— with AI assistance. No mass campaigns.",
    },
    accent: "cyan",
  },
  {
    slug: "apple-mail-mcp",
    name: "apple-mail-mcp",
    url: "apple-mail-mcp.cobos.io",
    href: "https://apple-mail-mcp.cobos.io",
    tag: { es: "OSS · Apple Mail MCP", en: "OSS · Apple Mail MCP" },
    blurb: {
      es: "Servidor MCP unificado para Apple Mail: búsqueda on-disk en milisegundos (FTS5 sobre un buzón real de 210k mensajes) más escrituras completas por AppleScript, unidas por un Message-ID canónico y protegidas por una capa de seguridad con dry-run, undo y confirmación explícita. 31 tools MCP para tu agente.",
      en: "Unified MCP server for Apple Mail: millisecond on-disk search (FTS5 over a real 210k-message mailbox) plus complete AppleScript writes, bridged by a canonical Message-ID and gated by one safety layer with dry-run, undo, and explicit confirm. 31 MCP tools for your AI agent.",
    },
    accent: "violet",
  },
  {
    slug: "infrastructure",
    name: "Infrastructure",
    url: "github.com/ErnestoCobos/Infrastructure",
    href: "https://github.com/ErnestoCobos/Infrastructure",
    repo: "github.com/ErnestoCobos/Infrastructure",
    tag: { es: "OSS · Terraform platform", en: "OSS · Terraform platform" },
    blurb: {
      es: "Repositorio local-first de IaC con Terraform oficial, Cloudflare DNS, HCP Terraform, Vercel, Supabase y secretos vía 1Password para cobos.io, enkiflow y getdecant.",
      en: "Local-first IaC repo with official Terraform, Cloudflare DNS, HCP Terraform, Vercel, Supabase, and secrets via 1Password — powering cobos.io, enkiflow, and getdecant.",
    },
    accent: "cyan",
  },
  {
    slug: "portfolio",
    name: "cobos.io · portfolio",
    url: "github.com/ErnestoCobos/Portfolio",
    href: "https://github.com/ErnestoCobos/Portfolio",
    repo: "github.com/ErnestoCobos/Portfolio",
    tag: { es: "OSS · operator console", en: "OSS · operator console" },
    blurb: {
      es: "Este mismo sitio: portfolio single-page con estética operator-console, Next.js 16, React 19, Tailwind v4 y una terminal de desarrollo que muta el DOM en vivo.",
      en: "This very site: single-page portfolio with operator-console aesthetic, Next.js 16, React 19, Tailwind v4, and a dev terminal that mutates the DOM live.",
    },
    accent: "cyan",
  },
];

export type Experience = {
  /** Year span — universal across locales. */
  y: Bilingual;
  /** Job title. */
  role: Bilingual;
  /** Company / sector. */
  co: Bilingual;
  /** One-line description of work done. */
  note: Bilingual;
};

export const EXPERIENCE: Experience[] = [
  {
    y: { es: "2024 — hoy", en: "2024 — now" },
    role: { es: "Cloud Platform Eng.", en: "Cloud Platform Eng." },
    co: { es: "Ford", en: "Ford" },
    note: {
      es: "Plataforma cloud + DevSecOps en sector automotriz: pipelines, observabilidad, golden paths.",
      en: "Cloud platform + DevSecOps in automotive: pipelines, observability, golden paths.",
    },
  },
  {
    y: { es: "2023 — hoy", en: "2023 — now" },
    role: { es: "Founder · Platform", en: "Founder · Platform" },
    co: { es: "EnkiFlow + GetDecant", en: "EnkiFlow + GetDecant" },
    note: {
      es: "SaaS productivos (AI time tracking · scent retail), multi-cloud, GitOps de extremo a extremo.",
      en: "Production SaaS (AI time tracking · scent retail), multi-cloud, end-to-end GitOps.",
    },
  },
  {
    y: { es: "2021 — 2023", en: "2021 — 2023" },
    role: { es: "Senior Cloud Architect", en: "Senior Cloud Architect" },
    co: {
      es: "Sector bancario y automotriz",
      en: "Banking and automotive sectors",
    },
    note: {
      es: "Migración legacy → EKS regulado, FinOps, zero-trust.",
      en: "Legacy → regulated EKS migration, FinOps, zero-trust.",
    },
  },
  {
    y: { es: "2019 — 2021", en: "2019 — 2021" },
    role: { es: "DevOps Lead", en: "DevOps Lead" },
    co: { es: "Retail enterprise", en: "Retail enterprise" },
    note: {
      es: "Multi-cloud (AWS+GCP), pipelines GitOps.",
      en: "Multi-cloud (AWS+GCP), GitOps pipelines.",
    },
  },
  {
    y: { es: "2016 — 2019", en: "2016 — 2019" },
    role: { es: "Full-stack Engineer", en: "Full-stack Engineer" },
    co: { es: "Agencias / consultoría", en: "Agencies / consulting" },
    note: {
      es: "Laravel, Django, Vue, infra.",
      en: "Laravel, Django, Vue, infra.",
    },
  },
];

/**
 * An industry certification — earned or on the roadmap. The `status` field
 * drives the visual treatment in the Certifications section: green dot +
 * verify link footer when `earned`, amber dot + prep progress bar when
 * `in-progress`. Vendor is plain text (`cncf` / `aws` / `gcp`…) and carries
 * NO color — keeping the structural cyan/violet palette clean (no AWS
 * orange, no GCP blue leaks). Color is owned by status, not vendor.
 *
 * Bilingual fields use the `Bilingual` shape and resolve via
 * `pick(field, locale)` exactly like Project / Experience / Trend.
 */
export type Certification = {
  /** Stable slug — React keys, `data-fs-path` (`/certs/<slug>.md`). */
  slug: string;
  /** Exam code shown as a mono uppercase badge. e.g. "CKA", "SAP-C02". */
  code: string;
  name: Bilingual;
  issuer: Bilingual;
  /** Lowercase vendor family. Drives the neutral vendor chip only. */
  vendor: "cncf" | "aws" | "gcp" | "azure" | "hashicorp";
  /** earned → green; in-progress → amber. */
  status: "earned" | "in-progress";
  /** Earned date (e.g. "2025-03") OR target window (e.g. "2026 Q3").
   *  Omit for an in-progress cert with no committed date — the card
   *  renders the line as `target · TBD` so heights stay honest. */
  when?: Bilingual;
  /** 0–100 prep completion. Only meaningful when in-progress; earned is
   *  treated as 100. Omit → bar renders "queued". */
  progress?: number;
  /** Public verification URL (Credly, AWS portal…). Optional. */
  verifyUrl?: string;
  /** One-line rationale in the site voice. Optional. */
  note?: Bilingual;
};

export const CERTIFICATIONS: Certification[] = [
  {
    slug: "cka",
    code: "CKA",
    name: {
      es: "Certified Kubernetes Administrator",
      en: "Certified Kubernetes Administrator",
    },
    issuer: {
      es: "Cloud Native Computing Foundation",
      en: "Cloud Native Computing Foundation",
    },
    vendor: "cncf",
    status: "in-progress",
    when: { es: "2026 Q3", en: "2026 Q3" },
    progress: 75,
    note: {
      es: "Operación de clusters en producción — respalda el trabajo de EKS regulado que ya entrego.",
      en: "Production cluster operations — backs the regulated EKS work I already ship.",
    },
  },
  {
    slug: "cks",
    code: "CKS",
    name: {
      es: "Certified Kubernetes Security Specialist",
      en: "Certified Kubernetes Security Specialist",
    },
    issuer: {
      es: "Cloud Native Computing Foundation",
      en: "Cloud Native Computing Foundation",
    },
    vendor: "cncf",
    status: "in-progress",
    when: { es: "2026 Q4", en: "2026 Q4" },
    progress: 40,
    note: {
      es: "Supply-chain, runtime, OPA/Falco — el ángulo DevSecOps, firmado.",
      en: "Supply-chain, runtime, OPA/Falco — the DevSecOps angle, signed.",
    },
  },
  {
    slug: "aws-sap",
    code: "SAP-C02",
    name: {
      es: "AWS Solutions Architect — Professional",
      en: "AWS Solutions Architect — Professional",
    },
    issuer: { es: "Amazon Web Services", en: "Amazon Web Services" },
    vendor: "aws",
    status: "in-progress",
    when: { es: "2026 Q3", en: "2026 Q3" },
    progress: 60,
    note: {
      es: "Credencial nivel arquitecto para las migraciones legacy → EKS que lidero.",
      en: "Architect-level credential for the legacy → EKS migrations I lead.",
    },
  },
  {
    slug: "gcp-pca",
    code: "PCA",
    name: {
      es: "Professional Cloud Architect",
      en: "Professional Cloud Architect",
    },
    issuer: { es: "Google Cloud", en: "Google Cloud" },
    vendor: "gcp",
    status: "in-progress",
    when: { es: "2027 Q1", en: "2027 Q1" },
    progress: 25,
    note: {
      es: "Paridad multi-cloud para el trabajo AWS+GCP en curso.",
      en: "Multi-cloud parity for the AWS+GCP work in flight.",
    },
  },
];

/**
 * A market trend backed by a REAL, cited statistic. A2 de-mock: the old
 * shape rendered seeded-rand sparklines / rollout % / tenant counts that
 * looked like live telemetry but were generated noise — a credibility
 * risk. Every figure below is verbatim from a published survey or press
 * release; the `url` lets the reader verify it in one click.
 */
export type TrendStat = {
  /** The figure exactly as published (e.g. "82%"). Never computed here. */
  value: string;
  /** What the figure measures, resolved per locale at render time. */
  label: Bilingual;
};

export type Trend = {
  t: Bilingual;
  d: Bilingual;
  stat: TrendStat;
  /** Publisher + report name, e.g. "CNCF Annual Survey". */
  source: string;
  /** Publication year of the cited report/edition. */
  year: number;
  url: string;
};

/** CNCF Annual Cloud Native Survey 2025 edition (published Jan 2026).
 * Cited three times below (AI inference, GitOps maturity, security
 * challenges), so hoisted once instead of repeating a 200-char URL. */
const CNCF_2025 =
  "https://www.cncf.io/announcements/2026/01/20/kubernetes-established-as-the-de-facto-operating-system-for-ai-as-production-use-hits-82-in-2025-cncf-annual-cloud-native-survey/";

export const TRENDS: Trend[] = [
  {
    t: { es: "AI-ready infra", en: "AI-ready infra" },
    d: {
      es: "GPU pools, vector DBs, gateways LLM con guardrails y observabilidad.",
      en: "GPU pools, vector DBs, LLM gateways with guardrails and observability.",
    },
    stat: {
      value: "66%",
      label: {
        es: "de las organizaciones que alojan modelos generativos de IA usan Kubernetes para parte o toda su inferencia",
        en: "of organizations hosting generative AI models run some or all of their inference on Kubernetes",
      },
    },
    source: "CNCF Annual Survey",
    year: 2025,
    url: CNCF_2025,
  },
  {
    t: { es: "Platform engineering", en: "Platform engineering" },
    d: {
      es: "IDPs con golden paths, Backstage, contratos de servicio firmados.",
      en: "IDPs with golden paths, Backstage, signed service contracts.",
    },
    stat: {
      value: "80%",
      label: {
        es: "de las organizaciones de ingeniería de software tendrá platform teams para 2026, según la predicción de Gartner",
        en: "of software engineering organizations will have platform teams by 2026, per Gartner's prediction",
      },
    },
    source: "Gartner",
    year: 2023,
    url: "https://www.gartner.com/en/newsroom/press-releases/2023-11-28-gartner-hype-cycle-shows-ai-practices-and-platform-engineering-will-reach-mainstream-adoption-in-software-engineering-in-two-to-five-years",
  },
  {
    t: { es: "FinOps + GreenOps", en: "FinOps + GreenOps" },
    d: {
      es: "Asignación por equipo, scheduling consciente de carbono, autoscaling agresivo.",
      en: "Per-team allocation, carbon-aware scheduling, aggressive autoscaling.",
    },
    stat: {
      value: "50%",
      label: {
        es: "sitúa la optimización de workloads y reducción de waste como prioridad #1; solo el 3% optimiza con criterios de sostenibilidad",
        en: "rank workload optimization and waste reduction as their #1 priority; only 3% optimize for sustainability",
      },
    },
    source: "FinOps Foundation · State of FinOps",
    year: 2025,
    url: "https://www.finops.org/insights/state-of-finops-2025/",
  },
  {
    t: { es: "Zero-trust by default", en: "Zero-trust by default" },
    d: {
      es: "mTLS, SPIFFE/SPIRE, OPA/Gatekeeper, supply chain SLSA L3.",
      en: "mTLS, SPIFFE/SPIRE, OPA/Gatekeeper, supply-chain SLSA L3.",
    },
    stat: {
      value: "63%",
      label: {
        es: "de las organizaciones a nivel mundial ha implementado zero-trust de forma total o parcial (encuesta Gartner)",
        en: "of organizations worldwide have implemented zero trust fully or partially (Gartner survey)",
      },
    },
    source: "Gartner · vía Expert Insights",
    year: 2025,
    url: "https://expertinsights.com/network-security/zero-trust-adoption-statistics-and-trends",
  },
  {
    // Reemplaza "Cloud-native edge": no existía una serie de adopción edge
    // citable 2024-2025, y GitOps sí tiene cifra publicada — además es el
    // diferenciador real de Ernesto (GitOps end-to-end en sus SaaS).
    t: { es: "GitOps como estándar", en: "GitOps as standard" },
    d: {
      es: "Promoción desde Git como única fuente de verdad: Argo CD, Flux, sync continuo y detección de drift.",
      en: "Promotion from Git as single source of truth: Argo CD, Flux, continuous sync and drift detection.",
    },
    stat: {
      value: "58%",
      label: {
        es: "de los «cloud native innovators» usa GitOps extensivamente — frente al 23% de los adopters",
        en: "of cloud native innovators use GitOps extensively — vs 23% of adopters",
      },
    },
    source: "CNCF Annual Survey",
    year: 2025,
    url: CNCF_2025,
  },
  {
    t: { es: "Policy as code", en: "Policy as code" },
    d: {
      es: "Rego, Cue, Kyverno — el cumplimiento es un commit.",
      en: "Rego, Cue, Kyverno — compliance is a commit.",
    },
    stat: {
      value: "36%",
      label: {
        es: "clasifican la seguridad entre los principales retos al adoptar cloud native — la política automatizada es la respuesta operativa",
        en: "rank security among their top cloud native adoption challenges — automated policy is the operational answer",
      },
    },
    source: "CNCF Annual Survey",
    year: 2025,
    url: CNCF_2025,
  },
];

export type Testimonial = {
  /** The quote. Only add REAL quotes — never invent them. */
  quote: Bilingual;
  author: string;
  /** e.g. "CEO · Tarzzo Stone" */
  role: Bilingual;
};

/**
 * Social-proof quotes. INTENTIONALLY EMPTY until real, attributable quotes
 * exist — the Testimonials section renders nothing while this is empty.
 * To enable: add entries with verifiable quotes (with permission).
 */
export const TESTIMONIALS: Testimonial[] = [];

export type NowItem = {
  /** e.g. { es: "ahora", en: "now" } */
  period: Bilingual;
  title: Bilingual;
  detail: Bilingual;
  status: "active" | "brewing";
};

/**
 * Snapshot of current fronts for the /now page. Derived from the
 * PROJECTS / EXPERIENCE / CERTIFICATIONS data above — don't invent
 * facts here. Refreshed monthly (`NOW.updated`).
 */
export const NOW: {
  /** Last refresh, e.g. "agosto 2026" / "August 2026". */
  updated: Bilingual;
  items: NowItem[];
} = {
  updated: { es: "agosto 2026", en: "August 2026" },
  items: [
    {
      period: { es: "sprint actual", en: "current sprint" },
      title: { es: "EnkiFlow", en: "EnkiFlow" },
      detail: {
        es: "Time tracker con AI en producción: contexto por voz/video y sync entre web, desktop, Chrome Extension y VS Code.",
        en: "AI time tracker in production: voice/video context capture and sync across web, desktop, Chrome Extension, and VS Code.",
      },
      status: "active",
    },
    {
      period: { es: "en producción", en: "in production" },
      title: { es: "GetDecant", en: "GetDecant" },
      detail: {
        es: "SaaS para perfumería operando en producción: POS táctil, inventario por mililitro y operación multi-sucursal.",
        en: "Scent-retail SaaS running in production: touch POS, milliliter-level inventory, and multi-store operation.",
      },
      status: "active",
    },
    {
      period: { es: "lanzamiento reciente", en: "newest launch" },
      title: { es: "Connver", en: "Connver" },
      detail: {
        es: "CRM de WhatsApp con seguimiento automatizado asistido por IA. Producto Voltaflow — el lanzamiento más nuevo.",
        en: "WhatsApp CRM with AI-assisted automated follow-up. A Voltaflow product — the newest launch.",
      },
      status: "active",
    },
    {
      period: { es: "2026 Q3 → 2027 Q1", en: "2026 Q3 → 2027 Q1" },
      title: {
        es: "Certificaciones · roadmap",
        en: "Certification roadmap",
      },
      detail: {
        es: "Prep activa: CKA 75% · SAP-C02 60% · CKS 40% · PCA 25%. Targets 2026 Q3 → 2027 Q1.",
        en: "Active prep: CKA 75% · SAP-C02 60% · CKS 40% · PCA 25%. Targets 2026 Q3 → 2027 Q1.",
      },
      status: "active",
    },
    {
      period: { es: "open source", en: "open source" },
      title: { es: "apple-mail-mcp", en: "apple-mail-mcp" },
      detail: {
        es: "Servidor MCP para Apple Mail: 31 tools, búsqueda FTS5 y capa de seguridad con undo. Iterando con feedback de la comunidad.",
        en: "MCP server for Apple Mail: 31 tools, FTS5 search, and a safety layer with undo. Iterating on community feedback.",
      },
      status: "brewing",
    },
  ],
};

export type PostCategory = "gitops" | "migrations" | "finops" | "platform";

export const CATEGORY_META: Record<
  PostCategory,
  { label: string; accent: "cyan" | "violet" }
> = {
  gitops: { label: "gitops", accent: "cyan" },
  migrations: { label: "migrations", accent: "violet" },
  finops: { label: "finops", accent: "cyan" },
  platform: { label: "platform", accent: "violet" },
};

/** A blog post. Source of truth lives in `content/blog/<slug>/{es,en}.md`
 * and is loaded server-side via `app/lib/posts.ts`. */
export type Post = {
  slug: string;
  title: string;
  locale: "es" | "en";
  d: string;
  date: string;
  dateModified?: string;
  r: string;
  category: PostCategory;
  body: string;
  cover?: string;
  coverAlt?: string;
  /** Legacy alias for `title`. */
  t: string;
};

export const NAV = [
  { id: "about", label: "About" },
  { id: "stack", label: "Stack" },
  { id: "infra", label: "Infra" },
  { id: "work", label: "Work" },
  { id: "exp", label: "Exp" },
  { id: "certs", label: "Certs" },
  { id: "trends", label: "2026" },
  { id: "blog", label: "Blog" },
  { id: "now", label: "Now" },
  { id: "approach", label: "Approach" },
  { id: "contact", label: "Contact" },
];

export type ApproachStep = {
  n: string;
  cmd: string;
  t: Bilingual;
  d: Bilingual;
};

export const APPROACH: ApproachStep[] = [
  {
    n: "01",
    cmd: "./diagnose --depth=full",
    t: { es: "Diagnóstico", en: "Diagnostic" },
    d: {
      es: "Mapeo del sistema actual, deuda y restricciones reales — no las que aparecen en el wiki.",
      en: "Mapping the current system, real debt, and real constraints — not the ones in the wiki.",
    },
  },
  {
    n: "02",
    cmd: "./design --slo --finops",
    t: { es: "Arquitectura objetivo", en: "Target architecture" },
    d: {
      es: "Diseño de plataforma con SLOs, costes, seguridad y experiencia de desarrollador desde el día uno.",
      en: "Platform design with SLOs, cost, security, and developer experience from day one.",
    },
  },
  {
    n: "03",
    cmd: "./migrate --layered",
    t: { es: "Migración por capas", en: "Layered migration" },
    d: {
      es: "Strangler fig pattern, GitOps de extremo a extremo, observabilidad antes que features.",
      en: "Strangler fig pattern, end-to-end GitOps, observability before features.",
    },
  },
  {
    n: "04",
    cmd: "./operate --improve",
    t: { es: "Operación y mejora", en: "Operation and improvement" },
    d: {
      es: "Runbooks como código, chaos drills, FinOps mensual. La plataforma evoluciona, no se congela.",
      en: "Runbooks as code, chaos drills, monthly FinOps. The platform evolves — it doesn't freeze.",
    },
  },
];
