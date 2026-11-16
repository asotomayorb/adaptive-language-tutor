import test from "node:test";
import assert from "node:assert/strict";
import { createAIProvider } from "../server/provider.js";

const tutorJson = JSON.stringify({
  message: "Vamos a practicar.",
  exercise: { type: "conversation", prompt: "Como você se chama?" },
  evaluation: { status: "not_applicable", feedback: "", correction: null },
  learnerUpdate: { vocabulary: [], errorsToReview: [] },
  nextAction: "answer"
});

function fakeFetch(expectedUrl, expectedHeaders, responseData) {
  return async (url, options) => {
    assert.equal(url, expectedUrl);
    for (const [key, value] of Object.entries(expectedHeaders)) assert.equal(options.headers[key], value);
    return { ok: true, json: async () => responseData };
  };
}

test("OpenAI adapter uses server-side credentials and structured output", async () => {
  const provider = createAIProvider(
    { AI_PROVIDER: "openai", AI_API_KEY: "server-secret", AI_MODEL: "test-model" },
    fakeFetch("https://api.openai.com/v1/chat/completions", { authorization: "Bearer server-secret" }, {
      choices: [{ message: { content: tutorJson } }]
    })
  );
  const result = await provider.generateTutorTurn({ userMessage: "Olá" });
  assert.equal(result.message, "Vamos a practicar.");
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
    { AI_PROVIDER: "gemini", AI_API_KEY: "secret", AI_MODEL: "test-model" },
    fakeFetch("https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent", { "x-goog-api-key": "secret" }, {
      candidates: [{ content: { parts: [{ text: tutorJson }] } }]
    })
  );
  assert.equal((await provider.generateTutorTurn({ userMessage: "Hello" })).message, "Vamos a practicar.");
});

test("missing provider configuration is reported without exposing credentials", async () => {
  const provider = createAIProvider({});
  assert.equal(provider.configured, false);
  await assert.rejects(() => provider.generateTutorTurn({ userMessage: "Hi" }), /not configured/i);
});

test("invalid model output is rejected", async () => {
  const provider = createAIProvider(
    { AI_PROVIDER: "openai", AI_API_KEY: "secret", AI_MODEL: "test-model" },
    fakeFetch("https://api.openai.com/v1/chat/completions", {}, {
      choices: [{ message: { content: "not json" } }]
    })
  );
  await assert.rejects(() => provider.generateTutorTurn({ userMessage: "Hi" }), /valid JSON/i);
});
