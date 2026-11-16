import test from "node:test";
import assert from "node:assert/strict";
import { createAppServer } from "../server/index.js";

async function withServer(provider, run) {
  const server = createAppServer(provider);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await run("http://127.0.0.1:" + address.port);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

test("health endpoint does not reveal provider details when unconfigured", async () => {
  await withServer({ configured: false, provider: "openai" }, async base => {
    const response = await fetch(base + "/api/health");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok", ai: { configured: false, provider: null } });
  });
});

test("tutor endpoint rejects missing user message", async () => {
  await withServer({ configured: true, provider: "test", generateTutorTurn: async () => ({ message: "ok" }) }, async base => {
    const response = await fetch(base + "/api/tutor", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({})
    });
    assert.equal(response.status, 400);
  });
});

test("tutor endpoint returns service unavailable without configured AI", async () => {
  await withServer({ configured: false, generateTutorTurn: async () => ({}) }, async base => {
    const response = await fetch(base + "/api/tutor", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userMessage: "Start" })
    });
    assert.equal(response.status, 503);
  });
});

test("tutor endpoint forwards validated context to the provider", async () => {
  let received;
  await withServer({
    configured: true,
    provider: "test",
    generateTutorTurn: async input => {
      received = input;
      return { message: "Vamos começar.", exercise: null, evaluation: null, learnerUpdate: null, nextAction: "answer" };
    }
  }, async base => {
    const response = await fetch(base + "/api/tutor", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ userMessage: "Quiero practicar", learner: { targetLanguage: "pt-BR" } })
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).message, "Vamos começar.");
    assert.equal(received.learner.targetLanguage, "pt-BR");
  });
});

test("server serves the application shell and frontend modules", async () => {
  await withServer({ configured: false }, async base => {
    const page = await fetch(base + "/");
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Adaptive Language Tutor/);
    const moduleResponse = await fetch(base + "/src/core/tutor-client.js");
    assert.equal(moduleResponse.status, 200);
    assert.match(moduleResponse.headers.get("content-type"), /javascript/);
  });
});

test("static server rejects path traversal", async () => {
  await withServer({ configured: false }, async base => {
    const response = await fetch(base + "/%2e%2e%2fpackage.json");
    assert.equal(response.status, 404);
  });
});
