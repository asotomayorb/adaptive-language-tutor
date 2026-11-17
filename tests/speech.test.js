import test from "node:test";
import assert from "node:assert/strict";
import { createSpeechController, findVoiceForLocale } from "../src/core/speech.js";

function speechMock(voices = []) {
  const spoken = [];
  let cancelled = 0;
  return {
    spoken,
    get cancelled() { return cancelled; },
    api: {
      getVoices: () => voices,
      speak: utterance => spoken.push(utterance),
      cancel: () => { cancelled += 1; }
    }
  };
}

class MockUtterance {
  constructor(text) { this.text = text; this.lang = ""; this.voice = null; }
}

test("voice resolution prefers exact locale and falls back to language match", () => {
  const voices = [
    { name: "English US", lang: "en-US" },
    { name: "English UK", lang: "en-GB" },
    { name: "Portuguese Brazil", lang: "pt-BR" }
  ];
  assert.equal(findVoiceForLocale(voices, "pt-BR").name, "Portuguese Brazil");
  assert.equal(findVoiceForLocale(voices, "en-AU").name, "English US");
  assert.equal(findVoiceForLocale(voices, "fr-FR"), null);
});

test("speech uses the requested locale and matching voice", () => {
  const mock = speechMock([{ name: "Brazilian Portuguese", lang: "pt-BR" }]);
  const controller = createSpeechController({
    synthesis: mock.api,
    Utterance: MockUtterance,
    storage: { getItem: () => null, setItem: () => {} }
  });
  const result = controller.speak("Bom dia", "pt-BR");
  assert.equal(result.spoken, true);
  assert.equal(mock.spoken[0].text, "Bom dia");
  assert.equal(mock.spoken[0].lang, "pt-BR");
  assert.equal(mock.spoken[0].voice.name, "Brazilian Portuguese");
});

test("automatic speech respects saved preference but manual playback remains available", () => {
  const mock = speechMock();
  const saved = new Map([["adaptive-language-tutor.audio.auto", "false"]]);
  const controller = createSpeechController({
    synthesis: mock.api,
    Utterance: MockUtterance,
    storage: { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) }
  });
  assert.equal(controller.enabled, false);
  assert.equal(controller.speak("Hello", "en", { automatic: true }).spoken, false);
  assert.equal(controller.speak("Hello", "en").spoken, true);
  controller.setEnabled(true);
  assert.equal(saved.get("adaptive-language-tutor.audio.auto"), "true");
  assert.equal(controller.speak("Hello", "en", { automatic: true }).spoken, true);
});

test("speech sequences preserve the locale of each fragment", () => {
  const mock = speechMock([
    { name: "Brazilian Portuguese", lang: "pt-BR" },
    { name: "English US", lang: "en-US" }
  ]);
  const controller = createSpeechController({
    synthesis: mock.api,
    Utterance: MockUtterance,
    storage: { getItem: () => null, setItem: () => {} }
  });
  const result = controller.speakSequence([
    { text: "Bom dia", language: "pt", locale: "pt-BR" },
    { text: "Good morning", language: "en", locale: "en-US" }
  ], { automatic: true });
  assert.equal(result.count, 2);
  assert.deepEqual(mock.spoken.map(item => [item.text, item.lang, item.voice.name]), [
    ["Bom dia", "pt-BR", "Brazilian Portuguese"],
    ["Good morning", "en-US", "English US"]
  ]);
});

test("disabling audio cancels current speech and unsupported browsers degrade safely", () => {
  const mock = speechMock();
  const controller = createSpeechController({
    synthesis: mock.api,
    Utterance: MockUtterance,
    storage: { getItem: () => null, setItem: () => {} }
  });
  controller.setEnabled(false);
  assert.equal(mock.cancelled, 1);
  const unsupported = createSpeechController({
    synthesis: null,
    Utterance: null,
    storage: { getItem: () => null, setItem: () => {} }
  });
  assert.equal(unsupported.supported, false);
  assert.equal(unsupported.speak("Hello", "en").spoken, false);
});

test("speech preference storage failures do not break the tutor", () => {
  const mock = speechMock();
  const controller = createSpeechController({
    synthesis: mock.api,
    Utterance: MockUtterance,
    storage: {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("blocked"); }
    }
  });
  assert.equal(controller.enabled, true);
  assert.equal(controller.speak("Olá", "pt-BR").spoken, true);
});
