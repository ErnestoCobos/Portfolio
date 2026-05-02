/**
 * Reference architectures shown in the /infra section. Each mirrors a
 * realistic production pattern from the corresponding cloud:
 *
 *   - aws-saas        Multi-tenant SaaS on AWS (Aurora, Cognito, Fargate)
 *   - gcp-bank        Regulated bank on GCP (Anthos, Spanner, Apigee, IAP)
 *   - azure-data      Enterprise analytics on Azure (Front Door, Synapse, AKS)
 *   - onprem-hybrid   Sovereign / regulated on-prem with cloud burst
 *
 * The layout grid is 920×560 (compact mode is auto-derived). Coordinates
 * reflect roughly-equivalent zones across vendors so switching tabs visually
 * "rewires" the same shape with different services.
 */

export type ArchKind =
  | "edge"
  | "net"
  | "k8s"
  | "gitops"
  | "data"
  | "sec"
  | "obs";

export type EdgeKind = "flow" | "dim" | "sec" | "gitops";

export interface ArchNode {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  kind: ArchKind;
  short?: string;
}

export interface ArchZone {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  kind: ArchKind;
}

export type ArchEdge = [string, string, EdgeKind];

export interface Architecture {
  id: string;
  vendor: string;
  name: string;
  caption: string;
  region: string;
  rps: number;
  p95: number;
  errPct: number;
  /** Baseline CPU utilization shown on the side panel (0–100). */
  cpu: number;
  /** Baseline memory utilization shown on the side panel (0–100). */
  mem: number;
  nodes: Record<string, ArchNode>;
  edges: ArchEdge[];
  zones: ArchZone[];
}

const Z = {
  edge: { x: 30, y: 40, w: 130, h: 280 },
  ingress: { x: 240, y: 40, w: 130, h: 280 },
  platform: { x: 470, y: 40, w: 130, h: 380 },
  data: { x: 700, y: 40, w: 130, h: 380 },
  security: { x: 30, y: 420, w: 340, h: 80 },
  observability: { x: 470, y: 440, w: 130, h: 60 },
};

