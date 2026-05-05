---
slug: gitops-regulados
title: "GitOps en sectores regulados: lo que nadie te dice"
d: "Mar 2026"
date: "2026-03-15"
r: "5 min"
category: gitops
---

GitOps suena perfecto en la presentación: declarativo, auditable, rollback mediante git. Luego entra el primer auditor de PCI o SOC2 y te das cuenta de que el modelo de "git es la fuente de la verdad" no responde a las preguntas que realmente importan en un sector regulado.

Pasé varios años en banca y otros tantos en el sector automotriz. Estos son los puntos donde GitOps se rompe en producción regulada, y cómo los solucioné.

## La separación de funciones no es una etiqueta de PR

El auditor pregunta: "¿quién puede hacer deploy a producción?". Responder "quien aprueba el PR" no es suficiente. Necesitas CODEOWNERS por carpeta, protección de rama con aprobadores requeridos por equipo, y una separación clara entre quién hace merge y quién ejecuta `argocd app sync`. En la práctica: dos equipos distintos. El que escribe el manifiesto (dev) y el que lo aplica (SRE). Argo CD lo soporta mediante RBAC granular, pero debe diseñarse desde el día uno.

## El registro de auditoría no es git log

`git log` te dice qué commit hizo qué cambio. El auditor quiere saber qué pasó realmente en producción a las 2:32pm del jueves. Necesitas correlacionar commit → evento de sync → reinicio de pod → métrica de observabilidad. Lo construí con eventos de Argo CD → Kafka → un ledger de solo append en Postgres. Cada sync termina firmada y trazable, con evidencia exportable.

## Secrets: sealed-secrets es el camino fácil, no el correcto

Sealed-secrets encripta el secreto en git con la llave pública del clúster. Funciona, pero rotar la llave del clúster es una pesadilla y no hay revocación granular. En entornos regulados terminé usando External Secrets Operator + Vault: el manifiesto en git referencia una ruta de Vault, el secreto real nunca toca git. Auditor contento, rotación trivial, blast radius limitado.

## La detección de drift es donde se cae el castillo

GitOps asume que git == clúster. La realidad: alguien ejecuta `kubectl edit` durante una emergencia, o un controlador muta un recurso. Argo CD detecta drift, pero lo que importa es la política. Auto-sync con auto-prune es agresivo y rompe cosas; el sync manual deja el drift sin resolver. El balance: auto-sync con `selfHeal: true` para apps de criticidad baja, manual con una alerta de SLO para las críticas.

## La promoción multi-entorno no es promover PRs

El playbook fácil: PR a `dev/`, merge → auto-deploy. PR a `staging/`, igual. PR a `prod/`, igual. En entornos regulados eso no sucede. Existe un change advisory board, ventanas de cambio, periodos de congelamiento. Lo que funcionó: app-of-apps con `targetRevision` por entorno, y la promoción es un PR que bumpa el SHA hacia el siguiente entorno. Cada bump pasa por aprobación humana + un ticket de JIRA con evidencia.

## El costo oculto: la cultura

Técnicamente GitOps se levanta en 2 semanas. Lograr que los equipos lo adopten correctamente toma 6 meses. Resistencia típica: "Siempre ejecuté `helm upgrade`, ¿por qué un PR?". La respuesta no es técnica, es alineación de cumplimiento: "porque el auditor va a preguntar, y no quieres ser el cuello de botella".

## Lo que se llevan los que lo piensan a fondo

GitOps en sectores regulados no es "GitOps con más PRs". Es rediseñar el flujo bajo la premisa de que el auditor va a auditar git, no el clúster. Si tu cumplimiento no se puede demostrar leyendo el repositorio + el ledger de eventos, GitOps te falló — no técnicamente, sino en la única dimensión que importa para evitar que el banco te retire el sello.
