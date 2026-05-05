import path from "node:path";

export const BLOG_DIR = path.join(process.cwd(), "content", "blog");
export const CACHE_FILE = path.join(BLOG_DIR, ".translator-cache.json");

/**
 * Translator provider configurations.
 *
 * Pricing as of 2026-05-04. The DeepSeek V4 Pro 75% discount expires
 * 2026-05-31 — re-check pricing after that and decide whether to keep
 * Pro as default or downgrade to Flash.
 *
 * `family` selects the request adapter in providers.mjs:
 *   - "deepseek": OpenAI-compatible /v1/chat/completions, Bearer auth
 *   - "anthropic": /v1/messages with system field separate, x-api-key auth
 */
export const PROVIDERS = {
  "deepseek-v4-pro": {
    family: "deepseek",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    apiModel: "deepseek-v4-pro",
    temperature: 0.2,
    maxTokens: 8000,
    inputCostPerM: 0.435,
    outputCostPerM: 0.87,
  },
  "deepseek-v4-flash": {
    family: "deepseek",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    apiModel: "deepseek-v4-flash",
    temperature: 0.2,
    maxTokens: 8000,
    inputCostPerM: 0.14,
    outputCostPerM: 0.28,
  },
  "claude-sonnet-4-6": {
    family: "anthropic",
    endpoint: "https://api.anthropic.com/v1/messages",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    apiModel: "claude-sonnet-4-6",
    temperature: 0.2,
    maxTokens: 8000,
    inputCostPerM: 3.0,
    outputCostPerM: 15.0,
  },
};

export const DEFAULT_MODEL = "deepseek-v4-pro";
