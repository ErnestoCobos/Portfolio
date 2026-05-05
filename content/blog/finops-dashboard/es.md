---
slug: finops-dashboard
title: "FinOps no es Excel: cómo construí un dashboard que ahorra 38%"
d: "Ene 2026"
date: "2026-01-15"
r: "5 min"
category: finops
---

Cualquiera puede armar un Excel con la factura de AWS y mandárselo al CFO el viernes. FinOps real es otra cosa: es hacer que el ahorro sea automático y los engineering leads vean el costo de sus decisiones en tiempo real, no 30 días después.

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

El 38% no vino de un truco. Vino de hacer que el costo sea visible, accionable, y que el feedback loop sea de horas, no de meses. La parte difícil no es técnica — es montar el ciclo cultural donde optimizar costo es trabajo de todos, no del CFO.
