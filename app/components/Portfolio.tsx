"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import {
  APPROACH,
  EXPERIENCE,
  NAV,
  POSTS,
  PROFILE,
  PROJECTS,
  STACK,
  TRENDS,
} from "./portfolio-data";
import {
  ArchDiagram,
  CloudTopology,
  CobosLogo,
  IsoCloud,
  useMounted,
  useReducedMotion,
  useTicker,
} from "./portfolio-visuals";

// Dev-only live terminal. In production the const folds to null so the module
// is never imported and gets tree-shaken from the bundle.
const LiveTerminal =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("./LiveTerminal"), { ssr: false })
    : null;

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [breakpoint]);
  return mobile;
}

function useViewportWidth(fallback = 1440) {
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const sync = () => setW(window.innerWidth);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  return w;
}

/* ─── Nav ────────────────────────────────────────────────── */
function useActiveSection(): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const ids = NAV.map((n) => n.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-72px 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75] }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return active;
}

function MobileMenu({
  active,
  onClose,
}: {
  active: string | null;
  onClose: () => void;
}) {
  const mounted = useMounted();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handlePick = (id: string) => {
    onClose();
    window.setTimeout(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);
    }, 60);
  };

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(6,6,10,.96)",
        backdropFilter: "blur(18px) saturate(140%)",
        WebkitBackdropFilter: "blur(18px) saturate(140%)",
        display: "flex",
        flexDirection: "column",
        animation: "fadeIn .18s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: "16px 18px",
          borderBottom: "1px solid var(--hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: 13,
            color: "var(--fg)",
            letterSpacing: "-0.01em",
          }}
        >
          cobos<span style={{ color: "var(--cyan)" }}>::</span>menu
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className="mono tap"
          style={{
            color: "var(--muted)",
            border: "1px solid var(--hairline)",
            borderRadius: 6,
            padding: "6px 12px",
            fontSize: 12,
            background: "rgba(255,255,255,.02)",
          }}
        >
          ESC ×
        </button>
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ padding: "20px 18px", flex: 1, overflowY: "auto" }}
      >
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--muted)",
            marginBottom: 8,
          }}
        >
          <span style={{ color: "var(--cyan)" }}>$</span> tree /
        </div>
        <div
          className="mono"
          style={{ fontSize: 14, color: "var(--fg)", marginBottom: 8 }}
        >
          cobos.io/
        </div>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {NAV.map((n, i) => {
            const isLast = i === NAV.length - 1;
            const branch = isLast ? "└──" : "├──";
            const isActive = active === n.id;
            return (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePick(n.id);
                  }}
                  className="mono tap"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 8px",
                    fontSize: 15,
                    color: isActive ? "var(--cyan)" : "var(--fg)",
                    background: isActive
                      ? "rgba(0,212,255,.08)"
                      : "transparent",
                    borderRadius: 6,
                  }}
                >
                  <span
                    style={{
                      color: "var(--muted)",
                      fontSize: 13,
                    }}
                  >
                    {branch}
                  </span>
                  <span style={{ color: isActive ? "var(--cyan)" : "var(--muted)" }}>
                    /
                  </span>
                  <span>{n.label.toLowerCase()}</span>
                  {isActive && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        color: "var(--cyan)",
                      }}
                    >
                      ● here
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
        <div
          className="mono"
          style={{
            marginTop: 24,
            fontSize: 11,
            color: "var(--muted)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{NAV.length} entries</span>
          <span style={{ color: "var(--cyan)" }}>● online</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Nav({ mobile }: { mobile: boolean }) {
  const active = useActiveSection();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        padding: mobile ? "10px 16px" : "12px 48px",
        background:
          "linear-gradient(180deg, rgba(6,6,10,.92) 0%, rgba(6,6,10,.78) 75%, rgba(6,6,10,0) 100%)",
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <a
          href="#top"
          aria-label="Volver al inicio"
          className="tap"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderRadius: 4,
            padding: 4,
          }}
        >
          <CobosLogo />
          <span
            className="mono"
            style={{
              fontSize: mobile ? 13 : 14,
              fontWeight: 500,
              color: "var(--fg)",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            cobos<span style={{ color: "var(--cyan)" }}>::</span>
            {mobile ? (
              <span style={{ color: "var(--muted)" }}>architect</span>
            ) : (
              "cloud_architect"
            )}
          </span>
        </a>
        {!mobile && (
          <nav
            style={{
              display: "flex",
              gap: 2,
              padding: 4,
              borderRadius: 8,
              background: "rgba(17,17,24,.5)",
              border: "1px solid var(--hairline)",
            }}
          >
            {NAV.slice(0, 7).map((n) => {
              const isActive = active === n.id;
              return (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  data-active={isActive ? "true" : undefined}
                  className="mono nav-chip"
                  style={{
                    padding: "6px 12px",
                    fontSize: 12,
                    color: isActive ? "var(--cyan)" : "var(--muted)",
                    background: isActive ? "rgba(0,212,255,.08)" : "transparent",
                    borderRadius: 6,
                    cursor: "pointer",
                    transition: "color .2s, background .2s",
                  }}
                >
                  /{n.label.toLowerCase()}
                </a>
              );
            })}
          </nav>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: mobile ? 8 : 12 }}>
          {!mobile && (
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--muted)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: "var(--cyan)",
                  boxShadow: "0 0 6px var(--cyan)",
                }}
              />
              online
            </span>
          )}
          <a
            href="#contact"
            className="mono tap"
            style={{
              padding: mobile ? "10px 12px" : "8px 14px",
              fontSize: mobile ? 13 : 12,
              border: "1px solid var(--cyan)",
              color: "var(--cyan)",
              borderRadius: 6,
              background: "rgba(0,212,255,.06)",
              cursor: "pointer",
              minHeight: mobile ? 40 : "auto",
              display: "flex",
              alignItems: "center",
            }}
          >
            ./contact
          </a>
          {mobile && (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              className="mono tap"
              style={{
                padding: "10px 12px",
                fontSize: 13,
                border: "1px solid var(--hairline-strong)",
                color: "var(--fg)",
                borderRadius: 6,
                background: "rgba(255,255,255,.03)",
                minHeight: 40,
                minWidth: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>
                ≡
              </span>
            </button>
          )}
        </div>
      </div>
      {mobile && menuOpen && (
        <MobileMenu active={active} onClose={() => setMenuOpen(false)} />
      )}
    </div>
  );
}