/* ── 1) AWS · multi-tenant SaaS ─────────────────────────────────────────── */
export const AWS_SAAS: Architecture = {
  id: "aws-saas",
  vendor: "AWS",
  name: "Multi-tenant SaaS",
  caption: "us-east-1 · multi-tenant SaaS · cellular isolation",
  region: "AWS · us-east-1 · vpc-saas-prod · 10.40.0.0/16",
  rps: 1240,
  p95: 118,
  errPct: 0.04,
  cpu: 38,
  mem: 64,
  zones: [
    { ...Z.edge, label: "EDGE", kind: "edge" },
    { ...Z.ingress, label: "INGRESS", kind: "net" },
    { ...Z.platform, label: "PLATFORM · ECS · FARGATE", kind: "k8s" },
    { ...Z.data, label: "DATA", kind: "data" },
    { ...Z.security, label: "SECURITY · ZERO-TRUST", kind: "sec" },
    { ...Z.observability, label: "OBSERVABILITY", kind: "obs" },
  ],
  nodes: {
    users: { id: "users", x: 90, y: 80, label: "Users · web/mobile", sub: "global · per-tenant", kind: "edge" },
    cdn:   { id: "cdn", x: 90, y: 180, label: "CloudFront", sub: "CDN · WAF · Shield", kind: "edge" },
    dns:   { id: "dns", x: 90, y: 280, label: "Route 53", sub: "DNS · health-checks", kind: "edge" },
    alb:   { id: "alb", x: 300, y: 80, label: "ALB", sub: "host-based routing", kind: "net" },
    apigw: { id: "apigw", x: 300, y: 180, label: "API Gateway", sub: "throttle · authz", kind: "net" },
    cog:   { id: "cog", x: 300, y: 280, label: "Cognito", sub: "OIDC · user pools", kind: "sec" },
    far1:  { id: "far1", x: 530, y: 80, label: "ECS · cell-a", sub: "Fargate · ARM64", kind: "k8s" },
    far2:  { id: "far2", x: 530, y: 180, label: "ECS · cell-b", sub: "Fargate · ARM64", kind: "k8s" },
    sqs:   { id: "sqs", x: 530, y: 280, label: "EventBridge", sub: "bus · SQS DLQ", kind: "k8s" },
    cd:    { id: "cd", x: 530, y: 380, label: "CodeDeploy", sub: "blue/green · canary", kind: "gitops" },
    pg:    { id: "pg", x: 760, y: 80, label: "Aurora Serverless", sub: "v2 · per-tenant pool", kind: "data" },
    ddb:   { id: "ddb", x: 760, y: 180, label: "DynamoDB", sub: "session · tenant cfg", kind: "data" },
    s3:    { id: "s3", x: 760, y: 280, label: "S3 · per-tenant", sub: "lake · KMS", kind: "data" },
    redis: { id: "redis", x: 760, y: 380, label: "ElastiCache", sub: "redis · 3 shards", kind: "data" },
    sec1:  { id: "sec1", x: 90, y: 460, label: "Secrets Mgr", sub: "rotation · KMS", kind: "sec" },
    sec2:  { id: "sec2", x: 300, y: 460, label: "Shield Advanced", sub: "DDoS · response", kind: "sec" },
    obs:   { id: "obs", x: 530, y: 460, label: "CloudWatch · X-Ray", sub: "logs · traces", kind: "obs" },
  },
  edges: [
    ["users", "cdn", "flow"], ["cdn", "alb", "flow"], ["cdn", "apigw", "flow"],
    ["dns", "alb", "dim"], ["alb", "far1", "flow"], ["alb", "far2", "flow"],
    ["apigw", "far1", "flow"], ["apigw", "far2", "flow"], ["cog", "apigw", "sec"],
    ["far1", "sqs", "dim"], ["far2", "sqs", "dim"],
    ["far1", "pg", "flow"], ["far2", "pg", "flow"],
    ["far1", "ddb", "flow"], ["far2", "ddb", "flow"],
    ["far1", "redis", "flow"], ["far2", "s3", "flow"],
    ["sec1", "far1", "sec"], ["sec1", "far2", "sec"],
    ["sec2", "apigw", "sec"], ["cd", "far1", "gitops"], ["cd", "far2", "gitops"],
    ["far1", "obs", "dim"], ["far2", "obs", "dim"],
  ],
};

