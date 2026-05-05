---
slug: finops-dashboard
title: "FinOps no es Excel: cómo construí un dashboard que ahorra un 38%"
d: "Ene 2026"
date: "2026-01-15"
r: "5 min"
category: finops
---

Cualquiera puede armar un Excel con la factura de AWS y enviárselo por email al CFO el viernes. El verdadero FinOps es otra cosa: es automatizar el ahorro y mostrarle a los líderes de ingeniería el costo de sus decisiones en tiempo real, no 30 días después.

Así construí el dashboard que en una empresa de retail nos ahorró un 38% de la factura cloud (de ~$180k/mes a ~$112k/mes) en 9 meses, y por qué Excel no era una opción.

## Paso 1: estrategia de etiquetado, o nada funciona

Sin etiquetas, no hay FinOps. Las etiquetas mínimas: team, service, env, cost-center. Política: cualquier recurso sin esas 4 etiquetas se elimina automáticamente después de 7 días (excepción: production). El primer mes el equipo gritó. El segundo mes todos etiquetaron. Lambda + evento de CloudWatch para auditoría diaria.

## Paso 2: dónde vivía el 38%

Análisis postmortem del ahorro real:

Recursos ociosos (12%): instancias de dev corriendo 24/7. Auto-parada después de las 7pm y fines de semana. Esto solo no rompe nada y nadie se da cuenta.

RDS sobredimensionado (9%): instancias r5.4xlarge corriendo al 6% de CPU promedio. Rightsize a r5.large + réplica de lectura si es necesario.

Recursos huérfanos (7%): volúmenes EBS no asociados, ELBs sin targets, snapshots viejos. CloudCustodian + etiqueta automática "delete-after".

Transferencia de NAT Gateway (5%): equipos accediendo a S3 por internet público en lugar de un VPC endpoint. Migrar a gateway endpoints, $0/GB en vez de $0.045/GB.

Reserved Instances mal modeladas (5%): RIs compradas hace 2 años para un tipo de instancia que ya no se usa. Vender en el marketplace + comprar Compute Savings Plans (más flexibles).

## Paso 3: el dashboard real

Stack: Cost & Usage Report (CUR) → S3 → Athena → Grafana. No usé Cost Explorer porque no permite consultas personalizadas entre dimensiones.

Cada equipo tiene su panel: gasto mensual, vs forecast, vs la misma semana del mes pasado, breakdown por servicio. Drill-down al recurso individual.

Lo que realmente cambia el comportamiento: cada PR de infra (Terraform) corre infracost y publica el delta de costo en el PR. Los devs ven "este cambio agrega $42/mes" antes de mergear. Cero discusión, datos directos.

## Paso 4: Reserved Instances vs Savings Plans vs Spot

Modelo simple:

Spot para batch, CI/CD, entornos de dev (60–90% de ahorro, toleras la interrupción).

Compute Savings Plans 1 año no-upfront para la baseline de producción (40% de ahorro, flexibilidad de instancia).

RIs solo para RDS y ElastiCache (no hay SP para esos).

Comprar el SP/RI no es un evento único, es un proceso recurrente. Cada mes: revisión de utilización, ajuste de compromiso. Lo automaticé con un script que recomienda compras basándose en los últimos 90 días.

## Paso 5: showback antes que chargeback

Chargeback (cobrarle al equipo) es controversial y genera política. Showback (mostrar el costo, sin cobrar) impulsa el 80% del cambio cultural sin la política. Empieza con showback. Si después de 6 meses el comportamiento no mejora, evalúa chargeback.

## Lo que no funciona

Kubecost solo. Es un buen cuentacuentos para K8s pero no ve el resto (RDS, S3, transferencia). Necesitas CUR.

Auto-rightsize sin aprobación. Lo intenté. Rompe producción. Recomendaciones → tickets, no auto-apply.

Reunión mensual de FinOps con cada equipo. Aburrido, nadie aparece. Mejor: un canal de Slack con un bot que publica los top-5 gastadores semanalmente y deja que el equipo se auto-organice.

## Lo que importa

El 38% no vino de un truco. Vino de hacer el costo visible, accionable, y de reducir el ciclo de feedback de meses a horas. La parte difícil no es técnica — es establecer el ciclo cultural donde optimizar el costo es trabajo de todos, no del CFO.
