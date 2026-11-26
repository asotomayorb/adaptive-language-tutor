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
  assert.equal(await unitRows.count(), 6, "A1 should preserve its six-unit hierarchy");
  assert.deepEqual(await page.locator("#theory-tree .theory-unit-number").allInnerTexts(), ["1.","2.","3.","4.","5.","6."], "only units should carry Arabic numbering");
  await unitRows.nth(0).click();
  assert.equal(await unitRows.nth(0).getAttribute("aria-expanded"), "true", "the first unit should expand");
  assert.ok(await page.locator("#theory-tree .theory-tree-topic").count() > 0, "the expanded unit should reveal its subtopics");
  assert.equal(await page.locator("#theory-tree .theory-tree-topic").first().locator(".theory-tree-topic-name").innerText(), "Saludos y despedidas", "Unit 1 should begin with its greeting topic");
  assert.equal(await page.locator("#theory-tree .theory-tree-topic .theory-unit-number").count(), 0, "subtopics must not receive unit numbering");
  assert.equal(await page.locator("#theory-tree .theory-tree-connector").count(), 0, "subtopics must not retain duplicate branch connectors");
  assert.equal(await page.locator("#theory-tree .theory-tree-marker").evaluateAll(nodes => nodes.every(el => getComputedStyle(el).display === "none")), true, "subtopic bullets should be removed while category glyphs remain");
  const unitOneTopics = page.locator("#theory-tree .theory-tree-topic");
  assert.equal(await unitOneTopics.count(), 4, "Unit 1 should contain exactly four focused subtopics");
  const unitOneChecks = [
    { title:"Saludos y despedidas", term:"Buongiorno", paired:"Buonasera" },
    { title:"Decir el nombre", term:"Mi chiamo", paired:"Come si chiama?" },
    { title:"Cómo estás", term:"Come stai?", paired:"Come sta?" },
    { title:"Pronombres y ser/estar", term:"Essere", paired:"Stare" }
  ];
  for (let i = 0; i < unitOneChecks.length; i++) {
    await unitOneTopics.nth(i).click();
    assert.equal(await page.locator("#theory-title").innerText(), unitOneChecks[i].title, "Unit 1 topic title should match its content");
    const topicText = await page.locator("#theory-description").innerText();
    assert.ok(topicText.includes(unitOneChecks[i].term), "Unit 1 topic should contain its own relevant Italian content");
    assert.ok(topicText.toLowerCase().includes(unitOneChecks[i].paired.toLowerCase()), "Unit 1 topic should include its related variant or concept");
    assert.deepEqual((await page.locator("#theory-description table").first().locator("thead th").allInnerTexts()).map(value => value.toLowerCase()), ["italiano","español"], "bilingual Unit 1 tables should use Italian and Spanish headings");
    if (i === 0) {
      const greetingCell = page.locator("#theory-description table tbody tr").first().locator("td").first();
      assert.equal(await greetingCell.locator(".theory-speech-variant").count(), 2, "paired greeting variants should share one cell with separate speech controls");
      assert.ok((await greetingCell.innerText()).includes("Buonasera"), "the second greeting variant should remain in the same cell");
    }
    if (i === 1) {
      const nameQuestionCell = page.locator("#theory-description table tbody tr").nth(1).locator("td").first();
      assert.equal(await nameQuestionCell.locator(".theory-speech-variant").count(), 2, "formal and informal name questions should share one cell with separate speech controls");
    }
    if (i === 2) {
      const stateQuestionCell = page.locator("#theory-description table tbody tr").first().locator("td").first();
      assert.equal(await stateQuestionCell.locator(".theory-speech-variant").count(), 2, "formal and informal state questions should share one cell with separate speech controls");
    }
    if (i === 3) {
      const verbHeading = page.locator("#theory-description h3").nth(1);
      assert.equal(await verbHeading.innerText(), "Verbos «Essere» (ser) y «Stare» (estar)", "Italian terms in subtopic headings should be italicized, quoted and translated");
      assert.equal(await verbHeading.locator("em").count(), 2, "Italian terms should be italicized only in the heading");
      const verbTable = page.locator("#theory-description table").nth(1);
      assert.deepEqual((await verbTable.locator("thead th").allInnerTexts()).map(value => value.toLowerCase()), ["persona","essere","stare"], "table headers must remain plain, without italics, quotes or translations");
      assert.equal(await verbTable.locator("thead em").count(), 0, "table headers must not inherit Italian title formatting");
      const verbTableSizes = await verbTable.locator("tbody tr").first().locator("td").evaluateAll(cells => cells.map(cell => getComputedStyle(cell).fontSize));
      assert.equal(new Set(verbTableSizes).size, 1, "all columns in the final verb table should use the same font size");
    }
    const italianTargets = page.locator("#theory-description table tbody td:first-child .theory-target-word");
    assert.ok(await italianTargets.count() > 0, "each Unit 1 topic should expose Italian target expressions in its content tables");
    const italianCellSize = await page.locator("#theory-description table").first().locator("tbody tr").first().locator("td").first().locator(".theory-target-word").first().evaluate(el => getComputedStyle(el).fontSize);
    const spanishCellSize = await page.locator("#theory-description table").first().locator("tbody tr").first().locator("td").nth(1).evaluate(el => getComputedStyle(el).fontSize);
    assert.equal(spanishCellSize, italianCellSize, "Spanish translations should match Italian text size in bilingual tables");
    if (i === 0) {
      const greetingCell = page.locator("#theory-description table").first().locator("tbody tr").first().locator("td").first();
      const variants = greetingCell.locator(".theory-speech-variant .theory-target-tap");
      assert.equal(await variants.count(), 2, "slash-separated phrases should expose independent tappable pronunciation targets");
      for (let variantIndex = 0; variantIndex < 2; variantIndex++) {
        await variants.nth(variantIndex).click();
        await page.waitForFunction(count => window.__spoken?.length >= count, variantIndex + 1);
        const expected = await variants.nth(variantIndex).getAttribute("data-speak");
        assert.equal(await page.evaluate(() => window.__spoken.at(-1).text), expected, "each variant control should pronounce only its own phrase");
      }
    }
    await page.locator("#theory-back").click();
  }
  assert.equal(await page.locator("#screen-theory .screen-heading").evaluate(el => getComputedStyle(el).position), "sticky", "only the Theory section heading should stick in the hierarchy menu");
  assert.equal(await page.locator("#theory-level-heading").evaluate(el => getComputedStyle(el).position), "static", "stage heading should scroll normally");
  assert.equal(await page.locator("#theory-tree .theory-tree-unit.is-expanded .theory-unit-row").evaluate(el => getComputedStyle(el).position), "static", "expanded unit heading should scroll normally");
  assert.equal(await page.locator("#theory-tree .theory-tree-topic").first().evaluate(el => getComputedStyle(el).backgroundColor), "rgba(0, 0, 0, 0)", "subtopics should remain visually open rather than becoming cards");
  assert.equal(await page.locator("#theory-tree .theory-tree-topic").first().locator(".theory-topic-completion-slot").count(), 1, "subtopics should reserve a left slot for future Route completion checks");
  assert.equal(await page.locator("#theory-tree .theory-tree-branches").first().evaluate(el => parseFloat(getComputedStyle(el).marginLeft)) >= 34, true, "subtopics should be indented to make room for future checks");

  assert.equal(await page.locator("#theory-tree .theory-tree-unit").first().evaluate(el => getComputedStyle(el).borderLeftWidth), "0px", "unit hierarchy should use the approved blue cells without a duplicate branch border");
  const hierarchyFontSizes = await page.locator("#theory-level-heading, #theory-tree .theory-unit-name, #theory-tree .theory-tree-topic-name").evaluateAll(nodes => nodes.map(el => getComputedStyle(el).fontSize));
  assert.ok(hierarchyFontSizes.every(size => size === "16px"), "stage, unit and subtopic labels should share the A1 heading font size");
  await unitRows.nth(1).click();
  assert.equal(await page.locator("#theory-tree .theory-unit-row[aria-expanded='true']").count(), 1, "only one unit may remain expanded at a time");
  assert.equal(await unitRows.nth(0).getAttribute("aria-expanded"), "false", "opening another unit should collapse the previous one");
  assert.equal(await unitRows.nth(1).getAttribute("aria-expanded"), "true", "the newly selected unit should be expanded");
  const unitTwoTopics = page.locator("#theory-tree .theory-tree-topic");
  assert.deepEqual(await unitTwoTopics.locator(".theory-tree-topic-name").allInnerTexts(), ["Países e idiomas","Artículos y concordancia","Artículos y adjetivos","Edad y procedencia"], "Unit 2 should retain its four planned subtopics");
  const unitTwoChecks = [
    {title:"Países e idiomas", terms:["(Italia)","italiano"]},
    {title:"Artículos y concordancia", terms:["Artículos definidos","Artículos indefinidos","lo","masculino","gli","z, gn, ps o x","un’","femenino"]},
    {title:"Artículos y adjetivos", terms:["ragazzo","ragazza"]},
    {title:"Edad y procedencia", terms:["Quanti anni hai?","Di dove sei?","Ho vent’anni."]}
  ];
  for (let i=0;i<unitTwoChecks.length;i++) {
    await unitTwoTopics.nth(i).click();
    const check=unitTwoChecks[i];
    assert.equal(await page.locator("#theory-title").innerText(),check.title,"Unit 2 topic title should match its content");
    const body=page.locator("#theory-description");
    const bodyText=(await body.innerText()).replace(/\s+/g," ").trim();
    for (const term of check.terms) assert.ok(bodyText.includes(term), "Unit 2 content should include "+term);
    if (check.heading) {
      const heading=body.locator("h3").filter({hasText:check.heading}).first();
      assert.ok(await heading.locator("em").count()>0,"Italian headings should use italics and angle quotes");
      assert.ok((await heading.innerText()).includes(" ("),"Italian headings should include Spanish translations");
    }
    const tables=body.locator("table");
    assert.ok(await tables.count()>0,"each Unit 2 subtopic should contain a reference table");
    for (let tableIndex=0;tableIndex<await tables.count();tableIndex++) {
      const table=tables.nth(tableIndex);
      const headers=(await table.locator("thead th").allInnerTexts()).map(v=>v.trim().toLowerCase());
      if(i===0) assert.deepEqual(headers,["país","gentilicio","idioma"],"country table should identify country, demonym and language separately");
      else if(i===1) assert.deepEqual(headers,["singular","plural","sustantivo / regla"],"article tables should use the approved three-column scheme");
      else if(i===2 && tableIndex===0) assert.deepEqual(headers,["terminación","femenino","plural"],"adjective rule table should show endings, feminine and plural forms");
      else if(i===2 && tableIndex===1) assert.deepEqual(headers,["italiano","español"],"adjective vocabulary should use Italian and Spanish columns");
      else if(i===2 && tableIndex===2) assert.deepEqual(headers,["terminación","ejemplo aplicado"],"adjective examples should be organized by ending");
      else assert.deepEqual(headers,["italiano","español"],"bilingual tables should use consistent column headings");
      assert.equal(await table.locator("thead em").count(),0,"table headings must remain plain");
      const widths=await table.locator("thead th").evaluateAll(cells=>cells.map(cell=>cell.getBoundingClientRect().width));
      assert.ok(widths.every(width=>width>0),"table columns should have measurable widths");
    }
    if(i===1) {
      assert.equal(await body.locator(".theory-rule-list").count(),0,"article intro should not be a bullet list");
      assert.equal(await body.locator(".theory-slide-text").count(),1,"article subtopic should retain only the concordance sentence");
      assert.ok(!(await body.innerText()).includes("…"),"article rules should not end in an unexplained ellipsis");
    }
    if(i===2) {
      assert.equal(await body.locator(".theory-slide-text").count(),1,"adjectives should retain one introductory paragraph");
      assert.equal(await body.locator(".theory-rule-list").count(),0,"adjective rules should use a simple table, not extended bullets");
      const rules=body.locator(".adjective-rules-table");
      assert.deepEqual((await rules.locator("tbody tr").allInnerTexts()).map(value=>value.replace(/\s+/g," ").trim()),["-o -a -i (masculino) / -e (femenino)","-e — -i (masculino y femenino)"],"adjective endings should map to feminine and plural forms");
      const vocabulary=body.locator(".adjective-vocabulary-table");
      assert.deepEqual((await vocabulary.locator("tbody tr").allInnerTexts()).map(value=>value.replace(/\s+/g," ").trim()),["bello bonito","buono bueno","grande grande","nuovo nuevo","piccolo pequeño","interessante interesante"],"frequent adjectives should appear with Spanish meanings before the examples");
      assert.equal(await vocabulary.locator(".theory-target-tap[role=button]").count(),6,"each vocabulary adjective should have its own tappable TTS control");
      const examples=body.locator(".adjective-examples-table");
      assert.deepEqual(await examples.locator("tbody tr td:first-child").allInnerTexts(),["-o","-a","-e → -i"],"examples should be keyed by ending, not pronoun");
      assert.equal(await examples.locator(".theory-target-tap[role=button]").count(),3,"each Italian example should have its own tappable TTS control");
      const adjectiveTables=body.locator(".adjective-rules-table, .adjective-vocabulary-table, .adjective-examples-table");
      const dimensions=await adjectiveTables.evaluateAll(nodes=>nodes.map(node=>({width:Math.round(node.getBoundingClientRect().width),font:getComputedStyle(node.querySelector("td")).fontSize})));
      assert.ok(dimensions.every(item=>item.width===dimensions[0].width && item.font===dimensions[0].font),"adjective tables should share the same width and cell font size");
      assert.ok((await examples.innerText()).includes("Un chico italiano.") && (await examples.innerText()).includes("Dos chicas interesantes."),"examples should retain Spanish translations");
    }
    if(i===0) {
      assert.equal(await body.locator(".theory-slide-text").count(),0,"country subtopic should not contain an unnecessary closing paragraph");
      const firstRow=body.locator("table").first().locator("tbody tr").first();
      assert.equal(await firstRow.locator("td").count(),3,"country, demonym and language must have separate columns");
      assert.ok((await firstRow.locator("td").first().innerText()).includes("(Italia)"),"country cell should keep Spanish translation in parentheses");
      assert.equal(await firstRow.locator("td").first().locator(".theory-target-tap[role=button]").count(),1,"Italian country name should remain individually tappable for pronunciation");
      for(let cellIndex=1;cellIndex<3;cellIndex++) assert.ok(await firstRow.locator("td").nth(cellIndex).locator(".theory-target-tap[role=button]").count()>0,"foreign demonym/language cells should remain individually tappable for pronunciation");
    }
    if(i===3) assert.ok(!(await body.innerText()).includes("(formal)"),"translations should not contain parenthetical mini-explanations");
    await page.locator("#theory-back").click();
  }
  await unitRows.nth(2).click();
  const unitThreeTopics=page.locator("#theory-tree .theory-tree-topic");
  const unitThreeTitle=await unitThreeTopics.first().locator(".theory-tree-topic-name").innerText();
  await unitThreeTopics.first().click();
  assert.equal(await page.locator("#theory-title").innerText(),unitThreeTitle,"later-unit subtopic titles must be preserved");
  assert.equal((await page.locator("#theory-description").innerText()).trim(),"","later-unit subtopics should have no lesson content until developed");
  await page.locator("#theory-back").click();
  await unitRows.nth(1).click();
  const topicButton = page.locator("#theory-tree .theory-tree-topic").first();
  await topicButton.click();
  assert.equal(await page.locator("#theory-detail").isVisible(), true, "Theory topic detail should open");
  assert.equal(await page.locator("#theory-level-list").isVisible(), false, "detail should replace the dropdown stack in-flow");
  assert.equal(await page.locator("#theory-detail").evaluate(el => getComputedStyle(el).position), "static", "detail should not be fullscreen/fixed");
  assert.ok((await page.locator("#theory-title").innerText()).length > 0, "Theory detail should contain a title");
  const categoryHeading = (await page.locator("#theory-category").textContent()).trim();
  assert.ok(["Gramática","Vocabulario","Expresiones"].some(label => categoryHeading.includes(label)), "category label should remain readable next to its new line icon");
  assert.equal(await page.locator("#theory-tree .theory-tree-unit.is-expanded .theory-unit-row").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(227, 239, 250)", "unit cells should use the soft blue background");
  assert.equal(await page.locator("#theory-tree .theory-unit-number").first().evaluate(el => getComputedStyle(el).color), "rgb(38, 62, 89)", "unit numbering should remain neutral");
  assert.equal(await page.locator("#theory-tree .theory-unit-name").first().evaluate(el => getComputedStyle(el).color), "rgb(49, 91, 133)", "unit title should use the blue text accent");
  assert.equal(await page.locator("#theory-tree .theory-unit-number").first().getAttribute("style"), "color:#263e59!important;-webkit-text-fill-color:#263e59", "unit numbering must carry an explicit neutral color");
  assert.equal(await page.locator("#theory-tree .theory-unit-name").first().getAttribute("style"), "color:#315b85!important;-webkit-text-fill-color:#315b85", "unit name must carry the blue accent explicitly");
  assert.equal(await page.locator("#theory-tree").evaluate(el => getComputedStyle(el).rowGap), "0px", "unit list should not add extra row gaps");
  assert.equal(await page.locator("#theory-tree .theory-tree-unit").first().evaluate(el => getComputedStyle(el).marginBottom), "2px", "spacing between units should be compact");
  // Content-specific assertions above cover Unit 1; category navigation is tested in its dedicated flow.
  assert.equal(await page.locator("#theory-breadcrumb").innerText(), "A1 · Principiante > Datos personales y entorno", "breadcrumb should identify the expanded unit");
   assert.equal(await page.locator(".theory-detail-topbar #theory-back").count(), 1, "back arrow should sit in the left slot of the top row");
   assert.equal(await page.locator(".theory-detail-topbar .section-detail-title").innerText(), "Teoría", "detail header should identify the section");
   assert.equal(await page.locator(".theory-detail-topbar #theory-audio-toggle").count(), 1, "detail header should include audio control");
   assert.equal(await page.locator(".theory-detail-topbar #theory-breadcrumb").count(), 0, "hierarchy breadcrumb should not occupy the detail header");
   assert.ok(await page.locator("#theory-category").evaluate(el => el.parentElement.classList.contains("theory-topic-heading")), "category and title should align left in their own block");
  assert.ok(await page.locator("#theory-counter").evaluate(el => el.parentElement.classList.contains("theory-topic-title-row")), "subtopic counter should share the title row");
  assert.equal(await page.locator(".theory-topic-title-row #theory-counter").count(), 1, "counter should appear exactly once beside the subtopic title");
  assert.match(await page.locator("#theory-tree [data-category=" + '"vocabulary"' + "] .theory-tree-category-icon").innerText().catch(() => ""), /abc/i, "vocabulary icon should expose bilingual letter glyph");
   assert.ok(await page.locator("#theory-tree .theory-tree-category-icon svg").count() > 0, "category rows should use line icons rather than the former text glyphs");
  assert.equal(await page.locator("#theory-detail .back-control").count(), 1, "detail should contain exactly one back arrow");
  // Unit 2 remains a content skeleton; use a developed Unit 1 topic for pronunciation interaction.
  await page.locator("#theory-back").click();
  await unitRows.nth(0).click();
  await page.locator("#theory-tree .theory-tree-topic").first().click();
  const manualPronunciation = page.locator("#theory-description .theory-target-tap").first();
  assert.ok(await manualPronunciation.count() > 0, "short target-language text should be directly tappable");
  assert.equal(await manualPronunciation.getAttribute("data-locale"), "it-IT", "Italian target text must declare the it-IT locale");
  assert.equal(await manualPronunciation.getAttribute("role"), "button", "tappable target text should expose button semantics");
  await manualPronunciation.click();
  await page.waitForFunction(() => window.__spoken?.length > 0);
  assert.equal(await page.evaluate(() => window.__spoken.at(-1).lang), "it-IT", "tapping target text must invoke the Italian voice");
  assert.equal(await page.evaluate(() => window.__spoken.at(-1).text.replace(/\s*\/\s*/g, " / ").replace(/\s+/g, " ").trim()), (await manualPronunciation.innerText()).replace(/\s*\/\s*/g, " / ").replace(/\s+/g, " ").trim(), "tapping target text must read that exact text, ignoring visual line breaks");
  assert.equal(await page.locator("#theory-description .theory-target-tap + .speak-button").count(), 0, "short target text must not show a redundant play icon");
  assert.ok(await page.locator("#theory-detail .theory-topic-heading").evaluate(el => parseFloat(getComputedStyle(el).marginBottom) <= 4), "detail heading should sit close to the start of its explanation");
  assert.ok(await page.locator("#theory-detail .theory-slide-content").evaluate(el => parseFloat(getComputedStyle(el).paddingTop) <= 2), "theory body should start close below the topic heading");
  await page.locator("#theory-back").click();
  assert.equal(await page.locator("#theory-level-list").isVisible(), true, "the single back arrow should return to the unit tree");
  assert.equal(await page.locator("#theory-tree .theory-unit-row[aria-expanded='true']").count(), 1, "returning from detail should preserve the expanded unit");

  await page.locator('.bottom-nav [data-screen="stats"]').click();
  await page.locator("#screen-stats").waitFor({ state: "visible" });
  assert.ok(await page.locator("#statistics-content").count() === 1, "Statistics content should remain mounted");
  assert.equal(await page.locator("#screen-stats > .screen-heading").evaluate(el => getComputedStyle(el).position), "sticky", "Statistics section title should remain fixed while scrolling, like other sections");
  assert.deepEqual(pageErrors, [], "navigation and preserved sections should not produce browser errors");

  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