/* ── 2) GCP · regulated bank ────────────────────────────────────────────── */
export const GCP_BANK: Architecture = {
  id: "gcp-bank",
  vendor: "GCP",
  name: "Regulated bank",
  caption: "GCP · regulated bank · multi-region active-active",
  region: "GCP · us-central1 + us-east1 · VPC-SC · CMEK",
  rps: 8420,
  p95: 142,
  errPct: 0.02,
  cpu: 62,
  mem: 71,
  zones: [
    { ...Z.edge, label: "EDGE", kind: "edge" },
    { ...Z.ingress, label: "API · ZERO-TRUST", kind: "net" },
    { ...Z.platform, label: "PLATFORM · ANTHOS · multi-region", kind: "k8s" },
    { ...Z.data, label: "DATA · GLOBAL-CONSISTENT", kind: "data" },
    { ...Z.security, label: "SECURITY · VPC-SC · CMEK · DLP", kind: "sec" },
    { ...Z.observability, label: "OBSERVABILITY", kind: "obs" },
  ],
  nodes: {
    users: { id: "users", x: 90, y: 80, label: "Customers · open banking", sub: "global · PCI-DSS", kind: "edge" },
    armor: { id: "armor", x: 90, y: 180, label: "Cloud Armor", sub: "WAF · bot · DDoS", kind: "edge" },
    dns:   { id: "dns", x: 90, y: 280, label: "Cloud DNS", sub: "anycast · DNSSEC", kind: "edge" },
    glb:   { id: "glb", x: 300, y: 80, label: "HTTPS LB", sub: "global anycast", kind: "net" },
    apigee:{ id: "apigee", x: 300, y: 180, label: "Apigee", sub: "API mgmt · OAuth2/JWT", kind: "net" },
    iap:   { id: "iap", x: 300, y: 280, label: "IAP · Identity-Aware", sub: "context-aware access", kind: "sec" },
    gke1:  { id: "gke1", x: 530, y: 80, label: "GKE · us-central1", sub: "Confidential VMs", kind: "k8s" },
    gke2:  { id: "gke2", x: 530, y: 180, label: "GKE · us-east1", sub: "Confidential VMs", kind: "k8s" },
    asm:   { id: "asm", x: 530, y: 280, label: "Anthos Service Mesh", sub: "mTLS · zero-trust", kind: "k8s" },
    config:{ id: "config", x: 530, y: 380, label: "Config Sync", sub: "GitOps · attested", kind: "gitops" },
    spanner:{id: "spanner", x: 760, y: 80, label: "Spanner · multi-reg", sub: "global ACID · 5 9s", kind: "data" },
    bq:    { id: "bq", x: 760, y: 180, label: "BigQuery", sub: "warehouse · CMEK", kind: "data" },
    fire:  { id: "fire", x: 760, y: 280, label: "Cloud SQL · HA", sub: "ledger · CMEK", kind: "data" },
    pubsub:{ id: "pubsub", x: 760, y: 380, label: "Pub/Sub", sub: "exactly-once · DLQ", kind: "data" },
    kms:   { id: "kms", x: 90, y: 460, label: "Cloud HSM · KMS", sub: "FIPS-140-2 L3", kind: "sec" },
    dlp:   { id: "dlp", x: 300, y: 460, label: "DLP · VPC-SC", sub: "PII redaction", kind: "sec" },
    obs:   { id: "obs", x: 530, y: 460, label: "Cloud Operations", sub: "logs · traces · audit", kind: "obs" },
  },
  edges: [
    ["users", "armor", "flow"], ["armor", "glb", "flow"],
    ["dns", "glb", "dim"], ["glb", "gke1", "flow"], ["glb", "gke2", "flow"],
    ["apigee", "gke1", "flow"], ["apigee", "gke2", "flow"], ["iap", "apigee", "sec"],
    ["gke1", "asm", "dim"], ["gke2", "asm", "dim"],
    ["gke1", "spanner", "flow"], ["gke2", "spanner", "flow"],
    ["gke1", "fire", "flow"], ["gke2", "fire", "flow"],
    ["gke1", "pubsub", "flow"], ["gke2", "bq", "flow"],
    ["kms", "gke1", "sec"], ["kms", "gke2", "sec"],
    ["dlp", "apigee", "sec"], ["config", "gke1", "gitops"], ["config", "gke2", "gitops"],
    ["gke1", "obs", "dim"], ["gke2", "obs", "dim"],
  ],
};

