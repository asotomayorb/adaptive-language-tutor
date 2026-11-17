import { buildTutorMessages, TUTOR_RESPONSE_SCHEMA } from "./prompts.js";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const MAX_OUTPUT_TOKENS = 1200;
const PROVIDER_TIMEOUT_MS = 45_000;

const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    message: { type: "STRING" },
    exercise: {
      type: "OBJECT", nullable: true,
      properties: {
        type: { type: "STRING", enum: ["translation", "comprehension", "grammar", "production", "conversation"] },
        prompt: { type: "STRING", nullable: true },
        expectedAnswer: { type: "STRING", nullable: true },
        acceptedAnswers: { type: "ARRAY", items: { type: "STRING" } },
        hint: { type: "STRING", nullable: true }
      },
      required: ["type", "prompt", "expectedAnswer", "acceptedAnswers", "hint"]
    },
    evaluation: {
      type: "OBJECT", nullable: true,
      properties: {
        status: { type: "STRING", enum: ["correct", "partially_correct", "incorrect", "not_applicable"] },
        feedback: { type: "STRING" },
        correction: { type: "STRING", nullable: true },
        skill: { type: "STRING" }
      },
      required: ["status", "feedback", "correction", "skill"]
    },
    learnerUpdate: {
      type: "OBJECT", nullable: true,
      properties: {
        estimatedLevel: { type: "STRING", nullable: true },
        vocabulary: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              term: { type: "STRING" },
              meaning: { type: "STRING" }
            },
            required: ["term", "meaning"]
          }
        },
        errorsToReview: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["estimatedLevel", "vocabulary", "errorsToReview"]
    },
    speechSegments: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          text: { type: "STRING" },
          language: { type: "STRING" },
          locale: { type: "STRING" }
        },
        required: ["text", "language", "locale"]
      }
    },
    nextAction: { type: "STRING", enum: ["answer", "continue", "review", "finish"] }
  },
  required: ["message", "exercise", "evaluation", "learnerUpdate", "speechSegments", "nextAction"]
};


function required(value, name) {
  if (!value) throw new Error("Missing required configuration: " + name);
  return value;
}

function extractJson(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("The AI provider returned an empty response.");
  }
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
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

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function contractError(message) {
  const error = new Error(message);
  error.status = 422;
  return error;
}

function enforceSessionDuration(result, input) {
  const turn = Number(input?.session?.turn);
  const duration = Number(input?.session?.duration);
  if (input?.task === "evaluate_and_continue" && Number.isFinite(turn) && Number.isFinite(duration) &&
      turn < duration && (result.nextAction === "finish" || result.exercise === null)) {
    throw contractError("The tutor attempted to finish before the configured session duration.");
  }
  return result;
}

