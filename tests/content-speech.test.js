import test from "node:test";
import assert from "node:assert/strict";
import { ptBR } from "../src/content/pt-BR.js";
import { english } from "../src/content/en.js";

for (const catalog of [ptBR, english]) {
  test(`${catalog.id} local speech annotations are explicit fragments of their source text`, () => {
    assert.ok(catalog.exercises.length > 0);
    for (const exercise of catalog.exercises) {
      for (const [field, source] of [
        ["hintSpeechSegments", exercise.hint || ""],
        ["explanationSpeechSegments", exercise.explanation || ""]
      ]) {
        assert.ok(Array.isArray(exercise[field]), `${exercise.id} must declare ${field}`);
        for (const phrase of exercise[field]) {
          assert.equal(typeof phrase, "string");
          assert.ok(phrase.trim(), `${exercise.id} contains an empty ${field} entry`);
          assert.ok(
            source.toLocaleLowerCase().includes(phrase.toLocaleLowerCase()),
            `${exercise.id} ${field} phrase is not present in its source text: ${phrase}`
          );
        }
      }
    }
  });
}
