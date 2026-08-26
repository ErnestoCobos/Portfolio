import { SpaceCanvas } from "./SpaceCanvas";
import { SessionTimer } from "./SessionTimer";
import { StartClock } from "./StartClock";
import { StartSearch } from "./StartSearch";
import { getSpaceData } from "./spaceData";
import {
  getSertomaStatus,
  shortReason,
  type NamespaceHealth,
} from "./sertomaData";
import { StartIntro } from "./StartIntro";
import { DecodeText } from "./DecodeText";
import { CountUp } from "./CountUp";

/** Re-check remote statuses at most once a minute (ISR), so the page stays
 * fast and cheap while the dots stay honest. */
export const revalidate = 60;

type LinkGroup = { dir: string; links: { label: string; href: string }[] };

const GROUPS: LinkGroup[] = [
  {
    dir: "dev/",
    links: [
      { label: "github", href: "https://github.com/ErnestoCobos" },
      { label: "vercel", href: "https://vercel.com" },
      { label: "notion", href: "https://notion.so" },
    ],
  },
  {
    dir: "productos/",
    links: [
      { label: "enkiflow.com", href: "https://www.enkiflow.com" },
      { label: "getdecant.com", href: "https://www.getdecant.com" },
      { label: "voltaflow.com", href: "https://voltaflow.com" },
      { label: "connver.com", href: "https://connver.com" },
    ],
  },
  {
    dir: "ops/",
    links: [
      { label: "gmail", href: "https://mail.google.com" },
      { label: "firstbase", href: "https://www.firstbase.io" },
    ],
  },
  {
    dir: "cobos/",
    links: [
      { label: "cobos.io", href: "https://cobos.io" },
      { label: "blog", href: "https://cobos.io/blog" },
    ],
  },
];

/** Status targets. Plain domains get `https://` + root; full URLs pass
 * through as-is (sertoma's sentinel only answers specific routes, and
 * its 404 on / would read as "down" — so we ping /healthz directly). */
const STATUS_TARGETS = [
  "enkiflow.com",
  "getdecant.com",
  "voltaflow.com",
  "connver.com",
  "cobos.io",
  "https://sertoma.cobos.io/healthz",
] as const;

const targetUrl = (t: string) => (t.startsWith("http") ? t : `https://${t}`);
const targetLabel = (t: string) =>
  t.replace(/^https?:\/\//, "").split("/")[0] ?? t;

type Status = { domain: string; ok: boolean; code: number; ms: number };

/** HEAD-ping each domain server-side. A domain that rejects HEAD gets one
 * GET retry before being marked down. Never throws — a failing target must
 * render as a red dot, not take the page down with it. */
async function checkStatus(target: string): Promise<Status> {
  const url = targetUrl(target);
  const started = performance.now();
  const attempt = (method: "HEAD" | "GET") =>
    fetch(url, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    });
  try {
    let res = await attempt("HEAD");
    if (res.status === 405 || res.status === 501) res = await attempt("GET");
    return {
      domain: targetLabel(target),
      ok: res.ok,
      code: res.status,
      ms: Math.round(performance.now() - started),
    };
  } catch {
    return {
      domain: targetLabel(target),
      ok: false,
      code: 0,
      ms: Math.round(performance.now() - started),
    };
  }
}

/** namespace → project mapping for the sertoma workloads panel. Lives in
 * the frontend on purpose: rename/relabel projects without touching the
 * cluster. Namespaces without an entry (kube-system, arc-*, …) collapse
 * into the aggregate "sistema" line. */
const NS_PROJECTS: Record<string, { label: string }> = {
  enkiflow: { label: "enkiflow.com" },
  getdecant: { label: "getdecant.com" },
  voltaflow: { label: "voltaflow.com" },
  connver: { label: "connver.com" },
};

type PanelStyle = React.CSSProperties & { "--sweep-delay"?: string };

/* Expanse-style ship console panel: hairline frame, tab label overlapping
 * the top border, corner tick. Content is whatever the panel carries.
 * Visual chrome (glass, hover light, corner ticks, scanline sweep) lives
 * in the .start-panel CSS rules so :hover can override it; layout props
 * stay here. --sweep-delay staggers the one-shot scanline sweep. */
