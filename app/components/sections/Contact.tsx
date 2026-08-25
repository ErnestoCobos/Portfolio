"use client";

import { useRef, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { PROFILE } from "../portfolio-data";
import { useLocale, useT } from "../../lib/i18n/locale-context";
import { trackEvent } from "../../lib/analytics";
import { CloudTopology, useReducedMotion } from "../portfolio-visuals";
import { useViewportWidth } from "../hooks";
import { SectionHeader } from "../chrome/primitives";

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
    background: "var(--surface-overlay)",
    border: "1px solid var(--hairline)",
    color: "var(--fg)",
    fontFamily: "inherit",
    fontSize: "var(--text-body)",
    resize: textarea ? "vertical" : "none",
    minHeight: textarea ? 120 : "auto",
    transition: "border-color .15s, background .15s",
  };
  return (
    <label style={{ display: "block" }}>
      <div
        className="mono"
        style={{
          fontSize: "var(--text-mono)",
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "var(--ls-tag)",
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
  const t = useT();
  const locale = useLocale();
  const formRef = useRef<HTMLFormElement>(null);
  const [sent, setSent] = useState(false);

  const subjectFallback =
    locale === "en" ? "Contact from cobos.io" : "Contacto desde cobos.io";

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const from = String(data.get("from") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const subject = String(data.get("subject") ?? "").trim();
    const body = String(data.get("body") ?? "").trim();

    const subjectLine = subject || subjectFallback;
    const bodyText = `${body}\n\n— ${from || "—"}${email ? ` <${email}>` : ""}`;
    const url = `mailto:${PROFILE.email}?subject=${encodeURIComponent(
      subjectLine
    )}&body=${encodeURIComponent(bodyText)}`;
    // Fires right before the deferred mailto hand-off; the form's own
    // navigation is JS-driven here, so ordering is guaranteed.
    trackEvent("contact_email_click", { method: "form" });
    setSent(true);
    window.setTimeout(() => window.location.assign(url), 220);
  };

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      style={{
        border: "1px solid var(--hairline-strong)",
        borderRadius: "var(--r-card-sm)",
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
          fontSize: "var(--text-mono)",
          color: "var(--muted)",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          <span style={{ color: "var(--cyan)" }}>›</span> {t.contact.formTitle.replace(/^›\s*/, "")}
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
          label={t.contact.fieldFrom}
          placeholder={t.contact.fieldFromPlaceholder}
          required
        />
        <Field
          name="email"
          type="email"
          label={t.contact.fieldEmail}
          placeholder={t.contact.fieldEmailPlaceholder}
        />
        <Field
          name="subject"
          label={t.contact.fieldSubject}
          placeholder={t.contact.fieldSubjectPlaceholder}
        />
        <Field
          name="body"
          label={t.contact.fieldBody}
          placeholder={t.contact.fieldBodyPlaceholder}
          textarea
          required
        />
        <button
          type="submit"
          className="btn-primary-violet"
          style={{
            alignSelf: "flex-start",
            fontFamily: "var(--font-jetbrains-mono)",
          }}
        >
          {t.contact.sendCta} <span aria-hidden>→</span>
        </button>
      </div>
    </form>
  );
}

/** Clipboard fallback for the mailto form — one tap copies the address,
 * with a transient inline confirmation. Swallows clipboard rejections
 * (permissions / non-secure contexts) silently; mailto remains the
 * primary path. */
function CopyEmailButton() {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="tap mono"
      onClick={() => {
        trackEvent("contact_copy_email");
        navigator.clipboard?.writeText(PROFILE.email).then(
          () => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          },
          () => {}
        );
      }}
      aria-label={t.contact.copyEmail}
      style={{
        marginLeft: 10,
        padding: "2px 8px",
        fontSize: "var(--text-mono-xs)",
        letterSpacing: "var(--ls-tag)",
        textTransform: "uppercase",
        color: copied ? "var(--green)" : "var(--muted)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--r-tile)",
        background: "var(--surface-overlay)",
      }}
    >
      {copied ? t.contact.copied : t.contact.copyEmail}
    </button>
  );
}

export function Contact({ mobile }: { mobile: boolean }) {
  const t = useT();
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
        scrollMarginTop: 52,
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
              "linear-gradient(var(--surface-soft) 1px, transparent 1px), linear-gradient(90deg, var(--surface-soft) 1px, transparent 1px)",
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
        <SectionHeader
          n={10}
          t={t.contact.sectionLabel}
          action={t.contact.action}
        />
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
                letterSpacing: "var(--ls-display)",
              }}
            >
              <span style={{ color: "var(--violet)" }}>{t.contact.headline[0]}</span>
              {t.contact.headline[1]}
              <br />
              <span style={{ color: "var(--violet)" }}>
                {t.contact.headline[2]}
                {t.contact.headline[3]}
              </span>
            </h2>
            <p
              style={{
                color: "var(--muted)",
                fontSize: "var(--text-body)",
                marginBottom: 32,
                maxWidth: 480,
              }}
            >
              {t.contact.blurb}
            </p>
            <div
              className="mono"
              style={{
                fontSize: "var(--text-meta)",
                lineHeight: 2.2,
                color: "var(--muted)",
              }}
            >
              <div>
                {t.contact.linkEmail}{"   "}
                {/* The address used to be plain text — it only became
                 * measurable once clickable. mailto keeps working without JS;
                 * onClick is additive (no preventDefault). */}
                <a
                  href={`mailto:${PROFILE.email}`}
                  onClick={() => trackEvent("contact_email_click", { method: "link" })}
                  style={{ color: "var(--cyan)", textDecoration: "none" }}
                >
                  {PROFILE.email}
                </a>
                <CopyEmailButton />
              </div>
              <div>
                {t.contact.linkGithub}{"  "}
                <a
                  href={`https://${PROFILE.github}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackEvent("outbound_github")}
                  style={{ color: "var(--cyan)", textDecoration: "none" }}
                >
                  {PROFILE.github}
                </a>
              </div>
              <div>
                {t.contact.linkLi}
                {"      "}
                <a
                  href={`https://${PROFILE.linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackEvent("outbound_linkedin")}
                  style={{ color: "var(--cyan)", textDecoration: "none" }}
                >
                  {PROFILE.linkedin}
                </a>
              </div>
              <div>
                {t.contact.linkBlog}
                {"    "}
                {/* next/link (not <a>): internal route, so client-side nav
                 * avoids a full reload; onClick tracking still fires. */}
                <Link
                  href="/blog"
                  onClick={() => trackEvent("contact_blog_click")}
                  style={{ color: "var(--cyan)", textDecoration: "none" }}
                >
                  cobos.io/blog
                </Link>
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
            fontSize: "var(--text-mono)",
            color: "var(--muted)",
            display: "flex",
            flexDirection: mobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: mobile ? "flex-start" : "center",
            flexWrap: "wrap",
            gap: mobile ? 6 : 12,
          }}
        >
          <span style={{ color: "var(--cyan)" }}>{t.contact.connectionAlive}</span>
          <span>{t.contact.consoleVersion}</span>
          <span>
            $ exit 0 · © {new Date().getFullYear()} ernesto cobos
          </span>
        </div>
      </div>
    </section>
  );
}
