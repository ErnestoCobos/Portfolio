import { NO_TRANSLATE, TERM_MAP } from "./glossary.mjs";
import { API_KEY_ENV_HINT, PROVIDERS, getApiKey } from "./config.mjs";
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

/**
 * Translate `enText` via the Vercel AI Gateway using the OpenAI-compatible
 * /chat/completions interface. The same code path serves DeepSeek and
 * Anthropic models — only the `model` string changes.
 */
export async function callProvider(modelKey, enText) {
  const provider = PROVIDERS[modelKey];
  if (!provider) {
    throw new Error(
      `Unknown translator model: "${modelKey}". Allowed: ${Object.keys(PROVIDERS).join(", ")}`
    );
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(`Missing AI Gateway credentials. ${API_KEY_ENV_HINT}`);
  }

  const system = buildSystemPrompt({ noTranslate: NO_TRANSLATE, termMap: TERM_MAP });
  const user = buildUserPrompt(enText);

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
      `AI Gateway ${res.status} ${res.statusText} (model=${provider.apiModel}): ${errText.slice(0, 500)}`
    );
  }

  const json = await res.json();
  const text = json.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error(
      `AI Gateway returned empty content. Response: ${JSON.stringify(json).slice(0, 500)}`
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
