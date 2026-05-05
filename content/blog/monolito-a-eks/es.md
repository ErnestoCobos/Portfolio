---
slug: monolito-a-eks
title: "Migrando un monolito a EKS sin downtime: el playbook"
d: "Feb 2026"
date: "2026-02-15"
r: "6 min"
category: migrations
---

Migrar un monolito sin downtime es 80% planificación, 15% paciencia, y 5% el deploy real. Lo difícil no es contenedorizar — es mover el state sin perder un request. Este es el playbook que apliqué en un retail enterprise (~3M usuarios activos) sobre un monolito Laravel + MySQL.

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

Reescribir el monolito completo a microservicios desde cero en paralelo es la trampa más común. No funciona. Muere antes de llegar a feature parity. La migración tiene que ser estranguladora — el monolito vive y se va comiendo poco a poco, no se reescribe. Si tu plan de migración no contempla un escenario "el monolito sigue corriendo en 2 años porque la pieza X no conviene mover", el plan está mal.
