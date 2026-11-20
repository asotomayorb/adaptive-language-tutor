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
  errors: [{ exerciseId: "greeting-1", prompt: "Saluda", expected: "Olá", term:"Olá", meaning:"hola", promptLocale:"es-CL", explanation: "Saludo básico", skill: "Saludos" }],
  errorsToReview: ["Conjugación en primera persona"]
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

test("persisting a session records history, vocabulary and makes graded errors immediately reviewable", () => {
  const now = Date.parse("2026-01-01T12:00:00.000Z");
  const progress = persistSession(loadProgress(null), baseSession(), {
    attempted: 1, correct: 0, accuracy: 0
  }, now);
  assert.equal(progress.sessions.length, 1);
  assert.equal(progress.sessions[0].estimatedLevel, "B1");
  assert.deepEqual(progress.sessions[0].reviewPatterns, ["Conjugación en primera persona"]);
  assert.equal(progress.vocabulary[0].term, "obrigado");
  assert.equal(progress.reviewCards.length, 2, "graded error and qualitative pattern should both be scheduled");
  const answerCard = progress.reviewCards.find(card => card.cardType !== "pattern");
  assert.equal(answerCard.term,"Olá");
  assert.equal(answerCard.meaning,"hola");
  const patternCard = progress.reviewCards.find(card => card.cardType === "pattern");
  assert.equal(patternCard.pattern, "Conjugación en primera persona");
  assert.equal(patternCard.expected, "", "pattern cards must not invent a single correct answer");
  assert.equal(getDueCards(progress, now).length, 1, "the concrete exercise error should be available in Repaso immediately");
  assert.equal(getDueCards(progress, now + 24 * 60 * 60 * 1000).length, 2, "the qualitative pattern card remains scheduled for tomorrow");
});

test("AI review cards from separate sessions do not overwrite each other", () => {
  const progress = loadProgress(null);
  const aiSession = () => ({
    config: { language: "Portugués brasileño", languageId: "pt-BR" },
    vocabulary: [],
    errors: [{
      turn: 1, exerciseId: "ai-turn-1", prompt: "Completa la frase",
      expected: "Eu gostaria de água", explanation: "Usa gostaria"
    }]
  });
  const firstTime = Date.parse("2026-01-01T12:00:00.000Z");
  persistSession(progress, aiSession(), { attempted: 1, correct: 0, accuracy: 0 }, firstTime);
  persistSession(progress, aiSession(), { attempted: 1, correct: 0, accuracy: 0 }, firstTime);
  assert.equal(progress.reviewCards.length, 2);
  assert.notEqual(progress.reviewCards[0].key, progress.reviewCards[1].key);
});

test("AI errors without an expected answer are not made into ungradable review cards", () => {
  const session = {
    config: { language: "Portugués brasileño", languageId: "pt-BR" },
    vocabulary: [],
    errors: [{
      turn: 1, exerciseId: "ai-turn-1", prompt: "Conversación libre",
      expected: "", explanation: "Continúa conversando"
    }]
  };
  const progress = persistSession(loadProgress(null), session, {
    attempted: 1, correct: 0, accuracy: 0
  }, Date.parse("2026-01-01T12:00:00.000Z"));
  assert.equal(progress.reviewCards.length, 0);
});

test("successful spaced reviews advance 3, 7 and 14 day intervals; failure stays due until corrected", () => {
  const now = Date.parse("2026-01-01T12:00:00.000Z");
  const progress = persistSession(loadProgress(null), baseSession(), {
    attempted: 1, correct: 0, accuracy: 0
  }, now);
  const key = progress.reviewCards[0].key;
  assert.equal(gradeReview(progress, key, true, now).nextIntervalDays, 3);
  assert.equal(gradeReview(progress, key, true, now).nextIntervalDays, 7);
  assert.equal(gradeReview(progress, key, true, now).nextIntervalDays, 14);
  assert.equal(gradeReview(progress, key, false, now).nextIntervalDays, 0);
  assert.equal(progress.reviewCards[0].repetitions, 0);
  assert.equal(getDueCards(progress, now).some(card => card.key === key), true,
    "an incorrect answer must leave the word in the pending review queue");
  gradeReview(progress, key, true, now);
  assert.equal(getDueCards(progress, now).some(card => card.key === key), false,
    "a correct answer moves the word out of the pending queue");
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


test("pattern review cards are deduplicated across sessions without resetting their schedule", () => {
  const progress = loadProgress(null);
  const session = {
    config: { language: "Francés", languageId: "fr-FR" },
    vocabulary: [], errors: [],
    errorsToReview: ["Acuerdo de género", "  Acuerdo de género  "]
  };
  const now = Date.parse("2026-01-01T12:00:00.000Z");
  persistSession(progress, session, { attempted: 0, correct: 0, accuracy: 0 }, now);
  assert.equal(progress.reviewCards.length, 1);
  const card = progress.reviewCards[0];
  gradeReview(progress, card.key, true, now);
  const dueAt = card.dueAt;
  persistSession(progress, session, { attempted: 0, correct: 0, accuracy: 0 }, now + 1000);
  assert.equal(progress.reviewCards.length, 1);
  assert.equal(progress.reviewCards[0].dueAt, dueAt);
});
