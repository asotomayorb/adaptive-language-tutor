import assert from "node:assert/strict";

const baseUrl = (process.env.TUTOR_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const startedAt = Date.now();

async function request(path, options) {
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(baseUrl + path, options);
    const payload = await response.json().catch(() => ({}));
    if (response.ok) return payload;

    const message = payload.error || "unexpected response";
    const transient = [429, 500, 502, 503, 504].includes(response.status);
    if (!transient || attempt === maxAttempts) {
      throw new Error(path + " failed (" + response.status + "): " + message);
    }

    const retryAfter = Number(response.headers.get("retry-after"));
    const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter * 1000, 15000)
      : 1500 * (2 ** (attempt - 1));
    console.warn(path + " returned " + response.status + "; retrying in " + delayMs + "ms (attempt " + (attempt + 1) + "/" + maxAttempts + ").");
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

function validateTurn(result, label) {
  assert.equal(typeof result.message, "string", label + ": message must be text");
  assert.ok(["answer", "continue", "review", "finish"].includes(result.nextAction), label + ": nextAction must be valid");
  assert.ok(result.exercise === null || typeof result.exercise.prompt === "string", label + ": exercise must be valid");
  assert.ok(result.evaluation === null || ["correct", "partially_correct", "incorrect", "not_applicable"].includes(result.evaluation.status), label + ": evaluation must be valid");
}

const health = await request("/api/health");
assert.equal(health.status, "ok", "application health endpoint should be available");
assert.equal(health.ai?.configured, true, "AI provider must be configured before live smoke testing");

const learner = {
  nativeLanguage: "Spanish",
  targetLanguage: "Portugués brasileño",
  targetLanguageId: "pt-BR",
  level: "basic",
  preferences: "Práctica cotidiana; explicaciones breves en español"
};
const session = { duration: 3, turn: 0, topic: "daily", diagnostic: false,
  performance: { streak: 0, consecutiveCorrect: 0, consecutiveErrors: 0 } };
const history = [];
let result = await request("/api/tutor", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    task: "start_lesson", learner, session, history,
    userMessage: "Inicia una breve sesión de práctica de portugués brasileño para situaciones cotidianas."
  })
});
validateTurn(result, "start_lesson");
assert.ok(result.exercise, "start_lesson should provide an exercise");
let exercise = result.exercise;
let evaluationCount = 0;

for (let turn = 1; turn <= session.duration; turn += 1) {
  const answer = exercise.expectedAnswer || exercise.acceptedAnswers?.[0] || "Eu gostaria de praticar português.";
  history.push({ role: "assistant", content: JSON.stringify(result) });
  const next = await request("/api/tutor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      task: "evaluate_and_continue",
      learner,
      session: {
        ...session,
        turn,
        currentExercise: exercise,
        performance: { streak: 0, consecutiveCorrect: 0, consecutiveErrors: 0, recentErrors: [], vocabulary: [] }
      },
      history: history.slice(-12),
      userMessage: answer
    })
  });
  validateTurn(next, "evaluate_and_continue turn " + turn);
  assert.ok(next.evaluation, "turn " + turn + " should evaluate the previous answer");
  evaluationCount += 1;
  history.push({ role: "user", content: answer });
  result = next;
  exercise = next.exercise;
  if (turn < session.duration) assert.ok(exercise, "intermediate turns should provide a follow-up exercise");
}
assert.equal(result.nextAction, "finish", "the tutor should finish at the configured session duration");
assert.equal(result.exercise, null, "finished session should not leave a new exercise open");

console.log(JSON.stringify({
  status: "passed",
  provider: health.ai.provider,
  turns: evaluationCount,
  elapsedMs: Date.now() - startedAt
}, null, 2));
