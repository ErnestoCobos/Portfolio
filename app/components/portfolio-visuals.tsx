"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export function useTicker(enabled: boolean = true) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);
  return enabled ? t : 0;
}

const noopSubscribe = () => () => {};
const getMountedClient = () => true;
const getMountedServer = () => false;

export function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, getMountedClient, getMountedServer);
}

const subscribeReducedMotion = (cb: () => void) => {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getReducedMotionClient = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getReducedMotionServer = () => false;

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionClient,
    getReducedMotionServer
  );
}

type CloudTopologyProps = {
  width: number;
  height: number;
  density?: number;
  palette?: [string, string];
  animate?: boolean;
};

export function CloudTopology({
  width,
  height,
  density = 1,
  palette = ["#00D4FF", "#7C3AED"],
  animate = true,
}: CloudTopologyProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = width * dpr;
    c.height = height * dpr;
    ctx.scale(dpr, dpr);

    const N = Math.floor(36 * density);
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: 1 + Math.random() * 2.2,
      hue: Math.random() < 0.7 ? palette[0] : palette[1],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < 130) {
            const alpha = (1 - d / 130) * 0.35;
            ctx.strokeStyle = a.hue === b.hue ? a.hue : "#5b6e9e";
            ctx.globalAlpha = alpha * 0.7;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      for (const n of nodes) {
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 8);
        grd.addColorStop(0, n.hue);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = n.hue;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (!animate) {
      draw();
      return;
    }

    let raf = 0;
    const loop = () => {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -10) n.x = width + 10;
        if (n.x > width + 10) n.x = -10;
        if (n.y < -10) n.y = height + 10;
        if (n.y > height + 10) n.y = -10;
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [width, height, density, palette, animate]);

  return <canvas ref={ref} style={{ width, height, display: "block" }} />;
}

