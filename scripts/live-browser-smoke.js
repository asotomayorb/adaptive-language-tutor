import assert from "node:assert/strict";
import { chromium } from "playwright";
import { setTimeout as delay } from "node:timers/promises";

const baseUrl = (process.env.TUTOR_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const browser = await chromium.launch({ headless: true });
let page;

async function waitForTutorState(page) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await page.waitForFunction(() => {
      const answer = document.querySelector("#ai-answer");
      const retry = document.querySelector("#retry-ai");
      return Boolean((answer && !answer.disabled) ||
        document.querySelector("#finish-ai-session") ||
        (retry && !retry.disabled));
    }, null, { timeout: 90_000 });
    const retry = page.locator("#retry-ai");
    if (await retry.count() && await retry.isEnabled()) {
      const delayMs = Math.min(1500 * (2 ** attempt), 10_000);
      console.warn("Live browser smoke: retrying a transient tutor request in " + delayMs + "ms.");
      await delay(delayMs);
      await retry.click();
      continue;
    }
    return;
  }
  throw new Error("The live tutor did not recover after six attempts.");
}

try {
  const context = await browser.newContext({ acceptDownloads: true });
  await context.addInitScript(() => {
    localStorage.clear();
    window.__spoken = [];
    const synth = {
      getVoices: () => [{ name: "Italian", lang: "it-IT" }],
      speak: utterance => window.__spoken.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice?.name }),
      cancel: () => {}
    };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: synth });
    window.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; this.lang = ""; this.voice = null; }
    };
  });
  page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => {
    const button = document.querySelector("#start-session");
    return button && !button.disabled;
  }, null, { timeout: 10_000 });

  await page.locator("#language").selectOption("Italiano");
  await page.locator("#duration").evaluate(select => {
    const option = document.createElement("option");
    option.value = "3";
    option.textContent = "3 turnos (smoke test)";
    select.add(option);
    select.value = "3";
  });
  await page.locator("#level").selectOption("basic");
  await page.locator("#topic").selectOption("daily");
  await page.locator("#start-session").click();
  await waitForTutorState(page);
  assert.ok(await page.locator("#ai-answer").count(), "live AI session should present its first answer field");
  assert.ok(await page.evaluate(() => window.__spoken.some(item => item.lang === "it-IT")),
    "live Italian tutor response should trigger target-locale speech");

  for (let turn = 1; turn <= 3; turn += 1) {
    await page.locator("#ai-answer").fill("Vorrei esercitarmi in italiano.");
    await page.locator("#submit-ai-answer").click();
    await waitForTutorState(page);
    if (turn < 3) {
      assert.ok(await page.locator("#ai-answer").count(), "turn " + turn + " should continue the live lesson");
    } else {
      await page.locator("#finish-ai-session").waitFor({ state: "visible" });
    }
  }

  await page.locator("#finish-ai-session").click();
  await page.locator("#summary-panel").waitFor({ state: "visible" });
  const summaryText = await page.locator("#summary-content").innerText();
  assert.match(summaryText, /Italiano/, "summary should retain the selected custom language");
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("adaptive-language-tutor.progress") || "{}")
  );
  assert.equal(stored.sessions?.length, 1, "real AI session should persist exactly once");
  assert.equal(pageErrors.length, 0, "live browser flow should not produce JavaScript errors");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#export-btn").click()
  ]);
  assert.equal(download.suggestedFilename(), "language-tutor-progress.json");

  console.log(JSON.stringify({
    status: "passed",
    provider: "gemini",
    targetLocale: "it-IT",
    turns: 3,
    persistedSessions: stored.sessions.length,
    exported: true,
    speechSegments: await page.evaluate(() => window.__spoken.filter(item => item.lang === "it-IT").length)
  }, null, 2));
} finally {
  await browser.close();
}
