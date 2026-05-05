---
slug: internal-developer-platform
title: "Por qué cada equipo necesita una Internal Developer Platform"
d: "Dic 2025"
date: "2025-12-15"
r: "5 min"
category: platform
---

Si la integración técnica de un nuevo desarrollador toma más de 1 semana antes de que mergee su primer PR a producción, no tienes un problema de onboarding — tienes un problema de plataforma. La solución se llama Internal Developer Platform (IDP) y no es Backstage.

## El verdadero problema: carga cognitiva

Un desarrollador moderno tiene que saber: Git, GitHub Actions, Docker, Kubernetes, Terraform, Vault, Argo CD, Datadog, consola de AWS, IAM, KMS, RDS, Helm, OPA — y aún tiene que saber cómo escribir el código del producto. Esto no es sostenible. Cada herramienta que el dev DEBE conocer es una carga cognitiva sobre el trabajo real (entregar funcionalidades).

Un IDP le da la vuelta: el dev escribe código + define un manifiesto de servicio. El IDP se encarga del resto.

## Qué es realmente un IDP

Un IDP no es un portal. Es:

Un catálogo: qué servicios existen, quién es su dueño, dónde están los runbooks.

Golden paths: plantillas con opinión para crear un nuevo servicio (CI, CD, monitoreo, alertas, RBAC, gestión de secretos — todo incluido).

Self-service: aprovisionamiento de DB, Redis, bucket S3, dominio, sin tickets a infra.

Observabilidad incorporada: métricas, logs, trazas aparecen automáticamente sin configuración.

Backstage es el frontend para los dos primeros. Los otros dos son backend (Crossplane, Argo Workflows, operadores personalizados). Confundir Backstage con un IDP es como confundir un dashboard de Grafana con observabilidad.

## Golden paths: con opinión pero escapables

El error clásico: hacer el IDP demasiado rígido. "Solo puedes usar Postgres, solo puedes deployar a EKS". Resultado: los equipos ignoran el IDP y construyen lo suyo por separado.

El equilibrio que funciona: el golden path cubre el 80% de los happy path. Para el 20% restante, hay un off-ramp documentado: cómo salir del camino sin que la plataforma te bloquee. Si tomas el off-ramp, pierdes algunos beneficios (SLA del IDP, soporte) pero sigues siendo un ciudadano de primera.

## Self-service no es "ticketing más rápido"

Si el dev aún abre un ticket a infra para crear un bucket S3, no tienes self-service. Tienes ticketing más rápido. Self-service de verdad: el dev hace un git push con un manifiesto que dice "Necesito un bucket S3 con cifrado KMS y un ciclo de vida de 30 días", y en 5 minutos existe, etiquetado, monitoreado, en su cuenta de AWS, con los permisos correctos.

Yo lo construí con Crossplane + ArgoCD + un workflow de GitHub Actions que valida el manifiesto contra políticas OPA antes de mergear. Tiempo de aprovisionamiento: 4 minutos en promedio. Tickets a infra para recursos comunes: 0.

## Métricas que importan

Métricas DORA aplicadas al IDP:

Tiempo de entrega de cambios (commit → prod): de 5 días a 2 horas.

Frecuencia de deploy: de 1 por semana por equipo a 5 por día por equipo.

Tasa de fallos en cambios: bajó de 18% a 6% (los golden paths incluyen pruebas obligatorias).

MTTR: de 4 horas a 35 minutos (runbooks incorporados + observabilidad automática).

Si el IDP no mueve estas 4, no está funcionando.

## Construir vs comprar

Backstage open-source + plugins personalizados: 6 meses para que un equipo de plataforma de 3 personas alcance producción. IDP de proveedor (Humanitec, Port, Mia-Platform): 4 semanas para funcionalidad básica, $$$ por puesto.

Mi regla: si la organización tiene <50 devs, comprar. Si tiene >150, construir (porque la inversión se amortiza y quieres control). Entre 50 y 150, depende del equipo de plataforma que tengas.

## Cuándo NO construir un IDP

Si tienes 10 devs, no lo construyas. Es overhead sin ROI. Lo que necesitas es un buen Makefile y un README, no Backstage. El IDP empieza a tener sentido cuando hay 3+ equipos compartiendo infra y la coordinación se convierte en carga cognitiva.

## El resumen

Un IDP bien construido es la diferencia entre un equipo que dedica el 60% de su tiempo a plomería (config, infra, debuggear deploys) y uno que dedica el 60% a funcionalidades. Eso es ROI medible. Si tu plataforma no lo está entregando, tu plataforma es plomería disfrazada.