/* ─── Hero (terminal chrome + animated boot log + iso lattice) ── */
function Hero({ mobile }: { mobile: boolean }) {
  const mounted = useMounted();
  const reduced = useReducedMotion();
  const tickerT = useTicker(!reduced);
  const t = mounted ? tickerT : 0;
  const vw = useViewportWidth();
  const accent = "#00D4FF";
  const violet = "#7C3AED";
  const prompt = "$";

  const LINES = [
    { k: "cmd" as const, v: `${prompt} whoami` },
    {
      k: "out" as const,
      v: "ernesto.cobos · cloud_architect+devsecops",
    },
    { k: "cmd" as const, v: `${prompt} uptime` },
    {
      k: "out" as const,
      v: "9y 4m · sprint: enkiflow.com (saas · prod)",
    },
    { k: "cmd" as const, v: `${prompt} echo $POSITION` },
    {
      k: "out" as const,
      v: "one of the cloud architects you want answering at 3am.",
    },
    { k: "cmd" as const, v: `${prompt} ` },
  ];
  const total = LINES.reduce((a, l) => a + l.v.length, 0);
  const progress = Math.min(total, t * 55);
  let used = 0;
  const typed: { k: "cmd" | "out"; v: string }[] = [];
  for (const l of LINES) {
    const remaining = progress - used;
    if (remaining <= 0) break;
    typed.push({
      ...l,
      v: l.v.slice(0, Math.floor(Math.min(l.v.length, remaining))),
    });
    used += l.v.length;
  }
  const showCursor = Math.floor(t * 2) % 2 === 0;
  const topoW = mobile ? Math.min(vw, 600) : Math.min(vw - 96, 1440);
  const topoH = mobile ? 720 : 760;

  return (
    <section
      style={{
        padding: mobile ? "20px 16px 40px" : "32px 48px 40px",
        minHeight: mobile ? "auto" : 720,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 70% 15%, ${accent}24, transparent 55%), radial-gradient(ellipse at 15% 85%, ${violet}26, transparent 55%)`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
          <CloudTopology
            width={topoW}
            height={topoH}
            density={mobile ? 0.5 : 0.9}
            animate={!reduced}
          />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1280,
          margin: "0 auto",
          border: "1px solid var(--hairline-strong)",
          borderRadius: 14,
          overflow: "hidden",
          background: "rgba(6,6,10,.78)",
          backdropFilter: "blur(24px) saturate(140%)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
          boxShadow: `0 30px 80px rgba(0,0,0,.5), 0 0 80px ${accent}1A`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderBottom: "1px solid var(--hairline)",
            background: "rgba(255,255,255,.02)",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#444",
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#444",
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: accent,
              boxShadow: `0 0 12px ${accent}`,
            }}
          />
          <span
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginLeft: 12,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {mobile ? "~/cobos.io" : "~/cobos.io  —  zsh  —  120×40"}
          </span>
          <span
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <span className="dot green" /> live · {(t % 60).toFixed(1)}s
          </span>
        </div>

        <div
          style={{
            padding: mobile ? "12px 18px 8px" : "14px 36px 10px",
            borderBottom: "1px solid var(--hairline)",
            minHeight: mobile ? 120 : 130,
          }}
        >
          {typed.map((l, i) => {
            const isLast = i === typed.length - 1;
            return (
              <div
                key={i}
                className="mono"
                style={{
                  fontSize: mobile ? 12 : 13,
                  lineHeight: 1.55,
                  color: l.k === "cmd" ? accent : "var(--fg)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {l.v}
                {isLast && (
                  <span
                    style={{
                      display: "inline-block",
                      width: ".55em",
                      height: "1em",
                      verticalAlign: "-2px",
                      background: accent,
                      marginLeft: 2,
                      opacity: showCursor ? 1 : 0,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "1.1fr 1fr",
            gap: mobile ? 20 : 32,
            padding: mobile ? "20px 18px 16px" : "20px 36px 18px",
            alignItems: "center",
            minHeight: mobile ? 0 : 240,
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--muted)",
                marginBottom: 16,
              }}
            >
              <span style={{ color: accent }}>›</span> rendering portfolio · v3.0
            </div>
            <h1
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: mobile ? 34 : 52,
                lineHeight: 1,
                letterSpacing: "-0.04em",
                fontWeight: 500,
                marginBottom: 14,
              }}
            >
              cobos<span style={{ color: accent }}>::</span>cloud_architect
              <br />
              <span style={{ color: violet }}>+</span>{" "}
              <span style={{ color: "var(--muted)" }}>devsecops</span>
            </h1>
            <p
              style={{
                color: "var(--muted)",
                fontSize: mobile ? 15 : 16,
                maxWidth: 540,
                marginBottom: 22,
                lineHeight: 1.55,
              }}
            >
              Migraciones legacy → cloud-native, Kubernetes en sectores
              regulados, multi-cloud, DevSecOps y FinOps. Construyo
              plataformas como producto.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="#work" className="btn-primary">
                ./view-work.sh
              </a>
            </div>
          </div>

          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: mobile ? 200 : 240,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: mobile ? -20 : -32,
                background: `radial-gradient(circle, ${accent}26, transparent 60%)`,
                filter: "blur(20px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {mounted && (
                <IsoCloud size={mobile ? 180 : 240} animate={!reduced} />
              )}
            </div>
            {mounted &&
              !mobile &&
              ["EKS", "GKE", "AKS", "Argo CD", "Vault", "OPA"].map((l, i) => {
                const a = t * 0.32 + i * ((Math.PI * 2) / 6);
                const dx = (Math.cos(a) * 130).toFixed(2);
                const dy = (Math.sin(a) * 80).toFixed(2);
                const c = i % 2 === 0 ? accent : violet;
                return (
                  <div
                    key={l}
                    className="mono"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
                      fontSize: 11,
                      color: c,
                      padding: "4px 10px",
                      background: "rgba(6,6,10,.82)",
                      border: `1px solid ${c}55`,
                      borderRadius: 5,
                      boxShadow: `0 0 12px ${c}33`,
                      pointerEvents: "none",
                      zIndex: 2,
                      letterSpacing: ".05em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {l}
                  </div>
                );
              })}
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--hairline)",
            padding: mobile ? "10px 14px" : "12px 18px",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            background: "rgba(255,255,255,.015)",
          }}
        >
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            eks-prod · eu-west-1
          </span>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            argo cd: synced
          </span>
          <span className="mono" style={{ fontSize: 11, color: accent }}>
            p95 118ms
          </span>
          <span className="mono" style={{ fontSize: 11, color: "#22c55e" }}>
            ● healthy
          </span>
        </div>
      </div>

      <a
        href="#about"
        aria-label="Scroll to about section"
        className="mono tap"
        style={{
          position: "relative",
          zIndex: 2,
          marginTop: mobile ? 12 : 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          color: "var(--muted)",
          fontSize: 10,
          letterSpacing: ".18em",
          textTransform: "uppercase",
        }}
      >
        <span>scroll · /about</span>
        <span
          aria-hidden
          style={{
            display: "inline-block",
            color: accent,
            fontSize: 14,
            lineHeight: 1,
            animation: reduced ? "none" : "hero-bounce 1.6s ease-in-out infinite",
          }}
        >
          ↓
        </span>
      </a>
    </section>
  );
}

/* ─── shared section primitives ─────────────────────────── */
function SectionHeader({
  n,
  t,
  action,
}: {
  n: number;
  t: string;
  action?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 32,
        paddingBottom: 16,
        borderBottom: "1px solid var(--hairline)",
        flexWrap: "wrap",
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 11,
          color: "var(--cyan)",
          letterSpacing: ".15em",
        }}
      >
        <span style={{ color: "var(--muted)" }}>0{n}</span> &nbsp;·&nbsp; {t}
      </div>
      {action && (
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
          {action}
        </div>
      )}
    </div>
  );
}

function Section({
  id,
  fsPath,
  children,
  mobile,
  dark,
}: {
  id?: string;
  fsPath?: string;
  children: ReactNode;
  mobile: boolean;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      data-fs-path={fsPath}
      data-fs-type={fsPath ? "dir" : undefined}
      style={{
        padding: mobile ? "48px 16px" : "80px 48px",
        background: dark ? "#08080C" : "transparent",
        borderTop: "1px solid var(--hairline)",
        scrollMarginTop: 72,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

/* ─── About ─────────────────────────────────────────────── */
function About({ mobile }: { mobile: boolean }) {
  return (
    <Section id="about" fsPath="/about" mobile={mobile}>
      <SectionHeader n={1} t="about" action="cat ./about.md" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "1fr 2fr",
          gap: mobile ? 24 : 64,
        }}
      >
        <div>
          <div
            style={{
              width: mobile ? 64 : 96,
              height: mobile ? 64 : 96,
              borderRadius: 8,
              border: "1px solid var(--cyan)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: mobile ? 22 : 32,
              color: "var(--cyan)",
            }}
          >
            EC
          </div>
          <div
            className="mono"
            style={{
              marginTop: 16,
              fontSize: 12,
              color: "var(--muted)",
              lineHeight: 1.7,
            }}
          >
            <div data-fs-path="/about/name.txt" data-fs-type="file">
              name: <span data-fs-text style={{ color: "var(--fg)" }}>ernesto cobos</span>
            </div>
            <div data-fs-path="/about/role.txt" data-fs-type="file">
              role: <span data-fs-text style={{ color: "var(--fg)" }}>cloud architect</span>
            </div>
            <div data-fs-path="/about/location.txt" data-fs-type="file">
              loc:  <span data-fs-text style={{ color: "var(--fg)" }}>mx · utc-6</span>
            </div>
            <div data-fs-path="/about/since.txt" data-fs-type="file">
              since: <span data-fs-text style={{ color: "var(--fg)" }}>2017</span>
            </div>
            <div data-fs-path="/about/status.txt" data-fs-type="file">
              status: <span data-fs-text style={{ color: "var(--cyan)" }}>● online</span>
            </div>
          </div>
        </div>
        <div>
          <h2
            data-fs-path="/about/headline.md"
            data-fs-type="file"
            style={{
              fontSize: mobile ? 26 : 40,
              fontWeight: 500,
              lineHeight: 1.15,
              marginBottom: 24,
              letterSpacing: "-0.025em",
            }}
          >
            <span data-fs-text>
              La plataforma es el producto. Lo demás es código en busca de un host.
            </span>
          </h2>
          <p
            data-fs-path="/about/bio.md"
            data-fs-type="file"
            style={{
              color: "var(--muted)",
              fontSize: mobile ? 15 : 17,
              lineHeight: 1.65,
              marginBottom: 16,
            }}
          >
            <span data-fs-text>
              Casi una década moviendo sistemas críticos a entornos cloud-native.
              Trato la infra como producto interno: SLOs, golden paths, DX
              medible.
            </span>
          </p>
          <p
            style={{
              color: "var(--muted)",
              fontSize: mobile ? 15 : 17,
              lineHeight: 1.65,
            }}
          >
            Hoy: Kubernetes regulado, GitOps E2E, multi-cloud (AWS · GCP ·
            Azure), AI-ready y FinOps. Y construyo{" "}
            <span style={{ color: "var(--fg)" }}>EnkiFlow</span> — SaaS en
            producción.
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 24,
            }}
          >
            {["k8s", "gitops", "multi-cloud", "devsecops", "finops", "ai-ready"].map(
              (t) => (
                <span
                  key={t}
                  className="mono chip"
                  style={{ fontSize: 11 }}
                >
                  --{t}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ─── Stack ─────────────────────────────────────────────── */
function Stack({ mobile }: { mobile: boolean }) {
  return (
    <Section id="stack" fsPath="/stack" mobile={mobile} dark>
      <SectionHeader n={2} t="stack" action="ls -la ./tools | wc -l → 38" />
      <div
        style={{
          border: "1px solid var(--hairline)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {STACK.map((s, i) => (
          <div
            key={s.group}
            style={{
              display: "grid",
              gridTemplateColumns: mobile ? "90px 1fr" : "160px 1fr 80px",
              borderTop: i ? "1px solid var(--hairline)" : "none",
              background:
                i % 2 === 0 ? "rgba(255,255,255,.015)" : "transparent",
            }}
          >
            <div
              className="mono"
              style={{
                padding: mobile ? "14px 12px" : "20px 24px",
                fontSize: 12,
                color: "var(--cyan)",
                borderRight: "1px solid var(--hairline)",
              }}
            >
              {s.group.toLowerCase()}/
            </div>
            <div
              style={{
                padding: mobile ? "14px 12px" : "20px 24px",
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              {s.items.map((it) => (
                <span
                  key={it}
                  className="mono"
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 4,
                    border: "1px solid var(--hairline)",
                    background: "rgba(0,212,255,.04)",
                    color: "var(--fg)",
                  }}
                >
                  {it}
                </span>
              ))}
            </div>
            {!mobile && (
              <div
                className="mono"
                style={{
                  padding: "20px 24px",
                  fontSize: 12,
                  color: "var(--muted)",
                  borderLeft: "1px solid var(--hairline)",
                  textAlign: "right",
                }}
              >
                {s.items.length} items
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

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
          borderRadius: 999,
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

function Infra({ mobile }: { mobile: boolean }) {
  const reduced = useReducedMotion();
  const t = useTicker(!reduced);
  const cpu = 38 + Math.sin(t * 0.7) * 8;
  const mem = 64 + Math.sin(t * 0.5 + 1) * 6;
  const rps = 1240 + Math.floor(Math.sin(t * 1.1) * 180);
  const events: { t: string; m: string; c: string }[] = [
    { t: "+12s", m: "Argo CD synced api-gateway@v2.41", c: "var(--cyan)" },
    { t: "+24s", m: "OPA admission denied: image not signed", c: "var(--violet)" },
    { t: "+47s", m: "HPA scale 6 → 9 (api-gateway)", c: "var(--muted)" },
    { t: "+58s", m: "Falco: shell-in-container (resolved)", c: "var(--violet)" },
  ];
  return (
    <Section id="infra" fsPath="/infra" mobile={mobile}>
      <SectionHeader n={3} t="infrastructure" action="watch -n1 ./status" />
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
              fontSize: 11,
              color: "var(--muted)",
              marginBottom: 16,
            }}
          >
            topology · reference architecture
          </div>
          <ArchDiagram compact={mobile} animate={!reduced} />
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
                fontSize: 11,
                color: "var(--muted)",
                marginBottom: 16,
              }}
            >
              cluster · eks-prod · eu-west-1
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
                fontSize: 11,
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
                  fontSize: 11,
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

/* ─── Work ──────────────────────────────────────────────── */
function Work({ mobile }: { mobile: boolean }) {
  return (
    <Section id="work" fsPath="/work" mobile={mobile} dark>
      <SectionHeader
        n={4}
        t="showcase · proyectos"
        action={`./projects.list (${PROJECTS.length})`}
      />
      <div style={{ marginBottom: mobile ? 32 : 48 }}>
        <h2
          style={{
            fontSize: mobile ? 28 : 44,
            fontWeight: 500,
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          Lo que estoy <span style={{ color: "var(--cyan)" }}>construyendo</span>{" "}
          ahora.
        </h2>
        <p
          style={{
            color: "var(--muted)",
            fontSize: mobile ? 15 : 17,
            maxWidth: 640,
          }}
        >
          De un SaaS en producción a migraciones para sectores regulados. Tres
          frentes activos.
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        {PROJECTS.map((p) => {
          const c = p.accent === "violet" ? "var(--violet)" : "var(--cyan)";
          const glow =
            p.accent === "violet"
              ? "rgba(124,58,237,.6)"
              : "rgba(0,212,255,.6)";
          return (
            <div
              key={p.slug}
              data-fs-path={`/work/${p.slug}.md`}
              data-fs-type="file"
              style={{
                border: "1px solid var(--hairline-strong)",
                borderRadius: 10,
                padding: 24,
                background: "rgba(255,255,255,.015)",
                display: "flex",
                flexDirection: "column",
                minHeight: mobile ? "auto" : 360,
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: c,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                <span
                  className="dot"
                  style={{ background: c, boxShadow: `0 0 6px ${glow}` }}
                />
                {p.tag}
              </div>
              <h3
                style={{
                  fontSize: mobile ? 24 : 28,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  marginBottom: 10,
                }}
              >
                {p.name}
              </h3>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  marginBottom: 16,
                  display: "flex",
                  gap: 10,
                }}
              >
                <span style={{ color: c }}>↗</span>
                <span>{p.url}</span>
              </div>
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginBottom: 24,
                  flex: 1,
                }}
              >
                {p.blurb}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${p.metrics.length}, 1fr)`,
                  border: "1px solid var(--hairline)",
                  borderRadius: 6,
                  overflow: "hidden",
                  background: "#0A0A0F",
                }}
              >
                {p.metrics.map((m, mi) => (
                  <div
                    key={m.k}
                    style={{
                      padding: "12px 10px",
                      borderRight:
                        mi < p.metrics.length - 1
                          ? "1px solid var(--hairline)"
                          : "none",
                    }}
                  >
                    <div
                      className="mono"
                      style={{
                        fontSize: mobile ? 16 : 18,
                        fontWeight: 500,
                        color: "var(--fg)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {m.v}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 9,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: ".18em",
                        marginTop: 4,
                      }}
                    >
                      {m.k}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ─── Experience ─────────────────────────────────────────── */
function Experience({ mobile }: { mobile: boolean }) {
  return (
    <Section id="exp" fsPath="/experience" mobile={mobile}>
      <SectionHeader n={5} t="experience" action="git log --oneline" />
      <div
        className="mono"
        style={{ fontSize: mobile ? 13 : 14, lineHeight: 1.9 }}
      >
        {EXPERIENCE.map((e, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: mobile ? "1fr" : "110px 240px 1fr",
              gap: 16,
              padding: "10px 0",
              borderTop: i ? "1px solid var(--hairline)" : "none",
            }}
          >
            <span style={{ color: "var(--cyan)" }}>{e.y}</span>
            <span style={{ color: "var(--fg)" }}>{e.role}</span>
            <span style={{ color: "var(--muted)" }}>
              <span style={{ color: "var(--violet)" }}>
                @{e.co.toLowerCase().replace(/\s+/g, "_")}
              </span>{" "}
              {e.note}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─── Trends ─────────────────────────────────────────────── */
function Trends({ mobile }: { mobile: boolean }) {
  return (
    <Section id="trends" fsPath="/trends" mobile={mobile} dark>
      <SectionHeader n={6} t="2026 · feature flags" action="ls ./flags" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "repeat(2, 1fr)",
          gap: 12,
        }}
      >
        {TRENDS.map((tr, i) => (
          <div
            key={tr.t}
            style={{
              border: "1px solid var(--hairline)",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span className="mono" style={{ fontSize: 11, color: "var(--cyan)" }}>
                flag_{(i + 1).toString().padStart(2, "0")}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--cyan)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span className="dot" /> enabled
              </span>
            </div>
            <h3
              style={{
                fontSize: mobile ? 18 : 20,
                fontWeight: 500,
                marginBottom: 8,
                letterSpacing: "-0.02em",
              }}
            >
              {tr.t}
            </h3>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>{tr.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─── Blog ───────────────────────────────────────────────── */
function Blog({ mobile }: { mobile: boolean }) {
  return (
    <Section id="blog" fsPath="/blog" mobile={mobile}>
      <SectionHeader n={7} t="notes" action={`tail -n ${POSTS.length} ./blog`} />
      <div
        className="mono"
        style={{ fontSize: mobile ? 13 : 14, lineHeight: 1.8 }}
      >
        {POSTS.map((p, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: mobile ? "1fr" : "110px 1fr 80px",
              gap: 16,
              padding: "12px 0",
              borderTop: i ? "1px solid var(--hairline)" : "none",
              cursor: "pointer",
            }}
          >
            <span style={{ color: "var(--muted)" }}>{p.d.toLowerCase()}</span>
            <span style={{ color: "var(--fg)", fontSize: mobile ? 14 : 16 }}>
              {p.t}
            </span>
            {!mobile && (
              <span style={{ color: "var(--cyan)", textAlign: "right" }}>
                {p.r} →
              </span>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─── Approach ───────────────────────────────────────────── */
function Approach({ mobile }: { mobile: boolean }) {
  return (
    <Section id="approach" fsPath="/approach" mobile={mobile} dark>
      <SectionHeader n={8} t="mi enfoque" action="man cobos" />
      <div style={{ marginBottom: mobile ? 40 : 56, maxWidth: 720 }}>
        <h2
          style={{
            fontSize: mobile ? 30 : 52,
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          Cómo trabajo cuando entro en un{" "}
          <span style={{ color: "var(--cyan)" }}>proyecto.</span>
        </h2>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "repeat(4, 1fr)",
          gap: 0,
          borderTop: "1px solid var(--hairline)",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        {APPROACH.map((it, i) => (
          <div
            key={it.n}
            style={{
              padding: mobile
                ? "24px 0"
                : `32px 24px 32px ${i > 0 ? 24 : 0}px`,
              borderRight:
                !mobile && i < APPROACH.length - 1
                  ? "1px solid var(--hairline)"
                  : "none",
              borderTop: mobile && i > 0 ? "1px solid var(--hairline)" : "none",
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--cyan)",
                letterSpacing: ".18em",
                marginBottom: 14,
              }}
            >
              {it.n}
            </div>
            <h3
              style={{
                fontSize: mobile ? 19 : 21,
                fontWeight: 500,
                letterSpacing: "-0.015em",
                marginBottom: 12,
                lineHeight: 1.2,
              }}
            >
              {it.t}
            </h3>
            <p
              style={{
                color: "var(--muted)",
                fontSize: 14,
                lineHeight: 1.55,
                marginBottom: 18,
              }}
            >
              {it.d}
            </p>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--cyan)",
                padding: "6px 10px",
                border: "1px solid rgba(0,212,255,.25)",
                borderRadius: 4,
                background: "rgba(0,212,255,.04)",
                display: "inline-block",
                letterSpacing: ".02em",
              }}
            >
              $ {it.cmd}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
          method:{" "}
          <span style={{ color: "var(--cyan)" }}>
            iterative · evidence-first · slo-bound
          </span>
        </span>
        <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
          deliverables:{" "}
          <span style={{ color: "var(--fg)" }}>
            arquitectura · IaC · runbooks · DX
          </span>
        </span>
      </div>
    </Section>
  );
}

/* ─── Contact ────────────────────────────────────────────── */
function Field({
  name,
  label,
  placeholder,
  textarea,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  placeholder: string;
  textarea?: boolean;
  type?: "text" | "email";
  required?: boolean;
}) {
  const sharedStyle: CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    background: "rgba(255,255,255,.02)",
    border: "1px solid var(--hairline)",
    color: "var(--fg)",
    fontFamily: "inherit",
    fontSize: 16,
    resize: textarea ? "vertical" : "none",
    minHeight: textarea ? 120 : "auto",
    transition: "border-color .15s, background .15s",
  };
  return (
    <label style={{ display: "block" }}>
      <div
        className="mono"
        style={{
          fontSize: 11,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: ".15em",
          marginBottom: 8,
        }}
      >
        {label}
        {required && <span style={{ color: "var(--cyan)", marginLeft: 4 }}>*</span>}
      </div>
      {textarea ? (
        <textarea
          name={name}
          placeholder={placeholder}
          required={required}
          style={sharedStyle}
        />
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          required={required}
          style={sharedStyle}
        />
      )}
    </label>
  );
}

function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const from = String(data.get("from") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const subject = String(data.get("subject") ?? "").trim();
    const body = String(data.get("body") ?? "").trim();

    const subjectLine = subject || "Contacto desde cobos.io";
    const bodyText = `${body}\n\n— ${from || "—"}${email ? ` <${email}>` : ""}`;
    const url = `mailto:${PROFILE.email}?subject=${encodeURIComponent(
      subjectLine
    )}&body=${encodeURIComponent(bodyText)}`;
    setSent(true);
    window.setTimeout(() => window.location.assign(url), 220);
  };

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      style={{
        border: "1px solid var(--hairline-strong)",
        borderRadius: 10,
        padding: 24,
        background: "rgba(6,6,10,.72)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
      }}
      noValidate={false}
    >
      <div
        className="mono"
        style={{
          fontSize: 11,
          color: "var(--muted)",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          <span style={{ color: "var(--cyan)" }}>›</span> ./new-message.sh
        </span>
        {sent && (
          <span style={{ color: "var(--cyan)" }}>
            ● mail client opened
          </span>
        )}
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <Field
          name="from"
          label="from"
          placeholder="tu nombre · empresa"
          required
        />
        <Field
          name="email"
          type="email"
          label="email"
          placeholder="tu@empresa.com"
        />
        <Field
          name="subject"
          label="subject"
          placeholder="auditoría · migración · plataforma · ..."
        />
        <Field
          name="body"
          label="body"
          placeholder="contexto del reto, stack actual, timing..."
          textarea
          required
        />
        <button
          type="submit"
          className="btn-primary"
          style={{
            alignSelf: "flex-start",
            fontFamily: "var(--font-jetbrains-mono)",
          }}
        >
          ./send →
        </button>
      </div>
    </form>
  );
}

function Contact({ mobile }: { mobile: boolean }) {
  const vw = useViewportWidth();
  const reduced = useReducedMotion();
  const topoW = mobile ? Math.min(vw, 600) : Math.min(vw - 96, 1440);
  return (
    <section
      id="contact"
      data-fs-path="/contact"
      data-fs-type="dir"
      style={{
        padding: mobile ? "48px 16px" : "80px 48px",
        background: "transparent",
        borderTop: "1px solid var(--hairline)",
        position: "relative",
        overflow: "hidden",
        scrollMarginTop: 72,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 80% 20%, rgba(0,212,255,.18), transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(124,58,237,.15), transparent 55%)",
          }}
        />
        <div style={{ position: "absolute", inset: 0, opacity: 0.55 }}>
          <CloudTopology
            width={topoW}
            height={mobile ? 900 : 800}
            density={mobile ? 0.6 : 0.95}
            animate={!reduced}
          />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
          }}
        />
      </div>
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <SectionHeader n={9} t="contact" action="ssh hola@cobos.io" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
            gap: 24,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: mobile ? 32 : 56,
                fontWeight: 500,
                lineHeight: 0.95,
                marginBottom: 24,
                letterSpacing: "-0.03em",
              }}
            >
              <span style={{ color: "var(--cyan)" }}>›</span> open
              <br />
              connection.
            </h2>
            <p
              style={{
                color: "var(--muted)",
                fontSize: 16,
                marginBottom: 32,
                maxWidth: 480,
              }}
            >
              Auditorías, arquitectura objetivo, migraciones, plataformas
              internas, FinOps. Si el problema es de infra y duele, escríbeme.
            </p>
            <div
              className="mono"
              style={{
                fontSize: 13,
                lineHeight: 2.2,
                color: "var(--muted)",
              }}
            >
              <div>
                email   <span style={{ color: "var(--cyan)" }}>{PROFILE.email}</span>
              </div>
              <div>
                github  <span style={{ color: "var(--cyan)" }}>{PROFILE.github}</span>
              </div>
              <div>
                li      <span style={{ color: "var(--cyan)" }}>{PROFILE.linkedin}</span>
              </div>
              <div>
                blog    <span style={{ color: "var(--cyan)" }}>cobos.io/blog</span>
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
        <div
          className="mono"
          style={{
            marginTop: mobile ? 48 : 80,
            paddingTop: 24,
            borderTop: "1px solid var(--hairline)",
            fontSize: 11,
            color: "var(--muted)",
            display: "flex",
            flexDirection: mobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: mobile ? "flex-start" : "center",
            flexWrap: "wrap",
            gap: mobile ? 6 : 12,
          }}
        >
          <span style={{ color: "var(--cyan)" }}>● connection alive</span>
          <span>cobos.io / v3.0 · console</span>
          <span>$ exit 0 · © 2026 ernesto cobos</span>
        </div>
      </div>
    </section>
  );
}

/* ─── Root ───────────────────────────────────────────────── */
export default function Portfolio() {
  const mobile = useIsMobile();
  return (
    <div className="cobos-art">
      <span id="top" aria-hidden style={{ position: "absolute" }} />
      <Hero mobile={mobile} />
      <Nav mobile={mobile} />
      <About mobile={mobile} />
      <Stack mobile={mobile} />
      <Infra mobile={mobile} />
      <Work mobile={mobile} />
      <Experience mobile={mobile} />
      <Trends mobile={mobile} />
      <Blog mobile={mobile} />
      <Approach mobile={mobile} />
      <Contact mobile={mobile} />
      {LiveTerminal && <LiveTerminal />}
    </div>
  );
}
