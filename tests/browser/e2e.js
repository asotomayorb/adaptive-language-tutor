import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import assert from "node:assert/strict";

const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["server/index.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port) },
  stdio: "ignore"
});
let browser;

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error("The application server did not become ready.");
}

function tutorTurn({ turn = 0, start = false } = {}) {
  return {
    message: start ? "Elige la respuesta correcta." : turn === 4 ? "¡Muy bien! Esta es la siguiente actividad." : "Revisemos tu respuesta y avancemos.",
    exercise: {
      type: "grammar",
      prompt: "Choisissez la bonne forme.",
      expectedAnswer: "Bonjour",
      acceptedAnswers: ["Bonjour"],
      options: turn < 3 ? ["Bonjour", "Bonsoir", "Au revoir"] : [],
      hint: "Piensa en el saludo de la mañana."
    },
    evaluation: start ? null : {
      status: "correct",
      feedback: "Correcto. La respuesta está bien formada.",
      correction: null,
      skill: "Saludos"
    },
    learnerUpdate: { estimatedLevel: "A1", vocabulary: [], errorsToReview: [] },
    speechSegments: [
      { text: "Instrucción en español que no debe leerse", language: "es", locale: "es-CL" },
      { text: "Bonjour", language: "fr", locale: "fr-FR" }
    ],
    nextAction: "answer"
  };
}

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.__spoken = [];
    const synth = {
      getVoices: () => [{ name:"Brazilian Portuguese",lang:"pt-BR" },{ name:"English",lang:"en-US" },{ name:"Spanish",lang:"es-CL" }],
      speak: utterance => { window.__spoken.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice?.name }); synth.speaking = true; const finish = () => { if (synth.paused) { setTimeout(finish, 25); return; } synth.speaking = false; utterance.onend?.(); }; setTimeout(finish, 500); },
      cancel: () => { synth.speaking = false; },
      pause: () => { synth.paused = true; },
      resume: () => { synth.paused = false; },
      paused: false,
      speaking: false
    };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: synth });
    window.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; this.lang = ""; this.voice = null; }
    };
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  assert.deepEqual(pageErrors, [], "the app should initialize without uncaught browser errors");
  assert.equal(await page.locator("#welcome-screen").isVisible(), true, "fresh users should see welcome");
  await page.locator("#welcome-start").click();
  assert.equal(await page.locator("#welcome-screen").isVisible(), true, "welcome must remain until the user presses Start");
  assert.equal(await page.locator("#language-picker").isVisible(), true, "Start should open language selection for a new user");
  await page.locator('[data-language="Portugués brasileño"]').click();
  await page.locator("#screen-route").waitFor({ state: "visible" });
  assert.equal(await page.locator("#open-language-picker").count(),0,"the active app must not expose a language-switch control");
  assert.equal(await page.locator("#selected-language-flag").count(),0,"the active app must not expose a language picker badge");
  assert.equal(await page.locator("#language-mosaic [data-language='other']").count(),0,"custom generative language entry must be removed");
  assert.equal(await page.locator("#route-unit-list [data-route-unit]").count(), 4, "Portuguese route should show four topic-based units");
  assert.equal(await page.locator('[data-route-unit="travel"]').isDisabled(), true, "unit 2 should remain locked until unit 1 reaches its minimum score");
  assert.equal(await page.locator('[data-route-unit="food"]').isDisabled(), true, "unit 3 should remain locked at the start");
  await page.evaluate(() => localStorage.setItem("adaptive-language-tutor.route-units:pt-BR",JSON.stringify({
    completedUnits:{
      foundations:{completed:true,stars:3,accuracy:60},
      travel:{completed:true,stars:4,accuracy:80}
    }
  })));
  await page.reload({ waitUntil:"networkidle" });
  await page.locator("#welcome-start").click();
  assert.equal(await page.locator('[data-route-unit="travel"]').isDisabled(), false, "unit 2 should unlock after unit 1 reaches three stars");
  assert.equal(await page.locator('[data-route-unit="food"]').isDisabled(), true, "unit 3 must require five stars in unit 2");
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("adaptive-language-tutor.route-units:pt-BR"));
    state.completedUnits.travel.stars = 5;
    state.completedUnits.travel.accuracy = 100;
    localStorage.setItem("adaptive-language-tutor.route-units:pt-BR",JSON.stringify(state));
  });
  await page.reload({ waitUntil:"networkidle" });
  await page.locator("#welcome-start").click();
  assert.equal(await page.locator('[data-route-unit="food"]').isDisabled(), false, "unit 3 should unlock only after unit 2 reaches five stars");
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("adaptive-language-tutor.route-units:pt-BR"));
    state.completedUnits.food = {completed:true,stars:1,accuracy:33};
    localStorage.setItem("adaptive-language-tutor.route-units:pt-BR",JSON.stringify(state));
  });
  await page.reload({ waitUntil:"networkidle" });
  await page.locator("#welcome-start").click();
  assert.equal(await page.locator('[data-route-unit="work"]').isDisabled(), true, "unit 4 should remain locked below three stars in unit 3");
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("adaptive-language-tutor.route-units:pt-BR"));
    state.completedUnits.food.stars = 3;
    state.completedUnits.food.accuracy = 67;
    localStorage.setItem("adaptive-language-tutor.route-units:pt-BR",JSON.stringify(state));
  });
  await page.reload({ waitUntil:"networkidle" });
  await page.locator("#welcome-start").click();
  assert.equal(await page.locator('[data-route-unit="work"]').isDisabled(), false, "unit 4 should unlock at three stars in unit 3");
  await page.locator('[data-route-unit="foundations"]').click();
  assert.match(await page.locator("#route-start").innerText(), /Repetir unidad/i, "a completed unlocked unit should offer repetition");
  await page.locator("#route-start").click();
  assert.equal(await page.locator("#lesson-panel").isVisible(), true, "a completed unit should be startable again");
  await page.locator("#session-close").click();
  await page.locator("#route-reset").click();
  assert.equal(await page.locator("#route-reset-confirm").isVisible(), true, "route reset must request confirmation");
  await page.locator("#cancel-route-reset").click();
  assert.equal(await page.locator('[data-route-unit="food"]').isDisabled(), false, "cancel should preserve route progress");
  await page.locator("#route-reset").click();
  await page.locator("#confirm-route-reset").click();
  assert.equal(await page.locator('[data-route-unit="travel"]').isDisabled(), true, "confirming reset should relock later units");

  // The target language is selected once during onboarding; no in-app switch or custom-language entry remains.
  assert.equal(await page.locator("#open-language-picker").count(),0,"the active navigation must not expose a language picker");
  assert.equal(await page.locator(".language-mosaic [data-language='other']").count(),0,"custom language generation must not be exposed");
  assert.equal(await page.locator("#custom-language-name").count(),0,"there must be no free-text language field");
  assert.equal(await page.locator('[data-mode="reading"]').evaluate(node => node.classList.contains("hidden")),false,"Portuguese reading content should enable the reading mode");

  // Theory categories open a large list; each topic opens its own full-screen slide.
  await page.locator('[data-screen="theory"]').click();
  await page.locator('[data-theory="grammar"]').click();
  assert.equal(await page.locator("#theory-topic-list").isVisible(), true);
  const topicRows = page.locator("#theory-list-items [data-theory-topic]");
  assert.ok(await topicRows.count() >= 5);
  await topicRows.first().click();
  assert.equal(await page.locator("#theory-detail").isVisible(), true);
  assert.equal(await page.locator("#theory-title").innerText(), "Pronombres personales");
  assert.match(await page.locator("#theory-description").innerText(), /eu\s*▶\s*yo[\s\S]*você/i);
  assert.ok(await page.locator("#theory-description .theory-pronoun-table tbody tr").count() >= 5, "pronouns should be shown in a bilingual table");
  assert.ok(await page.locator("#theory-description [data-speak]").count() >= 5, "each pronoun should have pronunciation audio");
  assert.equal(await page.locator("#theory-back").getAttribute("class").then(value => value.includes("back-control")),true,"theory detail should use the shared top-left back control");
  assert.equal(await page.evaluate(() => window.__spoken.some(item => item.text === "eu" && item.lang === "pt-BR")),true,"opening a theory topic should automatically pronounce target-language content");
  const theorySpeechCount = await page.evaluate(() => window.__spoken.length);
  await page.locator("#theory-description [data-speak]").first().click();
  assert.equal(await page.evaluate(() => window.__spoken.length),theorySpeechCount + 1,"target-language theory text should also play on manual request");
  await page.locator("#theory-next").click();
  assert.equal(await page.locator("#theory-title").innerText(), "Artículos");
  assert.equal(await page.locator("#theory-description").evaluate(root => {
    const table = root.querySelector(".theory-pronoun-table"), example = root.querySelector(".theory-example");
    return Boolean(table && example && (table.compareDocumentPosition(example) & Node.DOCUMENT_POSITION_FOLLOWING));
  }), true, "article examples should follow the comparison table");
  assert.ok(await page.locator("#theory-description .theory-rule-list li").count() >= 2, "article rules should be split into readable points");
  await page.locator("#theory-next").click();
  assert.match(await page.locator("#theory-description").innerText(), /Eu sou|SER|ESTAR/i, "verb theory should include applied conjugation");
  assert.equal(await page.locator("#theory-description .theory-note").count(),2,"verb rules and exceptions should use separate sections");
  assert.ok(await page.locator("#theory-description .theory-rule-list li").count() >= 3,"verb rules and exceptions should be listed one point per line");
  await page.locator("#theory-next").click();
  assert.equal(await page.locator("#theory-title").innerText(), "Tiempo presente");
  assert.ok(await page.locator("#theory-description .theory-pronoun-table tbody tr").count() >= 4, "present tense should show conjugated forms");
  await page.locator("#theory-next").click();
  assert.equal(await page.locator("#theory-title").innerText(), "Pasado");
  assert.equal(await page.locator("#theory-description").evaluate(root => {
    const table = root.querySelector(".theory-pronoun-table"), example = root.querySelector(".theory-example");
    return Boolean(table && example && (table.compareDocumentPosition(example) & Node.DOCUMENT_POSITION_FOLLOWING));
  }), true, "past examples should follow the conjugation table");
  assert.equal(await page.locator("#theory-description .theory-note").count(), 1, "the regular rule text should remain separate from conjugated irregular-form tables");
  assert.ok(await page.locator("#theory-description .theory-rule-list li").count() >= 1, "the rule should remain a readable point");
  assert.match(await page.locator("#theory-description").innerText(), /Ayer/i, "past tense should include an applied example");
  assert.ok(await page.locator("#theory-description .theory-table-block").count() >= 3, "past should show regular endings, a conjugation example and irregular verb tables");
  assert.deepEqual(await page.locator("#theory-description .theory-table-block").first().locator("thead th").evaluateAll(nodes => nodes.map(node => node.textContent.trim())), ["","-AR · falar","-ER · comer","-IR · partir"], "regular endings should compare -AR, -ER and -IR side by side");
  assert.ok(await page.locator("#theory-description .theory-table-block").nth(1).locator("tbody tr").count() >= 6, "past example conjugation should include each subject pronoun");
  assert.ok(await page.locator("#theory-description .theory-table-block").nth(2).locator("tbody tr").count() >= 6, "irregular verbs should be conjugated for every pronoun");
  assert.deepEqual(await page.locator("#theory-description .theory-example-table thead th").evaluateAll(nodes => nodes.map(node => node.textContent.trim())), ["Pronombre","Ejemplo aplicado"]);
  assert.ok(await page.locator("#theory-description .theory-example-table .theory-translation").count() >= 3, "translations should appear below examples in parentheses");
  assert.match(await page.locator("#theory-description").innerText(), /fui|tive|fiz|disse/i, "Portuguese past must explain irregular verbs");
  assert.equal(await page.locator("#theory-description .theory-exceptions").count(),0,"past irregulars should be shown in conjugation tables rather than duplicated as prose");
  assert.doesNotMatch(await page.locator("#theory-description").innerText(), /En futuro simple|direi|farei/i, "past theory must not contain future exceptions");
  await page.locator("#theory-next").click();
  assert.equal(await page.locator("#theory-title").innerText(), "Futuro");
  assert.match(await page.locator("#theory-description").innerText(), /Mañana/i, "future tense should include an applied example");
  assert.ok(await page.locator("#theory-description .theory-pronoun-table tbody tr").count() >= 6, "Portuguese future must conjugate for each subject pronoun");
  assert.match(await page.locator("#theory-description").innerText(), /vou falar|vai falar|vão falar/i, "Portuguese future must show the common ir + infinitive construction");
  assert.deepEqual(await page.locator("#theory-description .theory-pronoun-table").first().locator("thead th").evaluateAll(nodes => nodes.map(node => node.textContent.trim())), ["Pronombre","Forma verbal"], "future conjugation table should only show pronoun and verb form");
  const futureIrregularBlock = page.locator("#theory-description .theory-table-block").filter({hasText:"Excepciones del futuro simple"});
  assert.equal(await futureIrregularBlock.locator("tbody tr").count(),6,"future irregular verbs should be conjugated for every pronoun");
  assert.deepEqual(await futureIrregularBlock.locator("thead th").evaluateAll(nodes => nodes.map(node => node.textContent.trim())),["Pronombre","dizer","fazer","trazer","pôr","ter","vir","ser"]);
  const futureIrregularRows = await futureIrregularBlock.locator("tbody tr").allInnerTexts();
  assert.ok(futureIrregularRows[0].includes("direi") && futureIrregularRows[1].includes("dirás") && futureIrregularRows[2].includes("dirá") && futureIrregularRows[3].includes("diremos"),"future irregular forms should be shown across singular and plural subjects");
  assert.doesNotMatch(await page.locator("#theory-description").innerText(), /pretérito perfeito|fui, estar|ter → tive/i, "future theory must not contain past exceptions");
  assert.deepEqual(await page.locator("#theory-description .theory-pronoun-table").last().locator("thead th").evaluateAll(nodes => nodes.map(node => node.textContent.trim())), ["Pronombre","Forma verbal"], "future simple table must use the same headings");
  await page.locator("#theory-back").click();
  await page.locator("#theory-list-back").click();
  await page.locator('[data-theory="vocabulary"]').click();
  const vocabularyRows = page.locator("#theory-list-items [data-theory-topic]");
  await vocabularyRows.nth(2).click();
  const timeTheory = await page.locator("#theory-description").innerText();
  assert.match(timeTheory,/Días de la semana[\s\S]*segunda-feira[\s\S]*Meses del año[\s\S]*janeiro[\s\S]*Estaciones[\s\S]*Partes del día/i,"time vocabulary should include complete grouped calendar vocabulary");
  await page.locator("#theory-back").click();
  await vocabularyRows.nth(5).click();
  const numberTheory = await page.locator("#theory-description").innerText();
  assert.match(numberTheory,/Números cardinales[\s\S]*vinte[\s\S]*Números ordinales[\s\S]*primeiro/i,"number vocabulary should cover cardinal and ordinal forms");
  await page.locator("#theory-back").click();
  // Switching away and back resets Theory to its category start.
  await page.locator('[data-screen="exercises"]').click();
  await page.locator('[data-screen="theory"]').click();
  assert.equal(await page.locator("#theory-grid").isVisible(), true, "Theory navigation should return to categories");
  await page.locator('[data-screen="exercises"]').click();
  assert.equal(await page.locator("#screen-exercises h1").innerText(),"Entrenamiento","the visible section name should be Entrenamiento");
  assert.equal(await page.locator("#exercise-choice-panel").isVisible(), true, "Training navigation should return to its setup screen");
  await page.locator('[data-mode="review"]').click();
  assert.equal(await page.locator("#setup-form > label:visible").count(), 0, "review should hide practice-only level, duration and topic selectors");
  assert.equal(await page.locator("#review-exercises").isVisible(), true, "review should start immediately without a separate start button");
  await page.locator('[data-screen="theory"]').click();
  await page.locator('[data-screen="exercises"]').click();
  assert.equal(await page.locator('[data-mode="practice"]').getAttribute("class").then(value => value.includes("selected")), true, "Exercises should reset to Practice mode");
  assert.equal(await page.locator("#topic").isDisabled(), false, "the topic selector should be enabled again");
  await page.locator("#practice-toggle").click();
  assert.equal(await page.locator("#setup-panel").isVisible(), true, "the Exercise banner should expand its configuration");

  // Local exercise: first three questions are alternatives, then answers are written.
  await page.locator('[data-screen="exercises"]').click();
  await page.locator("#practice-toggle").click();
  await page.locator("#start-session").waitFor({ state: "visible" });
  await page.locator("#start-session").waitFor({ state: "attached" });
  await page.locator("#duration").selectOption("5");
  await page.locator("#start-session").click();
  assert.equal(await page.locator("#session-status").innerText(), "Práctica local", "available local content should avoid a live AI round trip");
  assert.equal(await page.locator("#lesson-content .exercise-instruction").innerText(), "Escucha la frase en portugués y elige su significado en español.");
  assert.ok(await page.evaluate(() => window.__spoken.some(item => item.text.startsWith("Escucha la frase") && item.lang === "es-CL")), "exercise instructions should be spoken in Spanish");
  assert.ok(await page.evaluate(() => window.__spoken.some(item => item.text === "Bom dia" && item.lang === "pt-BR")), "the target phrase should be spoken in Portuguese");
  assert.equal(await page.locator("#lesson-content [data-speak]").evaluateAll(nodes => nodes.every(node => node.dataset.locale === "pt-BR")), true, "manual play controls should only be offered for target-language speech");
  assert.ok((await page.locator("#lesson-content .activity-phase").innerText()).length > 0, "the evaluated topic/phase should appear after the illustration");
  assert.equal((await page.locator("#turn-count").innerText()).trim(),"1 / 5","the shared header should show the current question count");
  assert.ok((await page.locator(".activity-progress #progress-bar").evaluate(node => parseFloat(node.style.width))) > 0,"activity progress should reflect the current question counter");
  assert.equal(await page.locator(".activity-header #session-mode-label").innerText(),"Entrenamiento","the activity section title should remain at the left of the header");
  assert.ok((await page.locator("#lesson-content .exercise-illustration small").innerText()).length > 0, "topic caption should remain below the illustration icon");
  assert.equal(await page.locator("#lesson-content > .eyebrow").count(), 0, "duplicate topic/level heading below the icon should be removed");
  assert.equal(await page.locator("#review-btn").count(), 0, "the obsolete Repasar error action should not be rendered");
  assert.equal(await page.locator("#lesson-content h3").innerText(), "Bom dia", "target-language phrase should be separate from the source-language instruction");
  assert.equal(await page.locator("#lesson-content .target-word-link").count(), 0, "exercise words should no longer open translation popups");
  assert.ok(await page.evaluate(() => window.__spoken.some(item => item.text === "Bom dia" && item.lang === "pt-BR")), "audio should speak the complete target-language phrase");
  const initialSpeechLocales = await page.locator("#lesson-content [data-speak]").evaluateAll(nodes => nodes.map(node => node.dataset.locale));
  assert.ok(initialSpeechLocales.length > 0 && initialSpeechLocales.every(locale => locale === "pt-BR"), "manual playback controls should be reserved for target-language fragments");
  assert.ok(await page.evaluate(() => window.__spoken.some(item => item.text.startsWith("Escucha la frase") && item.lang === "es-CL")), "source instructions should use their own Spanish voice");
  for (let turn = 0; turn < 3; turn += 1) {
    assert.equal(await page.locator("#answer-area [data-choice]").count(), 3, "first three questions should have three choices");
    const questionBefore = await page.locator("#lesson-content h3").innerText();
    await page.locator("#answer-area [data-choice]").last().evaluate(button => button.click());
    assert.equal(await page.locator("#feedback .answer-status.incorrect").isVisible(), true, "incorrect feedback should appear at the end of the current question");
    assert.equal(await page.locator("#lesson-content h3").innerText(), questionBefore, "the current question must remain until Continue");
    assert.equal(await page.locator("#answer-area .answer-incorrect").count(), 1, "the selected wrong answer should be red");
    assert.equal(await page.locator("#answer-area .answer-correct").count(), 1, "the correct alternative should be green");
    assert.equal(await page.locator("#answer-area #continue-answer").isVisible(), true, "learner must explicitly continue");
    assert.equal(await page.locator("#feedback .answer-explanation").isVisible(), true, "only incorrect answers should show explanatory feedback");
    await page.locator("#answer-area #continue-answer").click();
    if (turn === 0) {
      await page.waitForFunction(() => window.__spoken.some(item => item.text.includes("Eu") && item.text.includes("chileno") && item.lang === "pt-BR"));
      assert.ok(await page.evaluate(() => window.__spoken.some(item => item.text.includes("Eu") && item.text.includes("chileno") && item.lang === "pt-BR")), "a recall blank should be spoken as a complete phrase with a pause");
    }
  }
  assert.equal(await page.locator("#answer-area #free-answer").isVisible(), true, "fourth question should require written input");
  await page.locator("#hint-btn").click();
  assert.match(await page.locator("#feedback").innerText(), /Pista:/);
  assert.equal(await page.locator("#hint-btn").innerText(), "Ver respuesta");
  await page.locator("#hint-btn").click();
  assert.match(await page.locator("#feedback").innerText(), /Respuesta:/);
  assert.equal(await page.locator("#hint-btn").isHidden(), true, "written answers should offer one hint followed by the answer");
  for (let turn = 3; turn < 5; turn += 1) {
    if (turn === 4) assert.match(await page.locator("#lesson-content").innerText(),/Traduce al portugués esta frase concreta: «Ayer fui al mercado»/,"the final training question should request one specific translation");
    await page.locator("#free-answer").fill("Bonjour");
    await page.locator("#submit-free").click();
    assert.equal(await page.locator("#answer-area #continue-answer").isVisible(), true, "written answers also require Continue");
    if (turn === 4) break;
    await page.locator("#answer-area #continue-answer").click();
  }
  await page.locator("#answer-area #continue-answer").click();
  await page.locator("#summary-panel").waitFor({ state: "visible" });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("adaptive-language-tutor.progress") || "{}"));
  assert.equal(saved.sessions?.length, 1, "completed exercise session should be saved");
  assert.equal(saved.sessions[0].attempted, 5);
  assert.equal(await page.locator("#summary-content h2").innerText(), "Resumen");
  assert.equal(await page.locator("#session-status").innerText(), "", "no redundant session status should appear below the summary");
  const summaryHeadings = await page.locator("#summary-content h3").allInnerTexts();
  assert.match(await page.locator("#summary-content .summary-accuracy strong").innerText(), /^\d+%$/);
  assert.ok(await page.locator("#summary-content .summary-accuracy span").innerText(), "summary should show an accuracy assessment");
  assert.match(summaryHeadings[0], /^Errores \d+\/5$/);
  assert.deepEqual(summaryHeadings.slice(1), ["Vocabulario","Temas"]);
  // Reading comprehension is a separate mode with a text passage and objective choices.
  await page.locator("#new-session").click();
  await page.locator('[data-mode="reading"]').click();
  assert.equal(await page.locator("#topic").inputValue(),"reading","reading mode should select its dedicated topic");
  assert.equal(await page.locator("#topic").isDisabled(),true,"reading topic should not be accidentally changed to a grammar topic");
  await page.locator("#start-session").click();
  assert.equal(await page.locator("#session-mode-label").innerText(),"Comprensión lectora");
  assert.equal(await page.locator("#lesson-content .reading-passage").isVisible(),true,"reading mode should show a passage before its question");
  assert.match(await page.locator("#lesson-content .reading-passage").innerText(),/João Pessoa/);
  assert.equal(await page.locator("#lesson-content #reading-tts-toggle").isVisible(),true,"the passage should expose its own TTS control");
  await page.locator("#reading-tts-toggle").click();
  assert.equal(await page.locator("#reading-tts-toggle").innerText(),"Ⅱ","passage TTS should show a pause icon while speaking");
  assert.equal(await page.locator("#reading-tts-toggle").getAttribute("aria-label"),"Pausar lectura");
  assert.equal(await page.locator("#reading-tts-progress").isVisible(),true,"the reading player should show a progress bar");
  assert.equal(await page.locator("#reading-tts-restart").isVisible(),true,"the reading player should show a restart control");
  await page.locator("#reading-tts-toggle").click();
  assert.equal(await page.locator("#reading-tts-toggle").innerText(),"▶","passage TTS should show play while paused");
  assert.equal(await page.locator("#reading-tts-toggle").getAttribute("aria-label"),"Reproducir lectura");
  await page.locator("#reading-tts-toggle").click();
  assert.equal(await page.locator("#reading-tts-toggle").innerText(),"Ⅱ","passage TTS should resume without restarting");
  assert.equal(await page.locator("#lesson-content .reading-question-type").evaluate(node => node.textContent.trim()),"Comprensión del texto");
  assert.equal(await page.locator("#answer-area [data-choice]").count(),3,"reading questions should always use objective multiple-choice answers");
  assert.equal(await page.locator("#answer-area [data-speak]").count(),0,"source-language reading options should not show target-language audio controls");
  await page.locator("#answer-area [data-choice]").first().click();
  assert.equal(await page.locator("#feedback .answer-status.correct").isVisible(),true,"the reading answer should be evaluated against its canonical answer");
  await page.locator("#answer-area #continue-answer").click();
  assert.equal(await page.locator("#lesson-content .reading-passage").isVisible(),true,"the passage should remain available across its comprehension questions");
  await page.locator("#session-close").click();
  await page.locator("#session-confirm").waitFor({state:"visible"});
  await page.locator("#confirm-session-close").click();
  // Reading never repeats a question within one session; the current unique bank has six questions.
  await page.locator('[data-mode="reading"]').click();
  await page.locator("#duration").selectOption("10");
  await page.locator("#start-session").click();
  const correctReadingChoices = [0,0,0,0,1,0];
  for (const choiceIndex of correctReadingChoices) {
    assert.equal(await page.locator("#lesson-content .reading-question-type").evaluate(node => node.textContent.trim()),"Comprensión del texto");
    assert.equal(await page.locator("#lesson-content .reading-passage").count(),1,"every reading question must retain its source passage");
    await page.locator("#answer-area [data-choice]").nth(choiceIndex).click();
    await page.locator("#answer-area #continue-answer").click();
  }
  await page.locator("#summary-panel").waitFor({state:"visible"});
  assert.equal(await page.locator("#summary-content h2").innerText(),"Resumen");
  assert.equal(await page.locator("#summary-content .summary-accuracy strong").innerText(),"100%","all six unique reading questions should be scored without inserting general practice or recycling questions");
  // The completed reading session is persisted as a full reading-only session.
  // Incomplete Exercises sessions are discarded; no partial session is persisted.
  await page.locator("#new-session").click();
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-screen="stats"]').click();
  assert.equal(await page.locator("#statistics-content .stats-language-table").isVisible(), true, "statistics should show the cross-language metrics table");
  assert.equal(await page.locator("#statistics-content .stats-horizontal-list").isVisible(), true, "global statistics should use full-width horizontal bars on mobile");
  const globalRows = page.locator("#statistics-content .stats-horizontal-row");
  assert.ok(await globalRows.count() >= 1, "each language should have its own readable row");
  assert.ok(await page.locator("#statistics-content .stats-horizontal-track").first().evaluate(node => node.getBoundingClientRect().width >= 250), "horizontal accuracy bars should use the available width on a portrait phone");
  assert.ok(await page.locator("#statistics-content .stats-horizontal-track span").evaluateAll(nodes => nodes.every(node => Number.parseFloat(node.style.width) >= 0 && Number.parseFloat(node.style.width) <= 100)), "horizontal bars should encode percentages without overflow");
  assert.equal(await page.locator("#stats-view-select option").first().innerText(), "🌐 Global");
  await page.locator("#stats-view-select").selectOption("pt-BR");
  assert.equal(await page.locator("#statistics-content .stats-language-chart").isVisible(), true, "a language view should show daily questions and accuracy");
  assert.equal(await page.locator("#statistics-content .stats-language-chart .chart-axis-title").textContent(), "Días");
  assert.equal(await page.locator("#statistics-content .stats-language-chart text.chart-axis-label").last().textContent(), "1");
  assert.equal(await page.locator("#statistics-content .stats-chart-scroll").evaluate(node => node.scrollWidth <= node.clientWidth + 1), true, "charts must fit the horizontal card margins without lateral scrolling");
  await page.locator("#stats-view-select").selectOption("global");
  const statsText = await page.locator("#statistics-content .stats-language-table").innerText();
  assert.ok(["Sesiones","Palabras","Precisión","Progreso de Ruta"].every(label => statsText.includes(label)));
  await page.locator('[data-screen="exercises"]').click();
  await page.locator("#practice-toggle").click();
  await page.locator("#duration").selectOption("10");
  await page.locator("#start-session").click();
  await page.locator("#session-close").click();
  await page.locator("#session-confirm").waitFor({ state: "visible" });
  await page.locator("#confirm-session-close").click();
  const afterDiscard = await page.evaluate(() => JSON.parse(localStorage.getItem("adaptive-language-tutor.progress") || "{}"));
  assert.equal(afterDiscard.sessions?.length, 2, "discarded exercise must not create a saved session");

  // Route partial progress survives leaving and reloading, unlike Exercises.
  await page.locator('[data-screen="route"]').click();
  await page.locator("#route-start").click();
  assert.equal(await page.locator("#lesson-content .exercise-illustration").count(),1,"every activity must show its topic icon");
  assert.equal(await page.locator("#lesson-content").locator(":scope > :first-child").getAttribute("class"),"exercise-illustration","the topic icon must follow the question counter directly");
  assert.equal((await page.locator("#turn-count").innerText()).trim(),"1 / 6");
  await page.locator("#answer-area [data-choice]").last().click();
  await page.locator("#answer-area #continue-answer").click();
  await page.locator("#answer-area [data-choice]").first().evaluate(button => button.click());
  await page.locator("#answer-area #continue-answer").waitFor({ state: "visible" });
  await page.locator("#session-close").click();
  const draft = await page.evaluate(() => JSON.parse(localStorage.getItem("adaptive-language-tutor.route-progress:pt-BR") || "null"));
  assert.equal(draft.session.turn, 2, "Route must save confirmed answers immediately");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator("#welcome-screen").isVisible(), true, "returning users must also explicitly press Start");
  await page.locator("#welcome-start").click();
  assert.equal(await page.locator("#welcome-screen").isVisible(), false, "Start should reveal the saved app");
  assert.equal(await page.locator("#route-resume").isVisible(), false, "Route should use a single resume banner");
  assert.match(await page.locator("#route-start").innerText(), /Continuar unidad/i, "the start banner should resume the active unit");
  await page.locator("#route-start").click();
  assert.match(await page.locator("#turn-count").innerText(), /2 \/ \d+/);
  assert.equal(await page.locator("#answer-area #continue-answer").isVisible(), true, "Route should restore the pending feedback and Continue action");
  assert.deepEqual(pageErrors, [], "browser should not report uncaught page errors");

  // AI session contract: the first three questions use alternatives; the fourth uses text input.
  const aiContext = await browser.newContext();
  await aiContext.addInitScript(() => {
    window.__spoken = [];
    const synth = {
      getVoices: () => [{ name:"Brazilian Portuguese",lang:"pt-BR" },{ name:"Spanish",lang:"es-CL" },{ name:"French",lang:"fr-FR" }],
      speak: utterance => window.__spoken.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice?.name }),
      cancel: () => {}
    };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: synth });
    window.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; this.lang = ""; this.voice = null; }
    };
  });
  const aiPage = await aiContext.newPage();
  const aiErrors = [];
  aiPage.on("pageerror", error => aiErrors.push(error.message));
  await aiPage.route("**/api/health", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ status: "ok", ai: { configured: true, provider: "e2e-mock" } })
  }));
  await aiPage.route("**/api/tutor", async route => {
    const input = route.request().postDataJSON();
    if (input.task === "start_lesson") {
      assert.equal(input.learner.targetLanguageLocale, "fr-FR");
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(tutorTurn({ start:true })) });
    }
    if (input.task === "evaluate_and_continue") {
      const turn = input.session.turn;
      if (turn === 4) await delay(350);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(tutorTurn({ turn })) });
    }
    if (input.task === "translate_word") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        message:"hola", exercise:null, evaluation:null, learnerUpdate:null, speechSegments:[], nextAction:"continue"
      }) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      message: "Pista.", exercise: { type:"grammar", prompt:"Pregunta", expectedAnswer:"Oui", acceptedAnswers:["Oui"], options:[], hint:"Piensa." },
      evaluation:null, learnerUpdate:null, speechSegments:[], nextAction:"answer"
    }) });
  });
  await aiPage.goto(baseUrl, { waitUntil: "networkidle" });
  await aiPage.locator("#welcome-start").click();
  await aiPage.locator('[data-language="Francés"]').click();
  await aiPage.locator('[data-screen="route"]').click();
  await aiPage.locator("#route-start").click();
  await aiPage.locator("#answer-area [data-ai-choice]").first().waitFor();
  assert.equal(await aiPage.locator("#lesson-content .exercise-instruction").innerText(), "Elige la respuesta correcta.");
  assert.equal(await aiPage.locator("#lesson-content h3").innerText(), "Choisissez la bonne forme.");
  assert.equal(await aiPage.locator("#lesson-content .target-word-link").count(), 0, "AI exercise text should not open word translations");
  await aiPage.waitForFunction(() => window.__spoken.some(item => item.text === "Bonjour" && item.lang === "fr-FR"));
  assert.equal(await aiPage.evaluate(() => window.__spoken.some(item => item.text.includes("Instrucción en español") && item.lang === "es-CL")), true,
    "AI source instructions should use the Spanish voice");
  assert.equal(await aiPage.evaluate(() => window.__spoken.some(item => item.text === "Bonjour" && item.lang === "fr-FR")), true,
    "AI target content should use the target-language voice");
  assert.ok(await aiPage.locator("#lesson-content [data-speak][data-locale='fr-FR']").count() > 0,"target-language AI text should expose manual pronunciation");
  const aiSpeechCount = await aiPage.evaluate(() => window.__spoken.length);
  await aiPage.locator("#lesson-content [data-speak][data-locale='fr-FR']").first().click();
  assert.equal(await aiPage.evaluate(() => window.__spoken.length),aiSpeechCount + 1,"manual target-language playback should trigger the selected locale");
  await aiPage.locator("#answer-area [data-ai-choice]").first().evaluate(button => button.click());
  await aiPage.locator("#feedback .answer-status.correct").waitFor({ state: "visible" });
  await aiPage.locator("#answer-area #continue-answer").waitFor({ state: "visible" });
  await aiPage.locator("#session-close").click();
  assert.equal(await aiPage.locator("#route-resume").isVisible(), false, "AI-backed Route must use the same single banner");
  assert.match(await aiPage.locator("#route-start").innerText(), /Continuar unidad/i);
  await aiPage.locator('[data-screen="exercises"]').click();
  await aiPage.locator("#practice-toggle").click();
  await aiPage.locator("#start-session").waitFor({ state: "visible" });
  await aiPage.locator("#start-session").click();
  await aiPage.locator("#answer-area [data-ai-choice]").first().waitFor();
  for (let turn = 0; turn < 3; turn += 1) {
    assert.equal(await aiPage.locator("#answer-area [data-ai-choice]").count(), 3);
    await aiPage.locator("#answer-area [data-ai-choice]").first().evaluate(button => button.click());
    await aiPage.locator("#feedback .answer-status.correct").waitFor({ state: "visible" });
    await aiPage.locator("#answer-area #continue-answer").waitFor({ state: "visible" });
    assert.doesNotMatch(await aiPage.locator("#lesson-content").innerText(), /Pronunciación|Vocabulario/i, "answer-revealing labels should not be displayed");
    await aiPage.locator("#answer-area #continue-answer").click();
  }
  await aiPage.locator("#ai-answer").waitFor({ state: "visible" });
  assert.equal(await aiPage.locator("#ai-answer").isVisible(), true, "AI should switch to written answers after three questions");
  await aiPage.locator("#ai-answer").fill("Bom dia");
  await aiPage.locator("#submit-ai-answer").click();
  await aiPage.locator("#feedback .answer-status.incorrect").waitFor({ state: "visible" });
  assert.equal(await aiPage.locator("#feedback .answer-status.correct").count(), 0, "a semantically incorrect answer must not be accepted just because the model labels it correct");
  assert.equal(await aiPage.locator("#submit-ai-answer").count(), 0, "written-answer submit button should disappear after sending");
  assert.equal(await aiPage.locator("#continue-answer").isVisible(), true, "Continue should appear immediately while the next turn is being prepared");
  assert.equal(await aiPage.locator("#continue-answer").isEnabled(), true, "Continue should be clickable while the next turn is loading");
  await aiPage.locator("#continue-answer").click();
  assert.equal(await aiPage.locator("#continue-answer").isDisabled(), true, "an early Continue tap should queue safely while the tutor responds");
  await aiPage.waitForFunction(() => document.querySelector("#turn-count")?.textContent.includes("5 / 10"));
  assert.doesNotMatch(await aiPage.locator("#lesson-content .exercise-instruction").innerText(), /¡Muy bien!/i, "the next question must not repeat contradictory praise after an incorrect answer");
  assert.equal(await aiPage.locator("#lesson-content .feedback-note").count(), 0, "previous-answer grey notes must not remain above the new question");
  assert.deepEqual(aiErrors, [], "AI browser flow should not report uncaught page errors");

  // Route's Portuguese integration task must give progressive, resumable clues.
  const routeContext = await browser.newContext();
  const routePage = await routeContext.newPage();
  const routeErrors = [];
  routePage.on("pageerror", error => routeErrors.push(error.message));
  await routePage.goto(baseUrl, { waitUntil: "networkidle" });
  await routePage.locator("#welcome-start").click();
  await routePage.locator('[data-language="Portugués brasileño"]').click();
  await routePage.evaluate(() => {
    const session = {
      config: { language:"Portugués", languageId:"pt-BR", languageLocale:"pt-BR", duration:6, questionCount:6, topic:"daily", level:"zero", routeMode:true, routeUnitId:"foundations" },
      turn:6, correct:6, attempted:6, streak:0, bestStreak:0, consecutiveCorrect:0, consecutiveErrors:0,
      errors:[], errorsToReview:[], vocabulary:[], reviewQueue:[], answers:Array.from({length:6},(_,i)=>({exerciseId:"seed-"+i,correct:true,status:"correct"}))
    };
    localStorage.setItem("adaptive-language-tutor.route-progress:pt-BR",JSON.stringify({
      languageId:"pt-BR",unitId:"foundations",questionCount:6,session,integration:true,integrationAttempts:0,routeIntegrationHintLevel:0,
      pendingFeedback:null,localPendingAnswer:null,aiPendingTurn:null,aiMode:false,aiHistory:[],
      aiLastResult:null,aiCurrentExercise:null,aiPendingFeedback:null
    }));
  });
  await routePage.reload({ waitUntil: "networkidle" });
  await routePage.locator("#welcome-start").click();
  await routePage.locator("#route-start").click();
  assert.equal((await routePage.locator("#turn-count").innerText()).trim(),"7 / 7","the Route integration must be included in the activity counter");
  assert.match(await routePage.locator("#lesson-content .activity-phase").innerText(),/CAPÍTULO 2 · ACTIVIDAD INTEGRADORA/);
  assert.equal(await routePage.locator("#session-close").innerText(),"←","active sessions should use the shared top-left back arrow");
  assert.match(await routePage.locator("#lesson-content h3").innerText(), /Traduce al portugués esta frase concreta: «Mañana estudio en casa»/i, "the route milestone should request one specific translation");
  await routePage.locator("#route-integration-answer").fill("ola");
  await routePage.locator("#route-integration-submit").click();
  assert.match(await routePage.locator("#feedback").innerText(), /Pista:/);
  await routePage.reload({ waitUntil: "networkidle" });
  await routePage.locator("#welcome-start").click();
  await routePage.locator("#route-start").click();
  assert.equal(await routePage.locator("#hint-btn").innerText(), "Ver respuesta", "the second help step should persist after reload");
  await routePage.locator("#hint-btn").click();
  assert.match(await routePage.locator("#feedback").innerText(), /Respuesta:/, "Route should restore the two-step hint sequence");
  await routePage.locator("#route-integration-answer").fill("Amanhã estudo em casa.");
  await routePage.locator("#route-integration-submit").click();
  await routePage.locator("#summary-panel").waitFor({state:"visible"});
  assert.equal(await routePage.locator("#summary-content .summary-route-stars").innerText(),"★★★★★","Route summary should show stars instead of an achievement percentage");
  assert.equal(await routePage.locator("#summary-content .route-result-feedback").innerText(),"Perfecto","Route summary should show qualitative achievement feedback");
  assert.equal(await routePage.locator("#summary-content .route-result").isVisible(),true,"Route should always display its achievement level alongside stars");
  assert.equal(await routePage.locator("#summary-content h3").count(),0,"Route summary should omit the reinforcement subtitle when there is nothing to review");
  assert.equal(await routePage.locator("#summary-content .route-reinforcement").count(),0,"an empty reinforcement section should not be rendered");
  assert.equal(await routePage.locator("#route-summary-next").isVisible(),true,"Route summary must provide a continuation action");
  assert.match(await routePage.locator("#route-summary-next").innerText(),/Continuar: Viajes y orientación/,"the next unlocked unit should be named in the continuation action");
  assert.equal(await routePage.locator('[data-route-unit="travel"]').isDisabled(),false,"a perfect completed first unit must unlock the next unit");
  await routePage.locator("#route-summary-next").click();
  assert.equal(await routePage.locator("#session-view").isVisible(),true,"continuation should start the next unit instead of stopping at the summary");
  assert.equal(await routePage.locator("#lesson-panel").getAttribute("data-route-unit"),"travel","the continuation must load the actual next unit, not just reopen the previous session");
  assert.equal(await routePage.locator("#session-mode-label").innerText(),"Entrenamiento");
  assert.equal(await routePage.locator('#route-unit-list [data-route-unit="travel"]').evaluate(node => node.classList.contains("selected")),true,"continuation should select the next unlocked Route unit");
  assert.deepEqual(routeErrors, [], "Portuguese Route integration should not report browser errors");

  const chapterContext = await browser.newContext();
  const chapterPage = await chapterContext.newPage();
  await chapterPage.goto(baseUrl,{waitUntil:"networkidle"});
  await chapterPage.locator("#welcome-start").click();
  await chapterPage.locator('[data-language="Portugués brasileño"]').click();
  await chapterPage.locator("#route-start").click();
  assert.match(await chapterPage.locator("#lesson-content .activity-phase").innerText(),/CAPÍTULO 1 · VOCABULARIO Y REGLAS/);
  assert.match(await chapterPage.locator("#lesson-content h3").innerText(),/¿Qué significa «Bom dia»\?/);
  assert.equal((await chapterPage.locator("#turn-count").innerText()).trim(),"1 / 6");
  await chapterContext.close();

  const thresholdContext = await browser.newContext();
  const thresholdPage = await thresholdContext.newPage();
  await thresholdPage.goto(baseUrl,{waitUntil:"networkidle"});
  await thresholdPage.locator("#welcome-start").click();
  await thresholdPage.locator('[data-language="Portugués brasileño"]').click();
  await thresholdPage.evaluate(() => {
    const session = {
      config:{language:"Portugués",languageId:"pt-BR",languageLocale:"pt-BR",duration:6,questionCount:6,topic:"daily",level:"zero",routeMode:true,routeUnitId:"foundations"},
      turn:6,correct:4,attempted:6,streak:0,bestStreak:0,consecutiveCorrect:0,consecutiveErrors:0,
      errors:[{exerciseId:"wrong-1",submitted:"x",expected:"y"},{exerciseId:"wrong-2",submitted:"x",expected:"y"}],
      errorsToReview:[],vocabulary:[],reviewQueue:[],answers:Array.from({length:6},(_,i)=>({exerciseId:"seed-"+i,correct:i<4,status:i<4?"correct":"incorrect"}))
    };
    localStorage.setItem("adaptive-language-tutor.route-progress:pt-BR",JSON.stringify({
      languageId:"pt-BR",unitId:"foundations",questionCount:6,session,integration:true,integrationAttempts:0,routeIntegrationHintLevel:0,
      pendingFeedback:null,localPendingAnswer:null,aiPendingTurn:null,aiMode:false,aiHistory:[],
      aiLastResult:null,aiCurrentExercise:null,aiPendingFeedback:null
    }));
  });
  await thresholdPage.reload({waitUntil:"networkidle"});
  await thresholdPage.locator("#welcome-start").click();
  await thresholdPage.locator("#route-start").click();
  await thresholdPage.locator("#route-integration-answer").fill("Amanhã estudo em casa.");
  await thresholdPage.locator("#route-integration-submit").click();
  await thresholdPage.locator("#summary-panel").waitFor({state:"visible"});
  assert.equal(await thresholdPage.locator("#summary-content .summary-route-stars").innerText(),"★★★☆☆");
  assert.equal(await thresholdPage.locator('[data-route-unit="travel"]').isDisabled(),false,"three earned stars should unlock the next unit at the threshold");
  assert.match(await thresholdPage.locator("#route-summary-next").innerText(),/Continuar: Viajes y orientación/);
  await thresholdContext.close();

  const lastRouteContext = await browser.newContext();
  const lastRoutePage = await lastRouteContext.newPage();
  await lastRoutePage.goto(baseUrl, { waitUntil:"networkidle" });
  await lastRoutePage.locator("#welcome-start").click();
  await lastRoutePage.locator('[data-language="Portugués brasileño"]').click();
  await lastRoutePage.evaluate(() => {
    const completedUnits = Object.fromEntries(["foundations","travel","food","work"].map(id => [id,{completed:true,stars:5,accuracy:100,correct:6,attempted:6}]));
    const session = {
      config:{language:"Portugués",languageId:"pt-BR",languageLocale:"pt-BR",duration:6,questionCount:6,topic:"work",level:"zero",routeMode:true,routeUnitId:"work"},
      turn:6,correct:6,attempted:6,streak:0,bestStreak:0,consecutiveCorrect:0,consecutiveErrors:0,
      errors:[],errorsToReview:[],vocabulary:[],reviewQueue:[],answers:Array.from({length:6},(_,i)=>({exerciseId:"work-"+i,correct:true,status:"correct"}))
    };
    localStorage.setItem("adaptive-language-tutor.route-units:pt-BR",JSON.stringify({completedUnits}));
    localStorage.setItem("adaptive-language-tutor.route-progress:pt-BR",JSON.stringify({
      languageId:"pt-BR",unitId:"work",questionCount:6,session,integration:true,integrationAttempts:0,routeIntegrationHintLevel:0,
      pendingFeedback:null,localPendingAnswer:null,aiPendingTurn:null,aiMode:false,aiHistory:[],aiLastResult:null,aiCurrentExercise:null,aiPendingFeedback:null
    }));
  });
  await lastRoutePage.reload({waitUntil:"networkidle"});
  await lastRoutePage.locator("#welcome-start").click();
  await lastRoutePage.locator("#route-start").click();
  await lastRoutePage.locator("#route-integration-answer").fill("Trabalho em um escritório.");
  await lastRoutePage.locator("#route-integration-submit").click();
  await lastRoutePage.locator("#summary-panel").waitFor({state:"visible"});
  assert.equal(await lastRoutePage.locator("#route-summary-next").innerText(),"Volver a Ruta","the final unit should offer a return to the map, not a replay");
  await lastRoutePage.locator("#route-summary-next").click();
  assert.equal(await lastRoutePage.locator("#screen-route").isVisible(),true,"the final unit action should return to the Route map");
  assert.equal(await lastRoutePage.locator("#session-view").isVisible(),false,"the final unit should not reopen itself when the user selects return to Route");
  await lastRouteContext.close();
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
