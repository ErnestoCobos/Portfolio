/**
 * Technical terms that must NOT be translated.
 *
 * The system prompt instructs the model to keep these verbatim. We list
 * them once here so the prompt and any post-translation linting share the
 * same source of truth. Add new terms when a post introduces them.
 */
export const NO_TRANSLATE = [
  "GitOps", "DevSecOps", "FinOps", "DevOps", "MLOps", "AIOps",
  "Kubernetes", "EKS", "GKE", "AKS", "k8s",
  "Argo CD", "Argo Workflows", "Argo Rollouts",
  "Vault", "HashiCorp Vault",
  "Crossplane", "Terraform", "Terragrunt", "Pulumi",
  "OPA", "Open Policy Agent", "Gatekeeper", "Kyverno",
  "RBAC", "ABAC", "IAM", "KMS", "STS",
  "S3", "RDS", "ElastiCache", "DynamoDB", "Lambda", "EventBridge",
  "CloudWatch", "CloudTrail", "CloudFormation", "CDK",
  "CUR", "Cost & Usage Report", "Athena", "Redshift", "QuickSight",
  "Grafana", "Prometheus", "Datadog", "New Relic", "Loki", "Tempo", "Mimir",
  "DORA", "MTTR", "MTBF", "SLO", "SLA", "SLI", "RTO", "RPO", "PII", "PCI", "SOC 2", "GDPR",
  "Backstage", "Humanitec", "Port", "Mia-Platform", "Roadie",
  "Compute Savings Plans", "Reserved Instances", "Savings Plans", "Spot",
  "Internal Developer Platform", "IDP", "Developer Portal",
  "p50", "p95", "p99", "p999",
  "Postgres", "PostgreSQL", "MySQL", "MariaDB", "Redis", "Memcached", "MongoDB",
  "Debezium", "CDC", "Kafka", "Kinesis", "Pub/Sub", "RabbitMQ",
  "ALB", "NLB", "ELB", "VPC", "NAT Gateway", "Transit Gateway", "Direct Connect",
  "Helm", "Kustomize", "kubectl", "kubeadm", "kubelet",
  "API", "REST", "gRPC", "GraphQL",
  "CI", "CD", "CI/CD",
  "JWT", "OAuth", "OIDC", "SAML",
  "TLS", "mTLS", "SSH", "VPN",
  "Docker", "containerd", "OCI",
  "GitHub Actions", "GitLab CI", "CircleCI", "Jenkins",
  "AWS", "GCP", "Azure",
  "Lighthouse", "Core Web Vitals", "LCP", "FCP", "CLS", "TTFB", "INP",
  "ChatGPT", "GPT-4", "GPT-5", "Claude", "DeepSeek", "OpenAI", "Anthropic",
  "Vercel", "Netlify", "Cloudflare",
  "Next.js", "React", "Node.js", "TypeScript",
  "PHP", "Laravel", "Go", "Python", "Rust", "Java",
];

/**
 * Term-to-term mappings to enforce consistency. The model still
 * translates surrounding context, but these specific tokens map 1:1
 * the same way every time. Useful when an English term has multiple
 * Spanish equivalents and we want one chosen.
 */
export const TERM_MAP = {
  rollback: "rollback",
  deploy: "deploy",
  deployment: "deployment",
  endpoint: "endpoint",
  "happy path": "happy path",
  "feedback loop": "ciclo de feedback",
  playbook: "playbook",
  showback: "showback",
  chargeback: "chargeback",
  rightsize: "rightsize",
  rightsizing: "rightsizing",
  containerize: "containerizar",
  containerized: "containerizado",
  monolith: "monolito",
  monolitos: "monolitos",
  pipeline: "pipeline",
  toolchain: "toolchain",
  observability: "observabilidad",
  workload: "workload",
  workloads: "workloads",
  tooling: "tooling",
  runbook: "runbook",
  runbooks: "runbooks",
  guardrail: "guardrail",
  guardrails: "guardrails",
  blueprint: "blueprint",
  blueprints: "blueprints",
  scaffolding: "scaffolding",
  "self-service": "self-service",
  cluster: "clúster",
  clusters: "clústers",
};
