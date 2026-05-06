---
slug: finops-dashboard
title: "FinOps is not Excel: how I built a dashboard that saves 38%"
d: "Jan 2026"
date: "2026-01-15"
r: "3 min"
category: finops
translator: deepseek-v4-flash
---
Anyone can put together an Excel with the AWS bill and email it to the CFO on Friday. Real FinOps is something else: it's making the savings automatic and giving engineering leads the cost of their decisions in real time, not 30 days later.


Here's how I built the dashboard that in a retail enterprise saved us 38% of the cloud bill (from ~$180k/mo to ~$112k/mo) over 9 months, and why Excel wasn't an option.


## Step 1: tagging strategy, or nothing works


Without tags, there's no FinOps. The minimum tags: team, service, env, cost-center. Policy: any resource without those 4 tags is automatically deleted after 7 days (exception: production). The first month the team screamed. The second month everyone tagged. Lambda + CloudWatch event for daily audit.


## Step 2: where the 38% lived


Postmortem analysis of the actual savings:


Idle resources (12%): dev instances running 24/7. Auto-stop after 7pm and weekends. This alone breaks nothing and nobody notices.


Oversized RDS (9%): r5.4xlarge instances running at 6% average CPU. Rightsize to r5.large + read replica if needed.


Orphan resources (7%): unattached EBS volumes, ELBs without targets, old snapshots. CloudCustodian + automatic "delete-after" tag.


NAT Gateway data transfer (5%): teams hitting S3 over the public internet instead of a VPC endpoint. Migrate to gateway endpoints, $0/GB instead of $0.045/GB.


Mis-modeled Reserved Instances (5%): RIs bought 2 years ago for a shape that's no longer in use. Sell on the marketplace + buy Compute Savings Plans (more flexible).


## Step 3: the actual dashboard


Stack: Cost & Usage Report (CUR) → S3 → Athena → Grafana. I didn't use Cost Explorer because it doesn't allow custom cross-dimension queries. Each team has its panel: month spend, vs forecast, vs the same week last month, service breakdown. Drill-down to the individual resource.


What actually changes behavior: every infra PR (Terraform) runs infracost and posts the cost delta on the PR. Devs see "this change adds $42/mo" before merging. Zero argument, direct data.


## Step 4: Reserved Instances vs Savings Plans vs Spot


Simple model:


Spot for batch, CI/CD, dev environments (60–90% savings, you tolerate interruption).


Compute Savings Plans 1yr no-upfront for prod baseline (40% savings, instance flexibility).


RIs only for RDS and ElastiCache (no SP for those).


Buying the SP/RI is not a one-time event, it's a recurring process. Every month: utilization review, commit adjustment. I automated it with a script that recommends purchases based on the last 90 days.


## Step 5: showback before chargeback


Chargeback (charging the team) is controversial and creates politics. Showback (showing the cost, without charging) drives 80% of the cultural change without the politics. Start with showback. If after 6 months behavior doesn't improve, evaluate chargeback.


## What doesn't work


Kubecost alone. It's a good storyteller for K8s but doesn't see the rest (RDS, S3, transfer). You need CUR.


Auto-rightsize without approval. I tried. It breaks production. Recommendations → tickets, not auto-apply.


Monthly FinOps meeting with every team. Boring, nobody shows up. Better: a Slack channel with a bot that posts the top-5 spenders weekly and lets the team self-organize.


## What matters


The 38% didn't come from a trick. It came from making cost visible, actionable, and shrinking the feedback loop from months to hours. The hard part isn't technical — it's setting up the cultural cycle where optimizing cost is everyone's job, not the CFO's.
