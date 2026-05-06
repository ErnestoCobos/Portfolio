---
slug: internal-developer-platform
title: "Por qué cada equipo necesita una Internal Developer Platform"
d: "Dic 2025"
date: "2025-12-15"
r: "3 min"
category: platform
translator: deepseek-v4-flash
---
Si el onboarding técnico de un nuevo dev tarda más de 1 semana antes de que haga merge de su primer PR a producción, no tienes un problema de onboarding — tienes un problema de plataforma. La solución se llama Internal Developer Platform (IDP) y no es Backstage.

## El verdadero problema: carga cognitiva

Un dev moderno tiene que saber: Git, GitHub Actions, Docker, Kubernetes, Terraform, Vault, Argo CD, Datadog, AWS console, IAM, KMS, RDS, Helm, OPA — y todavía tiene que saber cómo escribir el código del producto. Esto no es sostenible. Cada herramienta que el dev DEBE conocer es un impuesto cognitivo sobre el trabajo real (entregar funcionalidades).

Un IDP lo invierte: el dev escribe código + define un service manifest. El IDP se encarga del resto.

## Lo que realmente es un IDP

Un IDP no es un portal. Es:

Un catálogo: qué servicios existen, quién los es dueño, dónde están los runbooks.

Golden paths: templates opinados para crear un nuevo servicio (CI, CD, monitoreo, alertas, RBAC, secrets management — todo incluido).

Self-service: aprovisionamiento de DB, Redis, S3 bucket, dominio, sin tickets a infra.

Observabilidad built-in: métricas, logs, traces aparecen automáticamente sin configuración.

Backstage es el frontend para los primeros dos. Los otros dos son backend (Crossplane, Argo Workflows, operadores custom). Confundir Backstage con un IDP es como confundir un dashboard de Grafana con observabilidad.

## Golden paths: opinados pero con salida

El error clásico: hacer el IDP demasiado rígido. "Solo puedes usar Postgres, solo puedes hacer deploy a EKS". Resultado: los equipos ignoran el IDP y construyen su propia cosa aparte.

El balance que funciona: el golden path cubre el 80% de los happy cases. Para el 20% restante, hay un off-ramp documentado: cómo salir del camino sin que la plataforma te bloquee. Si tomas el off-ramp, pierdes algunos beneficios (SLA del IDP, soporte) pero sigues siendo un ciudadano de primera clase.

## Self-service no es "ticketing más rápido"

Si el dev todavía abre un ticket a infra para crear un S3 bucket, no tienes self-service. Tienes ticketing más rápido. Self-service real: el dev hace un git push con un manifest que dice "Necesito un S3 bucket con encriptación KMS y un lifecycle de 30 días", y en 5 minutos existe, etiquetado, monitoreado, en su cuenta de AWS, con los permisos correctos.

Lo construí con Crossplane + ArgoCD + un workflow de GitHub Actions que valida el manifest contra políticas OPA antes del merge. Tiempo de aprovisionamiento: 4 minutos en promedio. Tickets a infra para recursos comunes: 0.

## Métricas que importan

Métricas DORA aplicadas al IDP:

Lead time for changes (commit → prod): de 5 días a 2 horas.

Deployment frequency: de 1/semana por equipo a 5/día por equipo.

Change failure rate: bajó de 18% a 6% (golden paths incluyen tests obligatorios).

MTTR: de 4 horas a 35 minutos (runbooks built-in + observabilidad automática).

Si el IDP no mueve estos 4, no está funcionando.

## Construir vs comprar

Backstage open-source + plugins custom: 6 meses para un equipo de plataforma de 3 personas llegar a producción. Vendor IDP (Humanitec, Port, Mia-Platform): 4 semanas para funcionalidad básica, $$$ por asiento.

Mi regla: si la org tiene <50 devs, vendor. Si tiene >150, construir (porque la inversión se amortiza y quieres control). Entre 50 y 150, depende del equipo de plataforma que tengas.

## Cuándo NO construir un IDP

Si tienes 10 devs, no lo construyas. Es overhead sin ROI. Lo que necesitas es un buen Makefile y un README, no Backstage. El IDP empieza a tener sentido cuando hay 3+ equipos compartiendo infra y la coordinación se vuelve un impuesto cognitivo.

## El resumen

Un IDP bien construido es la diferencia entre un equipo que gasta el 60% de su tiempo en plumbing (config, infra, debugueando deploys) y uno que gasta el 60% en funcionalidades. Eso es ROI medible. Si tu plataforma no lo está entregando, tu plataforma es plumbing disfrazado.
