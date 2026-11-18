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
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.equal(response.headers.get("permissions-policy"), "camera=(), microphone=(), geolocation=()");
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

test("invalid tutor requests do not consume the provider rate limit", async () => {
  await withServer({
    configured: true,
    provider: "test",
    generateTutorTurn: async () => ({ message: "ok", exercise: null, evaluation: null, learnerUpdate: null, nextAction: "answer" })
  }, async base => {
    const invalid = await fetch(base + "/api/tutor", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({})
    });
    assert.equal(invalid.status, 400);
    for (let index = 0; index < 60; index += 1) {
      const response = await fetch(base + "/api/tutor", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ userMessage: "practice" })
      });
      assert.equal(response.status, 200);
    }
  });
});

test("unconfigured provider requests do not consume the rate limit", async () => {
  await withServer({ configured: false, provider: "test" }, async base => {
    for (let index = 0; index < 61; index += 1) {
      const response = await fetch(base + "/api/tutor", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ userMessage: "practice" })
      });
      assert.equal(response.status, 503);
    }
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

test("tutor endpoint does not expose internal provider errors", async () => {
  await withServer({
    configured: true,
    provider: "test",
    generateTutorTurn: async () => {
      const error = new Error("upstream response exposed secret diagnostic detail");
      error.status = 429;
      throw error;
    }
  }, async base => {
    const response = await fetch(base + "/api/tutor", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ userMessage: "practice" })
    });
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.equal(body.error, "El tutor IA no está disponible temporalmente. Intenta nuevamente.");
    assert.doesNotMatch(JSON.stringify(body), /secret diagnostic detail|upstream response/);
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
    assert.equal(page.headers.get("x-frame-options"), "DENY");
    assert.equal(page.headers.get("x-content-type-options"), "nosniff");
    assert.match(await page.text(), /Adaptive Language Tutor/);
    const moduleResponse = await fetch(base + "/src/core/tutor-client.js");
    assert.equal(moduleResponse.status, 200);
    assert.match(moduleResponse.headers.get("content-type"), /javascript/);
  });
});

test("static server does not expose environment, backend, package or test files", async () => {
  await withServer({ configured: false }, async base => {
    for (const path of [
      "/.env",
      "/.env.example",
      "/package.json",
      "/package-lock.json",
      "/server/index.js",
      "/server/provider.js",
      "/scripts/live-provider-smoke.js",
      "/tests/api.test.js",
      "/src/../.env",
      "/src/../server/provider.js"
    ]) {
      const response = await fetch(base + path);
      assert.equal(response.status, 404, path + " must not be publicly served");
    }
  });
});

test("static server rejects path traversal", async () => {
  await withServer({ configured: false }, async base => {
    const response = await fetch(base + "/%2e%2e%2fpackage.json");
    assert.equal(response.status, 404);
  });
});


test("tutor endpoint rate-limits requests and provides a retry delay", async () => {
  await withServer({
    configured: true,
    provider: "test",
    generateTutorTurn: async () => ({ message: "ok", exercise: null, evaluation: null, learnerUpdate: null, nextAction: "answer" })
  }, async base => {
    const sendRequest = () => fetch(base + "/api/tutor", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ userMessage: "practice" })
    });
    for (let index = 0; index < 60; index += 1) {
      const response = await sendRequest();
      assert.equal(response.status, 200);
    }
    const limited = await sendRequest();
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get("retry-after")) > 0);
  });
});

test("tutor endpoint bounds concurrent provider requests", async () => {
  let release;
  const providerResponse = new Promise(resolve => { release = resolve; });
  await withServer({
    configured: true,
    provider: "test",
    generateTutorTurn: async () => providerResponse
  }, async base => {
    const sendRequest = () => fetch(base + "/api/tutor", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ userMessage: "practice" })
    });
    const first = sendRequest();
    const second = sendRequest();
    await new Promise(resolve => setTimeout(resolve, 20));
    const third = await sendRequest();
    assert.equal(third.status, 503);
    assert.equal(third.headers.get("retry-after"), "2");
    release({ message: "ok", exercise: null, evaluation: null, learnerUpdate: null, nextAction: "answer" });
    assert.equal((await first).status, 200);
    assert.equal((await second).status, 200);
  });
});


test("preview password protects app and tutor endpoint while health stays available", async () => {
  const previous = process.env.PREVIEW_PASSWORD;
  process.env.PREVIEW_PASSWORD = "test-preview-secret";
  try {
    await withServer({ configured: false, provider: null }, async base => {
      const health = await fetch(base + "/api/health");
      assert.equal(health.status, 200);

      const blocked = await fetch(base + "/");
      assert.equal(blocked.status, 401);
      assert.match(blocked.headers.get("www-authenticate") || "", /Basic realm/);

      const authorized = await fetch(base + "/", {
        headers: { authorization: "Basic " + Buffer.from("tester:test-preview-secret").toString("base64") }
      });
      assert.equal(authorized.status, 200);
      assert.match(await authorized.text(), /Adaptive Language Tutor/);
    });
  } finally {
    if (previous === undefined) delete process.env.PREVIEW_PASSWORD;
    else process.env.PREVIEW_PASSWORD = previous;
  }
});
