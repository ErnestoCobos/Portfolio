"use client";

import Image from "next/image";
import { PROFILE } from "../portfolio-data";
import { useT } from "../../lib/i18n/locale-context";
import { Reveal } from "../cinematic/Reveal";
import { Section, SectionHeader } from "../chrome/primitives";

/* ─── About ─────────────────────────────────────────────── */
export function About({ mobile }: { mobile: boolean }) {
  const t = useT();
  return (
    <Section id="about" fsPath="/about" mobile={mobile}>
      <SectionHeader
        n={1}
        t={t.about.sectionLabel}
        action={t.about.action}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "1fr 2fr",
          gap: mobile ? 24 : 64,
        }}
      >
        <Reveal>
          <a
            href={`https://${PROFILE.github}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${PROFILE.name} on GitHub`}
            style={{
              width: mobile ? 96 : 140,
              height: mobile ? 96 : 140,
              borderRadius: "var(--r-card-sm)",
              border: "1px solid var(--cyan)",
              display: "block",
              overflow: "hidden",
              boxShadow: "0 0 32px rgba(0,212,255,.22)",
              transition: "box-shadow .2s, transform .2s",
            }}
          >
            <Image
              src={PROFILE.avatarUrl}
              alt={PROFILE.name}
              width={140}
              height={140}
              priority
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: "saturate(.85) contrast(1.05)",
              }}
            />
          </a>
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
              name: <span data-fs-text style={{ color: "var(--fg)" }}>{t.about.name}</span>
            </div>
            <div data-fs-path="/about/role.txt" data-fs-type="file">
              role: <span data-fs-text style={{ color: "var(--fg)" }}>{t.about.role}</span>
            </div>
            <div data-fs-path="/about/location.txt" data-fs-type="file">
              loc:  <span data-fs-text style={{ color: "var(--fg)" }}>{t.about.location}</span>
            </div>
            <div data-fs-path="/about/since.txt" data-fs-type="file">
              since: <span data-fs-text style={{ color: "var(--fg)" }}>{t.about.since}</span>
            </div>
            <div data-fs-path="/about/status.txt" data-fs-type="file">
              status: <span data-fs-text style={{ color: "var(--cyan)" }}>{t.about.statusOnline}</span>
            </div>
          </div>
        </Reveal>
        <Reveal delayMs={120}>
          <h2
            data-fs-path="/about/headline.md"
            data-fs-type="file"
            style={{
              fontSize: mobile ? 26 : 40,
              fontWeight: 500,
              lineHeight: 1.15,
              marginBottom: 24,
              letterSpacing: "var(--ls-heading)",
            }}
          >
            <span data-fs-text>{t.about.headline[0]}</span>
          </h2>
          {t.about.bioParas.map((para, i) => (
            <p
              key={i}
              data-fs-path={i === 0 ? "/about/bio.md" : undefined}
              data-fs-type={i === 0 ? "file" : undefined}
              style={{
                color: "var(--muted)",
                fontSize: mobile ? 15 : 17,
                lineHeight: 1.65,
                marginBottom: 16,
              }}
            >
              <span data-fs-text={i === 0 ? "" : undefined}>{para}</span>
            </p>
          ))}
          <p
            style={{
              color: "var(--muted)",
              fontSize: mobile ? 15 : 17,
              lineHeight: 1.65,
            }}
          >
            {t.about.bioContinuation.pre}
            <span style={{ color: "var(--violet)" }}>
              {t.about.bioContinuation.enkiflow}
            </span>
            {t.about.bioContinuation.and}
            <span style={{ color: "var(--violet)" }}>
              {t.about.bioContinuation.getdecant}
            </span>
            {t.about.bioContinuation.post}
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
