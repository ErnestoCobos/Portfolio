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
  linkedin: "linkedin.com/in/cobos",
  blog: "cobos.io",
  company: "@Ford",
  founded: "@enkiflow + @getdecant",
  avatarUrl: "https://avatars.githubusercontent.com/u/10171659?v=4",
  bio: {
    es: "Cloud platform & DevSecOps en Ford. Fundador de @enkiflow & @getdecant. Builder persiguiendo ideas que se convierten en herramientas útiles.",
    en: "Cloud platform & DevSecOps at Ford. Founder of @enkiflow & @getdecant. Builder chasing ideas that turn into useful tools.",
  } satisfies Bilingual,
};

export const STACK = [
  { group: "Cloud", items: ["AWS", "GCP", "Azure", "Cloudflare"] },
  { group: "Platform", items: ["Kubernetes", "Argo CD", "Flux", "Terraform", "Pulumi"] },
  { group: "Runtime", items: ["Docker", "Istio", "Linkerd", "Envoy"] },
  { group: "Code", items: ["Next.js", "Vue/Nuxt", "TypeScript", "Laravel", "Django"] },
  { group: "Security", items: ["OPA", "Trivy", "Falco", "Vault", "SOPS"] },
  { group: "Observability", items: ["Prometheus", "Grafana", "OTel", "Loki", "Tempo"] },
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
    accent: "violet",
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

export type Trend = { t: Bilingual; d: Bilingual };

export const TRENDS: Trend[] = [
  {
    t: { es: "AI-ready infra", en: "AI-ready infra" },
    d: {
      es: "GPU pools, vector DBs, gateways LLM con guardrails y observabilidad.",
      en: "GPU pools, vector DBs, LLM gateways with guardrails and observability.",
    },
  },
  {
    t: { es: "Platform engineering", en: "Platform engineering" },
    d: {
      es: "IDPs con golden paths, Backstage, contratos de servicio firmados.",
      en: "IDPs with golden paths, Backstage, signed service contracts.",
    },
  },
  {
    t: { es: "FinOps + GreenOps", en: "FinOps + GreenOps" },
    d: {
      es: "Asignación por equipo, scheduling consciente de carbono, autoscaling agresivo.",
      en: "Per-team allocation, carbon-aware scheduling, aggressive autoscaling.",
    },
  },
  {
    t: { es: "Zero-trust by default", en: "Zero-trust by default" },
    d: {
      es: "mTLS, SPIFFE/SPIRE, OPA/Gatekeeper, supply chain SLSA L3.",
      en: "mTLS, SPIFFE/SPIRE, OPA/Gatekeeper, supply-chain SLSA L3.",
    },
  },
  {
    t: { es: "Cloud-native edge", en: "Cloud-native edge" },
    d: {
      es: "K8s en el edge (k3s, Karmada), CDN-as-compute, replicación geo.",
      en: "K8s at the edge (k3s, Karmada), CDN-as-compute, geo replication.",
    },
  },
  {
    t: { es: "Policy as code", en: "Policy as code" },
    d: {
      es: "Rego, Cue, Kyverno — el cumplimiento es un commit.",
      en: "Rego, Cue, Kyverno — compliance is a commit.",
    },
  },
];

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
  { id: "trends", label: "2026" },
  { id: "blog", label: "Blog" },
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
