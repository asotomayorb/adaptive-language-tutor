import test from "node:test";
import assert from "node:assert/strict";
import { createAIProvider } from "../server/provider.js";

const tutorJson = JSON.stringify({
  message: "Vamos a practicar.",
  exercise: {
    type: "conversation",
    prompt: "Come ti chiami?",
    expectedAnswer: "Mi chiamo ...",
    acceptedAnswers: ["Sono ..."],
    options: ["Mi chiamo Anna", "Buongiorno", "Arrivederci"],
    hint: "Usa l’espressione «mi chiamo»."
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
  speechSegments: [{ text: "Buongiorno", language: "it", locale: "it-IT" }],
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
    { AI_PROVIDER: "openai", AI_API_KEY: "server-secret", AI_MODEL: "test-model" },
    fakeFetch("https://api.openai.com/v1/chat/completions", { authorization: "Bearer server-secret" }, {
      choices: [{ message: { content: tutorJson } }]
    }, options => {
      const body = JSON.parse(options.body);
      assert.equal(body.model, "test-model");
      assert.equal(body.max_completion_tokens, 1200);
      assert.equal(body.response_format.type, "json_schema");
      assert.equal(body.response_format.json_schema.strict, true);
      assert.equal(body.response_format.json_schema.name, "adaptive_language_tutor_turn");
    })
  );
  const result = await provider.generateTutorTurn({ userMessage: "Hola" });
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
  assert.equal((await provider.generateTutorTurn({ userMessage: "Hola" })).nextAction, "answer");
});

test("Gemini adapter uses its native generateContent format", async () => {
  const provider = createAIProvider(
    { AI_PROVIDER: "gemini", AI_API_KEY: "secret", AI_MODEL: "gemini-3.5-flash-lite" },
    fakeFetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent", { "x-goog-api-key": "secret" }, {
      candidates: [{ content: { parts: [{ text: tutorJson }] } }]
    }, options => {
      const body = JSON.parse(options.body);
      assert.equal(body.generationConfig.responseMimeType, "application/json");
      assert.equal(body.generationConfig.maxOutputTokens, 1200);
      assert.equal(body.generationConfig.responseSchema.type, "OBJECT");
      assert.deepEqual(body.generationConfig.responseSchema.properties.exercise.required,
        ["type", "prompt", "expectedAnswer", "acceptedAnswers", "options", "hint"]);
      assert.equal(body.generationConfig.responseSchema.properties.exercise.nullable, true);
      assert.deepEqual(body.generationConfig.responseSchema.required,
        ["message", "exercise", "evaluation", "learnerUpdate", "speechSegments", "nextAction"]);
      assert.equal(body.generationConfig.responseSchema.properties.speechSegments.type, "ARRAY");
    })
  );
  assert.equal((await provider.generateTutorTurn({ userMessage: "Hola" })).message, "Vamos a practicar.");
});

test("provider rejects oversized structured tutor responses", async () => {
  const oversized = JSON.parse(tutorJson);
  oversized.message = "x".repeat(17 * 1024);
  const provider = createAIProvider(
    { AI_PROVIDER: "openai", AI_API_KEY: "secret", AI_MODEL: "test-model" },
    fakeFetch("https://api.openai.com/v1/chat/completions", { authorization: "Bearer secret" }, {
      choices: [{ message: { content: JSON.stringify(oversized) } }]
    })
  );
  await assert.rejects(
    () => provider.generateTutorTurn({ userMessage: "Hola" }),
    /exceeds the tutor size limit/i
  );
});

test("provider preserves validated target-language speech segments", async () => {
  const provider = createAIProvider(
    { AI_PROVIDER: "openai", AI_API_KEY: "secret", AI_MODEL: "test-model" },
    fakeFetch("https://api.openai.com/v1/chat/completions", {}, {
      choices: [{ message: { content: JSON.stringify({
        message: "Practiquemos.",
        exercise: null,
        evaluation: null,
        learnerUpdate: null,
        speechSegments: [{ text: "Buongiorno", language: "it", locale: "it-IT" }],
        nextAction: "answer"
      }) } }]
    })
  );
  const result = await provider.generateTutorTurn({ userMessage: "Hola" });
  assert.deepEqual(result.speechSegments, [{ text: "Buongiorno", language: "it", locale: "it-IT" }]);
});

test("invalid target-language speech segments are rejected", async () => {
  const provider = createAIProvider(
    { AI_PROVIDER: "openai", AI_API_KEY: "secret", AI_MODEL: "test-model" },
    fakeFetch("https://api.openai.com/v1/chat/completions", {}, {
      choices: [{ message: { content: JSON.stringify({
        message: "Hi", exercise: null, evaluation: null, learnerUpdate: null,
        speechSegments: [{ text: "Buongiorno", locale: "es-CL" }],
        nextAction: "answer"
      }) } }]
    })
  );
  await assert.rejects(() => provider.generateTutorTurn({ userMessage: "Hola" }), /invalid speech segments/i);
});

