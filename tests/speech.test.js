import test from "node:test";
import assert from "node:assert/strict";
import { createSpeechController, findVoiceForLocale } from "../src/core/speech.js";

function speechMock(voices = []) {
  const spoken = [];
  let cancelled = 0;
  const listeners = new Map();
  const api = {
    getVoices: () => voices,
    addEventListener: (name, callback) => listeners.set(name, callback),
    emit: name => listeners.get(name)?.(),
    speak: utterance => spoken.push(utterance),
    cancel: () => { cancelled += 1; },
    pause: () => { api.paused = true; },
    resume: () => { api.paused = false; },
    paused: false
  };
  return {
    spoken,
    get cancelled() { return cancelled; },
    api
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
  assert.equal(findVoiceForLocale([{ name: "Portuguese generic", lang: "pt" }], "pt-BR").name, "Portuguese generic");
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
  const mock = speechMock([{ name:"English", lang:"en-US" }]);
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
    ["Bom dia", "pt-BR", "Brazilian Portuguese"]
  ]);
  mock.spoken[0].onend();
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
  const mock = speechMock([{ name:"Portuguese", lang:"pt-BR" }]);
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


test("speech controller can pause and resume a passage", () => {
  const mock = speechMock([{ name:"Portuguese", lang:"pt-BR" }]);
  mock.api.paused = false;
  const controller = createSpeechController({
    synthesis: mock.api,
    Utterance: MockUtterance,
    storage: { getItem: () => null, setItem: () => {} }
  });
  assert.equal(controller.speak("Um texto de leitura", "pt-BR").spoken, true);
  assert.equal(controller.pause(), true);
  assert.equal(controller.paused, true);
  assert.equal(controller.resume(), true);
  assert.equal(controller.paused, false);
});


test("speech delegates to the OS TTS engine with an explicit target locale when no matching Voice object is exposed", () => {
  const mock = speechMock([{ name:"Spanish", lang:"es-CL" }]);
  const controller = createSpeechController({
    synthesis:mock.api,
    Utterance:MockUtterance,
    storage:{getItem:()=>null,setItem:()=>{}}
  });
  const result = controller.speak("Bom dia","pt-BR");
  assert.equal(result.spoken,true);
  assert.equal(mock.spoken.length,1);
  assert.equal(mock.spoken[0].lang,"pt-BR");
  assert.equal(mock.spoken[0].voice,null);
});

test("speech sequence preserves each explicit locale even when Android exposes no matching voice object", () => {
  const mock = speechMock([{name:"Spanish",lang:"es-CL"}]);
  const controller = createSpeechController({
    synthesis:mock.api,
    Utterance:MockUtterance,
    storage:{getItem:()=>null,setItem:()=>{}}
  });
  const result = controller.speakSequence([
    {text:"Instrucción en español",locale:"es-CL"},
    {text:"Bom dia",locale:"pt-BR"}
  ]);
  assert.equal(result.count,2);
  assert.deepEqual(mock.spoken.map(item=>[item.lang,item.voice?.lang || null]),[["es-CL","es-CL"]]);
  mock.spoken[0].onend();
  assert.deepEqual(mock.spoken.map(item=>[item.lang,item.voice?.lang || null]),[["es-CL","es-CL"],["pt-BR",null]]);
});


test("speech waits for Android voiceschanged before giving up on the target voice", () => {
  const mock = speechMock([]);
  const controller = createSpeechController({
    synthesis:mock.api,
    Utterance:MockUtterance,
    storage:{getItem:()=>null,setItem:()=>{}}
  });
  const result = controller.speak("Bom dia","pt-BR",{automatic:true});
  assert.equal(result.spoken,true);
  assert.equal(result.pending,true);
  assert.equal(mock.spoken.length,0);
  mock.api.getVoices = () => [{name:"Brazilian Portuguese",lang:"pt-BR"}];
  mock.api.emit("voiceschanged");
  assert.equal(mock.spoken.length,1);
  assert.equal(mock.spoken[0].text,"Bom dia");
  assert.equal(mock.spoken[0].lang,"pt-BR");
  assert.equal(mock.spoken[0].voice.name,"Brazilian Portuguese");
});


test("speech retries with the explicit system locale if Android never emits voiceschanged", async () => {
  const mock = speechMock([]);
  const controller = createSpeechController({
    synthesis:mock.api,
    Utterance:MockUtterance,
    storage:{getItem:()=>null,setItem:()=>{}}
  });
  const result = controller.speak("Bom dia","pt-BR",{automatic:true});
  assert.equal(result.pending,true);
  await new Promise(resolve => setTimeout(resolve,950));
  assert.equal(mock.spoken.length,1);
  assert.equal(mock.spoken[0].lang,"pt-BR");
  assert.equal(mock.spoken[0].voice,null);
  controller.stop();
});


test("stopping a serialized speech sequence prevents stale fragments from playing", () => {
  const mock = speechMock([
    {name:"Portuguese",lang:"pt-BR"},
    {name:"English",lang:"en-US"}
  ]);
  const controller = createSpeechController({
    synthesis:mock.api,
    Utterance:MockUtterance,
    storage:{getItem:()=>null,setItem:()=>{}}
  });
  controller.speakSequence([
    {text:"Bom dia",locale:"pt-BR"},
    {text:"Good morning",locale:"en-US"}
  ]);
  assert.equal(mock.spoken.length,1);
  controller.stop();
  mock.spoken[0].onend?.();
  assert.equal(mock.spoken.length,1,"navigation stop must invalidate the pending second fragment");
});
