import type { Dictionary } from "./shape";

/**
 * English (en-US) dictionary. Mirrors the shape of `es.ts` exactly —
 * TypeScript will fail compilation if any key drifts. When a key is
 * intentionally identical across locales (CLI flags, technical jargon,
 * brand names), repeat it verbatim instead of using a fallback so the
 * intent is explicit.
 */
export const en: Dictionary = {
  meta: {
    siteTitle: "Ernesto Cobos — Cloud Architect · Platform Engineer · DevSecOps",
    siteDescription:
      "Legacy → cloud-native migrations, Kubernetes in regulated sectors, multi-cloud, DevSecOps and FinOps. I build platforms as a product.",
    htmlLang: "en",
    ogLocale: "en_US",
    skipLink: "↓ skip to content",
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
    ariaSections: "Sections",
    ariaBackToTop: "Back to top",
    ariaOpenMenu: "Open menu",
    ariaCloseMenu: "Close menu",
    menuEntries: (n: number) => `${n} entries`,
    menuActiveHere: "● here",
    ariaLanguageGroup: "Language",
    ariaSwitchTo: (other: "es" | "en"): string =>
      other === "en" ? "Switch to English" : "Switch to Spanish",
  },

  hero: {
    terminalTitle: "~/cobos.io  —  zsh  —  120×40",
    terminalTitleMobile: "~/cobos.io",
    sessionLabel: "session",
    versionLine: "› rendering portfolio · v3.0",
    h1Pre: "cobos::cloud_architect",
    h1Sep: "+",
    h1Post: "devsecops",
    subhead:
      "Legacy → cloud-native migrations, Kubernetes in regulated sectors, multi-cloud, DevSecOps and FinOps. I build platforms as a product.",
    cta: "./view-work.sh",
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
      "The platform is the product. Everything else is code looking for a host.",
    ],
    bioParas: [
      "Almost a decade moving critical systems to cloud-native environments. I treat infra as an internal product: SLOs, golden paths, measurable DX.",
    ],
    bioContinuation: {
      pre: "Today: regulated Kubernetes, end-to-end GitOps, multi-cloud (AWS · GCP · Azure), DevSecOps, AI-ready and FinOps. I build ",
      enkiflow: "EnkiFlow",
      and: " and ",
      getdecant: "GetDecant",
      post: " — SaaS in production.",
    },
  },

  stack: {
    sectionLabel: "stack",
    action: "ls -la ./tools | wc -l → 38",
    radialCenterTop: "COBOS::",
    radialCenterMid: "stack",
    radialCenterTools: "TOOLS",
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
    sectionLabel: "showcase · projects",
    action: (n: number) => `./projects.list (${n})`,
    headline: ["What I'm ", "building", " right now."],
    blurb:
      "Two SaaS in production and two open-source repos that hold the operation together. Four active fronts.",
    visit: "Visit site",
    repo: "View repo",
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
    headline: ["Proof for the work I ", "already ship", "."],
    blurb:
      "Industry certifications mapped to the platform work I do daily — Kubernetes, multi-cloud, IaC. A roadmap, tracked in the open.",
    statusEarned: "earned",
    statusInProgress: "recertifying",
    labelEarned: "earned",
    labelTarget: "target",
    targetTbd: "TBD",
    progressLabel: "prep",
    progressQueued: "queued",
    verifyCta: "verify credential",
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
    teaserNotasCount: (n: number) => `(${n} posts)`,
    landing: {
      headerHome: "cobos::/blog",
      headerMeta: (n: number) => `ls -la ./blog · ${n} posts`,
      rssLabel: "rss",
      rssTitle: "RSS feed",
      heroOverline: "● notes · field reports",
      heroH1: ["What I learn building ", "platforms", " in production."],
      heroSubhead:
        "Field notes on regulated GitOps, zero-downtime migrations, real-world FinOps, and internal developer platforms. No AI-generated fluff — history, decisions, and the footnotes that don't make it into the deck.",
      filterCommand: '$ grep -l "category:" ./blog/*.md | sort -u',
      filterAll: "all",
      latestOverline: "./latest · featured",
      featuredCta: "read article →",
      archiveTitle: "$ ls -la ./blog/ archive",
      archiveTitleFiltered: (cat: string) => `$ ls -la ./blog/ archive | grep ${cat}`,
      archiveCount: (n: number) => `${n} entries`,
      readPostfix: "read",
      readMoreShort: "read →",
      emptyStateLabel: (cat: string) => `$ ls ./blog/${cat}/`,
      emptyStateText: "0 entries in this category yet.",
      emptyStateBackAll: "← see all",
      footerTotal: (n: number) => `$ total ${n} · ordered by date desc`,
      backHome: "← cobos::/home",
    },
    article: {
      breadcrumbHome: "cobos",
      breadcrumbBlog: "/blog",
      labelHome: "Go to home",
      labelBlog: "Back to blog index",
      readPostfix: "read",
      relatedTitle: (cat: string) => `$ grep -l "category: ${cat}" ./blog/*.md`,
      navPrevLabel: "← previous · older",
      navNextLabel: "next · newer →",
      navPrevAria: (title: string) => `Previous: ${title}`,
      navNextAria: (title: string) => `Next: ${title}`,
      footerCat: (slug: string, read: string) =>
        `$ cat ./blog/${slug}.md · ${read} read`,
      editOnGithub: "edit on github",
      footerBackBlog: "← cobos::/blog",
      authorAuthorOf: "about the author",
    },
    modal: {
      header: "cobos",
      headerBlog: "blog",
      viewFull: "↗ open full page",
      close: "Close article",
      closeShort: "ESC ×",
      catCmd: (slug: string) => `$ cat ./blog/${slug}.md`,
      signoff: "— ernesto.cobos",
    },
  },

  approach: {
    sectionLabel: "my approach",
    action: "man cobos",
    headline: ["How I work when I take on a ", "project."],
    statusPending: "pending",
    statusRunning: "running",
    statusDone: "done",
    methodLabel: "method:",
    methodValue: "iterative · evidence-first · slo-bound",
    deliverablesLabel: "deliverables:",
    deliverablesValue: "architecture · IaC · runbooks · DX",
    actionReplay: "↻ replay",
  },

  contact: {
    sectionLabel: "contact",
    action: "ssh hola@cobos.io",
    headline: ["› ", "open", " ", "connection."],
    blurb:
      "Audits, target architectures, migrations, internal platforms, FinOps. If the problem is infra and it hurts, drop me a line.",
    formTitle: "› ./new-message.sh",
    fieldFrom: "FROM",
    fieldFromPlaceholder: "your name · company",
    fieldEmail: "EMAIL",
    fieldEmailPlaceholder: "you@company.com",
    fieldSubject: "SUBJECT",
    fieldSubjectPlaceholder: "audit · migration · platform · …",
    fieldBody: "BODY",
    fieldBodyPlaceholder: "context, current stack, timing…",
    sendCta: "./send",
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
      "That route doesn't exist in this manifest. Head back home or explore the technical notes.",
    terminalTitle: "~/cobos.io — zsh — exit code 404",
    statusBadge: "404",
    fatalLabel: "HTTP/2 404 Not Found",
    notFoundLine: (path: string) =>
      `path '${path}' not found in this manifest.`,
    suggestionsHint: "no rule matched · check the suggestions below ↓",
    suggestionsLabel: "$ ls ./suggestions",
    suggestionHome: "↩ home",
    suggestionBlog: "/blog · field notes",
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
    globalHeadline: "Something broke in the root shell.",
    globalUnknown: "Unknown error.",
    globalDigest: "digest:",
  },

  rss: {
    feedTitle: "cobos::/blog · field notes",
    feedDescription:
      "Technical notes on regulated GitOps, zero-downtime migrations to EKS, real-world FinOps, and internal developer platforms. Field reports from production by Ernesto Cobos.",
    language: "en-US",
  },
};
