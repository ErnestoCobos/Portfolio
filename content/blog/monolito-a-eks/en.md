---
slug: monolito-a-eks
title: "Migrating a monolith to EKS with zero downtime: the playbook"
d: "Feb 2026"
date: "2026-02-15"
r: "6 min"
category: migrations
---

Migrating a monolith with zero downtime is 80% planning, 15% patience, and 5% the actual deploy. The hard part isn't containerizing — it's moving the state without losing a single request. This is the playbook I applied at a retail enterprise (~3M active users) on a Laravel + MySQL monolith.

## Step 0: measure, don't assume

Before touching anything: APM on the monolith for 2 weeks. Most-used endpoints, latency percentiles, expensive queries, which tables grow, which are hot. Without this, you'll migrate what you *think* matters, not what actually matters.

## Step 1: extract state from the monolith

Sessions on disk / PHP-FPM → move to Redis (ElastiCache). Local uploads → S3. Cron on the server → EventBridge + Lambda. File cache → Memcached/Redis. This happens while the monolith is still on VMs, before you touch EKS. Each extraction is its own release, validatable in isolation.

## Step 2: containerize the whole monolith

Don't fragment yet. Pack the monolith as-is into a container, deploy it to EKS alongside the legacy, ALB with weighted target groups: 95% legacy / 5% EKS. Validate that the EKS pod responds identically to the legacy. Any differences are latent bugs the monolith had but nobody noticed.

## Step 3: gradual traffic shift

ALB target group weights: 95/5 → 80/20 → 50/50 → 20/80 → 0/100. Each step holds for 1 week. Metrics you watch: error rate, p95, p99, DB connections, business metrics (orders/min, signups/hr). A single violated SLO = immediate rollback (back to the previous weight).

## Step 4: the database is the real problem

Monolith and EKS pods point to the same RDS — easy. The problem comes when you want to extract a service (catalog, payments). Two patterns that worked:

Read-replica + dual-write: the new service writes to its own DB and to the monolith's. Reads already hit the new one. Once dual-write is stable for 2 weeks, cut the write to the monolith's DB.

CDC with Debezium: the monolith keeps writing to its DB; Debezium replicates to the new service in near-real-time. More complex but the monolith never finds out.

## Step 5: strangler fig by URL

Once a new service is stable, ALB does rule-based routing: /api/payments/* → new service, everything else → monolith. Each /api/X you migrate shrinks the monolith. Over 18 months we went from 1 monolith to 7 services + 1 thin monolith holding the billing logic that's never worth fragmenting.

## Step 6: rollback is not git revert

If the new service wrote to a new DB, "rollback" means reading data in old syntax from a DB that no longer exists. The rollback plan is designed BEFORE the switchover, not during it. At every cutover: full backup of the new DB, RDS snapshot, S3 export. Documented. Tested in staging.

## What you don't see in the happy-path blog posts

Rewriting the whole monolith into microservices from scratch in parallel is the most common trap. It doesn't work. It dies before reaching feature parity. The migration has to be a strangler — the monolith lives and gets eaten piece by piece, it isn't rewritten. If your migration plan doesn't entertain a scenario where "the monolith is still running in 2 years because piece X isn't worth moving", the plan is wrong.
