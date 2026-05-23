import type { MetadataRoute } from "next";

/**
 * Crawl rules. The wildcard allow remains the catch-all; explicit AI bot
 * entries are belt-and-suspenders — they default-allow, but listing them
 * removes ambiguity for LLM training pipelines. `host` was removed: it
 * was Yandex-specific and is now deprecated even there. Google never
 * honoured it. The sitemap entry stays as the single discovery endpoint.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: ["GPTBot", "ChatGPT-User", "OAI-SearchBot"], allow: "/" },
      { userAgent: ["ClaudeBot", "Claude-Web", "anthropic-ai"], allow: "/" },
      { userAgent: ["PerplexityBot", "Perplexity-User"], allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
    ],
    sitemap: "https://cobos.io/sitemap.xml",
  };
}
