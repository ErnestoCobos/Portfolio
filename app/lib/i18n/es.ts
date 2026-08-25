/**
 * Spanish (es-MX) dictionary. Source of truth for the shape — `Dictionary`
 * type is derived from this object. When adding a key, add it here first;
 * TypeScript will then force `en.ts` to provide the matching value.
 *
 * Organization: by surface (hero, about, stack, ...). Leaves are strings
 * or string arrays (used when a heading splits across lines for layout).
 * No deeper nesting than 2 levels — keeps the dot-path keys short.
 */
export const es = {
  meta: {
    siteTitle: "Ernesto Cobos — Cloud Architect · Platform Engineer · DevSecOps",
    siteDescription:
      "Migraciones legacy → cloud-native, Kubernetes en sectores regulados, multi-cloud, DevSecOps y FinOps. Construyo plataformas como producto.",
    htmlLang: "es",
    ogLocale: "es_MX",
    skipLink: "↓ saltar al contenido",
  },

  nav: {
    about: "About",
    stack: "Stack",
    infra: "Infra",
    work: "Work",
    exp: "Exp",
    trends: "2026",
    blog: "Blog",
    approach: "Approach",
    contact: "Contact",
    online: "online",
    contactCta: "./contact",
    ariaSections: "Secciones",
    ariaBackToTop: "Volver al inicio",
    ariaOpenMenu: "Abrir menú",
    ariaCloseMenu: "Cerrar menú",
    menuEntries: (n: number) => `${n} entries`,
    menuActiveHere: "● here",
    ariaLanguageGroup: "Selector de idioma",
    ariaSwitchTo: (other: "es" | "en"): string =>
      other === "en" ? "Cambiar a inglés" : "Cambiar a español",
  },

  proof: {
    aria: "cobos.io en números",
    years: "años construyendo",
    projects: "proyectos activos",
    tools: "tools en el stack",
    certs: "certs en roadmap",
  },

  now: {
    label: "now",
    title: "/now",
    headline: ["Qué estoy ", "construyendo", " ahora."],
    subhead:
      "Snapshot de los frentes activos: SaaS en producción, prep de certificaciones y open source. Se actualiza cada mes.",
    updatedLabel: "actualizado",
    statusActive: "activo",
    statusBrewing: "en fuego lento",
    backHome: "← cobos::/home",
  },

  testimonials: {
    label: "testimonios",
    headline: ["Lo que dicen los que ", "trabajan", " conmigo."],
    blurb:
      "Quotes reales de clientes y colegas. Sin marketing — lo que dijeron, atribuible y con permiso.",
  },

  cv: {
    title: "CV · Ernesto Cobos",
    headline: "cv.pdf — una página, sin humo",
    print: "descargar PDF",
    contactLabel: "contacto",
    expLabel: "experiencia",
    projectsLabel: "proyectos",
    certsLabel: "certificaciones",
    stackLabel: "stack",
  },

  newsletter: {
    title: "./subscribe",
    blurb:
      "Una nota cuando sale un post nuevo. Sin spam — darte de baja es un clic.",
    placeholder: "tu@email.com",
    cta: "suscribirse",
    success: "● suscrito — revisa tu inbox",
    error: "✗ intenta de nuevo",
    rssCta: "o vía RSS",
  },

  hero: {
    terminalTitle: "~/cobos.io  —  zsh  —  120×40",
    terminalTitleMobile: "~/cobos.io",
    sessionLabel: "session",
    sessionAria: (s: number) => `Sesión activa hace ${s} segundos`,
    versionLine: "› rendering portfolio · v3.0",
    h1Pre: "cobos::cloud_architect",
    h1Sep: "+",
    h1Post: "devsecops",
    subhead:
      "Migraciones legacy → cloud-native, Kubernetes en sectores regulados, multi-cloud, DevSecOps y FinOps. Construyo plataformas como producto.",
    cta: "./view-work.sh",
    ctaContact: "./contact",
    statusBar: {
      env: "eks-prod · eu-west-1",
      argo: "argo cd: synced",
      p95: "p95 118ms",
      health: "healthy",
    },
    devConsoleHelp: "[?] help",
    devConsoleOpen: "open console ·",
  },

  about: {
    sectionLabel: "about",
    action: "cat ./about.md",
    name: "ernesto cobos",
    role: "cloud architect · devsecops",
    location: "mx · utc-6",
    since: "2017",
    statusOnline: "● online",
    headline: [
      "La plataforma es el producto. Lo demás es código en busca de un host.",
    ],
    bioParas: [
      "Casi una década moviendo sistemas críticos a entornos cloud-native. Trato la infra como producto interno: SLOs, golden paths, DX medible.",
    ],
    bioContinuation: {
      pre: "Hoy: Kubernetes regulado, GitOps E2E, multi-cloud (AWS · GCP · Azure), DevSecOps, AI-ready y FinOps. Construyo ",
      enkiflow: "EnkiFlow",
      and: " y ",
      getdecant: "GetDecant",
      post: " — SaaS en producción.",
    },
  },

  stack: {
    sectionLabel: "stack",
    action: "ls -la ./tools | wc -l → 28",
    radialCenterTop: "COBOS::",
    radialCenterMid: "stack",
    radialCenterTools: "TOOLS",
    /** Map a group name (lowercase) to its display label in the radial. Most
     * are universal but kept here so EN can override if needed. */
    groupLabels: {
      cloud: "CLOUD",
      platform: "PLATFORM",
      runtime: "RUNTIME",
      code: "CODE",
      security: "SECURITY",
      observability: "OBSERVABILITY",
    } as Record<string, string>,
  },

  infra: {
    sectionLabel: "infrastructure",
    action: "watch -n1 ./status",
  },

  work: {
    sectionLabel: "showcase · proyectos",
    action: (n: number) => `./projects.list (${n})`,
    headline: ["Lo que estoy ", "construyendo", " ahora."],
    blurb:
      "Tres SaaS en producción, un servidor MCP open-source y dos repos que sostienen la operación. Seis frentes activos.",
    visit: "Visitar sitio",
    repo: "Ver repositorio",
  },

  experience: {
    sectionLabel: "experience",
    action: "git log --oneline",
    timelineNow: "NOW",
    tooltipLabel: (years: string, role: string) => `${years} · ${role}`,
  },

  certs: {
    sectionLabel: "certifications · roadmap",
    action: "ls ./certs --status",
    headline: ["Pruebas del trabajo que ", "ya entrego", "."],
    blurb:
      "Certificaciones de industria mapeadas al trabajo de plataforma que hago a diario — Kubernetes, multi-cloud, IaC. Un roadmap, rastreado en abierto.",
    statusEarned: "obtenida",
    statusInProgress: "recertificando",
    labelEarned: "obtenida",
    labelTarget: "objetivo",
    targetTbd: "por definir",
    progressLabel: "prep",
    progressQueued: "en cola",
    verifyCta: "verificar credencial",
  },

  trends: {
    sectionLabel: "2026 · feature flags",
    action: "ls ./flags",
    flagPrefix: "flag_",
    rollout: "rollout",
    tenants: "tenants",
    statusEnabled: "enabled",
    statusStaged: "staged",
  },

  blog: {
    sectionLabel: "notes",
    action: (n: number) => `tail -n ${n} ./blog`,
    teaserReadMore: "read more",
    teaserNotasCount: (n: number) => `(${n} notas)`,
    /** /blog landing */
    landing: {
      headerHome: "cobos::/blog",
      headerMeta: (n: number) => `ls -la ./blog · ${n} notas`,
      rssLabel: "rss",
      rssTitle: "RSS feed",
      heroOverline: "● notas · field reports",
      heroH1: ["Lo que aprendo construyendo ", "plataforma", " en producción."],
      heroSubhead:
        "Apuntes técnicos sobre GitOps regulado, migraciones sin downtime, FinOps real y plataformas internas. Sin AI-generated fluff — historia, decisiones y los pies-de-página que no salen en el deck.",
      filterCommand: '$ grep -l "category:" ./blog/*.md | sort -u',
      filterAll: "all",
      latestOverline: "./latest · featured",
      featuredCta: "leer artículo →",
      archiveTitle: "$ ls -la ./blog/ archive",
      archiveTitleFiltered: (cat: string) => `$ ls -la ./blog/ archive | grep ${cat}`,
      archiveCount: (n: number) => `${n} entradas`,
      readPostfix: "read",
      readMoreShort: "leer →",
      emptyStateLabel: (cat: string) => `$ ls ./blog/${cat}/`,
      emptyStateText: "0 entradas en esta categoría todavía.",
      emptyStateBackAll: "← ver todas",
      footerTotal: (n: number) => `$ total ${n} · ordered by date desc`,
      backHome: "← cobos::/home",
    },
    /** /blog/[slug] */
    article: {
      breadcrumbHome: "cobos",
      breadcrumbBlog: "/blog",
      labelHome: "Ir al home",
      labelBlog: "Volver al índice del blog",
      readPostfix: "read",
      relatedTitle: (cat: string) => `$ grep -l "category: ${cat}" ./blog/*.md`,
      navPrevLabel: "← anterior · más viejo",
      navNextLabel: "siguiente · más nuevo →",
      navPrevAria: (title: string) => `Anterior: ${title}`,
      navNextAria: (title: string) => `Siguiente: ${title}`,
      footerCat: (slug: string, read: string) =>
        `$ cat ./blog/${slug}.md · ${read} read`,
      editOnGithub: "edit on github",
      footerBackBlog: "← cobos::/blog",
      authorAuthorOf: "sobre el autor",
    },
    /** Modal del home */
    modal: {
      header: "cobos",
      headerBlog: "blog",
      viewFull: "↗ ver completo",
      close: "Cerrar artículo",
      closeShort: "ESC ×",
      catCmd: (slug: string) => `$ cat ./blog/${slug}.md`,
      signoff: "— ernesto.cobos",
    },
  },

  approach: {
    sectionLabel: "mi enfoque",
    action: "man cobos",
    headline: ["Cómo trabajo cuando entro en un ", "proyecto."],
    statusPending: "pending",
    statusRunning: "running",
    statusDone: "done",
    methodLabel: "method:",
    methodValue: "iterative · evidence-first · slo-bound",
    deliverablesLabel: "deliverables:",
    deliverablesValue: "arquitectura · IaC · runbooks · DX",
    actionReplay: "↻ replay",
  },

  contact: {
    sectionLabel: "contact",
    action: "ssh hola@cobos.io",
    headline: ["› ", "open", " ", "connection."],
    blurb:
      "Auditorías, arquitectura objetivo, migraciones, plataformas internas, FinOps. Si el problema es de infra y duele, escríbeme.",
    formTitle: "› ./new-message.sh",
    fieldFrom: "FROM",
    fieldFromPlaceholder: "tu nombre · empresa",
    fieldEmail: "EMAIL",
    fieldEmailPlaceholder: "tu@empresa.com",
    fieldSubject: "SUBJECT",
    fieldSubjectPlaceholder: "auditoría · migración · plataforma · …",
    fieldBody: "BODY",
    fieldBodyPlaceholder: "contexto del reto, stack actual, timing…",
    sendCta: "./send",
    copyEmail: "copiar email",
    copied: "copiado ✓",
    connectionAlive: "● connection alive",
    consoleVersion: "cobos.io / v3.0 · console",
    linkEmail: "email",
    linkGithub: "github",
    linkLi: "li",
    linkBlog: "blog",
  },

  notFound: {
    title: "404 · cobos::",
    description:
      "Esa ruta no existe en este manifiesto. Volvé al home o explorá las notas técnicas.",
    terminalTitle: "~/cobos.io — zsh — exit code 404",
    statusBadge: "404",
    fatalLabel: "HTTP/2 404 Not Found",
    notFoundLine: (path: string) =>
      `path '${path}' not found in this manifest.`,
    suggestionsHint: "no rule matched · check the suggestions below ↓",
    suggestionsLabel: "$ ls ./suggestions",
    suggestionHome: "↩ home",
    suggestionBlog: "/blog · notas de campo",
    region: "iad1 · cobos-edge",
  },

  error: {
    terminalTitle: "~/cobos.io — zsh — exit code 500",
    statusBadge: "500",
    logCmd: "$ tail -f /var/log/cobos.io/runtime.log",
    fatalPrefix: "FATAL:",
    panicPrefix: "panic:",
    digestRedacted: "<redacted>",
    exitedLine: "process exited with status 1.",
    retryHint: "↻ retry below — or report it on github if it keeps happening.",
    retry: "↻ retry",
    home: "↩ home",
    reportGithub: "report on github ↗",
    globalHeadline: "Algo se rompió en el shell raíz.",
    globalUnknown: "Unknown error.",
    globalDigest: "digest:",
  },

  rss: {
    feedTitle: "cobos::/blog · notas de campo",
    feedDescription:
      "Notas técnicas sobre GitOps regulado, migraciones a EKS sin downtime, FinOps real y plataformas internas. Apuntes desde producción por Ernesto Cobos.",
    language: "es-MX",
  },
};
