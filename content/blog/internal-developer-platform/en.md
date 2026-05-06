---
slug: internal-developer-platform
title: "Why every team needs an Internal Developer Platform"
d: "Dec 2025"
date: "2025-12-15"
r: "3 min"
category: platform
translator: deepseek-v4-flash
---
If your technical onboarding for a new dev takes more than 1 week before they merge their first PR to production, you don't have an onboarding problem — you have a platform problem. The fix is called an Internal Developer Platform (IDP) and it isn't Backstage.


## The real problem: cognitive load


A modern dev has to know: Git, GitHub Actions, Docker, Kubernetes, Terraform, Vault, Argo CD, Datadog, AWS console, IAM, KMS, RDS, Helm, OPA — and still has to know how to write the product code. This isn't sustainable. Every tool the dev MUST know is cognitive tax on the actual work (shipping features).


An IDP flips it: the dev writes code + defines a service manifest. The IDP handles the rest.


## What an IDP actually is


An IDP isn't a portal. It's:


A catalogue: which services exist, who owns them, where the runbooks are.


Golden paths: opinionated templates to create a new service (CI, CD, monitoring, alerts, RBAC, secrets management — all included).


Self-service: provisioning of DB, Redis, S3 bucket, domain, without tickets to infra.


Observability built-in: metrics, logs, traces appear automatically without configuration.


Backstage is the frontend for the first two. The other two are backend (Crossplane, Argo Workflows, custom operators). Confusing Backstage with an IDP is like confusing a Grafana dashboard with observability.


## Golden paths: opinionated but escapable


The classic mistake: making the IDP too rigid. "You can only use Postgres, you can only deploy to EKS". Result: teams ignore the IDP and build their own thing on the side.


The balance that works: the golden path covers 80% of the happy cases. For the remaining 20%, there's a documented off-ramp: how to leave the path without the platform blocking you. If you take the off-ramp, you lose some benefits (IDP SLA, support) but you're still a first-class citizen.


## Self-service isn't "faster ticketing"


If the dev still opens a ticket to infra to create an S3 bucket, you don't have self-service. You have faster ticketing. Real self-service: the dev does a git push with a manifest saying "I need an S3 bucket with KMS encryption and a 30-day lifecycle", and in 5 minutes it exists, tagged, monitored, in their AWS account, with the right permissions.


I built it with Crossplane + ArgoCD + a GitHub Actions workflow that validates the manifest against OPA policies before merging. Provisioning time: 4 minutes on average. Tickets to infra for common resources: 0.


## Metrics that matter


DORA metrics applied to the IDP:


Lead time for changes (commit → prod): from 5 days to 2 hours.


Deployment frequency: from 1/week per team to 5/day per team.


Change failure rate: dropped from 18% to 6% (golden paths include mandatory tests).


MTTR: from 4 hours to 35 minutes (built-in runbooks + automatic observability).


If the IDP doesn't move these 4, it isn't working.


## Build vs buy


Backstage open-source + custom plugins: 6 months for a 3-person platform team to reach production. Vendor IDP (Humanitec, Port, Mia-Platform): 4 weeks to basic feature, $$$ per seat.


My rule: if the org has <50 devs, vendor. If it has >150, build (because the investment amortizes and you want control). Between 50 and 150, it depends on the platform team you have.


## When NOT to build an IDP


If you're 10 devs, don't build it. It's overhead without ROI. What you need is a good Makefile and a README, not Backstage. The IDP starts making sense when there are 3+ teams sharing infra and coordination becomes cognitive tax.


## The summary


A well-built IDP is the difference between a team that spends 60% of its time on plumbing (config, infra, debugging deploys) and one that spends 60% on features. That's measurable ROI. If your platform isn't delivering it, your platform is plumbing in disguise.
