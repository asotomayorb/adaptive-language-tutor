import { buildTutorMessages } from "./prompts.js";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const MAX_OUTPUT_TOKENS = 1200;

function required(value, name) {
  if (!value) throw new Error(`Missing required configuration: ${name}`);
  return value;
}

function extractJson(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("The AI provider returned an empty response.");
  }
  const cleaned = text.trim().replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {}
    }
    throw new Error("The AI provider returned a response that was not valid JSON.");
  }
}

function validateTutorResult(result) {
  if (!result || typeof result !== "object" || Array.isArray(result) || typeof result.message !== "string") {
    throw new Error("The AI provider response does not match the tutor contract.");
  }
  return {
    message: result.message,
    exercise: result.exercise && typeof result.exercise === "object" ? result.exercise : null,
    evaluation: result.evaluation && typeof result.evaluation === "object" ? result.evaluation : null,
    learnerUpdate: result.learnerUpdate && typeof result.learnerUpdate === "object" ? result.learnerUpdate : null,
    nextAction: typeof result.nextAction === "string" ? result.nextAction : "continue"
  };
}

async function readProviderError(response) {
  let detail = "";
  try {
    const body = await response.json();
    detail = body.error?.message || body.message || "";
  } catch {}
  return new Error(`AI provider request failed (${response.status})${detail ? `: ${detail}` : ""}`);
}

export function createAIProvider(env = process.env, fetchImpl = fetch) {
  const provider = (env.AI_PROVIDER || "").trim().toLowerCase();
  const apiKey = env.AI_API_KEY;
  const model = env.AI_MODEL;
  const configured = Boolean(provider && apiKey && model);
  const supported = ["openai", "anthropic", "gemini", "openai-compatible"];

  return {
    provider: provider || null,
    model: model || null,
    configured: configured && supported.includes(provider) && (provider !== "openai-compatible" || Boolean(env.AI_BASE_URL)),

    async generateTutorTurn(input) {
      if (!configured || !supported.includes(provider) || (provider === "openai-compatible" && !env.AI_BASE_URL)) {
        throw new Error("AI provider is not configured. Set AI_PROVIDER, AI_API_KEY and AI_MODEL.");
      }
      const messages = buildTutorMessages(input);
      let url;
      let headers;
      let body;
      let extractText;

      if (provider === "anthropic") {
        url = "https://api.anthropic.com/v1/messages";
        headers = {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        };
        body = {
          model, max_tokens: MAX_OUTPUT_TOKENS,
          system: messages[0].content,
          messages: [{ role: "user", content: messages[1].content }]
        };
        extractText = data => data.content?.filter(part => part.type === "text").map(part => part.text).join("\n");
      } else if (provider === "gemini") {
        url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
        headers = { "content-type": "application/json", "x-goog-api-key": apiKey };
        body = {
          systemInstruction: { parts: [{ text: messages[0].content }] },
          contents: [{ role: "user", parts: [{ text: messages[1].content }] }],
          generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, responseMimeType: "application/json" }
        };
        extractText = data => data.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("\n");
      } else {
        const base = (provider === "openai-compatible" ? required(env.AI_BASE_URL, "AI_BASE_URL") : (env.AI_BASE_URL || DEFAULT_BASE_URL)).replace(/\/+$/, "");
        url = `${base}/chat/completions`;
        headers = { "content-type": "application/json", authorization: `Bearer ${apiKey}` };
        body = {
          model, messages, max_tokens: MAX_OUTPUT_TOKENS,
          response_format: { type: "json_object" }
        };
        extractText = data => data.choices?.[0]?.message?.content;
      }

      const response = await fetchImpl(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });
      if (!response.ok) throw await readProviderError(response);
      const data = await response.json();
      return validateTutorResult(extractJson(extractText(data)));
    }
  };
}
