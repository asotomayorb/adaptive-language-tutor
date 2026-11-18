import test from "node:test";
import assert from "node:assert/strict";
import { buildTutorMessages, TUTOR_RESPONSE_SCHEMA, TUTOR_SYSTEM_PROMPT } from "../server/prompts.js";

test("tutor prompt defines adaptive, communicative teaching rules", () => {
  assert.match(TUTOR_SYSTEM_PROMPT, /portugués brasileño natural/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /respuestas semánticamente equivalentes/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /session\.currentExercise/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /evaluate_and_continue/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /transición breve y neutral/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /no incluyas bloques o listas tituladas/i);
});

test("OpenAI response schema is strict and contains the complete tutor contract", () => {
  assert.equal(TUTOR_RESPONSE_SCHEMA.type, "object");
  assert.equal(TUTOR_RESPONSE_SCHEMA.additionalProperties, false);
  assert.deepEqual(TUTOR_RESPONSE_SCHEMA.required, ["message", "exercise", "evaluation", "learnerUpdate", "speechSegments", "nextAction"]);
  assert.equal(TUTOR_RESPONSE_SCHEMA.properties.nextAction.enum.includes("finish"), true);
});

test("buildTutorMessages preserves learner, active exercise and recent conversation context", () => {
  const history = Array.from({ length: 15 }, (_, index) => ({ role: index % 2 ? "user" : "assistant", content: String(index) }));
  const activeExercise = { type: "translation", prompt: "¿Dónde está la estación?", expectedAnswer: "Onde fica a estação?" };
  const messages = buildTutorMessages({
    task: "evaluate_and_continue",
    learner: { nativeLanguage: "es", targetLanguage: "pt-BR" },
    session: { turn: 2, duration: 8, currentExercise: activeExercise },
    history,
    userMessage: "Onde fica a estação?"
  });
  assert.equal(messages.length, 2);
  assert.match(messages[0].content, /profesor particular de idiomas/i);
  const payload = JSON.parse(messages[1].content);
  assert.equal(payload.task, "evaluate_and_continue");
  assert.deepEqual(payload.session.currentExercise, activeExercise);
  assert.equal(payload.history.length, 12);
  assert.equal(payload.history[0].content, "3");
  assert.equal(payload.userMessage, "Onde fica a estação?");
});


test("tutor prompt defines a non-advancing progressive hint request", () => {
  assert.match(TUTOR_SYSTEM_PROMPT, /request_hint/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /no cambies de actividad/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /no avances el turno/i);
});
