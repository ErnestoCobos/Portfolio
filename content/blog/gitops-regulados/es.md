---
slug: gitops-regulados
title: "GitOps en sectores regulados: lo que nadie te cuenta"
d: "Mar 2026"
date: "2026-03-15"
r: "5 min"
category: gitops
---

GitOps suena perfecto en el deck: declarativo, auditable, rollback-by-git. Después llega el primer auditor de PCI o SOC2 y te das cuenta que el modelo "git es la fuente de verdad" no contesta solas las preguntas que importan en un sector regulado.

Trabajé varios años en banca y otro tanto en automotriz. Estos son los puntos donde GitOps se rompe en producción regulada y cómo los resolví.

## Separation of duties no es una etiqueta de PR

El auditor pregunta: "¿quién puede desplegar a producción?". Responder "quien apruebe el PR" no alcanza. Necesitás CODEOWNERS por carpeta, branch protection con approvers requeridos por equipo, y separar quién mergea vs quién hace argocd app sync. En la práctica: dos equipos distintos. El que escribe el manifiesto (dev) y el que aplica (SRE). Argo CD soporta esto vía RBAC granular, pero hay que diseñarlo desde el día uno.

## El audit trail no es git log

git log te dice qué commit hizo qué cambio. El auditor quiere saber qué pasó realmente en producción a las 14:32 del jueves. Necesitás correlacionar commit → sync event → pod restart → métrica de observabilidad. Lo armé con Argo CD events → Kafka → ledger en Postgres con append-only. Cada sync queda firmado y trazable, con evidencia exportable.

## Secrets: sealed-secrets es el camino fácil, no el correcto

Sealed-secrets cifra el secret en git con la public key del cluster. Funciona, pero rotar la key del cluster es una pesadilla y no hay revocación granular. En entornos regulados terminé con External Secrets Operator + Vault: el manifiesto en git referencia un path de Vault, el secret real nunca toca git. Auditor feliz, rotación trivial, blast radius acotado.

## Drift detection es donde se cae el castillo

GitOps asume que git == cluster. La realidad: alguien hace kubectl edit en una emergencia, o un controller modifica un recurso. Argo CD detecta drift pero lo que importa es la política. Auto-sync con auto-prune es agresivo y rompe cosas; manual sync deja drift sin resolver. El balance: auto-sync con selfHeal: true para apps de baja criticidad, manual con alerta SLO para críticas.

## Multi-env promotion no es promote-PR

El playbook fácil: PR a dev/, merge → auto-deploy. PR a staging/, idem. PR a prod/, idem. En regulado eso no pasa. Hay change advisory board, ventana de cambios, freeze periods. Lo que funcionó: app-of-apps con targetRevision por env, y la promoción es un PR que bumpea el SHA en el env superior. Cada bump pasa por aprobación humana + ticket en JIRA con evidencia.

## El costo escondido: cultura

Técnicamente GitOps se monta en 2 semanas. Que los equipos lo adopten correctamente lleva 6 meses. Resistencia típica: "yo siempre hice helm upgrade, ¿por qué un PR?". La respuesta no es técnica, es alinear con compliance: "porque el auditor lo va a pedir y vos no querés ser el cuello de botella".

## Lo que se llevan los que lo piensan

GitOps en sectores regulados no es "GitOps con más PRs". Es rediseñar el flujo asumiendo que el auditor va a auditar el git, no el cluster. Si tu compliance no se puede demostrar leyendo el repo + el ledger de eventos, GitOps te falló — no técnicamente, sino en la única dimensión que importa para que el banco no te corte el sello.
