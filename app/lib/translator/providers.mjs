import { NO_TRANSLATE, TERM_MAP } from "./glossary.mjs";
import { PROVIDERS } from "./config.mjs";
import { buildSystemPrompt, buildUserPrompt } from "./prompts.mjs";

/**
 * Strip the ```markdown ... ``` fence the model might add despite our
 * instructions to output raw markdown. Belt-and-suspenders cleanup.
 */
function stripCodeFence(text) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

async function callDeepSeek(provider, system, user) {
  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) {
    throw new Error(
      `Missing ${provider.apiKeyEnv} env var. Get one at https://platform.deepseek.com/api_keys`
    );
  }

  const res = await fetch(provider.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: provider.apiModel,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: provider.temperature,
      max_tokens: provider.maxTokens,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `DeepSeek API ${res.status} ${res.statusText}: ${errText.slice(0, 500)}`
    );
  }

  const json = await res.json();
  const text = json.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error(
      `DeepSeek returned empty content. Response: ${JSON.stringify(json).slice(0, 500)}`
    );
  }

  return {
    text: stripCodeFence(text),
    usage: {
      input: json.usage?.prompt_tokens ?? 0,
      output: json.usage?.completion_tokens ?? 0,
    },
  };
}

async function callAnthropic(provider, system, user) {
  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) {
    throw new Error(
      `Missing ${provider.apiKeyEnv} env var. Get one at https://console.anthropic.com/settings/keys`
    );
  }

  const res = await fetch(provider.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: provider.apiModel,
      system,
      messages: [{ role: "user", content: user }],
      temperature: provider.temperature,
      max_tokens: provider.maxTokens,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Anthropic API ${res.status} ${res.statusText}: ${errText.slice(0, 500)}`
    );
  }

  const json = await res.json();
  const text = json.content?.[0]?.text;
  if (!text) {
    throw new Error(
      `Anthropic returned empty content. Response: ${JSON.stringify(json).slice(0, 500)}`
    );
  }

  return {
    text: stripCodeFence(text),
    usage: {
      input: json.usage?.input_tokens ?? 0,
      output: json.usage?.output_tokens ?? 0,
    },
  };
}

/**
 * Translate `enText` using the named provider. Throws if the provider
 * key is unknown, the API key is missing, or the API call fails.
 */
export async function callProvider(modelKey, enText) {
  const provider = PROVIDERS[modelKey];
  if (!provider) {
    throw new Error(
      `Unknown translator model: "${modelKey}". Allowed: ${Object.keys(PROVIDERS).join(", ")}`
    );
  }

  const system = buildSystemPrompt({ noTranslate: NO_TRANSLATE, termMap: TERM_MAP });
  const user = buildUserPrompt(enText);

  if (provider.family === "deepseek") return callDeepSeek(provider, system, user);
  if (provider.family === "anthropic") return callAnthropic(provider, system, user);

  throw new Error(`Unhandled provider family: ${provider.family}`);
}
