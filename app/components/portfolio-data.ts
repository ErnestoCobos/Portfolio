/**
 * Source: github.com/ErnestoCobos public profile + repos.
 * Bio: "Engineer @Ford & founder of @voltaflow."
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
  founded: "@voltaflow",
  avatarUrl: "https://avatars.githubusercontent.com/u/10171659?v=4",
  bio:
    "Engineer @Ford & founder of @voltaflow. Dog dad, lifelong learner & builder chasing ideas that turn into useful tools.",
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
  metrics: { k: string; v: string }[];
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
    metrics: [
      { k: "free", v: "$0" },
      { k: "pro", v: "$9/mo" },
      { k: "team", v: "$19/u" },
    ],
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
    metrics: [
      { k: "boutique", v: "$149/mo" },
      { k: "atelier", v: "$299/mo" },
      { k: "network", v: "custom" },
    ],
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
      "Repositorio local-first de IaC con Terraform oficial, Cloudflare DNS, HCP Terraform, Vercel, Supabase y secretos via 1Password para cobos.io, getdecant, voltaflow y enkiflow.",
    metrics: [
      { k: "projects", v: "4" },
      { k: "lang", v: "HCL 60%" },
      { k: "state", v: "HCP" },
    ],
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
    metrics: [
      { k: "hosting", v: "static" },
      { k: "framework", v: "Next 16" },
      { k: "runtime", v: "React 19" },
    ],
    accent: "cyan",
  },
];

export const EXPERIENCE = [
  { y: "2024 — hoy", role: "Engineer", co: "Ford", note: "Plataforma + DevSecOps." },
  { y: "2023 — hoy", role: "Founder · Platform", co: "Voltaflow", note: "SaaS productivo, multi-cloud, GitOps." },
  { y: "2021 — 2023", role: "Senior Cloud Architect", co: "Sector financiero", note: "Migración legacy → EKS regulado, FinOps." },
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

export const POSTS = [
  { d: "Mar 2026", t: "GitOps en sectores regulados: lo que nadie te cuenta", r: "12 min" },
  { d: "Feb 2026", t: "Migrando un monolito a EKS sin downtime: el playbook", r: "18 min" },
  { d: "Ene 2026", t: "FinOps no es Excel: cómo construí un dashboard que ahorra 38%", r: "9 min" },
  { d: "Dic 2025", t: "Por qué cada equipo necesita un Internal Developer Platform", r: "7 min" },
];

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
