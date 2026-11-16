import test from "node:test";
import assert from "node:assert/strict";
import { createAIProvider } from "../server/provider.js";

const tutorJson = JSON.stringify({
  message: "Vamos a practicar.",
  exercise: {
    type: "conversation",
    prompt: "Como você se chama?",
    expectedAnswer: "Meu nome é ...",
    acceptedAnswers: ["Eu me chamo ..."],
    hint: "Usa a expressão meu nome é."
  },
  evaluation: {
    status: "not_applicable",
    feedback: "",
    correction: null,
    skill: "Presentarse"
  },
  learnerUpdate: {
    estimatedLevel: null,
    vocabulary: [],
    errorsToReview: []
  },
  nextAction: "answer"
});

function fakeFetch(expectedUrl, expectedHeaders, responseData, inspectOptions = () => {}) {
  return async (url, options) => {
    assert.equal(url, expectedUrl);
    for (const [key, value] of Object.entries(expectedHeaders)) assert.equal(options.headers[key], value);
    inspectOptions(options);
    return { ok: true, json: async () => responseData };
  };
}

test("OpenAI adapter uses strict structured outputs and server-side credentials", async () => {
  const provider = createAIProvider(
    { AI_PROVIDER: "openai", AI_API_KEY: "server-secret", AI_MODEL: "gpt-6-luna" },
    fakeFetch("https://api.openai.com/v1/chat/completions", { authorization: "Bearer server-secret" }, {
      choices: [{ message: { content: tutorJson } }]
    }, options => {
      const body = JSON.parse(options.body);
      assert.equal(body.model, "gpt-6-luna");
      assert.equal(body.max_completion_tokens, 1200);
      assert.equal(body.response_format.type, "json_schema");
      assert.equal(body.response_format.json_schema.strict, true);
      assert.equal(body.response_format.json_schema.name, "adaptive_language_tutor_turn");
    })
  );
  const result = await provider.generateTutorTurn({ userMessage: "Olá" });
  assert.equal(result.message, "Vamos a practicar.");
  assert.equal(result.exercise.type, "conversation");
  assert.equal(provider.configured, true);
});

test("Anthropic adapter uses its native messages format", async () => {
  const provider = createAIProvider(
    { AI_PROVIDER: "anthropic", AI_API_KEY: "secret", AI_MODEL: "test-model" },
    fakeFetch("https://api.anthropic.com/v1/messages", { "x-api-key": "secret" }, {
      content: [{ type: "text", text: tutorJson }]
    })
  );
  assert.equal((await provider.generateTutorTurn({ userMessage: "Hello" })).nextAction, "answer");
});

test("Gemini adapter uses its native generateContent format", async () => {
  const provider = createAIProvider(
    { AI_PROVIDER: "gemini", AI_API_KEY: "secret", AI_MODEL: "gemini-3.8-flash" },
    fakeFetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", { "x-goog-api-key": "secret" }, {
      candidates: [{ content: { parts: [{ text: tutorJson }] } }]
    }, options => {
      const body = JSON.parse(options.body);
      assert.equal(body.generationConfig.responseMimeType, "application/json");
      assert.equal(body.generationConfig.maxOutputTokens, 1200);
    })
  );
  assert.equal((await provider.generateTutorTurn({ userMessage: "Hello" })).message, "Vamos a practicar.");
});

test("OpenAI-compatible providers retain the portable JSON mode", async () => {
  const provider = createAIProvider(
    { AI_PROVIDER: "openai-compatible", AI_API_KEY: "secret", AI_MODEL: "test-model", AI_BASE_URL: "https://example.test/v1" },
    fakeFetch("https://example.test/v1/chat/completions", { authorization: "Bearer secret" }, {
      choices: [{ message: { content: tutorJson } }]
    }, options => {
      const body = JSON.parse(options.body);
      assert.equal(body.response_format.type, "json_object");
      assert.equal(body.max_tokens, 1200);
    })
  );
  assert.equal((await provider.generateTutorTurn({ userMessage: "Hello" })).message, "Vamos a practicar.");
});

test("missing provider configuration is reported without exposing credentials", async () => {
  const provider = createAIProvider({});
  assert.equal(provider.configured, false);
  await assert.rejects(() => provider.generateTutorTurn({ userMessage: "Hi" }), /not configured/i);
});

test("invalid JSON model output is rejected", async () => {
  const provider = createAIProvider(
    { AI_PROVIDER: "openai", AI_API_KEY: "secret", AI_MODEL: "test-model" },
    fakeFetch("https://api.openai.com/v1/chat/completions", {}, {
      choices: [{ message: { content: "not json" } }]
    })
  );
  await assert.rejects(() => provider.generateTutorTurn({ userMessage: "Hi" }), /valid JSON/i);
});

test("a response outside the tutor contract is rejected", async () => {
  const provider = createAIProvider(
    { AI_PROVIDER: "openai", AI_API_KEY: "secret", AI_MODEL: "test-model" },
    fakeFetch("https://api.openai.com/v1/chat/completions", {}, {
      choices: [{ message: { content: JSON.stringify({ message: "Hi", exercise: {}, evaluation: null, learnerUpdate: null, nextAction: "unknown" }) } }]
    })
  );
  await assert.rejects(() => provider.generateTutorTurn({ userMessage: "Hi" }), /invalid exercise/i);
});
