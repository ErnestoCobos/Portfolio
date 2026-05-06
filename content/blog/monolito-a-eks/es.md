---
slug: monolito-a-eks
title: "Migrando un monolito a EKS con cero downtime: el playbook"
d: "Feb 2026"
date: "2026-02-15"
r: "3 min"
category: migrations
translator: deepseek-v4-flash
---
Migrar un monolito con cero downtime es 80% planeación, 15% paciencia y 5% el deploy real. La parte difícil no es containerizar — es mover el estado sin perder una sola request. Este es el playbook que apliqué en una empresa retail (~3M de usuarios activos) sobre un monolito Laravel + MySQL.

## Paso 0: mide, no asumas

Antes de tocar nada: APM en el monolito por 2 semanas. Endpoints más usados, percentiles de latencia, queries costosas, qué tablas crecen, cuáles están calientes. Sin esto, vas a migrar lo que _crees_ que importa, no lo que realmente importa.

## Paso 1: extrae el estado del monolito

Sesiones en disco / PHP-FPM → muévelas a Redis (ElastiCache). Subidas locales → S3. Cron en el servidor → EventBridge + Lambda. Caché de archivos → Memcached/Redis. Esto ocurre mientras el monolito sigue en VMs, antes de tocar EKS. Cada extracción es su propio release, validable de forma aislada.

## Paso 2: containeriza el monolito completo

No fragmentes aún. Empaqueta el monolito tal cual en un contenedor, haz deploy a EKS junto con el legacy, ALB con weighted target groups: 95% legacy / 5% EKS. Valida que el pod de EKS responda idénticamente al legacy. Cualquier diferencia son bugs latentes que el monolito tenía pero nadie notó.

## Paso 3: transición gradual de tráfico

Pesos de target groups del ALB: 95/5 → 80/20 → 50/50 → 20/80 → 0/100. Cada paso se mantiene por 1 semana. Métricas que vigilas: error rate, p95, p99, conexiones a BD, métricas de negocio (órdenes/min, registros/hr). Un solo SLO violado = rollback inmediato (al peso anterior).

## Paso 4: la base de datos es el verdadero problema

El monolito y los pods de EKS apuntan al mismo RDS — fácil. El problema viene cuando quieres extraer un servicio (catálogo, pagos). Dos patrones que funcionaron:

Read-replica + dual-write: el nuevo servicio escribe en su propia BD y en la del monolito. Las lecturas ya van a la nueva. Una vez que el dual-write es estable por 2 semanas, corta la escritura a la BD del monolito.

CDC con Debezium: el monolito sigue escribiendo en su BD; Debezium replica al nuevo servicio en casi tiempo real. Más complejo pero el monolito nunca se entera.

## Paso 5: strangler fig por URL

Una vez que un nuevo servicio es estable, ALB hace rule-based routing: `/api/payments/*` → nuevo servicio, todo lo demás → monolito. Cada `/api/X` que migras encoge el monolito. En 18 meses pasamos de 1 monolito a 7 servicios + 1 monolito delgado que contiene la lógica de facturación que nunca vale la pena fragmentar.

## Paso 6: rollback no es git revert

Si el nuevo servicio escribió en una nueva BD, "rollback" significa leer datos en sintaxis antigua desde una BD que ya no existe. El plan de rollback se diseña ANTES del switchover, no durante. En cada cutover: backup completo de la nueva BD, snapshot de RDS, export a S3. Documentado. Probado en staging.

## Lo que no ves en los blog posts del happy path

Reescribir todo el monolito en microservicios desde cero en paralelo es la trampa más común. No funciona. Muere antes de alcanzar paridad de funcionalidades. La migración tiene que ser un strangler — el monolito vive y se come pieza por pieza, no se reescribe. Si tu plan de migración no contempla un escenario donde "el monolito sigue corriendo en 2 años porque la pieza X no vale la pena moverla", el plan está mal.
