import test from "node:test";
import assert from "node:assert/strict";
import { loadProgress, saveProgress, persistSession, getDueCards, gradeReview, getProgressStats } from "../src/core/storage.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value)
  };
}

const baseSession = () => ({
  config: { language: "Portugués brasileño", languageId: "pt-BR", estimatedLevel: "B1" },
  vocabulary: [{ term: "obrigado", meaning: "gracias" }],
  errors: [{ exerciseId: "greeting-1", prompt: "Saluda", expected: "Olá", explanation: "Saludo básico", skill: "Saludos" }]
});

test("progress persists and loads with a versioned schema", () => {
  const storage = memoryStorage();
  const progress = loadProgress(storage);
  progress.sessions.push({ accuracy: 80, languageId: "pt-BR" });
  assert.equal(saveProgress(progress, storage), true);
  assert.equal(loadProgress(storage).sessions.length, 1);
});

test("invalid or incompatible stored data safely resets", () => {
  const storage = memoryStorage();
  storage.setItem("adaptive-language-tutor.progress", "{bad json");
  assert.deepEqual(loadProgress(storage), { version: 1, sessions: [], vocabulary: [], reviewCards: [] });
});

test("persisting a session records history, vocabulary and a review due tomorrow", () => {
  const now = Date.parse("2026-01-01T12:00:00.000Z");
  const progress = persistSession(loadProgress(null), baseSession(), {
    attempted: 1, correct: 0, accuracy: 0
  }, now);
  assert.equal(progress.sessions.length, 1);
  assert.equal(progress.sessions[0].estimatedLevel, "B1");
  assert.equal(progress.vocabulary[0].term, "obrigado");
  assert.equal(progress.reviewCards.length, 1);
  assert.equal(getDueCards(progress, now).length, 0);
  assert.equal(getDueCards(progress, now + 24 * 60 * 60 * 1000).length, 1);
});

test("successful spaced reviews advance 3, 7 and 14 day intervals; failure resets to one day", () => {
  const now = Date.parse("2026-01-01T12:00:00.000Z");
  const progress = persistSession(loadProgress(null), baseSession(), {
    attempted: 1, correct: 0, accuracy: 0
  }, now);
  const key = progress.reviewCards[0].key;
  assert.equal(gradeReview(progress, key, true, now).nextIntervalDays, 3);
  assert.equal(gradeReview(progress, key, true, now).nextIntervalDays, 7);
  assert.equal(gradeReview(progress, key, true, now).nextIntervalDays, 14);
  assert.equal(gradeReview(progress, key, false, now).nextIntervalDays, 1);
  assert.equal(progress.reviewCards[0].repetitions, 0);
});

test("progress statistics can be filtered by language", () => {
  const progress = loadProgress(null);
  progress.sessions.push({ languageId: "pt-BR", accuracy: 80 }, { languageId: "en", accuracy: 60 });
  progress.vocabulary.push({ languageId: "pt-BR" });
  const stats = getProgressStats(progress, "pt-BR");
  assert.equal(stats.sessions, 1);
  assert.equal(stats.vocabulary, 1);
  assert.equal(stats.averageAccuracy, 80);
});
