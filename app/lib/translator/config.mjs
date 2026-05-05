import path from "node:path";

export const BLOG_DIR = path.join(process.cwd(), "content", "blog");
export const CACHE_FILE = path.join(BLOG_DIR, ".translator-cache.json");

/**
 * Translator routes through the Vercel AI Gateway.
 *
 *   - Single endpoint, single API key for every model below.
 *   - Zero markup vs direct provider pricing (Vercel charges what the
 *     upstream provider charges).
 *   - $5/month free credits on every Vercel team — that covers our
 *     entire annual operational cost (~$0.18) ~25x over.
 *   - When this runs inside a Vercel deployment, no API key is needed:
 *     OIDC tokens are auto-attached. For local dev / non-Vercel CI,
 *     set AI_GATEWAY_API_KEY (provision in dashboard → AI Gateway → Keys).
 *
 * Model identifiers are confirmed via `GET /v1/models` (public, no auth).
 *
 * Pricing as of 2026-05-04. The DeepSeek V4 Pro 75% discount expires
 * 2026-05-31 — re-check pricing after that and decide whether to keep
 * Pro as default or downgrade to Flash. Claude Sonnet 4.6 stays as a
 * premium opt-in via post frontmatter for cases where DeepSeek output
 * isn't natural enough.
 */
const GATEWAY_BASE = "https://ai-gateway.vercel.sh/v1/chat/completions";

export const PROVIDERS = {
  "deepseek-v4-pro": {
    endpoint: GATEWAY_BASE,
    apiModel: "deepseek/deepseek-v4-pro",
    temperature: 0.2,
    maxTokens: 8000,
    inputCostPerM: 0.435,
    outputCostPerM: 0.87,
  },
  "deepseek-v4-flash": {
    endpoint: GATEWAY_BASE,
    apiModel: "deepseek/deepseek-v4-flash",
    temperature: 0.2,
    maxTokens: 8000,
    inputCostPerM: 0.14,
    outputCostPerM: 0.28,
  },
  "claude-sonnet-4-6": {
    endpoint: GATEWAY_BASE,
    apiModel: "anthropic/claude-sonnet-4.6",
    temperature: 0.2,
    maxTokens: 8000,
    inputCostPerM: 3.0,
    outputCostPerM: 15.0,
  },
};

export const DEFAULT_MODEL = "deepseek-v4-pro";

/**
 * Auth header for the gateway. When running inside a Vercel deploy,
 * the OIDC token is set automatically as VERCEL_OIDC_TOKEN. Otherwise
 * the user provides a personal AI_GATEWAY_API_KEY in the env.
 */
export function getApiKey() {
  return process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || "";
}

export const API_KEY_ENV_HINT =
  "Set AI_GATEWAY_API_KEY in .env.local " +
  "(provision at https://vercel.com/dashboard → AI Gateway → API Keys). " +
  "Free $5/mo credits cover this project's annual cost ~25x over.";
