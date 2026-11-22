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
    window.__spoken = [];
    const synth = {
      getVoices: () => [{ name: "Italian", lang: "it-IT" }, { name: "Spanish", lang: "es-CL" }],
      speak: utterance => { window.__spoken.push({ text:utterance.text, lang:utterance.lang }); setTimeout(() => utterance.onend?.(), 0); },
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
  assert.equal(await page.locator("#theory-level-heading").innerText(), "A1 · Principiante", "the stage should remain as a simple hierarchy heading");
  const unitRows = page.locator("#theory-tree .theory-unit-row");
  assert.equal(await unitRows.count(), 6, "A1 should show its six units");
  assert.deepEqual(await page.locator("#theory-tree .theory-unit-number").allInnerTexts(), ["1.","2.","3.","4.","5.","6."], "only units should carry Arabic numbering");
  await unitRows.nth(0).click();
  assert.equal(await unitRows.nth(0).getAttribute("aria-expanded"), "true", "the first unit should expand");
  assert.ok(await page.locator("#theory-tree .theory-tree-topic").count() > 0, "the expanded unit should reveal its subtopics");
  assert.equal(await page.locator("#theory-tree .theory-tree-topic").first().locator(".theory-tree-topic-name").innerText(), "Pronombres personales", "subtopics should retain their existing names");
  assert.equal(await page.locator("#theory-tree .theory-tree-topic .theory-unit-number").count(), 0, "subtopics must not receive unit numbering");
  assert.equal(await page.locator("#theory-tree .theory-tree-connector").count(), 0, "subtopics must not retain duplicate branch connectors");
  assert.ok(await page.locator("#theory-tree .theory-tree-marker").count() > 0, "each subtopic should use one simple marker");
  assert.equal(await page.locator("#theory-tree .theory-tree-unit").first().evaluate(el => getComputedStyle(el).borderLeftWidth), "2px", "the blue unit branch border should remain unchanged");
  await unitRows.nth(1).click();
  assert.equal(await page.locator("#theory-tree .theory-unit-row[aria-expanded='true']").count(), 1, "only one unit may remain expanded at a time");
  assert.equal(await unitRows.nth(0).getAttribute("aria-expanded"), "false", "opening another unit should collapse the previous one");
  assert.equal(await unitRows.nth(1).getAttribute("aria-expanded"), "true", "the newly selected unit should be expanded");
  const topicButton = page.locator("#theory-tree .theory-tree-topic").first();
  await topicButton.click();
  assert.equal(await page.locator("#theory-detail").isVisible(), true, "Theory topic detail should open");
  assert.equal(await page.locator("#theory-level-list").isVisible(), false, "detail should replace the dropdown stack in-flow");
  assert.equal(await page.locator("#theory-detail").evaluate(el => getComputedStyle(el).position), "static", "detail should not be fullscreen/fixed");
  assert.ok((await page.locator("#theory-title").innerText()).length > 0, "Theory detail should contain a title");
  const categoryHeading = await page.locator("#theory-category").innerText();
  assert.ok(["文","Aa","“ ”"].some(icon => categoryHeading.startsWith(icon + " ")), "category header should put its icon before the category word");
  assert.equal(await page.locator("#theory-breadcrumb").innerText(), "A1 · Principiante > Datos personales y entorno", "breadcrumb should identify the expanded unit");
  assert.ok(await page.locator("#theory-detail").locator("#theory-breadcrumb").evaluate(el => el.compareDocumentPosition(el.nextElementSibling) & Node.DOCUMENT_POSITION_FOLLOWING), "breadcrumb should precede the category and subtopic header");
  assert.equal(await page.locator("#theory-detail .back-control").count(), 1, "detail should contain exactly one back arrow");
  const manualPronunciation = page.locator("#theory-description [data-speak]").first();
  assert.ok(await manualPronunciation.count() > 0, "short target-language words should retain manual pronunciation controls");
  assert.equal(await manualPronunciation.getAttribute("data-locale"), "it-IT", "Italian pronunciation controls must declare the it-IT locale");
  await manualPronunciation.click();
  await page.waitForFunction(() => window.__spoken?.length > 0);
  assert.equal(await page.evaluate(() => window.__spoken.at(-1).lang), "it-IT", "manual pronunciation must invoke the Italian voice");
  assert.ok(await page.evaluate(() => window.__spoken.at(-1).text.length > 0), "manual pronunciation must send the selected target-language text");
  await page.locator("#theory-back").click();
  assert.equal(await page.locator("#theory-level-list").isVisible(), true, "the single back arrow should return to the unit tree");
  assert.equal(await page.locator("#theory-tree .theory-unit-row[aria-expanded='true']").count(), 1, "returning from detail should preserve the expanded unit");

  await page.locator('.bottom-nav [data-screen="stats"]').click();
  await page.locator("#screen-stats").waitFor({ state: "visible" });
  assert.ok(await page.locator("#statistics-content").count() === 1, "Statistics content should remain mounted");
  assert.deepEqual(pageErrors, [], "navigation and preserved sections should not produce browser errors");

  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
