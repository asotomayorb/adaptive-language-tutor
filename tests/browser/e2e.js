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
    const topicBody = page.locator("#theory-description");
    const topicText = await topicBody.innerText();
    assert.equal(await topicBody.locator(".theory-subtopic-content").count(),1,"Unit 1 should use the shared subtopic wrapper");
    assert.equal(await topicBody.locator(".theory-subtopic-intro").count(),1,"Unit 1 should use the shared introduction block");
    assert.ok(await topicBody.locator(".theory-content-section").count()>0,"Unit 1 reference content should use shared sections");
    assert.equal(await topicBody.locator(".speak-button").count(),0,"Unit 1 should not show Play or speaker buttons");
    const allUnitOneTableCells = page.locator("#theory-description table tbody td");
    assert.ok(await allUnitOneTableCells.count() > 0, "each Unit 1 subtopic should render its comparison table");
    assert.ok((await allUnitOneTableCells.evaluateAll(cells => cells.map(cell => getComputedStyle(cell).fontSize))).every(size => size === "15px"), "all Unit 1 subtopic table body cells should use the common 15px mobile size");
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
      assert.ok(topicText.includes("omitir el pronombre sujeto") && topicText.includes("Lei") && topicText.includes("tercera persona singular"), "Unit 1 should explain subject omission and formal Lei agreement");
      assert.ok(topicText.includes("Sono di Santiago.") && topicText.includes("Sto bene."), "essere and stare should be contextualized with Italian examples");
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
    {title:"Artículos y concordancia", terms:["Artículos definidos","Artículos indefinidos","lo","masculino","gli","z, gn, ps o x","un’","femenino","il libro","i libri","lo studente","gli studenti","dei libri","degli amici","delle case"]},
    {title:"Artículos y adjetivos", terms:["ragazzo","ragazza","Due ragazzi italiani.","Un ragazzo interessante.","Una ragazza interessante.","Due ragazzi interessanti."]},
    {title:"Edad y procedencia", terms:["Quanti anni hai?","Di dove sei?","Ho vent’anni.","Vengo dal Cile.","essere di","venire da"]}
  ];
  for (let i=0;i<unitTwoChecks.length;i++) {
    await unitTwoTopics.nth(i).click();
    const check=unitTwoChecks[i];
    assert.equal(await page.locator("#theory-title").innerText(),check.title,"Unit 2 topic title should match its content");
    const body=page.locator("#theory-description");
    assert.equal(await body.locator(".theory-subtopic-content").count(),1,"every developed topic should use the shared content wrapper");
    assert.equal(await body.locator(".theory-subtopic-intro").count(),1,"every developed topic should begin with one concise introduction");
    assert.ok(await body.locator(".theory-content-section").count()>0,"every developed topic should group its reference material into sections");
    assert.equal(await body.locator(".speak-button").count(),0,"Theory must not show Play or speaker buttons");
    const allTableCells=body.locator("table tbody td");
    if (await allTableCells.count()) {
      const tableBodySizes=await allTableCells.evaluateAll(cells=>cells.map(cell=>getComputedStyle(cell).fontSize));
      assert.ok(tableBodySizes.every(size=>size==="15px"),"all Unit 2 subtopic tables should use the same 15px mobile body text as Articles and Adjectives");
    }
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
      assert.equal(await body.locator(".theory-slide-text").count(),2,"article subtopic should explain concordance and plural indefinite forms");
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
      assert.deepEqual(await examples.locator("tbody tr td:first-child").allInnerTexts(),["-o","-a","-i","-e (m./f.)","-i (de -e)"],"examples should cover masculine/feminine and singular/plural agreement");
      assert.equal(await examples.locator(".theory-target-tap[role=button]").count(),7,"each Italian example phrase should have its own tappable TTS control");
      const adjectiveTables=body.locator(".adjective-rules-table, .adjective-vocabulary-table, .adjective-examples-table");
      const dimensions=await adjectiveTables.evaluateAll(nodes=>nodes.map(node=>({width:Math.round(node.getBoundingClientRect().width),fonts:[...node.querySelectorAll("tbody td")].map(cell=>getComputedStyle(cell).fontSize),wrap:[...node.querySelectorAll("th,td")].map(cell=>({overflow:getComputedStyle(cell).overflowWrap,word:getComputedStyle(cell).wordBreak,hyphens:getComputedStyle(cell).hyphens}))})));
      assert.ok(dimensions.every(item=>item.width===dimensions[0].width && item.fonts.every(font=>font==="15px")),"adjective tables should share the same width and readable, uniform 15px mobile body text");
      assert.ok(dimensions.every(item=>item.wrap.every(style=>style.overflow==="normal" && style.word==="normal" && style.hyphens==="none")),"table cells must wrap only between words and never split a word");
      assert.equal(await body.locator(".theory-slide-text").first().evaluate(el=>getComputedStyle(el).overflowWrap),"normal","explanatory paragraphs must not split words either");
      assert.ok((await examples.innerText()).includes("Un chico italiano.") && (await examples.innerText()).includes("Dos chicos italianos.") && (await examples.innerText()).includes("Dos chicas interesantes."),"examples should retain varied Spanish translations");
    }
    if(i===0) {
      const countryTable=body.locator("table.country-language-table");
      assert.equal(await countryTable.count(),1,"country-language table should use the balanced layout");
      const headerWidths=await countryTable.locator("thead th").evaluateAll(cells=>cells.map(cell=>cell.getBoundingClientRect().width));
      assert.ok(headerWidths[1]>=headerWidths[0] && headerWidths[1]>=headerWidths[2],"the longer demonym column should receive more space");
      const tableMetrics=await countryTable.evaluate(el=>({right:el.getBoundingClientRect().right,parentRight:el.parentElement.getBoundingClientRect().right,cells:[...el.querySelectorAll("tbody tr:first-child td")].map(td=>({scrollWidth:td.scrollWidth,clientWidth:td.clientWidth}))}));
      assert.ok(tableMetrics.right<=tableMetrics.parentRight+1,"country table must stay within its content container");
      assert.ok(tableMetrics.cells.every(cell=>cell.scrollWidth<=cell.clientWidth+1),"country table text must wrap without overflowing its cells");
      assert.ok(Math.max(...headerWidths)-Math.min(...headerWidths)>2,"column widths should adapt to content rather than be identical");
      const countryRows=countryTable.locator("tbody tr");
      for(let rowIndex=0;rowIndex<await countryRows.count();rowIndex++) {
        const cellHeights=await countryRows.nth(rowIndex).locator("td").evaluateAll(cells=>cells.map(cell=>cell.getBoundingClientRect().height));
        assert.ok(Math.max(...cellHeights)-Math.min(...cellHeights)<2,"cells in each country row should have uniform heights");
      }
      assert.equal(await countryTable.locator(".speak-button").count(),0,"country-language table should not display Play buttons");
      const firstRow=countryRows.first();
      assert.equal(await firstRow.locator("td").count(),3,"country, demonym and language must have separate columns");
      assert.ok((await firstRow.locator("td").first().innerText()).includes("(Italia)"),"country cell should keep Spanish translation in parentheses");
      for(let cellIndex=1;cellIndex<3;cellIndex++) {
        assert.equal(await countryRows.locator("td").nth(cellIndex).locator(".theory-translation").count(),0,"parenthetical Spanish translations belong only in the first column");
      }
      const countryTargets=firstRow.locator("td").first().locator(".theory-target-tap[role=button]");
      assert.equal(await countryTargets.count(),1,"Italian country name should remain individually tappable for pronunciation");
      const demonymTargets=firstRow.locator("td").nth(1).locator(".theory-target-tap[role=button]");
      assert.equal(await demonymTargets.count(),2,"slash-separated demonym forms should have independent pronunciation targets");
      assert.equal(await firstRow.locator("td").nth(1).locator(".theory-variant-separator").first().getAttribute("data-separator"),"/","the original slash separator should remain visible between separately pronounceable forms");
      for(let cellIndex=1;cellIndex<3;cellIndex++) assert.ok(await firstRow.locator("td").nth(cellIndex).locator(".theory-target-tap[role=button]").count()>0,"Italian demonym/language forms should remain individually tappable for pronunciation");
      assert.equal(await body.locator(".theory-subtopic-intro").count(),1,"country subtopic should use the shared introduction block");
    }
    if(i===3) { assert.ok(!(await body.innerText()).includes("(formal)"),"translations should not contain parenthetical mini-explanations"); assert.ok((await body.innerText()).includes("Hai / sei") && (await body.innerText()).includes("ha / è"),"age and origin should distinguish informal and formal forms"); }
    await page.locator("#theory-back").click();
  }
  await unitRows.nth(2).click();
  const unitThreeTopics=page.locator("#theory-tree .theory-tree-topic");
  const unitThreeChecks=[
    {title:"Familia",terms:["la madre","il padre","i genitori","Mia sorella si chiama Anna."]},
    {title:"Profesiones",terms:["il medico","la medica","lo studente","la studentessa","Sono insegnante."]},
    {title:"Rutinas y lugares",terms:["svegliarsi","fare colazione","la casa","l’ufficio","Mi sveglio alle sette."]},
    {title:"Días y fechas",terms:["lunedì","domenica","gennaio","Il mio compleanno è il primo maggio."]},
    {title:"Presente habitual",terms:["parlare","prendere","dormire","parliamo","Lavoro in ufficio."]},
    {title:"Pasado (passato prossimo)",terms:["avere","essere","-ato","fatto","Sono arrivata a casa.","Ieri ho studiato italiano."]},
    {title:"Futuro simple",terms:["futuro semplice","parlerò","prenderai","sar-","Domani lavorerò da casa."]},
    {title:"Rutinas diarias",terms:["Mi sveglio alle sette.","Faccio colazione e vado al lavoro.","Vado a letto alle dieci e mezza."]},
    {title:"La hora",terms:["Che ora è?","È l’una.","Sono le due.","e un quarto","meno un quarto","A che ora lavori?"]}
  ];
  assert.deepEqual(await unitThreeTopics.locator(".theory-tree-topic-name").allInnerTexts(),unitThreeChecks.map(item=>item.title),"Unit 3 should retain the nine planned subtopics in the specified order");
  for(let i=0;i<unitThreeChecks.length;i++){
    await unitThreeTopics.nth(i).click();
    const check=unitThreeChecks[i];
    assert.equal(await page.locator("#theory-title").innerText(),check.title,"Unit 3 topic title should match its content");
    const body=page.locator("#theory-description");
    assert.equal(await body.locator(".theory-subtopic-content").count(),1,"Unit 3 should use the shared content wrapper");
    assert.equal(await body.locator(".theory-subtopic-intro").count(),1,"Unit 3 should include one concise introduction");
    assert.ok(await body.locator(".theory-content-section").count()>0,"Unit 3 should group its reference content into sections");
    assert.ok(await body.locator("table").count()>0,"each Unit 3 topic should include a reference table");
    assert.equal(await body.locator(".speak-button").count(),0,"no Play or speaker buttons should appear in Unit 3");
    const content=(await body.innerText()).replace(/\s+/g," ");
    for(const term of check.terms) assert.ok(content.includes(term),"Unit 3 content should include "+term);
    const targets=body.locator(".theory-target-tap[role=button]");
    assert.ok(await targets.count()>0,"Italian reference terms should be individually tappable");
    assert.ok(await targets.evaluateAll(nodes=>nodes.every(node=>node.dataset.locale==="it-IT")),"all pronunciation targets must use Italian voice locale");
    await page.locator("#theory-back").click();
  }
  for (let unitIndex=3;unitIndex<await unitRows.count();unitIndex++) {
    await unitRows.nth(unitIndex).click();
    const laterTopics=page.locator("#theory-tree .theory-tree-topic");
    assert.ok(await laterTopics.count()>0,"later units must retain their planned subtopic titles");
    for (let topicIndex=0;topicIndex<await laterTopics.count();topicIndex++) {
      const laterTitle=await laterTopics.nth(topicIndex).locator(".theory-tree-topic-name").innerText();
      await laterTopics.nth(topicIndex).click();
      assert.ok((await page.locator("#theory-title").innerText()).toLocaleLowerCase().includes(laterTitle.split(" (")[0].toLocaleLowerCase()),"later-unit subtopic title must be preserved");
      assert.equal((await page.locator("#theory-description").innerText()).trim(),"","Units 3–6 must contain no lesson text or residual data");
      assert.equal(await page.locator("#theory-description table").count(),0,"Units 3–6 must contain no residual tables");
      await page.locator("#theory-back").click();
    }
  }
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
  // Use a developed Unit 1 topic for pronunciation interaction; Units 1–3 share the same tap-to-speak model.
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
