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
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    const synth = {
      getVoices: () => [{ name: "Italian", lang: "it-IT" }, { name: "Spanish", lang: "es-CL" }],
      speak: utterance => { setTimeout(() => utterance.onend?.(), 0); },
      cancel: () => {}, pause: () => {}, resume: () => {}, paused: false, speaking: false
    };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: synth });
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; this.lang = ""; this.voice = null; } };
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  assert.deepEqual(pageErrors, [], "the app should initialize without uncaught browser errors");
  await page.locator("#screen-theory").waitFor({ state: "visible" });
  assert.equal(await page.locator("#welcome-screen").isVisible(), false, "the app should open directly on its available section");
  assert.equal(await page.locator("#nav-language-button").isVisible(), true, "the central language icon should be visible immediately");
  const languageOptions = page.locator(".language-mosaic [data-language]");
  await page.locator("#nav-language-button").click();
  assert.equal(await page.locator("#language-picker").isVisible(), true, "the central icon should open language selection");
  assert.equal(await languageOptions.count(), 1, "Italian should be the only visible language option");
  assert.equal(await languageOptions.first().getAttribute("data-language"), "Italiano");
  await languageOptions.first().click();
  await page.locator("#screen-theory").waitFor({ state: "visible" });

  const routeButton = page.locator('.bottom-nav [data-screen="route"]');
  const trainingButton = page.locator('.bottom-nav [data-screen="exercises"]');
  assert.equal(await routeButton.isDisabled(), true, "Route must remain visible but disabled");
  assert.equal(await trainingButton.isDisabled(), true, "Training must remain visible but disabled");
  assert.equal(await page.locator("#nav-language-button").isVisible(), true, "central language selector should be visible");
  assert.equal(await page.locator("#selected-language-flag").innerText(), "🇮🇹");
  assert.equal(await page.locator('.bottom-nav [data-screen="theory"]').isEnabled(), true);
  assert.equal(await page.locator('.bottom-nav [data-screen="stats"]').isEnabled(), true);

  await page.locator("#nav-language-button").click();
  assert.equal(await page.locator("#language-picker").isVisible(), true, "central icon should open the language picker");
  assert.equal(await page.locator(".language-mosaic [data-language]").count(), 1);
  await page.locator("#language-cancel").click();
  assert.equal(await page.locator("#screen-theory").isVisible(), true, "cancel should keep the current section");

  assert.equal(await page.locator("#screen-theory .screen-heading h1").evaluate(el => getComputedStyle(el).textAlign), "center", "section titles should remain centered");
  await page.locator("#theory-level-a1").click();
  assert.equal(await page.locator("#theory-unit-list").isVisible(), true, "A1 should open its unit list");
  assert.equal(await page.locator("#theory-unit-items [data-theory-unit]").count(), 6, "A1 should show the six proposed unit titles");
  await page.locator("#theory-unit-items [data-theory-unit]").first().click();
  assert.equal(await page.locator("#theory-topic-list").isVisible(), true, "a unit should open its subtopics directly");
  assert.equal(await page.locator("#theory-list-title").innerText(), "Primeros contactos", "unit heading should retain its name after selection");
  assert.ok(await page.locator("#theory-list-items .theory-category-icon").count() > 0, "category should be represented by an icon on each subtopic");
  assert.equal(await page.locator("#theory-topics-level-title").innerText(), "A1 · Principiante", "subtopic list should retain the level heading");
  const headerHeightBefore = await page.locator("#theory-heading-stack").first().evaluate(el => el.getBoundingClientRect().height);
  await page.locator("#theory-list-items [data-theory-topic]").first().click();
  assert.equal(await page.locator("#theory-detail").isVisible(), true, "Theory topic detail should open");
  assert.equal(await page.locator("#theory-topic-list").isVisible(), false, "detail should replace the list in-flow rather than overlay it");
  assert.equal(await page.locator("#theory-detail").evaluate(el => getComputedStyle(el).position), "static", "detail should not be fullscreen/fixed");
  assert.equal(await page.locator("#theory-detail-level-title").innerText(), "A1 · Principiante", "detail should accumulate the level heading");
  assert.equal(await page.locator("#theory-detail-unit-title").innerText(), "Primeros contactos", "detail should accumulate the unit heading");
  assert.ok((await page.locator("#theory-title").innerText()).length > 0, "Theory detail should contain a title");
  assert.match(await page.locator("#theory-category").innerText(), /^(文|Aa|“ ”)\s+/, "category header should put its icon before the category word");
  const headerHeightAfter = await page.locator("#theory-detail .theory-heading-stack").evaluate(el => el.getBoundingClientRect().height);
  assert.ok(headerHeightAfter >= headerHeightBefore, "cumulative heading rows should preserve their height during navigation");
  assert.equal(await page.locator("#theory-description [data-speak]").count(), 0, "short target-language items should not have play controls");
  await page.locator("#theory-back").click();
  assert.equal(await page.locator("#theory-topic-list").isVisible(), true, "detail back should return to the subtopic list");
  await page.locator("#theory-list-back").click();
  assert.equal(await page.locator("#theory-unit-list").isVisible(), true, "subtopic back should return to the unit list");

  await page.locator('.bottom-nav [data-screen="stats"]').click();
  await page.locator("#screen-stats").waitFor({ state: "visible" });
  assert.ok(await page.locator("#statistics-content").count() === 1, "Statistics content should remain mounted");
  assert.deepEqual(pageErrors, [], "navigation and preserved sections should not produce browser errors");

  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
