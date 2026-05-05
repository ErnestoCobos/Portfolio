---
slug: gitops-regulados
title: "GitOps in regulated sectors: what nobody tells you"
d: "Mar 2026"
date: "2026-03-15"
r: "5 min"
category: gitops
---

GitOps sounds perfect on the deck: declarative, auditable, rollback-by-git. Then the first PCI or SOC2 auditor walks in and you realize the "git is the source of truth" model doesn't answer the questions that actually matter in a regulated sector.

I spent several years in banking and as many in automotive. These are the points where GitOps breaks under regulated production, and how I fixed them.

## Separation of duties is not a PR label

The auditor asks: "who can deploy to production?". Answering "whoever approves the PR" doesn't cut it. You need CODEOWNERS per folder, branch protection with team-required approvers, and a clean split between who merges vs. who runs argocd app sync. In practice: two distinct teams. The one writing the manifest (dev) and the one applying it (SRE). Argo CD supports this via granular RBAC, but it has to be designed from day one.

## The audit trail is not git log

git log tells you which commit made which change. The auditor wants to know what actually happened in production at 2:32pm on Thursday. You need to correlate commit → sync event → pod restart → observability metric. I built it with Argo CD events → Kafka → an append-only ledger in Postgres. Every sync ends up signed and traceable, with exportable evidence.

## Secrets: sealed-secrets is the easy path, not the right one

Sealed-secrets encrypts the secret in git with the cluster's public key. It works, but rotating the cluster key is a nightmare and there's no granular revocation. In regulated environments I ended up with External Secrets Operator + Vault: the manifest in git references a Vault path, the real secret never touches git. Auditor happy, rotation trivial, blast radius bounded.

## Drift detection is where the castle falls

GitOps assumes git == cluster. Reality: someone runs kubectl edit during an emergency, or a controller mutates a resource. Argo CD detects drift, but what matters is the policy. Auto-sync with auto-prune is aggressive and breaks things; manual sync leaves drift unresolved. The balance: auto-sync with selfHeal: true for low-criticality apps, manual with an SLO alert for the critical ones.

## Multi-env promotion is not promote-PR

The easy playbook: PR to dev/, merge → auto-deploy. PR to staging/, same. PR to prod/, same. In regulated environments that doesn't happen. There's a change advisory board, change windows, freeze periods. What worked: app-of-apps with targetRevision per env, and promotion is a PR that bumps the SHA in the next env up. Every bump passes through human approval + a JIRA ticket with evidence.

## The hidden cost: culture

Technically GitOps stands up in 2 weeks. Getting teams to adopt it correctly takes 6 months. Typical resistance: "I always ran helm upgrade, why a PR?". The answer isn't technical, it's compliance alignment: "because the auditor is going to ask, and you don't want to be the bottleneck".

## What the people thinking it through take away

GitOps in regulated sectors isn't "GitOps with more PRs". It's redesigning the flow on the assumption that the auditor is going to audit git, not the cluster. If your compliance can't be demonstrated by reading the repo + the event ledger, GitOps failed you — not technically, but in the only dimension that matters to keep the bank from pulling your stamp.
