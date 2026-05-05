---
slug: internal-developer-platform
title: "Por qué cada equipo necesita un Internal Developer Platform"
d: "Dic 2025"
date: "2025-12-15"
r: "5 min"
category: platform
---

Si tu onboarding técnico para un dev nuevo lleva más de 1 semana hasta que mergea su primer PR a producción, no tenés un problema de onboarding — tenés un problema de plataforma. La solución se llama Internal Developer Platform (IDP) y no es Backstage.

## El problema real: cognitive load

Un dev moderno tiene que conocer: Git, GitHub Actions, Docker, Kubernetes, Terraform, Vault, Argo CD, Datadog, AWS console, IAM, KMS, RDS, Helm, OPA, y todavía tiene que saber escribir el código del producto. Esto no es sostenible. Cada herramienta que el dev DEBE conocer es cognitive tax sobre la productividad real (escribir features).

Un IDP corre el opuesto: el dev escribe código + define un manifiesto de servicio. El IDP se encarga del resto.

## Qué es realmente un IDP

Un IDP no es un portal. Es:

Un catálogo: qué servicios existen, quién los owns, dónde están los runbooks.

Golden paths: templates opinados para crear un servicio nuevo (incluyen CI, CD, monitoring, alertas, RBAC, secrets management, todo).

Self-service: provision de DB, Redis, S3 bucket, dominio, sin tickets a infra.

Observability built-in: métricas, logs, traces aparecen automáticamente sin configurar.

Backstage es el frontend de los primeros dos. Los otros dos son backend (Crossplane, Argo Workflows, custom operators). Confundir Backstage con un IDP es como confundir un dashboard de Grafana con observabilidad.

## Golden paths: opinionados pero escapables

El error clásico: hacer el IDP demasiado rígido. "Solo podés usar Postgres, solo podés deployar a EKS". Resultado: equipos pinchan el IDP y arman lo suyo en paralelo.

El balance que funciona: el golden path cubre el 80% de los casos felices. Para el 20% restante, hay un off-ramp documentado: cómo salir del path sin que la plataforma te bloquee. Si elegís off-ramp, perdés algunos beneficios (SLA del IDP, soporte) pero seguís siendo first-class citizen.

## Self-service no es "ticket más rápido"

Si el dev sigue abriendo un ticket a infra para crear un bucket S3, no tenés self-service. Tenés ticketing más rápido. Self-service real: el dev hace git push con un manifiesto que dice "necesito un bucket S3 con cifrado KMS y lifecycle a 30 días", y en 5 min existe, taggeado, monitoreado, en su cuenta de AWS, con permisos correctos.

Lo armé con Crossplane + ArgoCD + un GitHub Actions workflow que valida el manifiesto contra políticas OPA antes de mergear. Tiempo de provisioning: 4 minutos promedio. Tickets a infra para crear recursos comunes: 0.

## Métricas que importan

DORA metrics aplicadas al IDP:

Lead time for changes (commit → prod): de 5 días a 2 horas.

Deployment frequency: de 1/semana por equipo a 5/día por equipo.

Change failure rate: bajó de 18% a 6% (los golden paths incluyen tests obligatorios).

MTTR: de 4 horas a 35 minutos (runbooks built-in + observability automática).

Si el IDP no mueve estas 4, no está funcionando.

## Build vs buy

Backstage open-source + plugins custom: 6 meses de un platform team de 3 personas para llegar a producción. Vendor IDP (Humanitec, Port, Mia-Platform): 4 semanas a feature básica, $$$ por seat.

Mi regla: si la organización tiene <50 devs, vendor. Si tiene >150, build (porque la inversión se amortiza y querés control). Entre 50 y 150, depende del platform team que tengas.

## Cuándo NO armar un IDP

Si sos 10 devs, no lo armes. Es overhead sin ROI. Lo que necesitás es un buen Makefile y un README, no Backstage. El IDP empieza a tener sentido cuando hay 3+ equipos compartiendo infra y la coordinación se vuelve impuesto cognitivo.

## El resumen

Un IDP bien hecho es la diferencia entre un equipo que pasa 60% del tiempo en plumbing (config, infra, debugging deploys) y uno que pasa 60% en features. Eso es ROI medible. Si tu plataforma no lo está dando, tu plataforma es plumbing disfrazado.
