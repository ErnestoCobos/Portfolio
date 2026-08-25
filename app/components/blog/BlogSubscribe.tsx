"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useLocale, useT } from "../../lib/i18n/locale-context";

const endpoint = process.env.NEXT_PUBLIC_NEWSLETTER_URL;

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

export default function BlogSubscribe() {
  const t = useT();
  const locale = useLocale();
  const mobile = useIsMobile();
  const [status, setStatus] = useState<"idle" | "pending" | "ok" | "error">(
    "idle"
  );
  const [rssHover, setRssHover] = useState(false);

  const rssHref = locale === "en" ? "/en/rss.xml" : "/rss.xml";

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!endpoint) return;
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    setStatus("pending");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        marginTop: mobile ? -52 : -76,
        padding: mobile ? "0 20px 80px" : "0 40px 120px",
      }}
    >
      <section
        aria-label={t.newsletter.title}
        style={{
          border: "1px solid var(--hairline-strong)",
          borderRadius: "var(--r-card-sm)",
          background: "var(--surface-overlay)",
          padding: mobile ? 20 : 24,
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: "var(--text-mono)",
            color: "var(--cyan)",
            letterSpacing: "var(--ls-overline)",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <span className="dot" aria-hidden />
          {t.newsletter.title}
        </div>

        {endpoint ? (
          <>
            <p
              style={{
                margin: 0,
                marginBottom: 16,
                color: "var(--body-soft)",
                fontSize: mobile ? 14 : 15,
                lineHeight: 1.55,
                maxWidth: 560,
              }}
            >
              {t.newsletter.blurb}
            </p>
            <form
              onSubmit={onSubmit}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "stretch",
                gap: 12,
              }}
            >
              <input
                type="email"
                name="email"
                required
                placeholder={t.newsletter.placeholder}
                aria-label={t.newsletter.placeholder}
                autoComplete="email"
                style={{
                  flex: "1 1 240px",
                  minWidth: 0,
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: "var(--surface-overlay)",
                  border: "1px solid var(--hairline)",
                  color: "var(--fg)",
                  fontFamily: "inherit",
                  fontSize: 16,
                  transition: "border-color .15s",
                }}
              />
              <button
                type="submit"
                disabled={status === "pending"}
                className="mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 18px",
                  borderRadius: "var(--r-btn)",
                  border: "none",
                  background: "var(--violet)",
                  color: "#F8FAFC",
                  fontWeight: 600,
                  fontSize: 13,
                  letterSpacing: "var(--ls-tag)",
                  textTransform: "uppercase",
                  cursor: status === "pending" ? "default" : "pointer",
                  opacity: status === "pending" ? 0.7 : 1,
                  fontFamily: "inherit",
                }}
              >
                {t.newsletter.cta}
              </button>
            </form>
            <div aria-live="polite">
              {status === "ok" && (
                <p
                  className="mono"
                  style={{
                    margin: 0,
                    marginTop: 14,
                    fontSize: "var(--text-mono)",
                    color: "var(--green)",
                    letterSpacing: "var(--ls-meta)",
                  }}
                >
                  {t.newsletter.success}
                </p>
              )}
              {status === "error" && (
                <p
                  className="mono"
                  role="alert"
                  style={{
                    margin: 0,
                    marginTop: 14,
                    fontSize: "var(--text-mono)",
                    color: "var(--amber)",
                    letterSpacing: "var(--ls-meta)",
                  }}
                >
                  {t.newsletter.error}
                </p>
              )}
            </div>
          </>
        ) : (
          <div
            className="mono"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontSize: "var(--text-mono)",
              letterSpacing: "var(--ls-meta)",
            }}
          >
            <span style={{ color: "var(--cyan)" }} aria-hidden>
              ●
            </span>
            <a
              href={rssHref}
              onMouseEnter={() => setRssHover(true)}
              onMouseLeave={() => setRssHover(false)}
              onFocus={() => setRssHover(true)}
              onBlur={() => setRssHover(false)}
              style={{
                color: rssHover ? "var(--cyan)" : "var(--muted)",
                textDecoration: "none",
                transition: "color .15s",
              }}
            >
              {t.newsletter.rssCta} <span aria-hidden>→</span>
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
