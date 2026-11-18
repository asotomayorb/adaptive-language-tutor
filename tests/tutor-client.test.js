import test from "node:test";
import assert from "node:assert/strict";
import { checkTutorHealth, requestTutorTurn } from "../src/core/tutor-client.js";

test("health check requests the API status and returns its payload", async () => {
  let requested;
  const fetchImpl = async (url, options) => {
    requested = { url, options };
    return new Response(JSON.stringify({ status: "ok", ai: { configured: true, provider: "test" } }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  };
  const result = await checkTutorHealth(fetchImpl);
  assert.equal(requested.url, "/api/health");
  assert.equal(requested.options.headers.accept, "application/json");
  assert.equal(result.ai.provider, "test");
});

test("health check reports an unavailable backend", async () => {
  await assert.rejects(
    checkTutorHealth(async () => new Response("unavailable", { status: 503 })),
    /Tutor API is unavailable/
  );
});

test("health check aborts a stalled backend so startup can fall back to local lessons", async () => {
  let signal;
  await assert.rejects(
    checkTutorHealth((_url, options) => new Promise((_resolve, reject) => {
      signal = options.signal;
      signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    }), 5),
    error => error.name === "AbortError"
  );
  assert.equal(signal.aborted, true);
});

test("tutor client posts the complete turn and parses the response", async () => {
  const input = {
    task: "evaluate_and_continue",
    learner: { targetLanguage: "pt-BR" },
    session: { turn: 1 },
    history: [],
    userMessage: "Onde fica a estação?"
  };
  let requested;
  const fetchImpl = async (url, options) => {
    requested = { url, options };
    return new Response(JSON.stringify({ message: "Muito bem.", nextAction: "answer" }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  };
  const result = await requestTutorTurn(input, fetchImpl);
  assert.equal(requested.url, "/api/tutor");
  assert.equal(requested.options.method, "POST");
  assert.equal(requested.options.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(requested.options.body), input);
  assert.equal(result.message, "Muito bem.");
});

test("tutor client surfaces provider errors returned by the API", async () => {
  await assert.rejects(
    requestTutorTurn({ userMessage: "practice" }, async () => new Response(
      JSON.stringify({ error: "Provider quota exceeded." }), { status: 502 }
    )),
    /Provider quota exceeded/
  );
});

test("tutor client uses a safe fallback for non-JSON error responses", async () => {
  await assert.rejects(
    requestTutorTurn({ userMessage: "practice" }, async () => new Response("gateway error", { status: 502 })),
    /El tutor no pudo responder/
  );
});