/* ── 3) Azure · enterprise data analytics ──────────────────────────────── */
export const AZURE_DATA: Architecture = {
  id: "azure-data",
  vendor: "Azure",
  name: "Enterprise · analytics",
  caption: "Azure · enterprise data platform · global front door",
  region: "Azure · westeurope + eastus2 · Hub-Spoke + Private Link",
  rps: 3680,
  p95: 156,
  errPct: 0.06,
  cpu: 74,
  mem: 82,
  zones: [
    { ...Z.edge, label: "EDGE", kind: "edge" },
    { ...Z.ingress, label: "INGRESS · APIM", kind: "net" },
    { ...Z.platform, label: "PLATFORM · AKS + FUNCTIONS", kind: "k8s" },
    { ...Z.data, label: "DATA · SQL · COSMOS · SYNAPSE", kind: "data" },
    { ...Z.security, label: "SECURITY · ENTRA ID · KEY VAULT", kind: "sec" },
    { ...Z.observability, label: "OBSERVABILITY", kind: "obs" },
  ],
  nodes: {
    users: { id: "users", x: 90, y: 80, label: "Users · enterprise", sub: "B2B · SSO", kind: "edge" },
    fd:    { id: "fd", x: 90, y: 180, label: "Front Door · WAF", sub: "global · TLS 1.3", kind: "edge" },
    dns:   { id: "dns", x: 90, y: 280, label: "Azure DNS", sub: "private + public", kind: "edge" },
    appgw: { id: "appgw", x: 300, y: 80, label: "App Gateway", sub: "L7 · path-based", kind: "net" },
    apim:  { id: "apim", x: 300, y: 180, label: "API Mgmt", sub: "policy · throttle", kind: "net" },
    entra: { id: "entra", x: 300, y: 280, label: "Entra ID", sub: "OIDC · groups", kind: "sec" },
    aks1:  { id: "aks1", x: 530, y: 80, label: "AKS · westeurope", sub: "azure-cni · uptime SLA", kind: "k8s" },
    aks2:  { id: "aks2", x: 530, y: 180, label: "AKS · eastus2", sub: "azure-cni · spot", kind: "k8s" },
    func:  { id: "func", x: 530, y: 280, label: "Azure Functions", sub: "event-driven · Durable", kind: "k8s" },
    flux:  { id: "flux", x: 530, y: 380, label: "Flux v2", sub: "GitOps · Helm", kind: "gitops" },
    sql:   { id: "sql", x: 760, y: 80, label: "Azure SQL · HS", sub: "Hyperscale · GZRS", kind: "data" },
    cosmos:{ id: "cosmos", x: 760, y: 180, label: "Cosmos · SQL", sub: "multi-region writes", kind: "data" },
    syn:   { id: "syn", x: 760, y: 280, label: "Synapse", sub: "warehouse · DLake gen2", kind: "data" },
    sb:    { id: "sb", x: 760, y: 380, label: "Service Bus", sub: "premium · sessions", kind: "data" },
    kv:    { id: "kv", x: 90, y: 460, label: "Key Vault · HSM", sub: "FIPS · CMK", kind: "sec" },
    def:   { id: "def", x: 300, y: 460, label: "Defender for Cloud", sub: "CSPM · CWPP", kind: "sec" },
    obs:   { id: "obs", x: 530, y: 460, label: "App Insights · Log Anal", sub: "OTel · Sentinel SIEM", kind: "obs" },
  },
  edges: [
    ["users", "fd", "flow"], ["fd", "appgw", "flow"], ["dns", "appgw", "dim"],
    ["appgw", "aks1", "flow"], ["appgw", "aks2", "flow"],
    ["apim", "aks1", "flow"], ["apim", "aks2", "flow"], ["entra", "apim", "sec"],
    ["aks1", "func", "dim"], ["aks2", "func", "dim"],
    ["aks1", "sql", "flow"], ["aks2", "sql", "flow"],
    ["aks1", "cosmos", "flow"], ["aks2", "cosmos", "flow"],
    ["aks1", "syn", "flow"], ["aks2", "sb", "flow"],
    ["kv", "aks1", "sec"], ["kv", "aks2", "sec"],
    ["def", "apim", "sec"], ["flux", "aks1", "gitops"], ["flux", "aks2", "gitops"],
    ["aks1", "obs", "dim"], ["aks2", "obs", "dim"],
  ],
};

