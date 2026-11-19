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
      getVoices: () => [{ name: "Brazilian Portuguese", lang: "pt-BR" }, { name: "English", lang: "en-US" }],
      speak: utterance => window.__spoken.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice?.name }),
      cancel: () => {}
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
  assert.equal(await page.locator("#selected-language-flag").innerText(), "🇧🇷");

  // Standard languages have flags and do not ask users to enter a locale.
  await page.locator("#open-language-picker").click();
  await page.locator('[data-language="Italiano"]').click();
  assert.equal(await page.locator("#selected-language-flag").innerText(), "🇮🇹");
  await page.locator("#open-language-picker").click();
  await page.locator('[data-language="other"]').click();
  await page.locator("#custom-language-name").fill("Suajili");
  assert.equal(await page.locator("#custom-language-locale").count(), 0, "custom languages must not request a locale");
  await page.locator("#language-apply").click();
  assert.equal(await page.locator("#selected-language-flag").innerText(), "🇰🇪", "recognized custom language should infer its flag");
  await page.locator("#open-language-picker").click();
  await page.locator('[data-language="Portugués brasileño"]').click();

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
  await page.locator("#theory-next").click();
  assert.equal(await page.locator("#theory-title").innerText(), "Artículos");
  await page.locator("#theory-next").click();
  assert.match(await page.locator("#theory-description").innerText(), /Eu sou|SER|ESTAR/i, "verb theory should include applied conjugation");
  await page.locator("#theory-next").click();
  assert.equal(await page.locator("#theory-title").innerText(), "Tiempo presente");
  assert.ok(await page.locator("#theory-description .theory-pronoun-table tbody tr").count() >= 4, "present tense should show conjugated forms");
  await page.locator("#theory-next").click();
  assert.equal(await page.locator("#theory-title").innerText(), "Pasado");
  assert.match(await page.locator("#theory-description").innerText(), /Ayer/i, "past tense should include an applied example");
  await page.locator("#theory-next").click();
  assert.equal(await page.locator("#theory-title").innerText(), "Futuro");
  assert.match(await page.locator("#theory-description").innerText(), /Mañana/i, "future tense should include an applied example");
  await page.locator("#theory-close").click();
  // Switching away and back resets Theory to its category start.
  await page.locator('[data-screen="exercises"]').click();
  await page.locator('[data-screen="theory"]').click();
  assert.equal(await page.locator("#theory-grid").isVisible(), true, "Theory navigation should return to categories");
  await page.locator('[data-screen="exercises"]').click();
  assert.equal(await page.locator("#exercise-choice-panel").isVisible(), true, "Exercises navigation should return to its setup screen");
  await page.locator('[data-mode="review"]').click();
  await page.locator('[data-screen="theory"]').click();
  await page.locator('[data-screen="exercises"]').click();
  assert.equal(await page.locator('[data-mode="global"]').getAttribute("class").then(value => value.includes("selected")), true, "Exercises should reset to Global mode");
  assert.equal(await page.locator("#topic").isDisabled(), false, "the topic selector should be enabled again");

  // Local exercise: first three questions are alternatives, then answers are written.
  await page.locator('[data-screen="exercises"]').click();
  await page.locator("#start-session").waitFor({ state: "visible" });
  await page.locator("#start-session").waitFor({ state: "attached" });
  await page.locator("#duration").selectOption("5");
  await page.locator("#start-session").click();
  assert.equal(await page.locator("#lesson-content .exercise-instruction").innerText(), "Escucha la frase en portugués y elige su significado en español.");
  assert.equal(await page.locator("#lesson-content h3").innerText(), "Bom dia", "target-language phrase should be separate from the source-language instruction");
  assert.equal(await page.locator("#lesson-content .target-word-link").count(), 0, "exercise words should no longer open translation popups");
  assert.ok(await page.evaluate(() => window.__spoken.some(item => item.text === "Bom dia" && item.lang === "pt-BR")), "audio should speak the complete target-language phrase");
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
      assert.ok(await page.evaluate(() => window.__spoken.some(item => item.text.includes("Eu") && item.text.includes("chileno") && item.lang === "pt-BR")), "a recall blank should be spoken as a complete phrase with a pause");
    }
  }
  assert.equal(await page.locator("#answer-area #free-answer").isVisible(), true, "fourth question should require written input");
  for (let turn = 3; turn < 5; turn += 1) {
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
  assert.match(summaryHeadings[0], /^Aciertos \d+\/5$/);
  assert.match(summaryHeadings[1], /^Errores \d+\/5$/);
  assert.deepEqual(summaryHeadings.slice(2), ["Vocabulario","Temas"]);
  // Incomplete Exercises sessions are discarded; no partial session is persisted.
  await page.locator("#new-session").click();
  await page.locator('[data-screen="stats"]').click();
  assert.equal(await page.locator("#statistics-content .stats-language-table").isVisible(), true, "statistics should show the cross-language metrics table");
  assert.equal(await page.locator("#statistics-content .stats-bar-chart").isVisible(), true, "global statistics should compare language accuracy with bars");
  assert.equal(await page.locator("#stats-view-select option").first().innerText(), "🌐 Global");
  await page.locator("#stats-view-select").selectOption("pt-BR");
  assert.equal(await page.locator("#statistics-content .stats-language-chart").isVisible(), true, "a language view should show daily questions and accuracy");
  assert.equal(await page.locator("#statistics-content .stats-language-chart .chart-axis-title").textContent(), "Días");
  assert.equal(await page.locator("#statistics-content .stats-language-chart text.chart-axis-label").last().textContent(), "1");
  assert.match(await page.locator("#statistics-content .stats-language-chart").getAttribute("viewBox"), /760 340/);
  await page.locator("#stats-view-select").selectOption("global");
  const statsText = await page.locator("#statistics-content .stats-language-table").innerText();
  assert.ok(["Sesiones","Palabras","Precisión","Progreso de Ruta"].every(label => statsText.includes(label)));
  await page.locator('[data-screen="exercises"]').click();
  await page.locator("#duration").selectOption("10");
  await page.locator("#start-session").click();
  await page.locator("#session-close").click();
  await page.locator("#session-confirm").waitFor({ state: "visible" });
  await page.locator("#confirm-session-close").click();
  const afterDiscard = await page.evaluate(() => JSON.parse(localStorage.getItem("adaptive-language-tutor.progress") || "{}"));
  assert.equal(afterDiscard.sessions?.length, 1, "discarded exercise must not create a saved session");

  // Route partial progress survives leaving and reloading, unlike Exercises.
  await page.locator('[data-screen="route"]').click();
  await page.locator("#route-start").click();
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
  assert.match(await page.locator("#route-start").innerText(), /Continuar recorrido/i, "the start banner should become Continue after the first start");
  await page.locator("#route-start").click();
  assert.match(await page.locator("#turn-count").innerText(), /2 \/ 10/);
  assert.equal(await page.locator("#answer-area #continue-answer").isVisible(), true, "Route should restore the pending feedback and Continue action");
  assert.deepEqual(pageErrors, [], "browser should not report uncaught page errors");

  // AI session contract: the first three questions use alternatives; the fourth uses text input.
  const aiContext = await browser.newContext();
  await aiContext.addInitScript(() => {
    window.__spoken = [];
    const synth = {
      getVoices: () => [{ name: "Brazilian Portuguese", lang: "pt-BR" }, { name: "Spanish", lang: "es-CL" }],
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
  assert.equal(await aiPage.evaluate(() => window.__spoken.some(item => item.text.includes("Instrucción en español"))), false,
    "mixed AI speech must ignore source-language segments");
  await aiPage.locator("#answer-area [data-ai-choice]").first().evaluate(button => button.click());
  await aiPage.locator("#feedback .answer-status.correct").waitFor({ state: "visible" });
  await aiPage.locator("#answer-area #continue-answer").waitFor({ state: "visible" });
  await aiPage.locator("#session-close").click();
  assert.equal(await aiPage.locator("#route-resume").isVisible(), false, "AI-backed Route must use the same single banner");
  assert.match(await aiPage.locator("#route-start").innerText(), /Continuar recorrido/i);
  await aiPage.locator('[data-screen="exercises"]').click();
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
      config: { language:"Portugués", languageId:"pt-BR", languageLocale:"pt-BR", duration:11, topic:"daily", level:"zero", routeMode:true },
      turn:10, correct:8, attempted:10, streak:0, bestStreak:0, consecutiveCorrect:0, consecutiveErrors:0,
      errors:[], errorsToReview:[], vocabulary:[], reviewQueue:[], answers:[]
    };
    localStorage.setItem("adaptive-language-tutor.route-started:pt-BR","true");
    localStorage.setItem("adaptive-language-tutor.route-progress:pt-BR",JSON.stringify({
      languageId:"pt-BR",session,integration:true,integrationAttempts:0,routeIntegrationHintLevel:0,
      pendingFeedback:null,localPendingAnswer:null,aiPendingTurn:null,aiMode:false,aiHistory:[],
      aiLastResult:null,aiCurrentExercise:null,aiPendingFeedback:null
    }));
  });
  await routePage.reload({ waitUntil: "networkidle" });
  await routePage.locator("#welcome-start").click();
  await routePage.locator("#route-start").click();
  assert.match(await routePage.locator("#lesson-content h3").innerText(), /Traduce al portugués/i);
  await routePage.locator("#route-integration-answer").fill("ola");
  await routePage.locator("#route-integration-submit").click();
  assert.match(await routePage.locator("#feedback").innerText(), /Pista 1\/5/);
  await routePage.locator("#hint-btn").click();
  assert.match(await routePage.locator("#feedback").innerText(), /Pista 2\/5/);
  await routePage.reload({ waitUntil: "networkidle" });
  await routePage.locator("#welcome-start").click();
  await routePage.locator("#route-start").click();
  await routePage.locator("#hint-btn").click();
  assert.match(await routePage.locator("#feedback").innerText(), /Pista 3\/5/, "Route must resume the clue sequence instead of restarting it");
  assert.deepEqual(routeErrors, [], "Portuguese Route integration should not report browser errors");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
