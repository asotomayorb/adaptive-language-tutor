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
  await page.locator("#hint-btn").click();
  await page.locator("#feedback").waitFor({ state: "visible" });
  assert.ok(await page.evaluate(() => window.__spoken.some(item => item.text === "dia" && item.lang === "pt-BR")), "local hints should pronounce explicitly annotated target-language fragments");

  // Complete the configured eight-turn local session.
  for (let turn = 0; turn < 8; turn += 1) {
    await page.locator("#answer-area [data-choice]").first().click();
    if (turn === 0) {
      assert.ok(await page.evaluate(() => window.__spoken.some(item => item.text === "Bom dia" && item.lang === "pt-BR")), "local feedback should pronounce only explicitly annotated target-language explanation fragments");
    }
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
    window.__speechCancelled = 0;
    const synth = {
      getVoices: () => [{ name: "Italian", lang: "it-IT" }, { name: "Spanish Chile", lang: "es-CL" }],
      speak: utterance => window.__spoken.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice?.name }),
      cancel: () => { window.__speechCancelled += 1; }
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
      assert.equal(input.learner.targetLanguageLabel, "Italiano");
      assert.equal(input.learner.targetLanguageLocale, "it-IT", "AI requests should carry the selected locale explicitly");
      startCalls += 1;
      if (startCalls === 1) {
        return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Mock temporary failure" }) });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Vamos a practicar una situación cotidiana.",
          exercise: { type: "production", prompt: "¿Qué significa buongiorno?", expectedAnswer: "Buongiorno", acceptedAnswers: ["Buongiorno"], hint: "Usa la expresión buongiorno para saludar por la mañana" },
          evaluation: null,
          learnerUpdate: { estimatedLevel: "A1", vocabulary: [{ term: "parlare", meaning: "hablar" }], errorsToReview: [] },
          questionSegments: [
            { text: "¿Qué significa ", language: "es", locale: "es-CL", isTarget: false },
            { text: "buongiorno", language: "it", locale: "it-IT", isTarget: true },
            { text: "?", language: "es", locale: "es-CL", isTarget: false }
          ],
          speechSegments: [{ text: "Vorrei", language: "it", locale: "it-IT" }],
          nextAction: "answer"
        })
      });
    }
    if (input.task === "request_hint") {
      hintCalls += 1;
      assert.equal(input.session.turn, 0, "asking for a hint must not consume a practice turn");
      assert.equal(input.session.currentExercise.prompt, "¿Qué significa buongiorno?", "hint request must preserve the active exercise");
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Pista adicional.",
          exercise: { type: "production", prompt: "¿Qué significa buongiorno?", expectedAnswer: "Buongiorno", acceptedAnswers: ["Buongiorno"], hint: "Piensa en el saludo matinal." },
          evaluation: null,
          learnerUpdate: null,
          questionSegments: [
            { text: "¿Qué significa ", language: "es", locale: "es-CL", isTarget: false },
            { text: "buongiorno", language: "it", locale: "it-IT", isTarget: true },
            { text: "?", language: "es", locale: "es-CL", isTarget: false }
          ],
          speechSegments: [{ text: "parlare", language: "it", locale: "it-IT" }],
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
        message: "Muy bien. Terminamos esta práctica.",
        exercise: null,
        evaluation: { status: "partially_correct", feedback: "La idea se entiende, pero revisa la conjugación.", correction: "Buongiorno", skill: "Producción" },
        learnerUpdate: { estimatedLevel: "A1", vocabulary: [], errorsToReview: ["Conjugación verbal en primera persona"] },
        speechSegments: [],
        nextAction: "finish"
      })
    });
  });

  await aiPage.goto(baseUrl, { waitUntil: "networkidle" });
  assert.equal(await aiPage.locator("#screen-languages h1").innerText(), "IDIOMAS", "the app should open on the central Languages screen");
  assert.equal(await aiPage.locator('[data-screen="route"]').isDisabled(), true, "unfinished Route navigation should remain disabled");
  assert.equal(await aiPage.locator('[data-screen="theory"]').isDisabled(), true, "unfinished Theory navigation should remain disabled");
  await aiPage.locator('[data-screen="stats"]').click();
  await aiPage.locator("#screen-stats").waitFor({ state: "visible" });
  await aiPage.locator('[data-screen="languages"]').click();
  await aiPage.locator("#open-training").click();
  await aiPage.locator("#language").selectOption("Italiano");
  await aiPage.locator("#duration").selectOption("8");
  await aiPage.locator("#start-session").click();
  await aiPage.getByRole("button", { name: "Reintentar sesión" }).click();
  await aiPage.locator("#lesson-content").getByRole("heading", { name: "¿Qué significa buongiorno?" }).waitFor();
  assert.deepEqual(await aiPage.evaluate(() => window.__spoken.slice(0, 3).map(item => [item.text, item.lang])), [
    ["¿Cómo se dice", "es-CL"], ["buongiorno", "it-IT"], ["?", "es-CL"]
  ], "mixed questions should be spoken in order using the locale of each segment");
  assert.equal(await aiPage.evaluate(() => window.__spoken[1]?.voice), "Italian", "target segment should select the matching installed voice");
  const targetFragment = aiPage.locator("#lesson-content .target-fragment");
  assert.equal(await targetFragment.innerText(), "buongiorno");
  assert.equal(await targetFragment.evaluate(node => getComputedStyle(node).textDecorationLine.includes("underline")), true, "only the target-language fragment should be underlined");
  await targetFragment.click();
  assert.deepEqual(await aiPage.evaluate(() => window.__spoken.at(-1) && [window.__spoken.at(-1).text, window.__spoken.at(-1).lang]), ["buongiorno", "it-IT"], "manual replay should pronounce only the selected target fragment");
  const spokenBeforeFirstHint = await aiPage.evaluate(() => window.__spoken.length);
  await aiPage.locator("#hint-btn").click();
  await aiPage.locator("#feedback").getByText(/saludo matinal/).waitFor();
  assert.ok(await aiPage.evaluate(count => window.__spoken.length > count && window.__spoken.at(-1)?.text === "parlare" && window.__spoken.at(-1)?.lang === "it-IT", spokenBeforeFirstHint), "the first AI hint should automatically pronounce its target-language fragment");
  const turnBeforeExtraHint = await aiPage.locator("#turn-count").innerText();
  const cancellationsBeforeExtraHint = await aiPage.evaluate(() => window.__speechCancelled);
  await aiPage.locator("#hint-btn").click();
  assert.ok(await aiPage.evaluate(count => window.__speechCancelled > count, cancellationsBeforeExtraHint), "requesting another hint should cancel any previous speech");
  await aiPage.locator("#feedback").getByText(/saludo matinal/).waitFor();
  assert.equal(await aiPage.locator("#turn-count").innerText(), turnBeforeExtraHint, "an additional hint must not advance the session");
  assert.equal(hintCalls, 1, "a second hint should call the AI tutor once");
  const hintSpeaker = aiPage.locator("#feedback [data-speak]").first();
  await hintSpeaker.waitFor();
  await hintSpeaker.click();
  assert.ok(await aiPage.evaluate(() => window.__spoken.some(item => item.text === "parlare" && item.lang === "it-IT")), "additional hint fragments should support manual pronunciation");
  await aiPage.locator("#ai-answer").fill("Buongiorno");
  const cancellationsBeforeAnswer = await aiPage.evaluate(() => window.__speechCancelled);
  await aiPage.locator("#submit-ai-answer").click();
  assert.ok(await aiPage.evaluate(count => window.__speechCancelled > count, cancellationsBeforeAnswer), "submitting an answer should immediately cancel speech from the previous turn");
  await aiPage.getByRole("button", { name: "Reintentar envío" }).click();
  assert.equal(await aiPage.locator("#retry-ai").isDisabled(), true, "retry control should disable immediately to prevent duplicate requests");
  await aiPage.getByRole("button", { name: "Ver resumen →" }).click();
  await aiPage.locator("#summary-panel").waitFor({ state: "visible" });
  const summarySpeaker = aiPage.locator("#summary-content [data-speak]").first();
  await summarySpeaker.waitFor();
  assert.ok(await aiPage.evaluate(() => window.__spoken.some(item => item.text === "parlare" && item.lang === "it-IT")), "summary vocabulary should be read automatically in the selected target locale");
  const spokenBeforeSummaryReplay = await aiPage.evaluate(() => window.__spoken.length);
  await summarySpeaker.click();
  assert.ok(await aiPage.evaluate(count => window.__spoken.length > count, spokenBeforeSummaryReplay), "summary vocabulary should support manual replay");
  await aiPage.locator("#audio-toggle").click();
  const spokenBeforeSummaryReenable = await aiPage.evaluate(() => window.__spoken.length);
  await aiPage.locator("#audio-toggle").click();
  assert.ok(await aiPage.evaluate(count => window.__spoken.length > count, spokenBeforeSummaryReenable), "re-enabling automatic speech on the summary should replay visible target vocabulary");
  assert.equal(await aiPage.evaluate(() => window.__spoken.at(-1)?.lang), "it-IT", "summary replay should preserve the selected target locale");

  // Hidden panels must not be replayed when automatic speech is re-enabled.
  await aiPage.evaluate(() => {
    document.querySelector("#summary-panel").classList.add("hidden");
    document.querySelector("#lesson-panel").classList.remove("hidden");
    document.querySelector("#lesson-content").innerHTML = '<button data-speak="visible lesson phrase" data-locale="it-IT">play</button>';
  });
  await aiPage.locator("#audio-toggle").click();
  const spokenBeforeVisibleReplay = await aiPage.evaluate(() => window.__spoken.length);
  await aiPage.locator("#audio-toggle").click();
  const replayedAfterPanelSwitch = await aiPage.evaluate(count => window.__spoken.slice(count).map(item => item.text), spokenBeforeVisibleReplay);
  assert.deepEqual(replayedAfterPanelSwitch, ["visible lesson phrase"], "audio re-enable should ignore speech buttons inside hidden panels");

  const aiStored = await aiPage.evaluate(() =>
    JSON.parse(localStorage.getItem("adaptive-language-tutor.progress") || "{}")
  );
  assert.equal(aiStored.sessions?.length, 1, "mock AI session should persist once");
  assert.equal(aiStored.reviewCards?.length, 2, "evaluated errors and qualitative learning patterns should both create review cards");
  assert.equal(aiStored.reviewCards[0].expected, "Buongiorno");

  // Make the AI review card due and verify that the real spaced-review UI grades it.
  await aiPage.evaluate(() => {
    const key = "adaptive-language-tutor.progress";
    const progress = JSON.parse(localStorage.getItem(key));
    progress.reviewCards.forEach(card => { card.dueAt = new Date(Date.now() - 1000).toISOString(); });
    localStorage.setItem(key, JSON.stringify(progress));
  });
  await aiPage.reload({ waitUntil: "networkidle" });
  await aiPage.locator("#language").selectOption("other");
  await aiPage.locator("#custom-language-name").fill("Italiano");
  await aiPage.locator("#custom-language-locale").fill("it-IT");
  await aiPage.getByRole("button", { name: /Iniciar repaso/ }).click();
  await aiPage.locator("#spaced-answer").fill("Buongiorno");
  await aiPage.locator("#check-spaced").click();
  const cancellationsBeforeNextReview = await aiPage.evaluate(() => window.__speechCancelled);
  await aiPage.getByRole("button", { name: "Siguiente →" }).click();
  assert.ok(await aiPage.evaluate(count => window.__speechCancelled > count, cancellationsBeforeNextReview), "moving to the next spaced-review card should cancel speech from the previous card");
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
