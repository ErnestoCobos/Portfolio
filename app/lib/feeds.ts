/**
 * Locale-parametric builders for the per-locale feeds:
 *   - RSS 2.0      (cobos.io/rss.xml + cobos.io/en/rss.xml)
 *   - llms.txt     (cobos.io/llms.txt + cobos.io/en/llms.txt)
 *   - llms-full.txt
 *
 * Each route handler imports the matching builder and passes its
 * locale. The builders own all locale-specific strings (titles,
 * descriptions, language tags) and URL generation via `localePath`.
 */
import { PROFILE, PROJECTS, pick } from "../components/portfolio-data";
import { postExcerpt } from "../components/ArticleBody";
import { getAllPosts } from "./posts";
import { getDictionary, localePath, type Locale } from "./i18n";

const SITE = "https://cobos.io";

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RFC 822 date format required by RSS 2.0. */
function rfc822(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

export function buildRss(locale: Locale): string {
  const t = getDictionary(locale).rss;
  const posts = getAllPosts(locale);
  const lastBuild = posts[0]?.date
    ? rfc822(posts[0].date)
    : new Date().toUTCString();

  const blogIndexUrl = `${SITE}${localePath(locale, "/blog")}`;
  const feedSelfUrl = `${SITE}${localePath(locale, "/rss.xml")}`;

  const items = posts
    .map((p) => {
      const url = `${SITE}${localePath(locale, `/blog/${p.slug}`)}`;
      const description = postExcerpt(p.body, 280);
      return [
        "    <item>",
        `      <title>${escXml(p.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${rfc822(p.date)}</pubDate>`,
        `      <category>${escXml(p.category)}</category>`,
        `      <author>${PROFILE.email} (${escXml(PROFILE.name)})</author>`,
        `      <description>${escXml(description)}</description>`,
        `      <content:encoded><![CDATA[${p.body}]]></content:encoded>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">`,
    `  <channel>`,
    `    <title>${escXml(t.feedTitle)}</title>`,
    `    <link>${blogIndexUrl}</link>`,
    `    <atom:link href="${feedSelfUrl}" rel="self" type="application/rss+xml" />`,
    `    <description>${escXml(t.feedDescription)}</description>`,
    `    <language>${t.language}</language>`,
    `    <lastBuildDate>${lastBuild}</lastBuildDate>`,
    `    <managingEditor>${PROFILE.email} (${escXml(PROFILE.name)})</managingEditor>`,
    `    <webMaster>${PROFILE.email} (${escXml(PROFILE.name)})</webMaster>`,
    `    <generator>cobos.io · markdown-driven Next.js feed</generator>`,
    items,
    `  </channel>`,
    `</rss>`,
  ].join("\n");
}

export function buildLlmsTxt(locale: Locale): string {
  const lines: string[] = [];
  const posts = getAllPosts(locale);
  const isEn = locale === "en";

  lines.push("# Ernesto Cobos · cobos.io");
  lines.push("");
  lines.push(
    `> ${PROFILE.role}. ${pick(PROFILE.bio, locale).replace(/\s+/g, " ").trim()}`
  );
  lines.push("");
  lines.push(
    isEn
      ? "Personal portfolio and engineering blog. Topics: cloud platform engineering, Kubernetes in regulated environments, GitOps, FinOps, monolith-to-microservices migrations, internal developer platforms (IDPs), DevSecOps. All content is original, written from production experience in banking, automotive, and retail enterprise. Language: English (Spanish version available at https://cobos.io/llms.txt)."
      : "Portfolio personal y blog de ingeniería. Temas: cloud platform engineering, Kubernetes en entornos regulados, GitOps, FinOps, migraciones monolito → microservicios, internal developer platforms (IDPs), DevSecOps. Todo el contenido es original, escrito desde experiencia en producción en banca, automotriz y retail enterprise. Idioma: español (versión en inglés disponible en https://cobos.io/en/llms.txt)."
  );
  lines.push("");

  lines.push(isEn ? "## Blog (technical articles)" : "## Blog (artículos técnicos)");
  lines.push("");
  for (const p of posts) {
    const firstPara = p.body
      .split(/\n\n+/)
      .map((b) => b.trim())
      .find((b) => b && !b.startsWith("## "));
    const summary = firstPara
      ? firstPara.replace(/\s+/g, " ").trim().slice(0, 200) +
        (firstPara.length > 200 ? "…" : "")
      : "";
    const url = `${SITE}${localePath(locale, `/blog/${p.slug}`)}`;
    lines.push(
      `- [${p.title}](${url}): ${p.d} · ${p.r} ${isEn ? "read" : "lectura"} · ${isEn ? "category" : "categoría"}: ${p.category}. ${summary}`
    );
  }
  lines.push("");

  lines.push(isEn ? "## Full article content" : "## Contenido completo");
  lines.push("");
  const fullUrl = `${SITE}${localePath(locale, "/llms-full.txt")}`;
  lines.push(
    isEn
      ? `- [llms-full.txt](${fullUrl}): all blog posts in plain markdown, concatenated, for direct ingestion.`
      : `- [llms-full.txt](${fullUrl}): todos los posts del blog en markdown plano, concatenados, listos para ingesta directa.`
  );
  lines.push("");

  lines.push(isEn ? "## Projects" : "## Proyectos");
  lines.push("");
  for (const proj of PROJECTS) {
    const tag = pick(proj.tag, locale);
    const blurb = pick(proj.blurb, locale).replace(/\s+/g, " ").trim();
    lines.push(`- [${proj.name}](${proj.href}): ${tag}. ${blurb}`);
  }
  lines.push("");

  lines.push(isEn ? "## About the author" : "## Sobre el autor");
  lines.push("");
  lines.push(`- Name: ${PROFILE.name}`);
  lines.push(`- Role: ${PROFILE.role}`);
  lines.push(`- Location: ${PROFILE.loc}`);
  lines.push(`- Email: ${PROFILE.email}`);
  lines.push(`- GitHub: https://${PROFILE.github}`);
  lines.push(`- LinkedIn: https://${PROFILE.linkedin}`);
  lines.push(`- ${isEn ? "Day job" : "Empleo actual"}: ${PROFILE.company}`);
  lines.push(
    `- ${isEn ? "Companies founded" : "Empresas fundadas"}: ${PROFILE.founded}`
  );
  lines.push("");

  lines.push(isEn ? "## Site map" : "## Mapa del sitio");
  lines.push("");
  lines.push(
    `- [${isEn ? "Home / portfolio" : "Home / portafolio"}](${SITE}${localePath(locale, "/")})`
  );
  lines.push(
    `- [${isEn ? "Blog index" : "Índice del blog"}](${SITE}${localePath(locale, "/blog")})`
  );
  lines.push(`- [Sitemap (XML)](${SITE}/sitemap.xml)`);
  if (isEn) {
    lines.push(`- [Spanish version](${SITE}/llms.txt)`);
  } else {
    lines.push(`- [English version](${SITE}/en/llms.txt)`);
  }
  lines.push("");

  return lines.join("\n");
}

export function buildLlmsFullTxt(locale: Locale): string {
  const lines: string[] = [];
  const posts = getAllPosts(locale);
  const isEn = locale === "en";

  lines.push("# cobos.io · full blog corpus");
  lines.push("");
  lines.push(`Author: ${PROFILE.name} (${PROFILE.role})`);
  lines.push(`Site: ${SITE}`);
  lines.push(`Language: ${isEn ? "English" : "Spanish (es-MX)"}`);
  lines.push(
    `License: All rights reserved · cite the URL when quoting.`
  );
  lines.push(
    `Generated: ${new Date().toISOString()} · ${posts.length} articles`
  );
  if (isEn) {
    lines.push(`Spanish version: ${SITE}/llms-full.txt`);
  } else {
    lines.push(`English version: ${SITE}/en/llms-full.txt`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const p of posts) {
    lines.push(`# ${p.title}`);
    lines.push("");
    lines.push(`URL: ${SITE}${localePath(locale, `/blog/${p.slug}`)}`);
    lines.push(`Date: ${p.d} (${p.date})`);
    lines.push(`Category: ${p.category}`);
    lines.push(`Read time: ${p.r}`);
    lines.push(`Author: ${PROFILE.name}`);
    lines.push("");
    lines.push(p.body);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}
