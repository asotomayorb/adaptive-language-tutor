import test from "node:test";
import assert from "node:assert/strict";
import { createSession, evaluateAnswer, recordAnswer, getDueReviews, buildSummary } from "../src/core/pedagogy.js";

const exercise = {
  id: "test-1",
  prompt: "¿Dónde está el baño?",
  target: "Onde fica o banheiro?",
  acceptedAnswers: ["Onde está o banheiro?"],
  term: "banheiro",
  meaning: "baño",
  skill: "Preguntas útiles",
  explanation: "Pregunta por una ubicación."
};

test("answer evaluation ignores case, accents and surrounding punctuation", () => {
  assert.equal(evaluateAnswer("  ONDE ESTÁ O BANHEIRO! ", exercise), true);
});

test("empty answers are not accepted", () => {
  assert.equal(evaluateAnswer("   ", exercise), false);
});

test("two consecutive errors activate scaffolding", () => {
  const session = createSession({ language: "Portugués brasileño" });
  recordAnswer(session, exercise, "wrong");
  const result = recordAnswer(session, exercise, "still wrong");
  assert.equal(result.adaptation.mode, "scaffold");
});

test("three consecutive correct answers activate a challenge", () => {
  const session = createSession({ language: "Portugués brasileño" });
  recordAnswer(session, exercise, exercise.target);
  recordAnswer(session, exercise, exercise.target);
  const result = recordAnswer(session, exercise, exercise.target);
  assert.equal(result.adaptation.mode, "challenge");
});

test("a wrong answer is queued for review after two subsequent turns", () => {
  const session = createSession({ language: "Portugués brasileño" });
  recordAnswer(session, exercise, "incorrect");
  assert.equal(getDueReviews(session).length, 0);
  recordAnswer(session, exercise, exercise.target);
  assert.equal(getDueReviews(session).length, 1);
});

test("summary reports accuracy, vocabulary and skill focus", () => {
  const session = createSession({ language: "Portugués brasileño" });
  recordAnswer(session, exercise, exercise.target);
  recordAnswer(session, exercise, "incorrect");
  const summary = buildSummary(session);
  assert.equal(summary.attempted, 2);
  assert.equal(summary.correct, 1);
  assert.equal(summary.accuracy, 50);
  assert.equal(summary.vocabulary.length, 1);
  assert.deepEqual(summary.recommendedFocus, ["Preguntas útiles"]);
});