test("provider rejects speech segments tagged with a different target locale", async () => {
  const provider = createAIProvider(
    { AI_PROVIDER: "openai", AI_API_KEY: "secret", AI_MODEL: "test-model" },
    fakeFetch("https://api.openai.com/v1/chat/completions", {}, {
      choices: [{ message: { content: JSON.stringify({
        message: "Practiquemos.",
        exercise: {
          type: "conversation", prompt: "Come stai?", expectedAnswer: "Sto bene.",
          acceptedAnswers: ["Sto bene."], options: ["Sto bene.", "Arrivederci.", "Grazie."], hint: null
        },
        evaluation: null,
        learnerUpdate: null,
        speechSegments: [{ text: "Buongiorno", language: "es", locale: "es-CL" }],
        nextAction: "answer"
      }) } }]
    })
  );
  await assert.rejects(
    () => provider.generateTutorTurn({
      task: "start_lesson",
      learner: { targetLanguageLocale: "it-IT" }
    }),
    error => error.status === 422 && /different from the selected target language/i.test(error.message)
  );
});

test("provider rejects premature AI session completion", async () => {
  const earlyFinish = {
    message: "Terminamos.",
    exercise: null,
    evaluation: { status: "correct", feedback: "Bien.", correction: null, skill: "Producción" },
    learnerUpdate: null,
    speechSegments: [],
    nextAction: "finish"
  };
  const provider = createAIProvider(
    { AI_PROVIDER: "openai", AI_API_KEY: "secret", AI_MODEL: "test-model" },
    fakeFetch("https://api.openai.com/v1/chat/completions", {}, {
      choices: [{ message: { content: JSON.stringify(earlyFinish) } }]
    })
  );
  await assert.rejects(
    () => provider.generateTutorTurn({ task: "evaluate_and_continue", session: { turn: 1, duration: 3 } }),
    error => error.status === 422 && /before the configured session duration/i.test(error.message)
  );
});

test("provider allows session completion at the configured duration", async () => {
  const finish = {
    message: "Terminamos.",
    exercise: null,
    evaluation: { status: "correct", feedback: "Bien.", correction: null, skill: "Producción" },
    learnerUpdate: null,
    speechSegments: [],
    nextAction: "finish"
  };
  const provider = createAIProvider(
    { AI_PROVIDER: "openai", AI_API_KEY: "secret", AI_MODEL: "test-model" },
    fakeFetch("https://api.openai.com/v1/chat/completions", {}, {
      choices: [{ message: { content: JSON.stringify(finish) } }]
    })
  );
  const result = await provider.generateTutorTurn({ task: "evaluate_and_continue", session: { turn: 3, duration: 3 } });
  assert.equal(result.nextAction, "finish");
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
  assert.equal((await provider.generateTutorTurn({ userMessage: "Hola" })).message, "Vamos a practicar.");
});

test("missing provider configuration is reported without exposing credentials", async () => {
  const provider = createAIProvider({});
  assert.equal(provider.configured, false);
  await assert.rejects(() => provider.generateTutorTurn({ userMessage: "Hola" }), /not configured/i);
});

test("invalid JSON model output is rejected", async () => {
  const provider = createAIProvider(
    { AI_PROVIDER: "openai", AI_API_KEY: "secret", AI_MODEL: "test-model" },
    fakeFetch("https://api.openai.com/v1/chat/completions", {}, {
      choices: [{ message: { content: "not json" } }]
    })
  );
  await assert.rejects(() => provider.generateTutorTurn({ userMessage: "Hola" }), /valid JSON/i);
});

test("a response outside the tutor contract is rejected", async () => {
  const provider = createAIProvider(
    { AI_PROVIDER: "openai", AI_API_KEY: "secret", AI_MODEL: "test-model" },
    fakeFetch("https://api.openai.com/v1/chat/completions", {}, {
      choices: [{ message: { content: JSON.stringify({ message: "Hi", exercise: {}, evaluation: null, learnerUpdate: null, nextAction: "unknown" }) } }]
    })
  );
  await assert.rejects(() => provider.generateTutorTurn({ userMessage: "Hola" }), /invalid exercise/i);
});


test("provider logs do not include upstream error response details", async () => {
  const originalError = console.error;
  const logged = [];
  console.error = (...args) => logged.push(args.join(" "));
  try {
    const provider = createAIProvider(
      { AI_PROVIDER: "openai", AI_API_KEY: "secret", AI_MODEL: "test-model" },
      async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: "sensitive upstream diagnostic detail" } })
      })
    );
    await assert.rejects(() => provider.generateTutorTurn({ userMessage: "Hola" }), /request failed/i);
    assert.equal(logged.length, 1);
    assert.match(logged[0], /"upstreamStatus":401/);
    assert.doesNotMatch(logged.join(" "), /sensitive upstream diagnostic detail/);
  } finally {
    console.error = originalError;
  }
});

test("provider requests have a timeout and report stalled requests clearly", async () => {
  const provider = createAIProvider(
    { AI_PROVIDER: "openai", AI_API_KEY: "secret", AI_MODEL: "test-model" },
    async (_url, options) => {
      assert.ok(options.signal instanceof AbortSignal);
      const error = new Error("request timed out");
      error.name = "TimeoutError";
      throw error;
    }
  );
  await assert.rejects(
    () => provider.generateTutorTurn({ userMessage: "Hola" }),
    /timed out after 45 seconds/i
  );
});
