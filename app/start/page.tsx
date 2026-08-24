import { SpaceCanvas } from "./SpaceCanvas";
import { SessionTimer } from "./SessionTimer";
import { StartClock } from "./StartClock";
import { StartSearch } from "./StartSearch";
import { getSpaceData } from "./spaceData";

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

const STATUS_TARGETS = [
  "enkiflow.com",
  "getdecant.com",
  "voltaflow.com",
  "connver.com",
  "cobos.io",
] as const;

type Status = { domain: string; ok: boolean; code: number; ms: number };

/** HEAD-ping each domain server-side. A domain that rejects HEAD gets one
 * GET retry before being marked down. Never throws — a failing target must
 * render as a red dot, not take the page down with it. */
async function checkStatus(domain: string): Promise<Status> {
  const started = performance.now();
  const attempt = (method: "HEAD" | "GET") =>
    fetch(`https://${domain}`, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    });
  try {
    let res = await attempt("HEAD");
    if (res.status === 405 || res.status === 501) res = await attempt("GET");
    return {
      domain,
      ok: res.ok,
      code: res.status,
      ms: Math.round(performance.now() - started),
    };
  } catch {
    return {
      domain,
      ok: false,
      code: 0,
      ms: Math.round(performance.now() - started),
    };
  }
}

/* Expanse-style ship console panel: hairline frame, tab label overlapping
 * the top border, corner tick. Content is whatever the panel carries. */
function Panel({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section
      aria-label={label}
      style={{
        position: "relative",
        border: "1px solid rgba(91,227,216,.22)",
        background: "rgba(4,6,12,.58)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        padding: "18px 18px 16px",
        ...style,
      }}
    >
      {/* corner ticks */}
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
          style={{ position: "absolute", width: 10, height: 10, ...s }}
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

export default async function StartPage() {
  const [statuses, space] = await Promise.all([
    Promise.all(STATUS_TARGETS.map(checkStatus)),
    getSpaceData(),
  ]);
  const allUp = statuses.every((s) => s.ok);

  return (
    <main
      className="cobos-art"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <SpaceCanvas wind={space.solarWind} kp={space.kp} issLat={space.iss?.lat ?? null} />

      {/* ── Header strip ─────────────────────────────────────── */}
      <header
        className="mono"
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
          órbita estable · sol {SOL}
        </span>
        <span
          aria-label={allUp ? "Todos los sistemas en línea" : "Hay sistemas con problemas"}
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
        <Panel label="nav // destinos">
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
                        className="mono tap"
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
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
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
            Δv {space.iss ? space.iss.velKms.toFixed(2) : "7.66"} km/s ·
            inclinación 51.6° · enlace nominal
            <br />
            {space.iss
              ? `iss ${space.iss.lat.toFixed(1)}°, ${space.iss.lon.toFixed(1)}°`
              : "iss señal perdida"}{" "}
            · {space.people} humanos en el espacio
          </div>
        </Panel>

        {/* SYSTEMS — status readouts */}
        <Panel label="systems // telemetría">
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
                  {s.code > 0 ? s.code : "down"} · {s.ms}ms
                </span>
              </li>
            ))}
          </ul>
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
            viento solar {space.solarWind} km/s · kp {space.kp.toFixed(1)}
            <br />
            noaa swpc · wheretheiss.at · open-notify
          </div>
        </Panel>
      </div>

      {/* ── Footer telemetry strip ───────────────────────────── */}
      <footer
        className="mono"
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
        }}
      >
        <SessionTimer />
        <span>utc-6 · trayectoria nominal</span>
      </footer>
    </main>
  );
}
