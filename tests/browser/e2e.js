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
  page.on("pageerror", error => pageErrors.push(error.message));
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
  let startCalls = 0;
  let answerCalls = 0;
  await aiPage.route("**/api/health", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ status: "ok", ai: { configured: true, provider: "e2e-mock" } })
  }));
  await aiPage.route("**/api/tutor", async route => {
    const input = route.request().postDataJSON();
    if (input.task === "start_lesson") {
      startCalls += 1;
      if (startCalls === 1) {
        return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Mock temporary failure" }) });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Vamos praticar uma situação cotidiana.",
          exercise: { type: "production", prompt: "Como você se chama?", expectedAnswer: "Eu me chamo Ana.", acceptedAnswers: ["Eu me chamo Ana."], hint: "Comece com: Eu me chamo..." },
          evaluation: null,
          learnerUpdate: { estimatedLevel: "A1", vocabulary: [{ term: "chamar", meaning: "llamar" }], errorsToReview: [] },
          nextAction: "answer"
        })
      });
    }
    answerCalls += 1;
    if (answerCalls === 1) {
      return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Mock temporary failure" }) });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Muito bem. Terminamos esta prática.",
        exercise: null,
        evaluation: { status: "partially_correct", feedback: "La idea se entiende, pero revisa la conjugación.", correction: "Eu me chamo Ana.", skill: "Producción" },
        learnerUpdate: { estimatedLevel: "A1", vocabulary: [], errorsToReview: [] },
        nextAction: "finish"
      })
    });
  });

  await aiPage.goto(baseUrl, { waitUntil: "networkidle" });
  await aiPage.locator("#duration").selectOption("8");
  await aiPage.locator("#start-session").click();
  await aiPage.getByRole("button", { name: "Reintentar sesión" }).click();
  await aiPage.locator("#lesson-content").getByText("Como você se chama?").waitFor();
  await aiPage.locator("#hint-btn").click();
  await aiPage.locator("#feedback").getByText(/Comece com/).waitFor();
  await aiPage.locator("#ai-answer").fill("Eu me chamo Ana.");
  await aiPage.locator("#submit-ai-answer").click();
  await aiPage.getByRole("button", { name: "Reintentar envío" }).click();
  await aiPage.getByRole("button", { name: "Ver resumen →" }).click();
  await aiPage.locator("#summary-panel").waitFor({ state: "visible" });
  const aiStored = await aiPage.evaluate(() =>
    JSON.parse(localStorage.getItem("adaptive-language-tutor.progress") || "{}")
  );
  assert.equal(aiStored.sessions?.length, 1, "mock AI session should persist once");
  assert.equal(aiStored.reviewCards?.length, 1, "an evaluated AI error with an expected answer should create one review card");
  assert.equal(aiStored.reviewCards[0].expected, "Eu me chamo Ana.");

  // Make the AI review card due and verify that the real spaced-review UI grades it.
  await aiPage.evaluate(() => {
    const key = "adaptive-language-tutor.progress";
    const progress = JSON.parse(localStorage.getItem(key));
    progress.reviewCards[0].dueAt = new Date(Date.now() - 1000).toISOString();
    localStorage.setItem(key, JSON.stringify(progress));
  });
  await aiPage.reload({ waitUntil: "networkidle" });
  await aiPage.getByRole("button", { name: /Iniciar repaso/ }).click();
  await aiPage.locator("#spaced-answer").fill("Eu me chamo Ana.");
  await aiPage.locator("#check-spaced").click();
  await aiPage.getByRole("button", { name: "Siguiente →" }).click();
  const reviewed = await aiPage.evaluate(() => JSON.parse(localStorage.getItem("adaptive-language-tutor.progress")));
  assert.equal(reviewed.reviewCards[0].repetitions, 1, "a correct AI review should increment repetitions");
  assert.ok(new Date(reviewed.reviewCards[0].dueAt).getTime() > Date.now(), "a correct AI review should schedule the next interval");

  assert.equal(startCalls, 2, "initial AI session request should be retried once");
  assert.equal(answerCalls, 2, "AI answer request should be retried once");
  assert.deepEqual(aiPageErrors, [], "AI-mode browser should not report uncaught page errors");
  await aiContext.close();

  console.log("Browser E2E passed: local and mocked-AI flows, retries, hints, summary, persistence, export and restart.");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
