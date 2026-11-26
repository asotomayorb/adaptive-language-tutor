import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildTutorMessages, TUTOR_RESPONSE_SCHEMA, TUTOR_SYSTEM_PROMPT } from "../server/prompts.js";

test("tutor prompt defines adaptive, communicative teaching rules", () => {
  assert.match(TUTOR_SYSTEM_PROMPT, /idioma de origen español/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /idioma objetivo italiano/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /respuestas semánticamente equivalentes/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /session\.currentExercise/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /evaluate_and_continue/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /transición breve y neutral/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /no incluyas bloques o listas tituladas/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /actividades deben ser cerradas y tener una respuesta verificable/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /No preguntes preferencias personales/i);
});

test("OpenAI response schema is strict and contains the complete tutor contract", () => {
  assert.equal(TUTOR_RESPONSE_SCHEMA.type, "object");
  assert.equal(TUTOR_RESPONSE_SCHEMA.additionalProperties, false);
  assert.deepEqual(TUTOR_RESPONSE_SCHEMA.required, ["message", "exercise", "evaluation", "learnerUpdate", "speechSegments", "nextAction"]);
  assert.equal(TUTOR_RESPONSE_SCHEMA.properties.nextAction.enum.includes("finish"), true);
});

test("buildTutorMessages preserves learner, active exercise and recent conversation context", () => {
  const history = Array.from({ length: 15 }, (_, index) => ({ role: index % 2 ? "user" : "assistant", content: String(index) }));
  const activeExercise = { type: "translation", prompt: "Dov’è la stazione?", expectedAnswer: "Dov’è la stazione?" };
  const messages = buildTutorMessages({
    task: "evaluate_and_continue",
    learner: { nativeLanguage: "legacy-source", targetLanguage: "legacy-target", targetLanguageLocale: "legacy-locale" },
    session: { turn: 2, duration: 8, currentExercise: activeExercise },
    history,
    userMessage: "Dov’è la stazione?"
  });
  assert.equal(messages.length, 2);
  assert.match(messages[0].content, /profesor particular de idiomas/i);
  const payload = JSON.parse(messages[1].content);
  assert.equal(payload.task, "evaluate_and_continue");
  assert.equal(payload.learner.nativeLanguage, "es");
  assert.equal(payload.learner.nativeLanguageLocale, "es-CL");
  assert.equal(payload.learner.targetLanguage, "it-IT");
  assert.equal(payload.learner.targetLanguageLocale, "it-IT");
  assert.deepEqual(payload.session.currentExercise, activeExercise);
  assert.equal(payload.history.length, 12);
  assert.equal(payload.history[0].content, "3");
  assert.equal(payload.userMessage, "Dov’è la stazione?");
});


test("tutor prompt defines a non-advancing progressive hint request", () => {
  assert.match(TUTOR_SYSTEM_PROMPT, /request_hint/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /no cambies de actividad/i);
  assert.match(TUTOR_SYSTEM_PROMPT, /no avances el turno/i);
});


test("the frontend exposes only the supported Spanish-to-Italian pair", async () => {
  const [app, html] = await Promise.all([
    readFile(new URL("../src/app.js", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8")
  ]);
  assert.match(app, /const languageDefinitions = \{\s*"Italiano": \{ id:"it-IT", label:"Italiano", locale:"it-IT"/);
  assert.doesNotMatch(app, /content\/(?:pt-BR|en)\.js|customLanguageLocales|customLanguageFlags|theorySamples|verbLessons|articleLessons/);
  assert.match(app, /savedSettings\.selectedLanguage = "Italiano"/);
  assert.match(app, /const languageIds = selectedId \? \[selectedId\] : \[\]/);
  assert.deepEqual([...html.matchAll(/data-language="([^"]+)"/g)].map(match => match[1]), ["Italiano"]);
  assert.match(html, /Español → Italiano/);
});