function validateTutorResult(result) {
  const statuses = ["correct", "partially_correct", "incorrect", "not_applicable"];
  const actions = ["answer", "continue", "review", "finish"];
  const exerciseTypes = ["translation", "comprehension", "grammar", "production", "conversation"];

  if (!isRecord(result) || typeof result.message !== "string") {
    throw contractError("The AI provider response does not match the tutor contract.");
  }
  if (result.exercise !== null && (!isRecord(result.exercise) ||
      !exerciseTypes.includes(result.exercise.type) ||
      !(typeof result.exercise.prompt === "string" || result.exercise.prompt === null) ||
      !(typeof result.exercise.expectedAnswer === "string" || result.exercise.expectedAnswer === null) ||
      !Array.isArray(result.exercise.acceptedAnswers) ||
      !result.exercise.acceptedAnswers.every(item => typeof item === "string") ||
      !(typeof result.exercise.hint === "string" || result.exercise.hint === null))) {
    throw contractError("The AI provider returned an invalid exercise (exercise fields: " + Object.keys(result.exercise || {}).join(", ") + ").");
  }
  if (result.evaluation !== null && (!isRecord(result.evaluation) ||
      !statuses.includes(result.evaluation.status) ||
      typeof result.evaluation.feedback !== "string" ||
      !(typeof result.evaluation.correction === "string" || result.evaluation.correction === null) ||
      typeof result.evaluation.skill !== "string")) {
    throw contractError("The AI provider returned an invalid evaluation.");
  }
  if (result.learnerUpdate !== null && (!isRecord(result.learnerUpdate) ||
      !(typeof result.learnerUpdate.estimatedLevel === "string" || result.learnerUpdate.estimatedLevel === null) ||
      !Array.isArray(result.learnerUpdate.vocabulary) ||
      !result.learnerUpdate.vocabulary.every(item => isRecord(item) && typeof item.term === "string" && typeof item.meaning === "string") ||
      !Array.isArray(result.learnerUpdate.errorsToReview) ||
      !result.learnerUpdate.errorsToReview.every(item => typeof item === "string"))) {
    throw contractError("The AI provider returned an invalid learner update.");
  }
  if (result.speechSegments !== undefined && (!Array.isArray(result.speechSegments) ||
      !result.speechSegments.every(item => isRecord(item) &&
        typeof item.text === "string" && typeof item.language === "string" && typeof item.locale === "string"))) {
    throw contractError("The AI provider returned invalid speech segments.");
  }
  if (!actions.includes(result.nextAction)) {
    throw contractError("The AI provider returned an invalid next action.");
  }

  return {
    message: result.message,
    exercise: result.exercise,
    evaluation: result.evaluation,
    learnerUpdate: result.learnerUpdate,
    speechSegments: result.speechSegments || [],
    nextAction: result.nextAction
  };
}

async function readProviderError(response) {
  let detail = "";
  try {
    const body = await response.json();
    detail = body.error?.message || body.message || "";
  } catch {}
  const error = new Error("AI provider request failed (" + response.status + ")" + (detail ? ": " + detail : ""));
  error.status = response.status;
  return error;
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
        url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent";
        headers = { "content-type": "application/json", "x-goog-api-key": apiKey };
        body = {
          systemInstruction: { parts: [{ text: messages[0].content }] },
          contents: [{ role: "user", parts: [{ text: messages[1].content }] }],
          generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, responseMimeType: "application/json", responseSchema: GEMINI_RESPONSE_SCHEMA, thinkingConfig: { thinkingLevel: "low" } }
        };
        extractText = data => data.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("\n");
      } else {
        const base = (provider === "openai-compatible" ? required(env.AI_BASE_URL, "AI_BASE_URL") : (env.AI_BASE_URL || DEFAULT_BASE_URL)).replace(/\/+$/, "");
        url = base + "/chat/completions";
        headers = { "content-type": "application/json", authorization: "Bearer " + apiKey };
        if (provider === "openai") {
          body = {
            model,
            messages,
            max_completion_tokens: MAX_OUTPUT_TOKENS,
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "adaptive_language_tutor_turn",
                strict: true,
                schema: TUTOR_RESPONSE_SCHEMA
              }
            }
          };
        } else {
          body = {
            model,
            messages,
            max_tokens: MAX_OUTPUT_TOKENS,
            response_format: { type: "json_object" }
          };
        }
        extractText = data => data.choices?.[0]?.message?.content;
      }

      const requestStartedAt = Date.now();
      try {
        const response = await fetchImpl(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS)
        });
        if (!response.ok) throw await readProviderError(response);
        const data = await response.json();
        const result = validateTutorResult(extractJson(extractText(data)));
        return enforceSessionDuration(result, input);
      } catch (error) {
        console.error("[ai-provider] request failed", JSON.stringify({ provider, model, elapsedMs: Date.now() - requestStartedAt, errorName: error?.name || "Error", error: error?.message || String(error) }));
        if (error?.name === "TimeoutError" || error?.name === "AbortError") {
          throw new Error("AI provider request timed out after 45 seconds.");
        }
        throw error;
      }
    }
  };
}
