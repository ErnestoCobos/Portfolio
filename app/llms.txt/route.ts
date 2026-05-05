import { PROFILE, PROJECTS } from "../components/portfolio-data";
import { getAllPosts } from "../lib/posts";

const SITE = "https://cobos.io";

/**
 * Generates an llms.txt file per https://llmstxt.org/ — a markdown index
 * optimized for LLM ingestion. Describes the site, surfaces canonical URLs,
 * and gives one-line context for each blog post and project.
 */
function generate(): string {
  const lines: string[] = [];
  const posts = getAllPosts();

  lines.push("# Ernesto Cobos · cobos.io");
  lines.push("");
  lines.push(
    `> ${PROFILE.role}. ${PROFILE.bio.replace(/\s+/g, " ").trim()}`
  );
  lines.push("");
  lines.push(
    "Personal portfolio and engineering blog. Topics: cloud platform engineering, Kubernetes in regulated environments, GitOps, FinOps, monolith-to-microservices migrations, internal developer platforms (IDPs), DevSecOps. All content is original, written from production experience in banking, automotive, and retail enterprise. Language: Spanish."
  );
  lines.push("");

  lines.push("## Blog (technical articles)");
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
    lines.push(`- [${p.title}](${SITE}/blog/${p.slug}): ${p.d} · ${p.r} read · category: ${p.category}. ${summary}`);
  }
  lines.push("");

  lines.push("## Full article content");
  lines.push("");
  lines.push(
    `- [llms-full.txt](${SITE}/llms-full.txt): all blog posts in plain markdown, concatenated, for direct ingestion.`
  );
  lines.push("");

  lines.push("## Projects");
  lines.push("");
  for (const proj of PROJECTS) {
    lines.push(`- [${proj.name}](${proj.href}): ${proj.tag}. ${proj.blurb.replace(/\s+/g, " ").trim()}`);
  }
  lines.push("");

  lines.push("## About the author");
  lines.push("");
  lines.push(`- Name: ${PROFILE.name}`);
  lines.push(`- Role: ${PROFILE.role}`);
  lines.push(`- Location: ${PROFILE.loc}`);
  lines.push(`- Email: ${PROFILE.email}`);
  lines.push(`- GitHub: https://${PROFILE.github}`);
  lines.push(`- LinkedIn: https://${PROFILE.linkedin}`);
  lines.push(`- Day job: ${PROFILE.company}`);
  lines.push(`- Companies founded: ${PROFILE.founded}`);
  lines.push("");

  lines.push("## Site map");
  lines.push("");
  lines.push(`- [Home / portfolio](${SITE}/)`);
  lines.push(`- [Blog index](${SITE}/blog)`);
  lines.push(`- [Sitemap (XML)](${SITE}/sitemap.xml)`);
  lines.push("");

  return lines.join("\n");
}

export function GET() {
  return new Response(generate(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