function Panel({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: PanelStyle;
}) {
  return (
    <section
      aria-label={label}
      className="start-panel start-reveal"
      style={style}
    >
      {/* corner ticks — breathe on a staggered phase */}
      {(
        [
          { top: -1, left: -1, borderTop: "1px solid #5BE3D8", borderLeft: "1px solid #5BE3D8" },
          { top: -1, right: -1, borderTop: "1px solid #5BE3D8", borderRight: "1px solid #5BE3D8" },
          { bottom: -1, left: -1, borderBottom: "1px solid #5BE3D8", borderLeft: "1px solid #5BE3D8" },
          { bottom: -1, right: -1, borderBottom: "1px solid #5BE3D8", borderRight: "1px solid #5BE3D8" },
        ] as const
      ).map((s, i) => (
        <span
          key={i}
          aria-hidden
          className="start-corner"
          style={{
            position: "absolute",
            width: 10,
            height: 10,
            animationDelay: `${i * 0.4}s`,
            ...s,
          }}
        />
      ))}
      <span
        className="mono"
        style={{
          position: "absolute",
          top: -8,
          left: 14,
          padding: "0 8px",
          background: "rgba(4,6,12,.9)",
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#5BE3D8",
        }}
      >
        {label}
      </span>
      {children}
    </section>
  );
}

