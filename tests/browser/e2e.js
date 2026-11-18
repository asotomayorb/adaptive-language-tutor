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
    message: start ? "Elige la respuesta correcta." : "Revisemos tu respuesta y avancemos.",
    exercise: {
      type: "grammar",
      prompt: `Pregunta de prueba ${turn + 1}: ¿Cuál es la forma adecuada?`,
      expectedAnswer: "Bom dia",
      acceptedAnswers: ["Bom dia"],
      options: turn < 3 ? ["Bom dia", "Boa noite", "Até logo"] : [],
      hint: "Piensa en el saludo de la mañana."
    },
    evaluation: start ? null : {
      status: "correct",
      feedback: "Correcto. La respuesta está bien formada.",
      correction: null,
      skill: "Saludos"
    },
    learnerUpdate: { estimatedLevel: "A1", vocabulary: [], errorsToReview: [] },
    speechSegments: [{ text: "Bom dia", language: "pt", locale: "pt-BR" }],
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
  assert.equal(await page.locator("#welcome-screen").isVisible(), true, "fresh users should see welcome");
  await page.locator("#welcome-start").click();
  assert.equal(await page.locator("#welcome-screen").isVisible(), false, "welcome should disappear immediately");
  await page.locator('[data-language="Portugués brasileño"]').click();
  await page.locator("#screen-route").waitFor({ state: "visible" });
  assert.equal(await page.locator("#selected-language-flag").innerText(), "🇧🇷");

  // Standard languages have flags and do not ask users to enter a locale.
  await page.locator("#open-language-picker").click();
  await page.locator('[data-language="Italiano"]').click();
  assert.equal(await page.locator("#selected-language-flag").innerText(), "🇮🇹");
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
  assert.match(await page.locator("#theory-description").innerText(), /eu, você/i);
  await page.locator("#theory-next").click();
  assert.equal(await page.locator("#theory-title").innerText(), "Artículos");
  await page.locator("#theory-close").click();

  // Local exercise: first three questions are alternatives, then answers are written.
  await page.locator('[data-screen="exercises"]').click();
  await page.locator("#start-session").waitFor({ state: "visible" });
  await page.locator("#start-session").waitFor({ state: "attached" });
  await page.locator("#duration").selectOption("5");
  await page.locator("#start-session").click();
  for (let turn = 0; turn < 3; turn += 1) {
    assert.equal(await page.locator("#answer-area [data-choice]").count(), 3, "first three questions should have three choices");
    await page.locator("#answer-area [data-choice]").first().click();
    assert.equal(await page.locator("#lesson-content .feedback-note").isVisible(), true, "feedback should move to the following question");
    assert.ok(await page.locator("#lesson-content .model-answer [data-speak]").count() === 1, "model answer should have its own pronunciation control");
  }
  assert.equal(await page.locator("#answer-area #free-answer").isVisible(), true, "fourth question should require written input");
  for (let turn = 3; turn < 5; turn += 1) {
    await page.locator("#free-answer").fill("Bom dia");
    await page.locator("#submit-free").click();
    if (turn < 4) assert.equal(await page.locator("#answer-area #free-answer").isVisible(), true);
  }
  await page.locator("#summary-panel").waitFor({ state: "visible" });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("adaptive-language-tutor.progress") || "{}"));
  assert.equal(saved.sessions?.length, 1, "completed exercise session should be saved");
  assert.equal(saved.sessions[0].attempted, 5);

  // Incomplete Exercises sessions are discarded; no partial session is persisted.
  await page.locator("#new-session").click();
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
  await page.locator("#answer-area [data-choice]").first().click();
  await page.locator("#answer-area [data-choice]").first().click();
  await page.locator("#session-close").click();
  const draft = await page.evaluate(() => JSON.parse(localStorage.getItem("adaptive-language-tutor.route-progress:pt-BR") || "null"));
  assert.equal(draft.session.turn, 2, "Route must save confirmed answers immediately");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator("#route-resume").isVisible(), true, "Route should offer resume after reload");
  await page.locator("#route-resume").click();
  assert.match(await page.locator("#turn-count").innerText(), /3 \/ 10/);
  assert.deepEqual(pageErrors, [], "browser should not report uncaught page errors");

  // AI session contract: the first three questions use alternatives; the fourth uses text input.
  const aiContext = await browser.newContext();
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
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(tutorTurn({ turn })) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      message: "Pista.", exercise: { type:"grammar", prompt:"Pregunta", expectedAnswer:"Oui", acceptedAnswers:["Oui"], options:[], hint:"Piensa." },
      evaluation:null, learnerUpdate:null, speechSegments:[], nextAction:"answer"
    }) });
  });
  await aiPage.goto(baseUrl, { waitUntil: "networkidle" });
  await aiPage.locator("#welcome-start").click();
  await aiPage.locator('[data-language="Francés"]').click();
  await aiPage.locator('[data-screen="exercises"]').click();
  await aiPage.locator("#start-session").waitFor({ state: "visible" });
  await aiPage.locator("#start-session").click();
  await aiPage.locator("#answer-area [data-ai-choice]").first().waitFor();
  for (let turn = 0; turn < 3; turn += 1) {
    assert.equal(await aiPage.locator("#answer-area [data-ai-choice]").count(), 3);
    await aiPage.locator("#answer-area [data-ai-choice]").first().click();
    assert.equal(await aiPage.locator("#lesson-content .feedback-note").isVisible(), true);
  }
  assert.equal(await aiPage.locator("#ai-answer").isVisible(), true, "AI should switch to written answers after three questions");
  assert.deepEqual(aiErrors, [], "AI browser flow should not report uncaught page errors");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
