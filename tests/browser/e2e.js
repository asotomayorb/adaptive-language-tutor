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
  await page.locator("#hint-btn").click();
  await page.locator("#feedback").waitFor({ state: "visible" });

  // Complete the configured eight-turn local session.
  for (let turn = 0; turn < 8; turn += 1) {
    await page.locator("#answer-area [data-choice]").first().click();
    if (turn < 7) {
      await page.getByRole("button", { name: "Continuar →" }).click();
    }
  }
  await page.getByRole("button", { name: "Ver resumen →" }).click();
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

  console.log("Browser E2E passed: setup, diagnostic, hint, 8-turn practice, summary, persistence, export and restart.");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