// "Sol" decorativo: día del año, como conteo de misión. Module scope — se
// calcula una vez por revalidación ISR, no por render (react-compiler rule).
const SOL = Math.floor(
  (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
);

/** Dilatación temporal gravitatoria real (métrica de Schwarzschild) para
 * una órbita circular a ~3 AU de un agujero negro de 4.31×10⁶ masas
 * solares — la escala de Gargantua. Δt = 1/√(1 − rₛ/r): el guiño nerd
 * bajo el reloj. Constante a nivel de módulo, coste cero en runtime. */
const DILATION = (() => {
  const M = 4.31e6 * 1.989e30; // kg
  const G = 6.674e-11; // m³/kg·s²
  const c = 299792458; // m/s
  const rs = (2 * G * M) / (c * c); // radio de Schwarzschild ≈ 1.27e10 m
  const r = 4.5e11; // órbita ~3 AU
  return 1 / Math.sqrt(1 - rs / r);
})();
const DILATION_STR = `×${DILATION.toFixed(4)}`;

export default async function StartPage() {
  const [statuses, space, sertoma] = await Promise.all([
    Promise.all(STATUS_TARGETS.map(checkStatus)),
    getSpaceData(),
    getSertomaStatus(),
  ]);
  const allUp = statuses.every((s) => s.ok);

  // Workloads del cluster: proyectos mapeados primero; todo lo demás
  // (kube-system, arc-*, gpu-*, …) se colapsa en una línea agregada.
  const projectRows = Object.entries(NS_PROJECTS)
    .map(([ns, p]) => ({ ns, label: p.label, health: sertoma?.namespaces[ns] }))
    .filter((r): r is typeof r & { health: NamespaceHealth } => !!r.health);
  const otherNs = sertoma
    ? Object.entries(sertoma.namespaces).filter(([ns]) => !(ns in NS_PROJECTS))
    : [];
  const otherPods = otherNs.reduce((acc, [, h]) => acc + h.pods, 0);
  const otherFailing = otherNs.flatMap(([, h]) => h.failing);

  return (
    <main
      id="start-scene"
      className="cobos-art"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <StartIntro />
      <SpaceCanvas wind={space.solarWind} kp={space.kp} issLat={space.iss?.lat ?? null} />

      {/* ── Atmosphere: vignette + filmic grain ────────────────────
          Sit above the canvas (z1), below content (z2). Focus the eye on
          Gargantua and the console; add a touch of cinema grain. */}
      <div className="start-vignette" aria-hidden />
      <div className="start-grain" aria-hidden />

      {/* ── Header strip ─────────────────────────────────────── */}
      <header
        className="mono start-reveal"
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 20px",
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--meta)",
          borderBottom: "1px solid rgba(91,227,216,.12)",
        }}
      >
        <span style={{ color: "var(--fg)" }}>
          cobos<span style={{ color: "var(--cyan)" }}>::</span>start
        </span>
        <span className="start-header-center" style={{ flex: 1, textAlign: "center" }}>
          <DecodeText text={`órbita estable · sol ${SOL}`} />
        </span>
        <span
          aria-label={allUp ? "Todos los sistemas en línea" : "Hay sistemas con problemas"}
          className="start-beacon"
          style={{ color: allUp ? "#5BE3D8" : "#ff5f57" }}
        >
          ● {allUp ? "all systems go" : "degraded"}
        </span>
      </header>

      {/* Spacer: the black hole lives in this visual band (canvas behind) */}
      <div aria-hidden style={{ flex: "0 0 clamp(300px, 42vh, 460px)" }} />

      {/* ── Console panels ───────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 18px 18px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 22,
          flex: 1,
          alignContent: "start",
        }}
      >
        {/* NAV — quicklinks */}
        <Panel
          label="nav // destinos"
          style={{ animationDelay: "0.15s", "--sweep-delay": "0.45s" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))",
              gap: "12px 14px",
            }}
          >
            {GROUPS.map((g) => (
              <div key={g.dir}>
                <div
                  className="mono"
                  style={{
                    color: "var(--violet)",
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    marginBottom: 6,
                  }}
                >
                  {g.dir}
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  {g.links.map((l, i) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        className="mono tap start-link"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 7,
                          padding: "2px 5px",
                          borderRadius: 4,
                          color: "var(--fg)",
                          fontSize: 12,
                        }}
                      >
                        <span
                          aria-hidden
                          className="start-link-prefix"
                          style={{ color: "var(--meta)", fontSize: 11 }}
                        >
                          {i === g.links.length - 1 ? "└─" : "├─"}
                        </span>
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Panel>

        {/* COMMS — search + date */}
        <Panel
          label="comms // uplink"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            animationDelay: "0.3s",
            "--sweep-delay": "0.6s",
          }}
        >
          <div
            className="mono"
            style={{
              display: "flex",
              gap: 10,
              alignItems: "baseline",
              fontSize: 12,
            }}
          >
            <span style={{ color: "var(--cyan)", flexShrink: 0 }}>$ date</span>
            <StartClock />
          </div>
          <StartSearch />
          <div
            className="mono"
            aria-hidden
            style={{
              marginTop: "auto",
              fontSize: 10,
              letterSpacing: "0.08em",
              color: "var(--meta)",
              lineHeight: 1.8,
            }}
          >
            Δv <CountUp value={space.iss ? space.iss.velKms : 7.66} decimals={2} /> km/s ·
            inclinación 51.6° · enlace nominal
            <br />
            {space.iss ? (
              <>
                iss <CountUp value={space.iss.lat} decimals={1} />°,{" "}
                <CountUp value={space.iss.lon} decimals={1} />°
              </>
            ) : (
              "iss señal perdida"
            )}{" "}
            · {space.people} humanos en el espacio
            <br />
            Δt horizonte {DILATION_STR} · métrica de schwarzschild
          </div>
        </Panel>

        {/* SYSTEMS — status readouts */}
        <Panel
          label="systems // telemetría"
          style={{ animationDelay: "0.45s", "--sweep-delay": "0.75s" }}
        >
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 7,
            }}
          >
            {statuses.map((s) => (
              <li
                key={s.domain}
                className="mono"
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  fontSize: 12,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    color: s.ok ? "#5BE3D8" : "#ff5f57",
                    textShadow: s.ok ? "0 0 8px rgba(91,227,216,.8)" : "none",
                  }}
                >
                  ●
                </span>
                <span style={{ color: "var(--fg)" }}>{s.domain}</span>
                <span
                  aria-hidden
                  style={{
                    flex: 1,
                    borderBottom: "1px dotted rgba(91,227,216,.18)",
                    transform: "translateY(-3px)",
                  }}
                />
                <span
                  style={{
                    color: s.ok ? "var(--muted)" : "#ff5f57",
                    fontSize: 11,
                  }}
                >
                  {s.code > 0 ? s.code : "down"} · <CountUp value={s.ms} />ms
                </span>
              </li>
            ))}
          </ul>
          {/* SERTOMA — workloads del cluster casero (vía sentinel/túnel) */}
          <div style={{ marginTop: 14 }}>
            <div
              className="mono"
              style={{
                color: "var(--violet)",
                fontSize: 11,
                letterSpacing: "0.1em",
                marginBottom: 6,
              }}
            >
              sertoma.k8s
            </div>
            {!sertoma ? (
              <div className="mono" style={{ fontSize: 12, color: "#f5c26b" }}>
                ▲ sin señal del cluster
              </div>
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                }}
              >
                {projectRows.length === 0 && (
                  <li className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                    sin workloads de proyectos desplegados
                  </li>
                )}
                {projectRows.map(({ ns, label, health }) => {
                  const bad = health.failing.length > 0;
                  const first = health.failing[0];
                  return (
                    <li
                      key={ns}
                      className="mono"
                      title={
                        health.failing.map((f) => `${f.pod}: ${f.reason}`).join("\n") ||
                        undefined
                      }
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 10,
                        fontSize: 12,
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          color: bad ? "#ff5f57" : "#5BE3D8",
                          textShadow: bad ? "none" : "0 0 8px rgba(91,227,216,.8)",
                        }}
                      >
                        ●
                      </span>
                      <span style={{ color: "var(--fg)" }}>{label}</span>
                      <span
                        aria-hidden
                        style={{
                          flex: 1,
                          borderBottom: "1px dotted rgba(91,227,216,.18)",
                          transform: "translateY(-3px)",
                        }}
                      />
                      {bad ? (
                        <span
                          style={{
                            color: "#ff5f57",
                            fontSize: 11,
                            textAlign: "right",
                          }}
                        >
                          {first.pod} · {shortReason(first.reason)}
                          {health.failing.length > 1 &&
                            ` +${health.failing.length - 1}`}
                        </span>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: 11 }}>
                          {health.ready}/{health.pods} pods
                        </span>
                      )}
                    </li>
                  );
                })}
                {otherNs.length > 0 && (
                  <li
                    className="mono"
                    title={otherFailing
                      .map((f) => `${f.ns}/${f.pod}: ${f.reason}`)
                      .join("\n")}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        color: otherFailing.length > 0 ? "#f5c26b" : "var(--meta)",
                      }}
                    >
                      ●
                    </span>
                    <span>sistema</span>
                    <span
                      aria-hidden
                      style={{
                        flex: 1,
                        borderBottom: "1px dotted rgba(91,227,216,.12)",
                        transform: "translateY(-3px)",
                      }}
                    />
                    <span style={{ color: "var(--meta)" }}>
                      {otherPods} pods
                      {otherFailing.length > 0 &&
                        ` · ${otherFailing.length} con fallo`}
                    </span>
                  </li>
                )}
              </ul>
            )}
          </div>

          <div
            className="mono"
            aria-hidden
            style={{
              marginTop: 14,
              fontSize: 10,
              letterSpacing: "0.08em",
              color: "var(--meta)",
            }}
          >
            viento solar {space.solarWind} km/s · kp{" "}
            <CountUp value={space.kp} decimals={1} />
            <br />
            noaa swpc · wheretheiss.at · open-notify
          </div>
        </Panel>
      </div>

      {/* ── Footer telemetry strip ───────────────────────────── */}
      <footer
        className="mono start-reveal"
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          padding: "10px 20px",
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--meta)",
          borderTop: "1px solid rgba(91,227,216,.12)",
          animationDelay: "0.6s",
        }}
      >
        <SessionTimer />
        <span>utc-6 · trayectoria nominal</span>
      </footer>
    </main>
  );
}
