---
slug: finops-dashboard
title: "FinOps no es Excel: cómo construí un dashboard que ahorra 38%"
d: "Ene 2026"
date: "2026-01-15"
r: "3 min"
category: finops
translator: deepseek-v4-flash
---

Cualquiera puede armar un Excel con la factura de AWS y enviárselo al CFO el viernes. El FinOps real es otra cosa: hacer que los ahorros sean automáticos y darle a los leads de ingeniería el costo de sus decisiones en tiempo real, no 30 días después.

Así es como construí el dashboard que en una empresa retail nos ahorró 38% de la factura cloud (de ~$180k/mes a ~$112k/mes) en 9 meses, y por qué Excel no era una opción.

## Paso 1: estrategia de tags, o nada funciona

Sin tags no hay FinOps. Los tags mínimos: team, service, env, cost-center. Política: cualquier recurso sin esos 4 tags se elimina automáticamente después de 7 días (excepción: producción). El primer mes el equipo gritó. El segundo mes todos etiquetaron. Lambda + CloudWatch event para auditoría diaria.

## Paso 2: dónde vivía el 38%

Análisis postmortem de los ahorros reales:

- Recursos idle (12%): instancias dev funcionando 24/7. Auto-stop después de las 7pm y fines de semana. Esto solo no rompe nada y nadie se da cuenta.
- RDS sobredimensionado (9%): instancias r5.4xlarge con 6% de CPU promedio. Rightsize a r5.large + read replica si es necesario.
- Recursos huérfanos (7%): volúmenes EBS sin attach, ELBs sin targets, snapshots viejos. CloudCustodian + tag "delete-after" automático.
- Transferencia de datos por NAT Gateway (5%): equipos accediendo a S3 por internet público en lugar de un VPC endpoint. Migrar a gateway endpoints, $0/GB en vez de $0.045/GB.
- Reserved Instances mal modeladas (5%): RIs compradas hace 2 años para una shape que ya no se usa. Vender en el marketplace + comprar Compute Savings Plans (más flexible).

## Paso 3: el dashboard real

Stack: Cost & Usage Report (CUR) → S3 → Athena → Grafana. No usé Cost Explorer porque no permite consultas cross-dimension personalizadas. Cada equipo tiene su panel: gasto del mes, vs forecast, vs la misma semana del mes anterior, desglose por servicio. Drill-down hasta el recurso individual.

Lo que realmente cambia el comportamiento: cada PR de infra (Terraform) ejecuta infracost y publica el delta de costo en el PR. Los devs ven "este cambio agrega $42/mes" antes de mergear. Cero argumento, dato directo.

## Paso 4: Reserved Instances vs Savings Plans vs Spot

Modelo simple:

- Spot para batch, CI/CD, entornos dev (60–90% de ahorro, toleras interrupción).
- Compute Savings Plans 1yr sin pago inicial para la línea base de producción (40% de ahorro, flexibilidad de instancia).
- RIs solo para RDS y ElastiCache (no hay SP para esos).

Comprar los SP/RI no es un evento único, es un proceso recurrente. Cada mes: revisión de utilización, ajuste de compromiso. Lo automatizé con un script que recomienda compras basado en los últimos 90 días.

## Paso 5: showback antes que chargeback

Chargeback (cobrarle al equipo) es controversial y genera política. Showback (mostrar el costo, sin cobrar) impulsa el 80% del cambio cultural sin la política. Empieza con showback. Si después de 6 meses el comportamiento no mejora, evalúa chargeback.

## Lo que no funciona

Kubecost solo. Es un buen narrador para K8s pero no ve el resto (RDS, S3, transferencia). Necesitas CUR.

Auto-rightsize sin aprobación. Lo intenté. Rompe producción. Recomendaciones → tickets, no aplicar automáticamente.

Reunión mensual de FinOps con cada equipo. Aburrido, nadie asiste. Mejor: un canal de Slack con un bot que publique los top-5 gastadores semanalmente y deje que el equipo se autoorganice.

## Lo que importa

El 38% no vino de un truco. Vino de hacer el costo visible, accionable y acortar el ciclo de feedback de meses a horas. La parte difícil no es técnica — es establecer el ciclo cultural donde optimizar el costo es trabajo de todos, no del CFO.
