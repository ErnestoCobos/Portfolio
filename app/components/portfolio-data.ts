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
      { k: "surfaces", v: "4" },
      { k: "input", v: "voice/video" },
      { k: "stage", v: "prod" },
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
      { k: "model", v: "B2B/POS" },
      { k: "unit", v: "mL" },
      { k: "stage", v: "prod" },
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
      "Repositorio local-first de IaC con Terraform oficial, Cloudflare DNS, HCP Terraform, Vercel, Supabase y secretos via 1Password para cobos.io, enkiflow y getdecant.",
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

export type Post = {
  slug: string;
  d: string;
  t: string;
  r: string;
  /**
   * Article body. Lines starting with `## ` render as h2, blank lines split
   * paragraphs. Inline emphasis isn't supported — keep prose declarative.
   */
  body: string;
};

export const POSTS: Post[] = [
  {
    slug: "gitops-regulados",
    d: "Mar 2026",
    t: "GitOps en sectores regulados: lo que nadie te cuenta",
    r: "5 min",
    body: `GitOps suena perfecto en el deck: declarativo, auditable, rollback-by-git. Después llega el primer auditor de PCI o SOC2 y te das cuenta que el modelo "git es la fuente de verdad" no contesta solas las preguntas que importan en un sector regulado.

Trabajé varios años en banca y otro tanto en automotriz. Estos son los puntos donde GitOps se rompe en producción regulada y cómo los resolví.

## Separation of duties no es una etiqueta de PR

El auditor pregunta: "¿quién puede desplegar a producción?". Responder "quien apruebe el PR" no alcanza. Necesitás CODEOWNERS por carpeta, branch protection con approvers requeridos por equipo, y separar quién mergea vs quién hace argocd app sync. En la práctica: dos equipos distintos. El que escribe el manifiesto (dev) y el que aplica (SRE). Argo CD soporta esto vía RBAC granular, pero hay que diseñarlo desde el día uno.

## El audit trail no es git log

git log te dice qué commit hizo qué cambio. El auditor quiere saber qué pasó realmente en producción a las 14:32 del jueves. Necesitás correlacionar commit → sync event → pod restart → métrica de observabilidad. Lo armé con Argo CD events → Kafka → ledger en Postgres con append-only. Cada sync queda firmado y trazable, con evidencia exportable.

## Secrets: sealed-secrets es el camino fácil, no el correcto

Sealed-secrets cifra el secret en git con la public key del cluster. Funciona, pero rotar la key del cluster es una pesadilla y no hay revocación granular. En entornos regulados terminé con External Secrets Operator + Vault: el manifiesto en git referencia un path de Vault, el secret real nunca toca git. Auditor feliz, rotación trivial, blast radius acotado.

## Drift detection es donde se cae el castillo

GitOps asume que git == cluster. La realidad: alguien hace kubectl edit en una emergencia, o un controller modifica un recurso. Argo CD detecta drift pero lo que importa es la política. Auto-sync con auto-prune es agresivo y rompe cosas; manual sync deja drift sin resolver. El balance: auto-sync con selfHeal: true para apps de baja criticidad, manual con alerta SLO para críticas.

## Multi-env promotion no es promote-PR

El playbook fácil: PR a dev/, merge → auto-deploy. PR a staging/, idem. PR a prod/, idem. En regulado eso no pasa. Hay change advisory board, ventana de cambios, freeze periods. Lo que funcionó: app-of-apps con targetRevision por env, y la promoción es un PR que bumpea el SHA en el env superior. Cada bump pasa por aprobación humana + ticket en JIRA con evidencia.

## El costo escondido: cultura

Técnicamente GitOps se monta en 2 semanas. Que los equipos lo adopten correctamente lleva 6 meses. Resistencia típica: "yo siempre hice helm upgrade, ¿por qué un PR?". La respuesta no es técnica, es alinear con compliance: "porque el auditor lo va a pedir y vos no querés ser el cuello de botella".

## Lo que se llevan los que lo piensan

GitOps en sectores regulados no es "GitOps con más PRs". Es rediseñar el flujo asumiendo que el auditor va a auditar el git, no el cluster. Si tu compliance no se puede demostrar leyendo el repo + el ledger de eventos, GitOps te falló — no técnicamente, sino en la única dimensión que importa para que el banco no te corte el sello.`,
  },
  {
    slug: "monolito-a-eks",
    d: "Feb 2026",
    t: "Migrando un monolito a EKS sin downtime: el playbook",
    r: "6 min",
    body: `Migrar un monolito sin downtime es 80% planificación, 15% paciencia, y 5% el deploy real. Lo difícil no es contenedorizar — es mover el state sin perder un request. Este es el playbook que apliqué en un retail enterprise (~3M usuarios activos) sobre un monolito Laravel + MySQL.

## Paso 0: medir, no asumir

Antes de tocar nada: APM en el monolito durante 2 semanas. Endpoints más usados, percentiles de latencia, queries más caras, qué tablas crecen, cuáles son hot. Sin esto, vas a migrar lo que vos creés que importa, no lo que importa.

## Paso 1: extraer state del monolito

Sessions en disco/PHP-FPM → mover a Redis (ElastiCache). Uploads locales → S3. Cron en server → EventBridge + Lambda. Cache de archivos → Memcached/Redis. Esto se hace con el monolito todavía en VMs, antes de tocar EKS. Cada extracción es un release independiente, validable.

## Paso 2: contenedorizar el monolito completo

No fragmentar todavía. Empaquetar el monolito tal cual en un contenedor, deployar a EKS al lado del legacy, ALB con weighted target groups: 95% legacy / 5% EKS. Validar que el pod en EKS responde idéntico al legacy. Si hay diferencias, son bugs latentes que el monolito tenía pero nunca se notaron.

## Paso 3: shift de tráfico gradual

ALB target group weights: 95/5 → 80/20 → 50/50 → 20/80 → 0/100. Cada paso queda 1 semana. Métricas que miras: error rate, p95, p99, DB connections, business metrics (orders/min, signups/hr). Un solo SLO violado = rollback inmediato (vuelta al peso anterior).

## Paso 4: la base de datos es el problema real

El monolito y los pods en EKS apuntan a la misma RDS — fácil. El problema viene cuando querés extraer un servicio (catalog, payments). Dos patrones que funcionaron:

Read-replica + dual-write: el nuevo servicio escribe a su DB y a la del monolito. Lecturas ya van a la nueva. Cuando dual-write es estable por 2 semanas, cortar el write a la del monolito.

CDC con Debezium: el monolito sigue escribiendo a su DB; Debezium replica al servicio nuevo en near-real-time. Más complejo pero el monolito no se entera.

## Paso 5: strangler fig por URL

Una vez que un servicio nuevo está estable, ALB hace rule-based routing: /api/payments/* → nuevo servicio, todo lo demás → monolito. Cada /api/X que se moviste reduce el monolito. En 18 meses pasamos de 1 monolito a 7 servicios + 1 monolito flaco con la lógica de billing que nunca conviene fragmentar.

## Paso 6: el rollback no es git revert

Si el nuevo servicio escribió a una DB nueva, "rollback" es leer datos en sintaxis vieja desde una DB que ya no existe. El plan de rollback se diseña ANTES del switchover, no durante. En cada cutover: backup completo de la nueva DB, snapshot RDS, export S3. Documentado. Probado en staging.

## Lo que no se ve en los blog posts felices

Reescribir el monolito completo a microservicios desde cero en paralelo es la trampa más común. No funciona. Muere antes de llegar a feature parity. La migración tiene que ser estranguladora — el monolito vive y se va comiendo poco a poco, no se reescribe. Si tu plan de migración no contempla un escenario "el monolito sigue corriendo en 2 años porque la pieza X no conviene mover", el plan está mal.`,
  },
  {
    slug: "finops-dashboard",
    d: "Ene 2026",
    t: "FinOps no es Excel: cómo construí un dashboard que ahorra 38%",
    r: "5 min",
    body: `Cualquiera puede armar un Excel con la factura de AWS y mandárselo al CFO el viernes. FinOps real es otra cosa: es hacer que el ahorro sea automático y los engineering leads vean el costo de sus decisiones en tiempo real, no 30 días después.

Cuento cómo armé el dashboard que en un retail enterprise nos ahorró 38% de la factura cloud (de ~$180k/mes a ~$112k/mes) en 9 meses, y por qué Excel no era opción.

## Paso 1: tagging strategy o nada funciona

Sin tags, no hay FinOps. Los tags mínimos: team, service, env, cost-center. Política: cualquier recurso sin esos 4 tags se elimina automáticamente después de 7 días (excepción: producción). El primer mes el equipo gritó. El segundo mes todos taggeaban. Lambda + CloudWatch event para auditoría diaria.

## Paso 2: dónde estaba el 38%

Análisis postmortem del ahorro real:

Idle resources (12%): instancias dev encendidas 24/7. Auto-stop después de 19hs y los fines de semana. Esto solo no rompe nada y nadie lo nota.

Oversized RDS (9%): instancias r5.4xlarge corriendo a 6% CPU promedio. Rightsizing a r5.large + read replica si hace falta.

Orphan resources (7%): EBS volumes desatachados, ELBs sin targets, snapshots viejos. CloudCustodian + tag de "delete-after" automático.

NAT Gateway data transfer (5%): equipos llamando S3 vía internet en vez de VPC endpoint. Migrar a gateway endpoints, $0/GB en vez de $0.045/GB.

Reserved Instances mal modeladas (5%): RIs compradas hace 2 años para shape que ya no se usaba. Vender en marketplace + comprar Compute Savings Plans (más flexibles).

## Paso 3: el dashboard real

Stack: Cost & Usage Report (CUR) → S3 → Athena → Grafana. No usé Cost Explorer porque no permite custom dimensions cruzadas. Cada equipo tiene su panel: gasto del mes, vs forecast, vs misma semana del mes anterior, desglose por servicio. Drill-down hasta el recurso individual.

Lo que cambia el comportamiento: cada PR a infra (Terraform) corre infracost y postea el delta de costo en el PR. Los devs ven "este cambio agrega $42/mes" antes de mergear. Cero discusión, dato directo.

## Paso 4: Reserved Instances vs Savings Plans vs Spot

Modelo simple:

Spot para batch, CI/CD, dev environments (60–90% ahorro, hay que tolerar interrupción).

Compute Savings Plans 1yr no upfront para baseline de prod (40% ahorro, flexibilidad de instancia).

RIs solo para RDS y ElastiCache (no hay SP para esos).

Comprar el SP/RI no es un evento, es un proceso recurrente. Cada mes: review de utilización, ajuste de commit. Lo automaticé con un script que recomienda compras basado en últimos 90 días.

## Paso 5: showback antes que chargeback

Chargeback (cobrar al equipo) es controversial y genera política. Showback (mostrar el costo, sin cobrar) genera 80% del cambio cultural sin la política. Empezar por showback. Si después de 6 meses el comportamiento no mejora, evaluar chargeback.

## Lo que no funciona

Kubecost solo. Es buen storyteller para K8s pero no ve el resto (RDS, S3, transfer). Necesitás CUR.

Auto-rightsize sin aprobación. Probé. Rompe production. Recomendaciones → tickets, no auto-apply.

Meeting mensual de FinOps con todos los equipos. Aburre, nadie va. Mejor: un canal Slack con bot que postea top-5 spenders semanal y deja que el equipo se autoorganice.

## Lo importante

El 38% no vino de un truco. Vino de hacer que el costo sea visible, accionable, y que el feedback loop sea de horas, no de meses. La parte difícil no es técnica — es montar el ciclo cultural donde optimizar costo es trabajo de todos, no del CFO.`,
  },
  {
    slug: "internal-developer-platform",
    d: "Dic 2025",
    t: "Por qué cada equipo necesita un Internal Developer Platform",
    r: "5 min",
    body: `Si tu onboarding técnico para un dev nuevo lleva más de 1 semana hasta que mergea su primer PR a producción, no tenés un problema de onboarding — tenés un problema de plataforma. La solución se llama Internal Developer Platform (IDP) y no es Backstage.

## El problema real: cognitive load

Un dev moderno tiene que conocer: Git, GitHub Actions, Docker, Kubernetes, Terraform, Vault, Argo CD, Datadog, AWS console, IAM, KMS, RDS, Helm, OPA, y todavía tiene que saber escribir el código del producto. Esto no es sostenible. Cada herramienta que el dev DEBE conocer es cognitive tax sobre la productividad real (escribir features).

Un IDP corre el opuesto: el dev escribe código + define un manifiesto de servicio. El IDP se encarga del resto.

## Qué es realmente un IDP

Un IDP no es un portal. Es:

Un catálogo: qué servicios existen, quién los owns, dónde están los runbooks.

Golden paths: templates opinados para crear un servicio nuevo (incluyen CI, CD, monitoring, alertas, RBAC, secrets management, todo).

Self-service: provision de DB, Redis, S3 bucket, dominio, sin tickets a infra.

Observability built-in: métricas, logs, traces aparecen automáticamente sin configurar.

Backstage es el frontend de los primeros dos. Los otros dos son backend (Crossplane, Argo Workflows, custom operators). Confundir Backstage con un IDP es como confundir un dashboard de Grafana con observabilidad.

## Golden paths: opinionados pero escapables

El error clásico: hacer el IDP demasiado rígido. "Solo podés usar Postgres, solo podés deployar a EKS". Resultado: equipos pinchan el IDP y arman lo suyo en paralelo.

El balance que funciona: el golden path cubre el 80% de los casos felices. Para el 20% restante, hay un off-ramp documentado: cómo salir del path sin que la plataforma te bloquee. Si elegís off-ramp, perdés algunos beneficios (SLA del IDP, soporte) pero seguís siendo first-class citizen.

## Self-service no es "ticket más rápido"

Si el dev sigue abriendo un ticket a infra para crear un bucket S3, no tenés self-service. Tenés ticketing más rápido. Self-service real: el dev hace git push con un manifiesto que dice "necesito un bucket S3 con cifrado KMS y lifecycle a 30 días", y en 5 min existe, taggeado, monitoreado, en su cuenta de AWS, con permisos correctos.

Lo armé con Crossplane + ArgoCD + un GitHub Actions workflow que valida el manifiesto contra políticas OPA antes de mergear. Tiempo de provisioning: 4 minutos promedio. Tickets a infra para crear recursos comunes: 0.

## Métricas que importan

DORA metrics aplicadas al IDP:

Lead time for changes (commit → prod): de 5 días a 2 horas.

Deployment frequency: de 1/semana por equipo a 5/día por equipo.

Change failure rate: bajó de 18% a 6% (los golden paths incluyen tests obligatorios).

MTTR: de 4 horas a 35 minutos (runbooks built-in + observability automática).

Si el IDP no mueve estas 4, no está funcionando.

## Build vs buy

Backstage open-source + plugins custom: 6 meses de un platform team de 3 personas para llegar a producción. Vendor IDP (Humanitec, Port, Mia-Platform): 4 semanas a feature básica, $$$ por seat.

Mi regla: si la organización tiene <50 devs, vendor. Si tiene >150, build (porque la inversión se amortiza y querés control). Entre 50 y 150, depende del platform team que tengas.

## Cuándo NO armar un IDP

Si sos 10 devs, no lo armes. Es overhead sin ROI. Lo que necesitás es un buen Makefile y un README, no Backstage. El IDP empieza a tener sentido cuando hay 3+ equipos compartiendo infra y la coordinación se vuelve impuesto cognitivo.

## El resumen

Un IDP bien hecho es la diferencia entre un equipo que pasa 60% del tiempo en plumbing (config, infra, debugging deploys) y uno que pasa 60% en features. Eso es ROI medible. Si tu plataforma no lo está dando, tu plataforma es plumbing disfrazado.`,
  },
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
