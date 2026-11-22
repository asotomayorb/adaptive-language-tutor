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
  await page.locator("#theory-level-select").selectOption("a1");
  assert.equal(await page.locator("#theory-unit-field").isVisible(), true, "selecting a level should reveal the unit dropdown");
  assert.equal(await page.locator("#theory-unit-select option").count(), 7, "A1 should offer six units plus its placeholder");
  await page.locator("#theory-unit-select").selectOption("0");
  assert.equal(await page.locator("#theory-topic-field").isVisible(), true, "selecting a unit should reveal the subtopic dropdown");
  assert.ok(await page.locator("#theory-topic-select optgroup").count() > 0, "subtopics should be grouped by grammar, vocabulary and expressions");
  await page.locator("#theory-topic-select").selectOption("0");
  assert.equal(await page.locator("#theory-detail").isVisible(), true, "Theory topic detail should open");
  assert.equal(await page.locator("#theory-level-list").isVisible(), false, "detail should replace the dropdown stack in-flow");
  assert.equal(await page.locator("#theory-detail").evaluate(el => getComputedStyle(el).position), "static", "detail should not be fullscreen/fixed");
  assert.ok((await page.locator("#theory-title").innerText()).length > 0, "Theory detail should contain a title");
  assert.match(await page.locator("#theory-category").innerText(), /^(文|Aa|“ ”)\\s+/, "category header should put its icon before the category word");
  assert.equal(await page.locator("#theory-breadcrumb").innerText(), "A1 · Principiante > Primeros contactos", "breadcrumb should sit below the topic title in smaller text");
  assert.equal(await page.locator("#theory-detail .back-control").count(), 1, "detail should contain exactly one back arrow");
  assert.equal(await page.locator("#theory-description [data-speak]").count(), 0, "short target-language items should not have play controls");
  await page.locator("#theory-back").click();
  assert.equal(await page.locator("#theory-level-list").isVisible(), true, "the single back arrow should return to the hierarchical dropdowns");

  await page.locator('.bottom-nav [data-screen="stats"]').click();
  await page.locator("#screen-stats").waitFor({ state: "visible" });
  assert.ok(await page.locator("#statistics-content").count() === 1, "Statistics content should remain mounted");
  assert.deepEqual(pageErrors, [], "navigation and preserved sections should not produce browser errors");

  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