/* ── 4) On-prem hybrid · regulated / sovereign ─────────────────────────── */
export const ONPREM_HYBRID: Architecture = {
  id: "onprem-hybrid",
  vendor: "On-prem",
  name: "Sovereign hybrid",
  caption: "on-prem core · cloud burst for stateless edge",
  region: "DC1 (primary) · DC2 (DR) · ExpressRoute → AWS eu-west-1",
  rps: 740,
  p95: 184,
  errPct: 0.08,
  cpu: 45,
  mem: 58,
  zones: [
    { ...Z.edge, label: "DMZ · PUBLIC", kind: "edge" },
    { ...Z.ingress, label: "L7 · MUTUAL TLS", kind: "net" },
    { ...Z.platform, label: "PLATFORM · OPENSHIFT · DC1+DC2", kind: "k8s" },
    { ...Z.data, label: "DATA · SOVEREIGN", kind: "data" },
    { ...Z.security, label: "SECURITY · HSM · LDAP · SIEM", kind: "sec" },
    { ...Z.observability, label: "OBSERVABILITY · ON-PREM", kind: "obs" },
  ],
  nodes: {
    users: { id: "users", x: 90, y: 80, label: "Users · partner net", sub: "VPN · mTLS clients", kind: "edge" },
    haproxy:{ id: "haproxy", x: 90, y: 180, label: "HAProxy + ModSec", sub: "DMZ · WAF rules", kind: "edge" },
    dns:   { id: "dns", x: 90, y: 280, label: "PowerDNS · BIND", sub: "split-horizon", kind: "edge" },
    nginx: { id: "nginx", x: 300, y: 80, label: "NGINX Plus", sub: "L7 · canary", kind: "net" },
    krakend:{ id: "krakend", x: 300, y: 180, label: "KrakenD", sub: "API gateway · agg", kind: "net" },
    keycloak:{id:"keycloak", x: 300, y: 280, label: "Keycloak", sub: "OIDC + SAML federation", kind: "sec" },
    ocp1:  { id: "ocp1", x: 530, y: 80, label: "OpenShift · DC1", sub: "RHCOS · bare-metal", kind: "k8s" },
    ocp2:  { id: "ocp2", x: 530, y: 180, label: "OpenShift · DC2", sub: "DR · async replica", kind: "k8s" },
    istio: { id: "istio", x: 530, y: 280, label: "Istio · mTLS mesh", sub: "SPIFFE/SPIRE", kind: "k8s" },
    argo:  { id: "argo", x: 530, y: 380, label: "Argo CD on-prem", sub: "GitOps · sealed-secrets", kind: "gitops" },
    pg:    { id: "pg", x: 760, y: 80, label: "PostgreSQL HA", sub: "Patroni · 3 nodes", kind: "data" },
    minio: { id: "minio", x: 760, y: 180, label: "MinIO", sub: "S3-compat · erasure code", kind: "data" },
    aws:   { id: "aws", x: 760, y: 280, label: "AWS S3 (cold)", sub: "ExpressRoute · backup", kind: "data" },
    kafka: { id: "kafka", x: 760, y: 380, label: "Kafka · self-mgd", sub: "3 brokers · MM2", kind: "data" },
    vault: { id: "vault", x: 90, y: 460, label: "Vault HA + HSM", sub: "Thales Luna · PKI", kind: "sec" },
    ldap:  { id: "ldap", x: 300, y: 460, label: "FreeIPA · LDAP", sub: "AD trust · hosts", kind: "sec" },
    obs:   { id: "obs", x: 530, y: 460, label: "Prom · Grafana · Loki", sub: "+ Wazuh SIEM", kind: "obs" },
  },
  edges: [
    ["users", "haproxy", "flow"], ["haproxy", "nginx", "flow"],
    ["dns", "nginx", "dim"], ["nginx", "ocp1", "flow"], ["nginx", "ocp2", "flow"],
    ["krakend", "ocp1", "flow"], ["krakend", "ocp2", "flow"],
    ["keycloak", "krakend", "sec"],
    ["ocp1", "istio", "dim"], ["ocp2", "istio", "dim"],
    ["ocp1", "pg", "flow"], ["ocp2", "pg", "flow"],
    ["ocp1", "minio", "flow"], ["ocp2", "minio", "flow"],
    ["ocp1", "kafka", "flow"], ["minio", "aws", "dim"],
    ["vault", "ocp1", "sec"], ["vault", "ocp2", "sec"],
    ["ldap", "krakend", "sec"], ["argo", "ocp1", "gitops"], ["argo", "ocp2", "gitops"],
    ["ocp1", "obs", "dim"], ["ocp2", "obs", "dim"],
  ],
};

export const ARCHITECTURES: Architecture[] = [
  AWS_SAAS,
  GCP_BANK,
  AZURE_DATA,
  ONPREM_HYBRID,
];
