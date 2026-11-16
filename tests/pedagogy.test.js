import test from "node:test";
import assert from "node:assert/strict";
import { createSession, evaluateAnswer, recordAnswer, getDueReviews, buildSummary, applyLearnerUpdate, recordTutorEvaluation } from "../src/core/pedagogy.js";

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


test("AI learner updates store an estimated level for subsequent turns", () => {
  const session = createSession({ level: "diagnostic" });
  assert.equal(applyLearnerUpdate(session, { estimatedLevel: "B1" }), "B1");
  assert.equal(session.config.estimatedLevel, "B1");
});

test("empty AI level estimates do not erase a previous estimate", () => {
  const session = createSession({ level: "diagnostic", estimatedLevel: "A2" });
  assert.equal(applyLearnerUpdate(session, { estimatedLevel: null }), null);
  assert.equal(session.config.estimatedLevel, "A2");
});

test("AI review patterns are retained, deduplicated and bounded", () => {
  const session = createSession({ level: "diagnostic" });
  applyLearnerUpdate(session, {
    errorsToReview: ["Conjugación en primera persona", "  Uso de preposiciones  "]
  });
  applyLearnerUpdate(session, {
    errorsToReview: ["conjugación en primera persona", "Orden de palabras"]
  });
  assert.deepEqual(session.errorsToReview, [
    "Conjugación en primera persona", "Uso de preposiciones", "Orden de palabras"
  ]);
  assert.deepEqual(buildSummary(session).reviewPatterns, session.errorsToReview);
});

test("empty AI review updates do not erase earlier patterns", () => {
  const session = createSession({ level: "diagnostic" });
  applyLearnerUpdate(session, { errorsToReview: ["Concordancia"] });
  applyLearnerUpdate(session, { errorsToReview: [] });
  assert.deepEqual(session.errorsToReview, ["Concordancia"]);
});

test("AI review patterns ignore invalid values and cap their length and count", () => {
  const session = createSession({});
  applyLearnerUpdate(session, {
    errorsToReview: [null, 4, ...Array.from({ length: 10 }, (_, i) => "Patrón " + i), "x".repeat(200)]
  });
  assert.equal(session.errorsToReview.length, 8);
  assert.equal(session.errorsToReview.at(-1).length, 160);
  assert.equal(session.errorsToReview[0], "Patrón 3");
});


test("AI not_applicable turns do not count as errors or reduce accuracy", () => {
  const session = createSession({ language: "Portugués brasileño" });
  recordTutorEvaluation(session, {
    exerciseId: "ai-turn-1", prompt: "Conversa livre", submitted: "Tudo bem",
    status: "not_applicable"
  });
  const summary = buildSummary(session);
  assert.equal(session.turn, 1);
  assert.equal(summary.turns, 1);
  assert.equal(session.answers.length, 1);
  assert.equal(session.attempted, 0);
  assert.equal(session.errors.length, 0);
  assert.equal(session.consecutiveErrors, 0);
  assert.equal(summary.accuracy, 0);
});

test("AI not_applicable turns preserve the current correct streak", () => {
  const session = createSession({ language: "Portugués brasileño" });
  recordTutorEvaluation(session, {
    exerciseId: "ai-turn-1", prompt: "Pergunta", submitted: "Olá",
    expected: "Olá", status: "correct"
  });
  recordTutorEvaluation(session, {
    exerciseId: "ai-turn-2", prompt: "Conversa livre", submitted: "Tudo bem",
    status: "not_applicable"
  });
  assert.equal(session.streak, 1);
  assert.equal(session.consecutiveCorrect, 1);
  assert.equal(session.attempted, 1);
  assert.equal(session.correct, 1);
});

test("AI partially correct and incorrect evaluations are counted and stored for review", () => {
  const session = createSession({ language: "Portugués brasileño" });
  recordTutorEvaluation(session, {
    exerciseId: "ai-turn-1", prompt: "Pergunta", submitted: "Eu querer água",
    expected: "Eu quero água", status: "partially_correct", feedback: "Conjugación",
    skill: "Gramática"
  });
  recordTutorEvaluation(session, {
    exerciseId: "ai-turn-2", prompt: "Pergunta", submitted: "Não sei",
    expected: "Eu quero água", status: "incorrect", feedback: "Inténtalo de nuevo",
    skill: "Producción"
  });
  assert.equal(session.attempted, 2);
  assert.equal(session.correct, 0);
  assert.equal(session.errors.length, 2);
  assert.equal(session.errors[0].evaluationStatus, "partially_correct");
  assert.equal(session.errors[1].evaluationStatus, "incorrect");
  assert.equal(buildSummary(session).accuracy, 0);
});
