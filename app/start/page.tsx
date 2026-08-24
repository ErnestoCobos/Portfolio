import { StartClock } from "./StartClock";
import { StartSearch } from "./StartSearch";

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

export default async function StartPage() {
  const statuses = await Promise.all(STATUS_TARGETS.map(checkStatus));
  const allUp = statuses.every((s) => s.ok);

  return (
    <main
      className="cobos-art"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 18px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient halo — same accent rotation as the home hero, dimmer. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "5% -10%",
          background:
            "radial-gradient(ellipse at 70% 15%, rgba(0,212,255,.14), transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(124,58,237,.15), transparent 55%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(var(--surface-soft) 1px, transparent 1px), linear-gradient(90deg, var(--surface-soft) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at center, #000 25%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, #000 25%, transparent 75%)",
          pointerEvents: "none",
        }}
      />

      {/* Terminal window */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 780,
          border: "1px solid var(--hairline-strong)",
          borderRadius: 14,
          overflow: "hidden",
          background: "rgba(6,6,10,.82)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,.5), 0 0 80px rgba(0,212,255,.08)",
        }}
      >
        {/* Window chrome */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderBottom: "1px solid var(--hairline)",
            background: "var(--surface-overlay)",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 12,
              height: 12,
              borderRadius: "var(--r-chip)",
              background: "#444",
            }}
          />
          <span
            aria-hidden
            style={{
              width: 12,
              height: 12,
              borderRadius: "var(--r-chip)",
              background: "#444",
            }}
          />
          <span
            aria-hidden
            style={{
              width: 12,
              height: 12,
              borderRadius: "var(--r-chip)",
              background: "var(--cyan)",
              boxShadow: "0 0 12px var(--cyan)",
            }}
          />
          <span
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginLeft: 12,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            start.cobos.io — zsh
          </span>
          <span
            className="mono"
            aria-label={allUp ? "Todos los sistemas en línea" : "Hay sistemas con problemas"}
            style={{
              marginLeft: "auto",
              fontSize: 12,
              color: allUp ? "var(--cyan)" : "#ff5f57",
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            ● {allUp ? "all systems go" : "degraded"}
          </span>
        </div>

        <div
          className="mono"
          style={{
            padding: "22px 22px 26px",
            display: "flex",
            flexDirection: "column",
            gap: 26,
            fontSize: 14,
          }}
        >
          {/* $ date */}
          <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
            <span style={{ color: "var(--cyan)", flexShrink: 0 }}>$ date</span>
            <StartClock />
          </div>

          {/* $ search */}
          <StartSearch />

          {/* $ ls ./quicklinks */}
          <nav aria-label="Links rápidos">
            <div style={{ color: "var(--cyan)", marginBottom: 10 }}>
              $ ls <span style={{ color: "var(--fg)" }}>./quicklinks</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "14px 20px",
              }}
            >
              {GROUPS.map((g) => (
                <div key={g.dir}>
                  <div style={{ color: "var(--violet)", marginBottom: 6 }}>
                    {g.dir}
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      margin: 0,
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
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
                            gap: 8,
                            padding: "3px 6px",
                            borderRadius: 4,
                            color: "var(--fg)",
                            fontSize: 13,
                          }}
                        >
                          <span
                            aria-hidden
                            style={{ color: "var(--meta)", fontSize: 12 }}
                          >
                            {i === g.links.length - 1 ? "└──" : "├──"}
                          </span>
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          {/* $ status */}
          <div>
            <div style={{ color: "var(--cyan)", marginBottom: 10 }}>
              $ status <span style={{ color: "var(--meta)" }}>--watch 60s</span>
            </div>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {statuses.map((s) => (
                <li
                  key={s.domain}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 10,
                    fontSize: 13,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      color: s.ok ? "var(--cyan)" : "#ff5f57",
                      textShadow: s.ok ? "0 0 8px var(--cyan)" : "none",
                    }}
                  >
                    ●
                  </span>
                  <span style={{ color: "var(--fg)" }}>{s.domain}</span>
                  <span
                    aria-hidden
                    style={{
                      flex: 1,
                      borderBottom: "1px dotted var(--hairline-strong)",
                      transform: "translateY(-3px)",
                    }}
                  />
                  <span
                    style={{
                      color: s.ok ? "var(--muted)" : "#ff5f57",
                      fontSize: 12,
                    }}
                  >
                    {s.code > 0 ? s.code : "down"} · {s.ms}ms
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Status bar */}
        <div
          className="mono"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            padding: "8px 16px",
            borderTop: "1px solid var(--hairline)",
            background: "var(--surface-overlay)",
            fontSize: 11,
            color: "var(--meta)",
          }}
        >
          <span>
            cobos<span style={{ color: "var(--cyan)" }}>::</span>start
          </span>
          <span style={{ color: "var(--cyan)" }}>● online</span>
        </div>
      </div>
    </main>
  );
}
