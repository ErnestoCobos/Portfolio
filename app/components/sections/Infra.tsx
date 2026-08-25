"use client";

import { useState } from "react";
import { ARCHITECTURES } from "../architectures";
import { useT } from "../../lib/i18n/locale-context";
import {
  ArchDiagram,
  useReducedMotion,
  useTicker,
} from "../portfolio-visuals";
import { Section, SectionHeader } from "../chrome/primitives";

/* ─── Infra ─────────────────────────────────────────────── */
function Gauge({
  label,
  val,
  display,
  suffix = "%",
}: {
  label: string;
  val: number;
  display?: string;
  suffix?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
          {label}
        </span>
        <span className="mono" style={{ fontSize: 12, color: "var(--fg)" }}>
          {display ?? val.toFixed(1) + suffix}
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: "rgba(255,255,255,.05)",
          borderRadius: "var(--r-chip)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: Math.min(100, val) + "%",
            height: "100%",
            background: "linear-gradient(90deg, var(--cyan), var(--violet))",
          }}
        />
      </div>
    </div>
  );
}

const ARCH_EVENTS: Record<
  string,
  { t: string; m: string; c: string }[]
> = {
  "aws-saas": [
    { t: "+12s", m: "CodeDeploy · canary api-gateway@v2.41 → green", c: "var(--cyan)" },
    { t: "+24s", m: "Cognito · MFA enrollment for tenant_842", c: "var(--violet)" },
    { t: "+47s", m: "Aurora · scale 8→12 ACU (tenant_217 burst)", c: "var(--muted)" },
    { t: "+58s", m: "WAF · 412 reqs blocked (rate-limit · /v2/auth)", c: "var(--violet)" },
  ],
  "gcp-bank": [
    { t: "+09s", m: "Spanner · multi-region commit p99 = 67ms", c: "var(--cyan)" },
    { t: "+22s", m: "VPC-SC · perimeter ingress denied (project mismatch)", c: "var(--violet)" },
    { t: "+41s", m: "Cloud Armor · 2.4k DDoS reqs absorbed at edge", c: "var(--muted)" },
    { t: "+55s", m: "DLP · PII redacted in 18 BigQuery rows (PCI scope)", c: "var(--violet)" },
  ],
  "azure-data": [
    { t: "+11s", m: "Flux · helm release synapse-pool@2.7 → success", c: "var(--cyan)" },
    { t: "+19s", m: "Defender · medium · public IP on AKS-pool-3", c: "var(--violet)" },
    { t: "+38s", m: "Cosmos · multi-master conflict resolved (LWW)", c: "var(--muted)" },
    { t: "+52s", m: "Front Door · failover westeurope→eastus2 (4s rtt)", c: "var(--violet)" },
  ],
  "onprem-hybrid": [
    { t: "+15s", m: "Argo CD · sync ocp-dc1/api@v3.12.4 (sealed-secrets)", c: "var(--cyan)" },
    { t: "+27s", m: "Patroni · failover replica → primary (37ms)", c: "var(--violet)" },
    { t: "+44s", m: "MinIO → AWS S3 · 12.4GB cold replication", c: "var(--muted)" },
    { t: "+59s", m: "Wazuh · suricata alert · investigated (false-positive)", c: "var(--violet)" },
  ],
};

export function Infra({ mobile }: { mobile: boolean }) {
  const dict = useT();
  const reduced = useReducedMotion();
  // Gauge wobble is a slow sine — 4 updates/sec reads identically to 60
  // and cuts this section's re-render cost by ~93%.
  const tick = useTicker(!reduced, 4);
  const [archIdx, setArchIdx] = useState(0);
  const arch = ARCHITECTURES[archIdx];
  // Baselines come from the active architecture so a SaaS, a bank, an
  // analytics platform and an on-prem hybrid don't all read the same load.
  const cpu = arch.cpu + Math.sin(tick * 0.7) * 6;
  const mem = arch.mem + Math.sin(tick * 0.5 + 1) * 5;
  const rpsBase = arch.rps;
  const rps = rpsBase + Math.floor(Math.sin(tick * 1.1) * Math.max(60, rpsBase * 0.1));
  const events = ARCH_EVENTS[arch.id] || [];

  return (
    <Section id="infra" fsPath="/infra" mobile={mobile}>
      <SectionHeader
        n={3}
        t={dict.infra.sectionLabel}
        action={dict.infra.action}
      />

      {/* Tab strip — terminal-style, click to switch architecture */}
      <div
        role="tablist"
        aria-label="Reference architectures"
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 16,
          borderBottom: "1px solid var(--hairline)",
          overflowX: "auto",
          flexWrap: mobile ? "nowrap" : "wrap",
        }}
      >
        {ARCHITECTURES.map((a, i) => {
          const active = i === archIdx;
          return (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setArchIdx(i)}
              className="mono tap"
              style={{
                padding: mobile ? "10px 12px" : "10px 16px",
                fontSize: 12,
                color: active ? "var(--cyan)" : "var(--muted)",
                background: active ? "var(--cyan-tint-soft)" : "transparent",
                border: "none",
                borderBottom: active
                  ? "2px solid var(--cyan)"
                  : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                marginBottom: -1,
              }}
            >
              <span style={{ color: "var(--muted)", marginRight: 6 }}>0{i + 1}</span>
              <span>{a.vendor}</span>
              <span style={{ color: "var(--muted)", marginLeft: 6 }}>·</span>
              <span style={{ marginLeft: 6, color: active ? "var(--fg)" : "inherit" }}>
                {a.name}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="mono"
        style={{
          fontSize: "var(--text-mono)",
          color: "var(--muted)",
          marginBottom: 16,
        }}
      >
        <span style={{ color: "var(--cyan)" }}>›</span> {arch.caption}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "5fr 3fr",
          gap: 16,
        }}
      >
        <div
          style={{
            border: "1px solid var(--hairline)",
            borderRadius: 8,
            padding: mobile ? 12 : 24,
            background: "rgba(0,0,0,.2)",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: "var(--text-mono)",
              color: "var(--muted)",
              marginBottom: 16,
            }}
          >
            topology · {arch.vendor.toLowerCase()} reference
          </div>
          <ArchDiagram arch={arch} compact={mobile} animate={!reduced} />
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              border: "1px solid var(--hairline)",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: "var(--text-mono)",
                color: "var(--muted)",
                marginBottom: 16,
              }}
            >
              {arch.region}
            </div>
            <Gauge label="cpu" val={cpu} />
            <Gauge label="memory" val={mem} />
            <Gauge label="net rps" val={rps / 25} display={`${rps}`} suffix=" rps" />
          </div>
          <div
            style={{
              border: "1px solid var(--hairline)",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: "var(--text-mono)",
                color: "var(--muted)",
                marginBottom: 12,
              }}
            >
              events · last 60s
            </div>
            {events.map((e, i) => (
              <div
                key={i}
                className="mono"
                style={{
                  fontSize: "var(--text-mono)",
                  padding: "6px 0",
                  borderTop: i ? "1px solid var(--hairline)" : "none",
                  display: "flex",
                  gap: 10,
                }}
              >
                <span style={{ color: "var(--muted)", minWidth: 38 }}>{e.t}</span>
                <span style={{ color: e.c }}>●</span>
                <span style={{ color: "var(--fg)", flex: 1 }}>{e.m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
