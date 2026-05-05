/**
 * Source: github.com/ErnestoCobos public profile + repos.
 * Bio: cloud platform @ford · founder of @enkiflow + @getdecant.
 */

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
  bio:
    "Cloud platform & DevSecOps @Ford. Founder of @enkiflow & @getdecant. Builder chasing ideas that turn into useful tools.",
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
  tag: string;
  blurb: string;
  accent: "cyan" | "violet";
  repo?: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "enkiflow",
    name: "EnkiFlow",
    url: "www.enkiflow.com",
    href: "https://www.enkiflow.com",
    tag: "SaaS · AI time tracking",
    blurb:
      "Time tracker con enfoque AI para builders: analiza paginas, captura contexto por voz o video y sincroniza trabajo entre web, desktop, Chrome Extension y VS Code.",
    accent: "cyan",
  },
  {
    slug: "getdecant",
    name: "GetDecant",
    url: "www.getdecant.com",
    href: "https://www.getdecant.com",
    tag: "SaaS · scent retail",
    blurb:
      "SaaS premium para perfumeria con POS tactil, inventario por mililitro, pricing por presentacion y operacion multi-sucursal con roles, traslados y superadmin.",
    accent: "violet",
  },
  {
    slug: "infrastructure",
    name: "Infrastructure",
    url: "github.com/ErnestoCobos/Infrastructure",
    href: "https://github.com/ErnestoCobos/Infrastructure",
    repo: "github.com/ErnestoCobos/Infrastructure",
    tag: "OSS · Terraform platform",
    blurb:
      "Repositorio local-first de IaC con Terraform oficial, Cloudflare DNS, HCP Terraform, Vercel, Supabase y secretos via 1Password para cobos.io, enkiflow y getdecant.",
    accent: "violet",
  },
  {
    slug: "portfolio",
    name: "cobos.io · portfolio",
    url: "github.com/ErnestoCobos/Portfolio",
    href: "https://github.com/ErnestoCobos/Portfolio",
    repo: "github.com/ErnestoCobos/Portfolio",
    tag: "OSS · operator console",
    blurb:
      "Este mismo sitio: portfolio single-page con estetica operator-console, Next.js 16, React 19, Tailwind v4 y una terminal de desarrollo que muta el DOM en vivo.",
    accent: "cyan",
  },
];

export const EXPERIENCE = [
  { y: "2024 — hoy", role: "Cloud Platform Eng.", co: "Ford", note: "Plataforma cloud + DevSecOps en sector automotriz: pipelines, observabilidad, golden paths." },
  { y: "2023 — hoy", role: "Founder · Platform", co: "EnkiFlow + GetDecant", note: "SaaS productivos (AI time tracking · scent retail), multi-cloud, GitOps de extremo a extremo." },
  { y: "2021 — 2023", role: "Senior Cloud Architect", co: "Sector bancario y automotriz", note: "Migración legacy → EKS regulado, FinOps, zero-trust." },
  { y: "2019 — 2021", role: "DevOps Lead", co: "Retail enterprise", note: "Multi-cloud (AWS+GCP), pipelines GitOps." },
  { y: "2016 — 2019", role: "Full-stack Engineer", co: "Agencias / consultoría", note: "Laravel, Django, Vue, infra." },
];

export const TRENDS = [
  { t: "AI-ready infra", d: "GPU pools, vector DBs, gateways LLM con guardrails y observabilidad." },
  { t: "Platform engineering", d: "IDPs con golden paths, Backstage, contratos de servicio firmados." },
  { t: "FinOps + GreenOps", d: "Asignación por equipo, scheduling consciente de carbono, autoscaling agresivo." },
  { t: "Zero-trust by default", d: "mTLS, SPIFFE/SPIRE, OPA/Gatekeeper, supply chain SLSA L3." },
  { t: "Cloud-native edge", d: "K8s en el edge (k3s, Karmada), CDN-as-compute, replicación geo." },
  { t: "Policy as code", d: "Rego, Cue, Kyverno — el cumplimiento es un commit." },
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

/** A blog post. Source of truth lives in `content/blog/<slug>.md` and is
 * loaded server-side via `app/lib/posts.ts`. Client components receive
 * Post values via props from server components — they should never import
 * the loader directly. */
export type Post = {
  slug: string;
  title: string;
  /** Locale of this post version. Each post can exist in multiple
   * locales (content/blog/<slug>/{es,en}.md); this field reflects the
   * one that was loaded for this Post instance. */
  locale: "es" | "en";
  /** Human-readable date used in UI (e.g. "Mar 2026"). */
  d: string;
  /** ISO date used for sorting and structured data (e.g. "2026-03-15"). */
  date: string;
  /** Last-modified ISO timestamp from the git log of the markdown file.
   * Populated by the `prebuild` script (`scripts/git-modified-dates.mjs`)
   * via `content/blog/.modified-dates.json`. Falls back to `date` when
   * the script hasn't run yet (dev) or the post has only one commit. */
  dateModified?: string;
  /** Read time string (e.g. "5 min"). */
  r: string;
  category: PostCategory;
  /**
   * Article body. Renders via `marked` (GFM): supports `## ` h2,
   * paragraphs, `**bold**`, `*italic*`, `[links](url)`, inline `code`,
   * fenced code blocks and `![alt](path)` images. */
  body: string;
  /** Optional cover image override. Path relative to /public — e.g.
   * `/blog-covers/<slug>.jpg`. When set, the dedicated page renders
   * this instead of the procedural BlogCover, and the OG image route
   * uses it as the social-share preview. */
  cover?: string;
  /** Alt text for the cover image. Required for accessibility when
   * `cover` is set; falls back to the post title if missing. */
  coverAlt?: string;
  /** Legacy alias for `title`. Kept so older components reading `p.t`
   * continue to compile without a sweeping rename. */
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

export const APPROACH = [
  {
    n: "01",
    t: "Diagnóstico",
    d: "Mapeo del sistema actual, deuda y restricciones reales — no las que aparecen en el wiki.",
    cmd: "./diagnose --depth=full",
  },
  {
    n: "02",
    t: "Arquitectura objetivo",
    d: "Diseño de plataforma con SLOs, costes, seguridad y experiencia de desarrollador desde el día uno.",
    cmd: "./design --slo --finops",
  },
  {
    n: "03",
    t: "Migración por capas",
    d: "Strangler fig pattern, GitOps de extremo a extremo, observabilidad antes que features.",
    cmd: "./migrate --layered",
  },
  {
    n: "04",
    t: "Operación y mejora",
    d: "Runbooks como código, chaos drills, FinOps mensual. La plataforma evoluciona, no se congela.",
    cmd: "./operate --improve",
  },
];