export function IsoCloud({
  size = 360,
  animate = true,
}: {
  size?: number;
  animate?: boolean;
}) {
  const t = useTicker(animate);
  const cells: { x: number; z: number; h: number; op: number }[] = [];
  const W = 6;
  for (let z = 0; z < W; z++) {
    for (let x = 0; x < W; x++) {
      const phase = (x + z) * 0.4 + t * 1.2;
      const lift = (Math.sin(phase) + 1) / 2;
      cells.push({ x, z, h: 6 + lift * 28, op: 0.25 + lift * 0.6 });
    }
  }
  return (
    <svg viewBox="0 0 240 240" style={{ width: size, height: size, overflow: "visible" }}>
      <defs>
        <linearGradient id="iso-cyan" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#00D4FF" stopOpacity=".95" />
          <stop offset="1" stopColor="#00D4FF" stopOpacity=".25" />
        </linearGradient>
        <linearGradient id="iso-violet" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7C3AED" stopOpacity=".95" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity=".25" />
        </linearGradient>
      </defs>
      <g transform="translate(120,140)">
        {cells.map((c, i) => {
          const px = (c.x - c.z) * 14;
          const py = (c.x + c.z) * 7 - c.h;
          const fill = (c.x + c.z) % 2 === 0 ? "url(#iso-cyan)" : "url(#iso-violet)";
          return (
            <g key={i} transform={`translate(${px},${py})`} opacity={c.op}>
              <polygon points="0,0 14,7 0,14 -14,7" fill={fill} />
              <polygon
                points={`0,14 14,7 14,${7 + c.h} 0,${14 + c.h}`}
                fill="rgba(0,212,255,.18)"
                stroke="rgba(0,212,255,.35)"
                strokeWidth=".4"
              />
              <polygon
                points={`0,14 -14,7 -14,${7 + c.h} 0,${14 + c.h}`}
                fill="rgba(124,58,237,.18)"
                stroke="rgba(124,58,237,.35)"
                strokeWidth=".4"
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

const ARCH_COLOR = {
  edge: "#00D4FF",
  net: "#00D4FF",
  k8s: "#7C3AED",
  gitops: "#7C3AED",
  data: "#94A3B8",
  sec: "#F59E0B",
  obs: "#22C55E",
} as const;

type NodeKind = keyof typeof ARCH_COLOR;
type ArchNode = { x: number; y: number; l: string; s: string; k: NodeKind };
type EdgeKind = "flow" | "dim" | "sec" | "gitops";

export function ArchDiagram({
  compact = false,
  animate = true,
}: {
  compact?: boolean;
  animate?: boolean;
}) {
  const t = useTicker(animate);
  const W = compact ? 360 : 920;
  const H = compact ? 260 : 560;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);

  const nodes: Record<string, ArchNode> = {
    users: { x: 90, y: 80, l: "Users · web/api", s: "global", k: "edge" },
    cdn: { x: 90, y: 180, l: "CloudFront", s: "CDN · WAF", k: "edge" },
    dns: { x: 90, y: 280, l: "Route 53", s: "DNS · failover", k: "edge" },
    alb: { x: 300, y: 80, l: "ALB / NLB", s: "TLS termination", k: "net" },
    apigw: { x: 300, y: 180, l: "API Gateway", s: "rate · authz", k: "net" },
    waf: { x: 300, y: 280, l: "WAF · Shield", s: "OWASP rules", k: "sec" },
    eksA: { x: 530, y: 80, l: "EKS · prod-a", s: "eu-west-1a · m7g", k: "k8s" },
    eksB: { x: 530, y: 180, l: "EKS · prod-b", s: "eu-west-1b · m7g", k: "k8s" },
    mesh: { x: 530, y: 280, l: "Istio", s: "mTLS · traffic", k: "k8s" },
    argo: { x: 530, y: 380, l: "Argo CD", s: "GitOps · sync", k: "gitops" },
    pg: { x: 760, y: 80, l: "Aurora PG", s: "multi-AZ · pitr", k: "data" },
    redis: { x: 760, y: 180, l: "ElastiCache", s: "redis · 3 shards", k: "data" },
    s3: { x: 760, y: 280, l: "S3", s: "lake · KMS", k: "data" },
    vec: { x: 760, y: 380, l: "Vector DB", s: "pgvector", k: "data" },
    vault: { x: 90, y: 460, l: "Vault", s: "secrets · PKI", k: "sec" },
    opa: { x: 300, y: 460, l: "OPA · Kyverno", s: "admission policy", k: "sec" },
    obs: { x: 530, y: 460, l: "Grafana · Loki", s: "metrics · logs", k: "obs" },
  };

  const edges: [string, string, EdgeKind][] = [
    ["users", "cdn", "flow"],
    ["cdn", "alb", "flow"],
    ["cdn", "apigw", "flow"],
    ["dns", "alb", "dim"],
    ["alb", "eksA", "flow"],
    ["alb", "eksB", "flow"],
    ["apigw", "eksA", "flow"],
    ["apigw", "eksB", "flow"],
    ["waf", "apigw", "dim"],
    ["eksA", "mesh", "dim"],
    ["eksB", "mesh", "dim"],
    ["eksA", "pg", "flow"],
    ["eksB", "pg", "flow"],
    ["eksA", "redis", "flow"],
    ["eksB", "redis", "flow"],
    ["eksA", "s3", "flow"],
    ["eksB", "vec", "flow"],
    ["vault", "eksA", "sec"],
    ["vault", "eksB", "sec"],
    ["opa", "eksA", "sec"],
    ["opa", "eksB", "sec"],
    ["argo", "eksA", "gitops"],
    ["argo", "eksB", "gitops"],
    ["eksA", "obs", "dim"],
    ["eksB", "obs", "dim"],
  ];

  const zones = [
    { x: 30, y: 40, w: 130, h: 280, l: "EDGE", c: ARCH_COLOR.edge },
    { x: 240, y: 40, w: 130, h: 280, l: "INGRESS", c: ARCH_COLOR.net },
    {
      x: 470,
      y: 40,
      w: 130,
      h: 380,
      l: "PLATFORM · EKS · eu-west-1",
      c: ARCH_COLOR.k8s,
    },
    { x: 700, y: 40, w: 130, h: 380, l: "DATA", c: ARCH_COLOR.data },
    {
      x: 30,
      y: 420,
      w: 340,
      h: 80,
      l: "SECURITY · ZERO-TRUST",
      c: ARCH_COLOR.sec,
    },
    { x: 470, y: 440, w: 130, h: 60, l: "OBSERVABILITY", c: ARCH_COLOR.obs },
  ];

  if (compact) {
    const small = [
      { x: 60, y: 50, l: "Edge", c: ARCH_COLOR.edge },
      { x: 60, y: 130, l: "API", c: ARCH_COLOR.net },
      { x: 180, y: 50, l: "EKS", c: ARCH_COLOR.k8s },
      { x: 180, y: 130, l: "Mesh", c: ARCH_COLOR.k8s },
      { x: 300, y: 50, l: "PG", c: ARCH_COLOR.data },
      { x: 300, y: 130, l: "S3", c: ARCH_COLOR.data },
      { x: 60, y: 210, l: "Vault", c: ARCH_COLOR.sec },
      { x: 180, y: 210, l: "Argo", c: ARCH_COLOR.k8s },
      { x: 300, y: 210, l: "Loki", c: ARCH_COLOR.obs },
    ];
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {small.map((n, i) => (
          <g key={i} transform={`translate(${n.x},${n.y})`}>
            <rect x={-40} y={-16} width={80} height={32} rx={6} fill="#0E0E14" stroke={n.c} strokeOpacity=".7" />
            <text x={0} y={4} textAnchor="middle" fill="#F8FAFC" fontSize="10" fontFamily="JetBrains Mono">
              {n.l}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <pattern id="ad-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#ad-grid)" />
      <rect x="20" y="20" width={W - 40} height={H - 40} rx="14" fill="none" stroke="rgba(255,255,255,.08)" strokeDasharray="6 6" />
      <text x="36" y="14" fill="rgba(255,255,255,.4)" fontSize="10" fontFamily="JetBrains Mono" letterSpacing=".15em">
        AWS · eu-west-1 · vpc-prod-01 · 10.40.0.0/16
      </text>
      {zones.map((z, i) => (
        <g key={i}>
          <rect
            x={z.x}
            y={z.y}
            width={z.w}
            height={z.h}
            rx="10"
            fill={z.c}
            fillOpacity=".035"
            stroke={z.c}
            strokeOpacity=".22"
          />
          <text
            x={z.x + 12}
            y={z.y + 18}
            fill={z.c}
            fillOpacity=".75"
            fontSize="9"
            fontFamily="JetBrains Mono"
            letterSpacing=".18em"
          >
            {z.l}
          </text>
        </g>
      ))}
      {edges.map(([fromK, toK, kind], i) => {
        const a = nodes[fromK];
        const b = nodes[toK];
        if (!a || !b) return null;
        const stroke =
          kind === "sec"
            ? "rgba(245,158,11,.45)"
            : kind === "gitops"
              ? "rgba(124,58,237,.55)"
              : kind === "dim"
                ? "rgba(255,255,255,.12)"
                : "rgba(0,212,255,.45)";
        const dash = kind === "sec" ? "4 4" : kind === "gitops" ? "2 5" : kind === "dim" ? "3 5" : "0";
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={kind === "sec" || kind === "gitops" ? 1 : 1.2} strokeDasharray={dash} />
            {animate && kind === "flow" && (
              <circle r={2.6} fill="#00D4FF">
                <animateMotion dur={`${1.8 + (i % 4) * 0.4}s`} repeatCount="indefinite" path={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} />
              </circle>
            )}
            {animate && kind === "gitops" && (
              <circle r={2.2} fill="#7C3AED">
                <animateMotion dur={`${2.6 + (i % 3) * 0.3}s`} repeatCount="indefinite" path={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} />
              </circle>
            )}
          </g>
        );
      })}
      {Object.entries(nodes).map(([k, n]) => {
        const c = ARCH_COLOR[n.k] || "#94A3B8";
        return (
          <g key={k} transform={`translate(${n.x},${n.y})`}>
            <rect x={-72} y={-26} width={144} height={52} rx="10" fill={c} fillOpacity=".05" />
            <rect x={-70} y={-24} width={140} height={48} rx="9" fill="#0B0B12" stroke={c} strokeOpacity=".7" strokeWidth="1" />
            <circle cx={-58} cy={-12} r="2.5" fill={c} opacity={0.5 + 0.5 * Math.sin(t * 2 + n.x * 0.01)} />
            <text x={-50} y={-7} fill="#F8FAFC" fontSize="11" fontFamily="JetBrains Mono" fontWeight="500">
              {n.l}
            </text>
            {n.s && (
              <text x={-50} y={9} fill="rgba(255,255,255,.45)" fontSize="9" fontFamily="JetBrains Mono">
                {n.s}
              </text>
            )}
            <text x={62} y={-9} textAnchor="end" fill={c} fillOpacity=".55" fontSize="8" fontFamily="JetBrains Mono" letterSpacing=".1em">
              {String(k).toUpperCase().slice(0, 4)}
            </text>
          </g>
        );
      })}
      <g transform={`translate(${W - 220}, ${H - 70})`}>
        <rect x="0" y="0" width="200" height="56" rx="6" fill="#0B0B12" stroke="rgba(255,255,255,.12)" />
        <text x="10" y="14" fill="rgba(255,255,255,.4)" fontSize="9" fontFamily="JetBrains Mono" letterSpacing=".15em">
          LIVE · TRAFFIC
        </text>
        <text x="10" y="34" fill="#F8FAFC" fontSize="13" fontFamily="JetBrains Mono">
          {1240 + Math.floor(Math.sin(t) * 180)} rps
        </text>
        <text x="10" y="48" fill="rgba(0,212,255,.85)" fontSize="9" fontFamily="JetBrains Mono">
          p95 {(115 + pulse * 8).toFixed(0)}ms · err 0.04%
        </text>
        <circle cx="186" cy="14" r="3" fill="#22C55E" opacity={0.6 + 0.4 * Math.sin(t * 3)} />
      </g>
    </svg>
  );
}

export function CobosLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" style={{ display: "block" }}>
      <defs>
        <linearGradient id="clg" x1="0" x2="1">
          <stop offset="0" stopColor="#00D4FF" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <path d="M14 4 L24 9 V19 L14 24 L4 19 V9 Z" fill="none" stroke="url(#clg)" strokeWidth="1.6" />
      <circle cx="14" cy="14" r="3.2" fill="url(#clg)" />
    </svg>
  );
}
