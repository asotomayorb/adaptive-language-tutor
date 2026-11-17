import test from "node:test";
import assert from "node:assert/strict";
import {
  createSession,
  applyLearnerUpdate,
  recordTutorEvaluation,
  buildSummary
} from "../src/core/pedagogy.js";
import {
  loadProgress,
  saveProgress,
  persistSession,
  getDueCards
} from "../src/core/storage.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value)
  };
}

test("AI session lifecycle keeps learner updates, neutral turns, evaluation and persistence consistent", () => {
  const now = Date.parse("2026-11-17T12:00:00.000Z");
  const storage = memoryStorage();
  const session = createSession({
    language: "Portugués brasileño",
    languageId: "pt-BR",
    duration: 3,
    level: "basic",
    topic: "daily"
  });

  applyLearnerUpdate(session, {
    estimatedLevel: "B1",
    vocabulary: [{ term: "saudade", meaning: "nostalgia" }],
    errorsToReview: ["Uso de preposiciones"]
  });

  recordTutorEvaluation(session, {
    exerciseId: "ai-turn-1",
    prompt: "Como você está?",
    submitted: "Eu está bem",
    expected: "Eu estou bem",
    status: "partially_correct",
    feedback: "Usa estou con eu.",
    skill: "Conjugación"
  });

  applyLearnerUpdate(session, {
    estimatedLevel: "B1",
    vocabulary: [
      { term: "saudade", meaning: "nostalgia" },
      { term: "obrigado", meaning: "gracias" }
    ],
    errorsToReview: ["Uso de preposiciones", "Concordancia verbal"]
  });

  recordTutorEvaluation(session, {
    exerciseId: "ai-turn-2",
    prompt: "Continúa la conversación",
    submitted: "Que bom!",
    expected: "",
    status: "not_applicable",
    feedback: "",
    skill: "Conversación"
  });

  recordTutorEvaluation(session, {
    exerciseId: "ai-turn-3",
    prompt: "Diga que você quer água",
    submitted: "Eu gostaria de água",
    expected: "Eu gostaria de água",
    status: "correct",
    feedback: "Natural e correto.",
    skill: "Producción"
  });

  const summary = buildSummary(session);
  assert.equal(summary.turns, 3);
  assert.equal(summary.attempted, 2);
  assert.equal(summary.correct, 1);
  assert.equal(summary.accuracy, 50);
  assert.equal(summary.errors.length, 1);
  assert.deepEqual(summary.reviewPatterns, ["Uso de preposiciones", "Concordancia verbal"]);
  assert.equal(session.vocabulary.length, 2);
  assert.equal(session.config.estimatedLevel, "B1");

  const progress = persistSession(loadProgress(storage), session, summary, now);
  assert.equal(saveProgress(progress, storage), true);

  const restored = loadProgress(storage);
  assert.equal(restored.sessions.length, 1);
  assert.equal(restored.sessions[0].estimatedLevel, "B1");
  assert.equal(restored.sessions[0].attempted, 2);
  assert.equal(restored.sessions[0].accuracy, 50);
  assert.deepEqual(restored.sessions[0].reviewPatterns, ["Uso de preposiciones", "Concordancia verbal"]);
  assert.deepEqual(restored.vocabulary.map(item => item.term).sort(), ["obrigado", "saudade"]);
  assert.equal(restored.reviewCards.length, 1);
  assert.equal(restored.reviewCards[0].expected, "Eu estou bem");
  assert.equal(getDueCards(restored, now + 24 * 60 * 60 * 1000, "pt-BR").length, 1);
});
