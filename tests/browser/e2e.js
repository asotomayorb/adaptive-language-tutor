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

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", error => {
    pageErrors.push(error.message);
    console.error("[browser pageerror]", error.stack || error.message);
  });
  page.on("console", message => {
    if (message.type() === "error") console.error("[browser console]", message.text());
  });
  page.on("requestfailed", request => {
    console.error("[browser request failed]", request.url(), request.failure()?.errorText || "unknown");
  });
  page.on("response", response => {
    if (response.status() >= 400) console.error("[browser HTTP error]", response.status(), response.url());
  });
  await page.addInitScript(() => {
    window.__spoken = [];
    const synth = {
      getVoices: () => [
        { name: "Brazilian Portuguese", lang: "pt-BR" },
        { name: "English", lang: "en-US" }
      ],
      speak: utterance => window.__spoken.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice?.name }),
      cancel: () => {}
    };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: synth });
    window.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; this.lang = ""; this.voice = null; }
    };
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  assert.match(await page.title(), /Adaptive Language Tutor/);
  await page.locator("#ai-status").waitFor();
  await page.locator("#start-session").waitFor({ state: "visible" });
  await page.locator("#level").selectOption("diagnostic");
  await page.locator("#duration").selectOption("8");
  await page.locator("#start-session").click();
  // Complete the four-question diagnostic, then verify guided practice.
  for (let question = 0; question < 4; question += 1) {
    await page.locator("#answer-area .answer-option").first().click();
  }
  await page.locator("#answer-area [data-speak]").first().waitFor();
  const firstSpeech = await page.evaluate(() => window.__spoken[0]);
  assert.equal(firstSpeech.lang, "pt-BR", "automatic speech should use the selected target locale");
  assert.equal(firstSpeech.voice, "Brazilian Portuguese", "speech should select the matching installed voice");
  await page.locator("#answer-area [data-speak]").first().click();
  assert.ok(await page.evaluate(() => window.__spoken.length >= 2), "manual pronunciation should be available per phrase");
  await page.locator("#audio-toggle").click();
  assert.equal(await page.locator("#audio-toggle").getAttribute("aria-pressed"), "false", "global audio toggle should disable automatic speech");
  const speechCountBeforeReenable = await page.evaluate(() => window.__spoken.length);
  await page.locator("#audio-toggle").click();
  assert.equal(await page.locator("#audio-toggle").getAttribute("aria-pressed"), "true", "global audio toggle should re-enable automatic speech");
  assert.ok(await page.evaluate(count => window.__spoken.length > count, speechCountBeforeReenable), "re-enabling audio should read the currently visible target fragments");
  await page.locator("#audio-toggle").click();
  await page.locator("#hint-btn").click();
  await page.locator("#feedback").waitFor({ state: "visible" });

  // Complete the configured eight-turn local session.
  for (let turn = 0; turn < 8; turn += 1) {
    await page.locator("#answer-area [data-choice]").first().click();
    await page.getByRole("button", { name: "Continuar →" }).click();
  }
  await page.locator("#summary-panel").waitFor({ state: "visible" });

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("adaptive-language-tutor.progress") || "{}")
  );
  assert.equal(stored.sessions?.length, 1, "completed session should persist once");
  assert.ok(stored.sessions[0].languageId, "persisted session should include its language");
  assert.ok(await page.locator("#summary-content").innerText());

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar progreso" }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "language-tutor-progress.json");

  await page.getByRole("button", { name: "Nueva sesión →" }).click();
  await page.locator("#setup-panel").waitFor({ state: "visible" });
  assert.deepEqual(pageErrors, [], "browser should not report uncaught page errors");

  // Exercise the AI-mode interface with deterministic API responses, including both retry paths.
  const aiContext = await browser.newContext();
  const aiPage = await aiContext.newPage();
  const aiPageErrors = [];
  aiPage.on("pageerror", error => aiPageErrors.push(error.message));
  await aiPage.addInitScript(() => {
    window.__spoken = [];
    const synth = {
      getVoices: () => [{ name: "French", lang: "fr-FR" }],
      speak: utterance => window.__spoken.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice?.name }),
      cancel: () => {}
    };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: synth });
    window.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; this.lang = ""; this.voice = null; }
    };
  });
  let startCalls = 0;
  let answerCalls = 0;
  let hintCalls = 0;
  await aiPage.route("**/api/health", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ status: "ok", ai: { configured: true, provider: "e2e-mock" } })
  }));
  await aiPage.route("**/api/tutor", async route => {
    const input = route.request().postDataJSON();
    if (input.task === "start_lesson") {
      assert.equal(input.learner.targetLanguageLabel, "Francés");
      assert.equal(input.learner.targetLanguageLocale, "fr-FR", "AI requests should carry the selected locale explicitly");
      startCalls += 1;
      if (startCalls === 1) {
        return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Mock temporary failure" }) });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Vamos praticar uma situação cotidiana.",
          exercise: { type: "production", prompt: "Comment tu t’appelles ?", expectedAnswer: "Je m’appelle Ana.", acceptedAnswers: ["Je m’appelle Ana."], hint: "Usa la expresión Je m’appelle..." },
          evaluation: null,
          learnerUpdate: { estimatedLevel: "A1", vocabulary: [{ term: "s’appeler", meaning: "llamarse" }], errorsToReview: [] },
          speechSegments: [{ text: "Comment tu t’appelles ?", language: "fr", locale: "fr-FR" }],
          nextAction: "answer"
        })
      });
    }
    if (input.task === "request_hint") {
      hintCalls += 1;
      assert.equal(input.session.turn, 0, "asking for a hint must not consume a practice turn");
      assert.equal(input.session.currentExercise.prompt, "Comment tu t’appelles ?", "hint request must preserve the active exercise");
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Pista adicional.",
          exercise: { type: "production", prompt: "Comment tu t’appelles ?", expectedAnswer: "Je m’appelle Ana.", acceptedAnswers: ["Je m’appelle Ana."], hint: "Piensa en el verbo que expresa tu nombre." },
          evaluation: null,
          learnerUpdate: null,
          speechSegments: [{ text: "s’appeler", language: "fr", locale: "fr-FR" }],
          nextAction: "answer"
        })
      });
    }
    answerCalls += 1;
    if (answerCalls === 1) {
      return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Mock temporary failure" }) });
    }
    await new Promise(resolve => setTimeout(resolve, 250));
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Très bien. Terminamos esta práctica.",
        exercise: null,
        evaluation: { status: "partially_correct", feedback: "La idea se entiende, pero revisa la conjugación.", correction: "Je m’appelle Ana.", skill: "Producción" },
        learnerUpdate: { estimatedLevel: "A1", vocabulary: [], errorsToReview: ["Conjugación verbal en primera persona"] },
        speechSegments: [{ text: "Je m’appelle Ana.", language: "fr", locale: "fr-FR" }],
        nextAction: "finish"
      })
    });
  });

  await aiPage.goto(baseUrl, { waitUntil: "networkidle" });
  await aiPage.locator("#language").selectOption("other");
  await aiPage.locator("#custom-language-name").fill("Francés");
  await aiPage.locator("#custom-language-locale").fill("fr-FR");
  await aiPage.locator("#duration").selectOption("8");
  await aiPage.locator("#start-session").click();
  await aiPage.getByRole("button", { name: "Reintentar sesión" }).click();
  await aiPage.locator("#lesson-content").getByRole("heading", { name: "Comment tu t’appelles ?" }).waitFor();
  assert.equal(await aiPage.evaluate(() => window.__spoken[0]?.lang), "fr-FR", "custom AI language should use its explicit target locale");
  assert.equal(await aiPage.evaluate(() => window.__spoken[0]?.voice), "French", "custom AI locale should select the matching system voice");
  await aiPage.locator("#lesson-content [data-speak]").first().click();
  assert.ok(await aiPage.evaluate(() => window.__spoken.length >= 2), "AI fragments should offer manual playback");
  await aiPage.locator("#hint-btn").click();
  await aiPage.locator("#feedback").getByText(/Je m’appelle/).waitFor();
  const turnBeforeExtraHint = await aiPage.locator("#turn-count").innerText();
  await aiPage.locator("#hint-btn").click();
  await aiPage.locator("#feedback").getByText(/verbo que expresa tu nombre/).waitFor();
  assert.equal(await aiPage.locator("#turn-count").innerText(), turnBeforeExtraHint, "an additional hint must not advance the session");
  assert.equal(hintCalls, 1, "a second hint should call the AI tutor once");
  const hintSpeaker = aiPage.locator("#feedback [data-speak]").first();
  await hintSpeaker.waitFor();
  await hintSpeaker.click();
  assert.ok(await aiPage.evaluate(() => window.__spoken.some(item => item.text === "s’appeler" && item.lang === "fr-FR")), "additional hint fragments should support manual pronunciation");
  await aiPage.locator("#ai-answer").fill("Je m’appelle Ana.");
  await aiPage.locator("#submit-ai-answer").click();
  await aiPage.getByRole("button", { name: "Reintentar envío" }).click();
  assert.equal(await aiPage.locator("#retry-ai").isDisabled(), true, "retry control should disable immediately to prevent duplicate requests");
  await aiPage.getByRole("button", { name: "Ver resumen →" }).click();
  await aiPage.locator("#summary-panel").waitFor({ state: "visible" });
  const summarySpeaker = aiPage.locator("#summary-content [data-speak]").first();
  await summarySpeaker.waitFor();
  assert.ok(await aiPage.evaluate(() => window.__spoken.some(item => item.text === "s’appeler" && item.lang === "fr-FR")), "summary vocabulary should be read automatically in the selected target locale");
  const spokenBeforeSummaryReplay = await aiPage.evaluate(() => window.__spoken.length);
  await summarySpeaker.click();
  assert.ok(await aiPage.evaluate(count => window.__spoken.length > count, spokenBeforeSummaryReplay), "summary vocabulary should support manual replay");
  const aiStored = await aiPage.evaluate(() =>
    JSON.parse(localStorage.getItem("adaptive-language-tutor.progress") || "{}")
  );
  assert.equal(aiStored.sessions?.length, 1, "mock AI session should persist once");
  assert.equal(aiStored.reviewCards?.length, 2, "evaluated errors and qualitative learning patterns should both create review cards");
  assert.equal(aiStored.reviewCards[0].expected, "Je m’appelle Ana.");

  // Make the AI review card due and verify that the real spaced-review UI grades it.
  await aiPage.evaluate(() => {
    const key = "adaptive-language-tutor.progress";
    const progress = JSON.parse(localStorage.getItem(key));
    progress.reviewCards.forEach(card => { card.dueAt = new Date(Date.now() - 1000).toISOString(); });
    localStorage.setItem(key, JSON.stringify(progress));
  });
  await aiPage.reload({ waitUntil: "networkidle" });
  await aiPage.locator("#language").selectOption("other");
  await aiPage.locator("#custom-language-name").fill("Francés");
  await aiPage.locator("#custom-language-locale").fill("fr-FR");
  await aiPage.getByRole("button", { name: /Iniciar repaso/ }).click();
  await aiPage.locator("#spaced-answer").fill("Je m’appelle Ana.");
  await aiPage.locator("#check-spaced").click();
  await aiPage.getByRole("button", { name: "Siguiente →" }).click();
  await aiPage.getByRole("button", { name: "Lo recordé" }).click();
  await aiPage.getByRole("button", { name: "Siguiente →" }).click();
  const reviewed = await aiPage.evaluate(() => JSON.parse(localStorage.getItem("adaptive-language-tutor.progress")));
  assert.equal(reviewed.reviewCards[0].repetitions, 1, "a correct AI review should increment repetitions");
  const patternCard = reviewed.reviewCards.find(card => card.cardType === "pattern");
  assert.equal(patternCard.repetitions, 1, "self-assessed pattern review should increment repetitions");
  assert.ok(new Date(reviewed.reviewCards[0].dueAt).getTime() > Date.now(), "a correct AI review should schedule the next interval");

  assert.equal(startCalls, 2, "initial AI session request should be retried once");
  assert.equal(answerCalls, 2, "AI answer request should be retried once");
  assert.deepEqual(aiPageErrors, [], "AI-mode browser should not report uncaught page errors");
  await aiContext.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  await mobileContext.addInitScript(() => {
    const synth = { getVoices: () => [{ name: "Portuguese", lang: "pt-BR" }], speak: () => {}, cancel: () => {} };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: synth });
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; this.lang = ""; this.voice = null; } };
  });
  const mobilePage = await mobileContext.newPage();
  const mobileErrors = [];
  mobilePage.on("pageerror", error => mobileErrors.push(error.message));
  await mobilePage.goto(baseUrl, { waitUntil: "networkidle" });
  await mobilePage.waitForFunction(() => {
    const button = document.querySelector("#start-session");
    return button && !button.disabled;
  }, null, { timeout: 10_000 });
  const setupWidth = await mobilePage.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(setupWidth.document <= setupWidth.viewport, "mobile setup should not overflow horizontally");
  await mobilePage.locator("#start-session").click();
  await mobilePage.locator("#lesson-content h3").waitFor({ state: "visible" });
  const lessonWidth = await mobilePage.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(lessonWidth.document <= lessonWidth.viewport, "mobile lesson should not overflow horizontally");
  assert.equal(mobileErrors.length, 0, "mobile layout should not produce JavaScript errors");
  await mobileContext.close();

  console.log("Browser E2E passed: local and mocked-AI flows, retries, hints, summary, persistence, export, restart and 390px mobile layout.");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
