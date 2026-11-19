import { createSession, recordAnswer, recordTutorEvaluation, evaluateAnswer, buildSummary, getAdaptation, applyLearnerUpdate } from "./core/pedagogy.js";
import { loadProgress, saveProgress, persistSession, getDueCards, gradeReview, getProgressStats } from "./core/storage.js";
import { ptBR } from "./content/pt-BR.js";
import { english } from "./content/en.js";
import { checkTutorHealth, requestTutorTurn } from "./core/tutor-client.js";
import { escapeHTML } from "./core/html.js";
import { createSpeechController } from "./core/speech.js";

const $ = id => document.getElementById(id);
const languageDefinitions = {
  "Portugués brasileño": { id:"pt-BR", label:"Portugués", locale:"pt-BR", flag:"🇧🇷", catalog:ptBR },
  "Inglés": { id:"en", label:"Inglés", locale:"en-US", flag:"🇺🇸", catalog:{ ...english, locale:"en-US" } },
  "Italiano": { id:"it-IT", label:"Italiano", locale:"it-IT", flag:"🇮🇹" },
  "Alemán": { id:"de-DE", label:"Alemán", locale:"de-DE", flag:"🇩🇪" },
  "Ruso": { id:"ru-RU", label:"Ruso", locale:"ru-RU", flag:"🇷🇺" },
  "Francés": { id:"fr-FR", label:"Francés", locale:"fr-FR", flag:"🇫🇷" },
  "Español": { id:"es-ES", label:"Español", locale:"es-ES", flag:"🇪🇸" },
  "Japonés": { id:"ja-JP", label:"Japonés", locale:"ja-JP", flag:"🇯🇵" },
  "Chino mandarín": { id:"zh-CN", label:"Chino mandarín", locale:"zh-CN", flag:"🇨🇳" },
  "Coreano": { id:"ko-KR", label:"Coreano", locale:"ko-KR", flag:"🇰🇷" },
  "Neerlandés": { id:"nl-NL", label:"Neerlandés", locale:"nl-NL", flag:"🇳🇱" },
  "Árabe": { id:"ar-SA", label:"Árabe", locale:"ar-SA", flag:"🇸🇦" },
  "Hindi": { id:"hi-IN", label:"Hindi", locale:"hi-IN", flag:"🇮🇳" },
  "Turco": { id:"tr-TR", label:"Turco", locale:"tr-TR", flag:"🇹🇷" },
  "Griego": { id:"el-GR", label:"Griego", locale:"el-GR", flag:"🇬🇷" },
  "Polaco": { id:"pl-PL", label:"Polaco", locale:"pl-PL", flag:"🇵🇱" },
  "Sueco": { id:"sv-SE", label:"Sueco", locale:"sv-SE", flag:"🇸🇪" },
  "Noruego": { id:"nb-NO", label:"Noruego", locale:"nb-NO", flag:"🇳🇴" },
  "Danés": { id:"da-DK", label:"Danés", locale:"da-DK", flag:"🇩🇰" },
  "Hebreo": { id:"he-IL", label:"Hebreo", locale:"he-IL", flag:"🇮🇱" },
  "Vietnamita": { id:"vi-VN", label:"Vietnamita", locale:"vi-VN", flag:"🇻🇳" },
  "Indonesio": { id:"id-ID", label:"Indonesio", locale:"id-ID", flag:"🇮🇩" },
  "Tailandés": { id:"th-TH", label:"Tailandés", locale:"th-TH", flag:"🇹🇭" }
};
const catalogs = Object.fromEntries(Object.entries(languageDefinitions).map(([name,definition]) => [name, definition.catalog || { id:definition.id, label:definition.label, locale:definition.locale, exercises:[] }]));
const speech = createSpeechController({ onStatus: updateAudioStatus });
function updateAudioStatus(status) {
  const toggles = [document.getElementById("audio-toggle"), document.getElementById("session-audio-toggle")].filter(Boolean);
  toggles.forEach(toggle => {
    toggle.textContent = status.enabled ? "🔊" : "🔇";
    toggle.setAttribute("aria-pressed", String(status.enabled));
    toggle.setAttribute("aria-label", status.enabled ? "Desactivar audio" : "Activar audio");
    toggle.title = status.enabled ? "Audio activado" : "Audio desactivado";
    toggle.classList.toggle("audio-off", !status.enabled);
  });
}

function toggleAudio() {
  const enabled = speech.setEnabled(!speech.enabled);
  if (enabled) {
    const visibleSegments = [...document.querySelectorAll("#lesson-content [data-speak], #answer-area [data-speak], #feedback [data-speak], #summary-content [data-speak]")]
      .filter(button => !button.closest(".hidden") && button.getClientRects().length > 0)
      .map(button => ({ text: button.dataset.speak, locale: button.dataset.locale }));
    speech.speakSequence(visibleSegments, { automatic: true });
  }
}
document.getElementById("audio-toggle")?.addEventListener("click", toggleAudio);
document.getElementById("session-audio-toggle")?.addEventListener("click", toggleAudio);
function speakerButton(text, locale) {
  return '<button class="speak-button" type="button" data-speak="' + escapeHTML(text) + '" data-locale="' + escapeHTML(locale || "") + '" aria-label="Reproducir pronunciación" title="Escuchar">▶</button>';
}
const spellingVariants = {
  color:["colour","En inglés estadounidense se escribe color; en inglés británico, colour."],
  favorite:["favourite","En inglés estadounidense se escribe favorite; en inglés británico, favourite."],
  center:["centre","En inglés estadounidense se escribe center; en inglés británico, centre."],
  theater:["theatre","En inglés estadounidense se escribe theater; en inglés británico, theatre."],
  traveled:["travelled","En inglés estadounidense se escribe traveled; en inglés británico, travelled."],
  organize:["organise","En inglés estadounidense se escribe organize; en inglés británico, organise."]
};
function renderVariantTerms(value) {
  let html = escapeHTML(value || "");
  if (!["en-US","en-GB"].includes(catalog?.locale)) return html;
  for (const [word] of Object.entries(spellingVariants)) {
    const expression = new RegExp("\\b(" + word + ")\\b", "gi");
    html = html.replace(expression, match => '<button class="variant-link" type="button" data-variant="' + match.toLowerCase() + '">' + match + '</button>');
  }
  return html;
}
function renderClickableTargetText(value) {
  return escapeHTML(value || "");
}
function bindTargetWords() {
  // Word-level translation was intentionally removed from exercise interactions.
}
function bindVariantLinks(root) {
  root.querySelectorAll("[data-variant]:not([data-variant-bound])").forEach(button => {
    button.dataset.variantBound = "true";
    button.addEventListener("click", () => {
      const word = button.dataset.variant;
      const [alternative, explanation] = spellingVariants[word];
      $("variant-word").textContent = word + " / " + alternative;
      $("variant-description").textContent = explanation;
      $("variant-dialog").showModal();
    });
  });
}

function bindSpeakerButtons(root) {
  root.querySelectorAll("[data-speak]:not([data-speech-bound])").forEach(button => {
    button.dataset.speechBound = "true";
    button.addEventListener("click", event => {
      event.stopPropagation();
      speech.speak(button.dataset.speak, button.dataset.locale || catalog?.locale);
    });
  });
}
function appendSpeechButtons(root, segments) {
  const locale = session?.config.languageLocale || session?.config.languageId;
  const valid = (segments || []).filter(item =>
    item && typeof item.text === "string" && item.text.trim() && item.locale === locale
  );
  if (!valid.length) return;
  root.insertAdjacentHTML("beforeend", valid.map(item => " " + speakerButton(item.text, item.locale)).join(""));
  bindSpeakerButtons(root);
}

function appendCatalogSpeech(root, exercise, field, includeTarget = false) {
  const locale = session?.config.languageLocale || catalog?.locale;
  const phrases = [
    ...(Array.isArray(exercise?.[field]) ? exercise[field] : []),
    ...(includeTarget && typeof exercise?.target === "string" ? [exercise.target] : [])
  ];
  const unique = [...new Set(phrases.filter(text => typeof text === "string" && text.trim()))];
  const segments = unique.map(text => ({ text, locale }));
  appendSpeechButtons(root, segments);
  speech.speakSequence(segments, { automatic: true });
}
function getExerciseSpeech(exercise) {
  if (exercise?.speechText && typeof exercise.speechText === "string") {
    return { text: exercise.speechText, locale: exercise.speechLocale || catalog?.locale || "und" };
  }
  const prompt = String(exercise?.prompt || "");
  const afterInstruction = prompt.includes(":") ? prompt.slice(prompt.indexOf(":") + 1) : prompt;
  const sentence = afterInstruction.replace(/\([^)]*\)/g, "").trim();
  const hasGap = /_{1,}|＿+/u.test(sentence);
  const spoken = sentence.replace(/_{1,}|＿+/gu, "…").replace(/[“”]/g, "").trim();
  const sourceInstruction = /^(?:¿?cómo dices|traduce|completa|elige|selecciona|responde|corrige|escucha|marca)\b/i.test(sentence);
  return {
    text: spoken || prompt,
    locale: prompt.includes(":") || hasGap || !sourceInstruction
      ? (exercise?.speechLocale || catalog?.locale || "und")
      : "es-CL"
  };
}
function getExerciseSpeechSegments(exercise) {
  if (Array.isArray(exercise?.speechSegments) && exercise.speechSegments.length) {
    return exercise.speechSegments.filter(item => item?.text && item?.locale);
  }
  const segments = [];
  if (exercise?.instruction) segments.push({ text: exercise.instruction, locale: "es-CL" });
  const prompt = String(exercise?.prompt || "").trim();
  if (prompt) {
    const locale = exercise.promptLocale || (exercise.promptLanguage === "target"
      ? (catalog?.locale || "und")
      : (exercise.instruction ? (catalog?.locale || "und") : getExerciseSpeech(exercise).locale));
    segments.push({ text: prompt, locale });
  }
  return segments.length ? segments : [getExerciseSpeech(exercise)];
}
function autoSpeak(text, locale = catalog?.locale) {
  if (text && speech.enabled) speech.speak(text, locale, { automatic: true });
}
const topicLabels = { daily:"vida cotidiana", travel:"viajes", food:"comida y restaurantes", work:"trabajo y estudios", random:"tema sorpresa" };
const customLanguageLocales = {
  "suajili":"sw-KE", "ucraniano":"uk-UA", "persa":"fa-IR", "farsi":"fa-IR",
  "checo":"cs-CZ", "rumano":"ro-RO", "húngaro":"hu-HU", "hungaro":"hu-HU",
  "finés":"fi-FI", "fines":"fi-FI", "estonio":"et-EE", "croata":"hr-HR",
  "serbio":"sr-RS", "búlgaro":"bg-BG", "bulgaro":"bg-BG", "catalán":"ca-ES",
  "catalan":"ca-ES", "gallego":"gl-ES", "urdu":"ur-PK", "bengalí":"bn-BD",
  "bengali":"bn-BD", "malayo":"ms-MY", "filipino":"fil-PH"
};
const customLanguageFlags = {
  "suajili":"🇰🇪", "ucraniano":"🇺🇦", "persa":"🇮🇷", "farsi":"🇮🇷",
  "checo":"🇨🇿", "rumano":"🇷🇴", "húngaro":"🇭🇺", "hungaro":"🇭🇺",
  "finés":"🇫🇮", "fines":"🇫🇮", "estonio":"🇪🇪", "croata":"🇭🇷",
  "serbio":"🇷🇸", "búlgaro":"🇧🇬", "bulgaro":"🇧🇬", "catalán":"🇪🇸",
  "catalan":"🇪🇸", "gallego":"🇪🇸", "urdu":"🇵🇰", "bengalí":"🇧🇩",
  "bengali":"🇧🇩", "malayo":"🇲🇾", "filipino":"🇵🇭"
};
function getSelectedCatalog() {
  const selected = $("language").value;
  if (selected !== "other") return catalogs[selected] || null;
  const label = $("custom-language-name").value.trim();
  if (!label) return null;
  const known = Object.entries(languageDefinitions).find(([name,definition]) =>
    name.toLocaleLowerCase() === label.toLocaleLowerCase() ||
    definition.label.toLocaleLowerCase() === label.toLocaleLowerCase()
  );
  if (known) return catalogs[known[0]];
  const normalized = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  const locale = customLanguageLocales[normalized] || "und";
  const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "custom";
  return { id: locale === "und" ? "custom-" + slug : locale, label, locale, exercises:[] };
}
function updateLanguageFlag() {
  const selected = $("language").value;
  const customName = $("custom-language-name").value.trim();
  const known = selected === "other" ? Object.entries(languageDefinitions).find(([name,definition]) =>
    name.toLocaleLowerCase() === customName.toLocaleLowerCase() ||
    definition.label.toLocaleLowerCase() === customName.toLocaleLowerCase()
  ) : null;
  const customKey = customName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  $("selected-language-flag").textContent = selected === "other"
    ? known?.[1].flag || customLanguageFlags[customKey] || "🏳️"
    : languageDefinitions[selected]?.flag || "🏳️";
  if (typeof ROUTE_STORAGE_KEY !== "undefined") {
    const selectedCatalog = getSelectedCatalog();
    routeDraft = getRouteDraftForLanguage(selectedCatalog?.id);
    renderRouteDashboard();
  }
}
let session = null;
let catalog = null;
let diagnostic = null;
let currentExercise = null;
let pendingFeedback = null;
let localPendingAnswer = null;
let aiPendingFeedback = null;
let aiPendingTurn = null;
let reviewExercise = null;
let reviewMode = false;
let progress = loadProgress();
let dueReviewCards = [];
let reviewIndex = 0;
let reviewHintLevel = 0;
let reviewProgressDraft = null;
let aiConfigured = false;
let aiReady = false;
let aiMode = false;
let aiHistory = [];
let aiLastResult = null;
let aiCurrentExercise = null;
let aiHintLevel = 0;
let aiHintPending = false;
let aiEvaluationPending = false;
let aiContinueRequested = false;
let routeIntegrationHintLevel = 0;
let localHintLevel = 0;
let sessionFinished = false;
let selectedExerciseMode = "practice";
let sessionAbortController = null;
let routeMode = false;
let routeIntegration = false;
let routeIntegrationAttempts = 0;
let routeDraft = null;
const ROUTE_STORAGE_KEY = "adaptive-language-tutor.route-progress";
const ROUTE_UNITS_KEY = "adaptive-language-tutor.route-units";
const ROUTE_UNIT_DEFINITIONS = [
  { id:"foundations", number:"01", title:"Fundamentos", topic:"daily", icon:"💬", requiredStars:0, description:"Vocabulario, conjugaciones y presentaciones." },
  { id:"travel", number:"02", title:"Viajes y orientación", topic:"travel", icon:"🧭", requiredStars:3, description:"Moverte, preguntar y resolver situaciones." },
  { id:"food", number:"03", title:"Comida y restaurantes", topic:"food", icon:"🍽️", requiredStars:5, description:"Pedir, elegir y expresar preferencias." },
  { id:"work", number:"04", title:"Trabajo y estudios", topic:"work", icon:"💼", requiredStars:4, description:"Hablar de tareas, ocupaciones y ayuda." }
];
let selectedRouteUnitId = "foundations";
let routeSelectionTouched = false;
let activeRouteUnit = null;
let routeQuestionCount = 10;
function getRouteDraftForLanguage(languageId) {
  if (!languageId) return null;
  try { return JSON.parse(localStorage.getItem(ROUTE_STORAGE_KEY + ":" + languageId) || "null"); }
  catch { return null; }
}
function getRouteProgressForLanguage(languageId) {
  if (!languageId) return { completedUnits:{} };
  try {
    const saved = JSON.parse(localStorage.getItem(ROUTE_UNITS_KEY + ":" + languageId) || "null");
    return saved && typeof saved === "object" ? { completedUnits:{}, ...saved } : { completedUnits:{} };
  } catch { return { completedUnits:{} }; }
}
function saveRouteProgressForLanguage(languageId, state) {
  try { localStorage.setItem(ROUTE_UNITS_KEY + ":" + languageId, JSON.stringify(state)); } catch {}
}
function getRouteUnitsForCatalog(selectedCatalog) {
  if (!selectedCatalog) return [];
  if (!selectedCatalog.exercises?.length) return aiConfigured ? ROUTE_UNIT_DEFINITIONS.map(unit => ({ ...unit, questionCount:10, available:true })) : [];
  return ROUTE_UNIT_DEFINITIONS.map(unit => ({
    ...unit, questionCount:selectedCatalog.exercises.filter(exercise => exercise.topic === unit.topic).length,
    available:selectedCatalog.exercises.some(exercise => exercise.topic === unit.topic)
  })).filter(unit => unit.available);
}
function isRouteUnitUnlocked(units, index, state) {
  if (index === 0) return true;
  const record = state.completedUnits?.[units[index-1].id];
  return Boolean(record?.completed && Number(record.stars) >= Number(units[index].requiredStars || 0));
}
function renderRouteDashboard() {
  const list = $("route-unit-list"), start = $("route-start");
  if (!list || !start) return;
  const selectedCatalog = getSelectedCatalog(), units = getRouteUnitsForCatalog(selectedCatalog);
  const state = getRouteProgressForLanguage(selectedCatalog?.id);
  routeDraft = getRouteDraftForLanguage(selectedCatalog?.id);
  if (routeDraft?.unitId && units.some(unit => unit.id === routeDraft.unitId)) selectedRouteUnitId = routeDraft.unitId;
  else if (!routeSelectionTouched || !units.some(unit => unit.id === selectedRouteUnitId) || !isRouteUnitUnlocked(units,units.findIndex(unit => unit.id === selectedRouteUnitId),state)) {
    const next = units.find((unit,index) => !state.completedUnits?.[unit.id] && isRouteUnitUnlocked(units,index,state))
      || units.find((unit,index) => state.completedUnits?.[unit.id] && units[index+1] && !isRouteUnitUnlocked(units,index+1,state))
      || units[0];
    selectedRouteUnitId = next?.id || "";
  }
  list.innerHTML = units.map((unit,index) => {
    const record = state.completedUnits?.[unit.id], unlocked = isRouteUnitUnlocked(units,index,state);
    const stars = record?.stars || 0, starMarkup = "★".repeat(stars) + "☆".repeat(5-stars);
    const status = !unlocked ? "Bloqueada" : record?.completed ? "Completada" : unit.id === selectedRouteUnitId ? "Disponible" : "Desbloqueada";
    const requirement = index ? '<small class="route-requirement">Requiere ' + unit.requiredStars + ' estrellas en la unidad anterior</small>' : "";
    return '<button class="route-unit-card' + (unit.id === selectedRouteUnitId ? ' selected' : '') + (!unlocked ? ' locked' : '') + '" type="button" data-route-unit="' + unit.id + '"' + (!unlocked ? ' disabled' : '') + '>' +
      '<span class="route-unit-icon" aria-hidden="true">' + unit.icon + '</span><span class="route-unit-copy"><span class="route-unit-kicker">UNIDAD ' + unit.number + ' · ' + status.toUpperCase() + '</span><strong>' + unit.title + '</strong><small>' + unit.description + '</small>' +
      (record?.completed ? '<span class="route-stars" aria-label="' + stars + ' de 5 estrellas">' + starMarkup + ' · ' + record.accuracy + '%</span>' : requirement) +
      '</span><span class="route-unit-chevron" aria-hidden="true">›</span></button>';
  }).join("") || '<p class="muted">La ruta de este idioma se está preparando.</p>';
  const selected = units.find(unit => unit.id === selectedRouteUnitId), index = units.findIndex(unit => unit.id === selectedRouteUnitId);
  const record = state.completedUnits?.[selectedRouteUnitId];
  const draft = Boolean(routeDraft?.session && routeDraft.unitId === selectedRouteUnitId);
  start.textContent = draft ? "Continuar unidad" : record?.completed ? "Repetir unidad" : "Comenzar unidad";
  start.disabled = !selected || !isRouteUnitUnlocked(units,index,state);
  $("route-reset")?.toggleAttribute("disabled", !selectedCatalog);
  $("route-resume")?.classList.add("hidden");
}
function getRoutePhase(index,total) {
  const first = Math.max(1,Math.ceil(total/3)), second = Math.max(first+1,Math.ceil(total*2/3));
  if (index < first) return { id:"vocabulary",label:"VOCABULARIO Y CONJUGACIONES" };
  if (index < second) return { id:"context",label:"APLICACIÓN EN CONTEXTO" };
  return { id:"sentences",label:"FRASES COMPLETAS" };
}
function getExerciseIllustration(exercise) {
  const text = [exercise?.prompt,exercise?.term,exercise?.skill,exercise?.meaning].join(" ").toLocaleLowerCase();
  const icon = /café|coffee|espresso/.test(text) ? "☕" : /baño|bathroom|banheiro/.test(text) ? "🚻"
    : /pasaje|billete|ticket|passagem/.test(text) ? "🎫" : /restaurante|cuenta|bill|conta|cebolla|onion|comida/.test(text) ? "🍽️"
    : /oficina|trabajo|office|work|ocupaci[oó]n/.test(text) ? "💼" : /viaje|tren|estaci[oó]n|travel|train|direcci[oó]n/.test(text) ? "🧭"
    : /hora|ayer|mañana|yesterday|tomorrow|ontem/.test(text) ? "🕒" : "💬";
  const label = topicLabels[exercise?.topic] || "situación cotidiana";
  return '<div class="exercise-illustration" role="img" aria-label="Ilustración de ' + escapeHTML(label) + '"><svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect x="3" y="3" width="58" height="58" rx="15" fill="#e7eff7"/><circle cx="48" cy="15" r="5" fill="#c6d6e7"/><text x="32" y="44" text-anchor="middle" font-size="31">' + icon + '</text></svg><small>' + escapeHTML(label) + '</small></div>';
}

function refreshDashboard() {
  const selectedId = getSelectedCatalog()?.id;
  const languageIds = [...new Set([
    ...progress.sessions.map(item => item.languageId).filter(Boolean),
    ...progress.vocabulary.map(item => item.languageId).filter(Boolean),
    selectedId
  ].filter(Boolean))];
  const entries = Object.entries(languageDefinitions);
  const languages = languageIds.map(id => {
    const definition = entries.find(([, value]) => value.id === id);
    const sessionRecord = progress.sessions.find(item => item.languageId === id);
    const wordRecord = progress.vocabulary.find(item => item.languageId === id);
    return { id, label: definition?.[0] || sessionRecord?.language || wordRecord?.language || id,
      flag: definition?.[1].flag || "🌐" };
  });
  const due = getDueCards(progress, Date.now(), selectedId).filter(card => card.cardType !== "pattern");
  const reviewCount = $("review-count");
  if (reviewCount) reviewCount.textContent = String(due.length);
  const reviewDashboard = $("review-dashboard");
  if (reviewDashboard) reviewDashboard.innerHTML = due.length
    ? "<strong>" + due.length + " errores pendientes.</strong><p>Este apartado contiene únicamente respuestas incorrectas registradas en sesiones anteriores.</p>"
    : "No tienes repasos pendientes. Los errores que cometas durante las sesiones aparecerán aquí.";
  const statsContent = $("statistics-content");
  if (!statsContent) return;
  const previousStatsView = $("stats-view-select")?.value || "global";
  const metrics = languages.map(language => {
    const languageSessions = progress.sessions.filter(item => item.languageId === language.id);
    const attempted = languageSessions.reduce((sum,item) => sum + (Number(item.attempted) || 0),0);
    const correct = languageSessions.reduce((sum,item) => sum + (Number(item.correct) || 0),0);
    const stats = getProgressStats(progress, language.id);
    let routePercent = 0;
    try {
      const routeState = getRouteProgressForLanguage(language.id);
      const routeUnits = getRouteUnitsForCatalog(languageDefinitions && Object.values(languageDefinitions).find(item => item.id === language.id)?.catalog || { exercises:[] });
      const completedUnits = routeUnits.filter(unit => routeState.completedUnits?.[unit.id]?.completed).length;
      routePercent = routeUnits.length ? Math.round(completedUnits / routeUnits.length * 100) : 0;
      const draft = JSON.parse(localStorage.getItem(ROUTE_STORAGE_KEY + ":" + language.id) || "null");
      if (draft?.session && !completedUnits) routePercent = Math.max(routePercent, Math.round((draft.session.turn / Math.max(1,draft.questionCount || 10))*100 / Math.max(routeUnits.length,1)));
    } catch {}
    return { ...language, sessions:stats.sessions, words:stats.vocabulary,
      accuracy:attempted ? Math.round(correct / attempted * 100) : stats.averageAccuracy,
      attempted, correct, routePercent };
  });
  const header = '<thead><tr><th>Indicador</th>' + metrics.map(item =>
    '<th title="' + escapeHTML(item.label) + '">' + item.flag + '</th>').join("") + '</tr></thead>';
  const rows = [["Sesiones","sessions"],["Palabras","words"],["Precisión","accuracy","%"],["Progreso de Ruta","routePercent","%"]];
  const body = '<tbody>' + rows.map(([label,key,suffix=""]) =>
    '<tr><th scope="row">' + label + '</th>' + metrics.map(item => '<td>' + item[key] + suffix + '</td>').join("") + '</tr>').join("") + '</tbody>';
  const colorFor = index => "hsl(" + Math.round(index * 360 / Math.max(metrics.length, 1)) + " 62% 42%)";
  const options = '<option value="global">🌐 Global</option>' + metrics.map(item =>
    '<option value="' + escapeHTML(item.id) + '">' + item.flag + ' ' + escapeHTML(item.label) + '</option>').join("");
  const selectedView = previousStatsView === "global" || metrics.some(item => item.id === previousStatsView)
    ? previousStatsView : "global";
  let chartMarkup = "";
  if (selectedView === "global") {
    const totalAttempted = metrics.reduce((sum,item) => sum + item.attempted,0);
    const totalCorrect = metrics.reduce((sum,item) => sum + item.correct,0);
    const average = totalAttempted ? Math.round(totalCorrect / totalAttempted * 100)
      : (metrics.length ? Math.round(metrics.reduce((sum,item)=>sum+item.accuracy,0)/metrics.length) : 0);
    if (!metrics.length) {
      chartMarkup = '<p class="empty-chart">Completa una sesión para comparar la precisión entre idiomas.</p>';
    } else {
      const width = Math.max(320, Math.floor((statsContent.clientWidth || 760) - 24)), height = 390;
      const left = 58, right = 24, top = 28, bottom = 82;
      const plotWidth = width-left-right, plotHeight = height-top-bottom;
      const yAt = value => top + (100-value)*plotHeight/100;
      const slot = plotWidth/metrics.length, barWidth = Math.min(88,slot*0.86);
      const grid = [0,25,50,75,100].map(value =>
        '<line x1="' + left + '" y1="' + yAt(value) + '" x2="' + (width-right) + '" y2="' + yAt(value) + '" class="chart-gridline"/><text x="4" y="' + (yAt(value)+4) + '" class="chart-axis-label">' + value + '%</text>'
      ).join("");
      const bars = metrics.map((item,index) => {
        const x = left + slot*index + (slot-barWidth)/2, y = yAt(item.accuracy), h = plotHeight*item.accuracy/100;
        const labelX = left + slot*(index+0.5);
        return '<rect class="stats-bar" x="' + x + '" y="' + y + '" width="' + barWidth + '" height="' + h + '" rx="5" fill="' + colorFor(index) + '"><title>' + escapeHTML(item.label) + ': ' + item.accuracy + '%</title></rect>' +
          '<text x="' + labelX + '" y="' + (y-7) + '" text-anchor="middle" class="chart-value-label">' + item.accuracy + '%</text>' +
          '<text x="' + labelX + '" y="' + (height-42) + '" text-anchor="middle" class="chart-axis-label">' + item.flag + '</text>' +
          '<text x="' + labelX + '" y="' + (height-25) + '" text-anchor="middle" class="chart-axis-label">' + escapeHTML(item.label.length>12?item.label.slice(0,11)+"…":item.label) + '</text>';
      }).join("");
      const averageLine = '<line x1="' + left + '" y1="' + yAt(average) + '" x2="' + (width-right) + '" y2="' + yAt(average) + '" class="stats-average-line"/>' +
        '<text x="' + (width-right-2) + '" y="' + (yAt(average)-6) + '" text-anchor="end" class="chart-average-label">Promedio ' + average + '%</text>';
      chartMarkup = '<div class="stats-chart-scroll"><svg class="stats-bar-chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Precisión actual comparada entre idiomas">' +
        grid + bars + averageLine + '</svg></div><div class="stats-chart-legend"><span><i class="legend-bar"></i>Precisión actual</span><span><i class="legend-dashed"></i>Promedio global ' + average + '%</span></div>';
    }
  } else {
    const language = metrics.find(item => item.id === selectedView);
    const daily = new Map();
    for (const item of progress.sessions) {
      if (item.languageId !== selectedView || !item.completedAt) continue;
      const day = item.completedAt.slice(0,10);
      if (!daily.has(day)) daily.set(day,{attempted:0,correct:0});
      const record = daily.get(day);
      record.attempted += Number(item.attempted) || 0;
      record.correct += Number(item.correct) || 0;
    }
    const practicedDays = [...daily.entries()].sort(([a],[b]) => a.localeCompare(b)).slice(-15);
    if (!practicedDays.length) {
      chartMarkup = '<p class="empty-chart">Todavía no hay días de práctica registrados para ' + escapeHTML(language?.label || "") + '.</p>';
    } else {
      const width = Math.max(300, Math.floor((statsContent.clientWidth || 760) - 52)), height = 340, left = 38, right = 38, top = 28, bottom = 64;
      const plotWidth = width-left-right, plotHeight = height-top-bottom;
      const maxQuestions = Math.max(1,...practicedDays.map(([,item])=>item.attempted));
      const questionMax = Math.max(5,Math.ceil(maxQuestions/5)*5);
      const xAt = index => practicedDays.length===1 ? left+plotWidth/2 : left+index*plotWidth/(practicedDays.length-1);
      const yAccuracy = value => top+(100-value)*plotHeight/100;
      const yQuestions = value => top+(questionMax-value)*plotHeight/questionMax;
      const grid = [0,25,50,75,100].map(value =>
        '<line x1="' + left + '" y1="' + yAccuracy(value) + '" x2="' + (width-right) + '" y2="' + yAccuracy(value) + '" class="chart-gridline"/>' +
        '<text x="3" y="' + (yAccuracy(value)+4) + '" class="chart-axis-label">' + Math.round(questionMax*value/100) + '</text>' +
        '<text x="' + (width-right+5) + '" y="' + (yAccuracy(value)+4) + '" class="chart-axis-label">' + value + '%</text>'
      ).join("");
      const countPoints = practicedDays.map(([,item],index)=>xAt(index)+","+yQuestions(item.attempted)).join(" ");
      const accuracyPoints = practicedDays.map(([,item],index)=>{
        const accuracy = item.attempted ? item.correct/item.attempted*100 : 0;
        return xAt(index)+","+yAccuracy(accuracy);
      }).join(" ");
      const dots = practicedDays.map(([,item],index)=>{
        const accuracy = item.attempted ? item.correct/item.attempted*100 : 0;
        return '<circle cx="' + xAt(index) + '" cy="' + yQuestions(item.attempted) + '" r="7" class="stats-question-dot"><title>' + item.attempted + ' preguntas</title></circle>' +
          '<circle cx="' + xAt(index) + '" cy="' + yAccuracy(accuracy) + '" r="7" class="stats-accuracy-dot"><title>' + Math.round(accuracy) + '% precisión</title></circle>' +
          '<text x="' + xAt(index) + '" y="' + (height-26) + '" text-anchor="middle" class="chart-axis-label">' + (index+1) + '</text>';
      }).join("");
      chartMarkup = '<div class="stats-chart-scroll"><svg class="stats-line-chart stats-language-chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Preguntas respondidas y precisión por día practicado">' +
        grid + '<polyline class="stats-question-line" points="' + countPoints + '"/><polyline class="stats-accuracy-line" points="' + accuracyPoints + '"/>' + dots + '<text x="' + (left+plotWidth/2) + '" y="' + (height-4) + '" text-anchor="middle" class="chart-axis-title">Días</text></svg></div>' +
        '<div class="stats-chart-legend"><span><i class="legend-question"></i>Preguntas respondidas</span><span><i class="legend-accuracy"></i>Precisión (%)</span></div>' +
        '<p class="chart-note">Últimos ' + practicedDays.length + ' días practicados · sin días de inactividad.</p>';
    }
  }
  statsContent.innerHTML = '<section class="stats-table-card"><h2>Progreso por idioma</h2>' +
    (metrics.length?'<div class="stats-table-wrap"><table class="stats-language-table">' + header + body + '</table></div>':'<p class="empty-chart">Aún no hay idiomas con actividad registrada.</p>') +
    '</section><section class="progress-chart-card"><div class="stats-chart-heading"><h2>Evolución</h2><label class="stats-view-picker"><span class="visually-hidden">Vista del gráfico</span><select id="stats-view-select" aria-label="Seleccionar vista de estadísticas">' + options + '</select></label></div>' +
    chartMarkup + '</section>';
  $("stats-view-select").value = selectedView;
  $("stats-view-select").addEventListener("change", refreshDashboard);
}
$("language").addEventListener("change", () => {
  $("custom-language-fields").classList.toggle("hidden", $("language").value !== "other");
  $("language-apply").classList.toggle("hidden", $("language").value !== "other");
  updateLanguageFlag();
  refreshDashboard();
});
$("custom-language-name").addEventListener("input", () => {
  updateLanguageFlag();
  refreshDashboard();
});
try {
  const savedSettings = JSON.parse(localStorage.getItem("adaptive-language-tutor.settings") || "{}");
  if (savedSettings.selectedLanguage) {
    $("language").value = savedSettings.selectedLanguage;
    if (savedSettings.customLanguageName) $("custom-language-name").value = savedSettings.customLanguageName;
    $("welcome-screen").classList.remove("hidden");
    $("app-shell").classList.add("hidden");
  }
  if (savedSettings.duration) $("duration").value = String(savedSettings.duration);
  if (savedSettings.level) $("level").value = savedSettings.level;
  if (savedSettings.topic) $("topic").value = savedSettings.topic;

} catch { /* Ignore malformed optional settings; progress storage remains independent. */ }
updateLanguageFlag();
refreshDashboard();
routeDraft = getRouteDraftForLanguage(getSelectedCatalog()?.id);
$("route-resume").classList.add("hidden");
checkTutorHealth().then(status => {
  aiConfigured = Boolean(status.ai?.configured);
  $("ai-status").textContent = aiConfigured
    ? "Tutor IA disponible"
    : "Tutor IA no disponible; se utilizarán ejercicios locales";
}).catch(() => {
  $("ai-status").textContent = "Tutor IA no disponible; se utilizarán ejercicios locales";
}).finally(() => {
  aiReady = true;
  updateLanguageFlag();
  $("start-session").disabled = false;
  $("ai-status").classList.remove("hidden");
});

function startSpacedReview() {
  speech.stop();
  catalog = getSelectedCatalog();
  if (!catalog) { $("ai-status").textContent = "Selecciona un idioma del mosaico."; return; }
  dueReviewCards = getDueCards(progress, Date.now(), catalog.id).filter(card => card.cardType !== "pattern");
  reviewProgressDraft = JSON.parse(JSON.stringify(progress));
  reviewIndex = 0;
  if (!dueReviewCards.length) {
    reviewProgressDraft = null;
    $("review-exercises").classList.remove("hidden");
    $("review-dashboard").innerHTML = "No tienes tarjetas pendientes. Los errores nuevos aparecerán aquí después de practicar.";
    refreshDashboard();
    return;
  }
  sessionFinished = false;
  showSessionView("review");
  $("summary-panel").classList.add("hidden");
  $("lesson-panel").classList.remove("hidden");
  $("session-status").textContent = "Repaso programado";
  reviewMode = true;
  aiMode = false;
  $("stats").hidden = true;
  $("hint-btn").hidden = false;
  $("hint-btn").textContent = "Pista";
  $("review-btn").hidden = true;
  renderSpacedReview();
}

function renderSpacedReview() {
  speech.stop();
  if (reviewIndex >= dueReviewCards.length) {
    if (reviewProgressDraft) {
      progress = reviewProgressDraft;
      saveProgress(progress);
      reviewProgressDraft = null;
    }
    sessionFinished = true;
    $("lesson-panel").classList.add("hidden");
    $("summary-panel").classList.remove("hidden");
    $("summary-content").textContent = "Has terminado los repasos disponibles.";
    return;
  }
  const card = dueReviewCards[reviewIndex];
  const exercise = catalog.exercises.find(item => item.id === card.exerciseId);
  const expected = exercise?.target || card.expected;
  reviewExercise = exercise || { target:expected, hint:card.hint, explanation:card.explanation };
  reviewHintLevel = 0;
  $("lesson-phase").textContent = "REPETICIÓN ESPACIADA";
  $("turn-count").textContent = "Tarjeta " + (reviewIndex + 1) + " / " + dueReviewCards.length;
  $("progress-bar").style.width = (reviewIndex / dueReviewCards.length * 100) + "%";
  $("feedback").classList.add("hidden");

  if (card.cardType === "pattern") {
    $("hint-btn").hidden = true;
    $("lesson-content").innerHTML = '<p class="eyebrow">REPASO DE PATRÓN</p><h3>' + escapeHTML(card.pattern) + '</h3><p>Intenta recordar una frase propia que aplique este patrón. Este repaso no consume turnos de práctica.</p>';
    $("answer-area").innerHTML = '<p class="muted">¿Pudiste recordar y aplicar el patrón?</p><button id="pattern-recalled" class="primary" type="button">Lo recordé</button><button id="pattern-practice" class="secondary" type="button">Necesito practicarlo</button>';
    const gradePattern = recalled => {
      const result = gradeReview(reviewProgressDraft || progress, card.key, recalled);
      showFeedback(recalled
        ? "Registrado. Próximo repaso en " + (result?.nextIntervalDays || 1) + " días."
        : "Sigue pendiente. Vuelve a intentarlo en otro repaso.", recalled);
      $("answer-area").innerHTML = '<button id="next-spaced" class="secondary" type="button">Siguiente →</button>';
      $("next-spaced").addEventListener("click", () => { reviewIndex += 1; renderSpacedReview(); });
    };
    $("pattern-recalled").addEventListener("click", () => gradePattern(true));
    $("pattern-practice").addEventListener("click", () => gradePattern(false));
    return;
  }

  const hasOptions = Array.isArray(exercise?.options) && exercise.options.length >= 2;
  $("hint-btn").hidden = hasOptions;
  $("hint-btn").disabled = false;
  $("hint-btn").textContent = "Pista";
  $("lesson-content").innerHTML = getExerciseIllustration(exercise || { topic:card.topic, prompt:card.prompt }) + '<p class="eyebrow">REPASO PROGRAMADO</p><h3>' + escapeHTML(exercise?.prompt || card.prompt || "") + '</h3><p>' + (hasOptions ? "Elige la respuesta correcta. Este repaso no consume turnos de práctica." : "Escribe la respuesta sin mirar la solución. Este repaso no consume turnos de práctica.") + '</p>';
  const submitReviewAnswer = answer => {
    const checkExercise = exercise || { target:expected, acceptedAnswers:[] };
    const correct = evaluateAnswer(answer,checkExercise);
    const result = gradeReview(reviewProgressDraft || progress,card.key,correct);
    const interval = result?.nextIntervalDays || 1;
    $("hint-btn").hidden = true;
    showFeedback(correct
      ? "Correcto. Próximo repaso en " + interval + " días."
      : "Respuesta de referencia: " + expected + ". " + (exercise?.explanation || card.explanation) + " La palabra seguirá pendiente hasta responderla correctamente.",correct);
    appendCatalogSpeech($("feedback"),exercise || { target:expected },"explanationSpeechSegments",true);
    $("answer-area").innerHTML = '<button id="next-spaced" class="secondary" type="button">Siguiente →</button>';
    $("next-spaced").addEventListener("click",() => { reviewIndex += 1; renderSpacedReview(); });
  };
  if (hasOptions) {
    $("answer-area").innerHTML = exercise.options.map((option,index) => '<button class="answer-option" type="button" data-review-choice="' + index + '">' + escapeHTML(option) + '</button>').join("");
    $("answer-area").querySelectorAll("[data-review-choice]").forEach(button => button.addEventListener("click",() => {
      $("answer-area").querySelectorAll("[data-review-choice]").forEach(item => item.disabled = true);
      submitReviewAnswer(exercise.options[Number(button.dataset.reviewChoice)]);
    }));
  } else {
    $("answer-area").innerHTML = '<input id="spaced-answer" class="answer-input" placeholder="Escribe tu respuesta…"><button id="check-spaced" class="primary" type="button">Comprobar respuesta</button>';
    $("check-spaced").addEventListener("click",() => submitReviewAnswer($("spaced-answer").value));
  }
}

$("setup-form").addEventListener("submit", event => {
  event.preventDefault();
  if (!aiReady) return;
  catalog = getSelectedCatalog();
  if (!catalog) {
    $("ai-status").textContent = "Selecciona un idioma del mosaico.";
    return;
  }
  if (!catalog.exercises.length && !aiConfigured) {
    $("ai-status").textContent = "Los idiomas personalizados requieren que el tutor IA esté disponible.";
    return;
  }
  if (selectedExerciseMode === "review") {
    startSpacedReview();
    return;
  }
  const questionCount = Number($("duration").value);
  const config = { language:catalog.label, languageId:catalog.id, languageLocale:catalog.locale || catalog.id, duration:questionCount, questionCount, level:$("level").value, topic:$("topic").value };
  persistSettings();
  sessionAbortController?.abort();
  sessionAbortController = new AbortController();
  session = createSession(config);
  sessionFinished = false;
  reviewMode = false;
  $("summary-panel").classList.add("hidden");
  $("lesson-panel").classList.remove("hidden");
  const useLiveAI = aiConfigured && catalog.exercises.length < questionCount;
  $("session-status").textContent = useLiveAI ? "Tutor IA en sesión" : "Práctica local";
  showSessionView(selectedExerciseMode);
  if (useLiveAI) {
    startAITutorSession(config);
  } else {
    aiMode = false;
    session.config.level = config.level;
    renderLesson();
  }
});

function getAILearnerContext(config = session.config) {
  return {
    nativeLanguage: "es",
    targetLanguage: config.languageId,
    targetLanguageLabel: config.language,
    targetLanguageLocale: config.languageLocale || catalog?.locale || config.languageId,
    level: config.estimatedLevel || config.level,
    topic: config.topic,
    questionCount: config.questionCount || config.duration
  };
}

async function startAITutorSession(config) {
  const activeSession = session;
  aiMode = true;
  aiPendingFeedback = null;
  aiHistory = [];
  aiLastResult = null;
  aiCurrentExercise = null;
  $("stats").hidden = true;
  $("hint-btn").hidden = true;
  $("review-btn").hidden = true;
  $("lesson-phase").textContent = "TUTOR IA · INICIO";
  $("turn-count").textContent = "Preparando tu sesión…";
  $("lesson-content").textContent = "El tutor está preparando una actividad adaptada a tu nivel.";
  $("answer-area").innerHTML = "";
  try {
    const result = await requestTutorTurn({
      task: "start_lesson",
      learner: getAILearnerContext(config),
      session: {
        duration: config.duration,
        turn: 0,
        topic: config.topic,
        diagnostic: false,
        performance: { streak: 0, consecutiveCorrect: 0, consecutiveErrors: 0 }
      },
      history: [],
      userMessage: "Inicia directamente con una actividad concreta adecuada al nivel y tema seleccionados. No hagas diagnóstico, no estimes mi nivel ni hagas preguntas abiertas para evaluarlo. No presentes una prueba inicial. Escribe las instrucciones e imperativos siempre en español (idioma origen), en message. Mantén exercise.prompt separado como texto o frase que se debe evaluar; no mezcles la orden con ese texto. Explícame brevemente la tarea y espera mi respuesta."
    }, undefined, { signal: sessionAbortController?.signal });
    if (session !== activeSession || sessionAbortController?.signal.aborted) return;
    applyLearnerUpdate(session, result.learnerUpdate);
    renderAITutorTurn(result);
  } catch (error) {
    if (session === activeSession && !sessionAbortController?.signal.aborted) showAITutorError(error, null);
  }
}

function renderAITutorTurn(result) {
  $("lesson-panel").classList.remove("route-integration-active");
  speech.stop();
  aiLastResult = result;
  aiCurrentExercise = result.exercise || {};
  aiHintLevel = 0;
  aiHintPending = false;
  aiEvaluationPending = false;
  aiContinueRequested = false;
  $("hint-btn").disabled = false;
  $("hint-btn").textContent = "Pista";
  $("review-btn").disabled = false;
  $("lesson-phase").textContent = routeMode && routeIntegration ? "HITO INTEGRADOR" : "TUTOR IA · CONVERSACIÓN";
  $("turn-count").textContent = routeMode && routeIntegration
    ? "Actividad integradora"
    : "Pregunta " + Math.min(session.turn + 1, session.config.duration) + " / " + session.config.duration;
  $("progress-bar").style.width = (session.turn / session.config.duration * 100) + "%";
  $("streak").textContent = session.streak;
  $("word-count").textContent = session.vocabulary.length;
  $("error-count").textContent = session.errors.length;

  let instruction = String(result.message || "").trim();
  if (/^(?:¡?muy bien|¡?excelente|¡?correcto|¡?perfecto)/i.test(instruction)) instruction = "Continuemos con la siguiente actividad.";
  const instructionMarkup = instruction
    ? '<p class="exercise-instruction">' + escapeHTML(instruction) + '</p>' : "";
  const prompt = aiCurrentExercise.prompt
    ? '<h3>' + renderClickableTargetText(aiCurrentExercise.prompt) + '</h3>'
    : '<h3>El tutor está preparando una actividad cerrada.</h3>';
  const targetLocale = session.config.languageLocale || session.config.languageId;
  const targetSpeech = (result.speechSegments || []).filter(item =>
    item && typeof item.text === "string" && item.text.trim() && item.locale === targetLocale
  );
  const questionSpeech = targetSpeech.length
    ? { text: targetSpeech.map(item => item.text.trim()).join(" "), locale: targetLocale }
    : getExerciseSpeech(aiCurrentExercise);
  const promptAudio = aiCurrentExercise.prompt
    ? speakerButton(questionSpeech.text, questionSpeech.locale)
    : "";
  $("lesson-content").innerHTML = getExerciseIllustration(aiCurrentExercise) + instructionMarkup + prompt + promptAudio;
  bindSpeakerButtons($("lesson-content"));
  bindVariantLinks($("lesson-content"));
  bindTargetWords($("lesson-content"));
  autoSpeak(questionSpeech.text, questionSpeech.locale);
  $("feedback").classList.add("hidden");
  const aiOptions = Array.isArray(aiCurrentExercise.options) ? aiCurrentExercise.options : [];
  const aiHasChoices = session.turn < 3 && aiOptions.length === 3 && aiOptions.some(option => String(option).trim().toLocaleLowerCase() === String(aiCurrentExercise.expectedAnswer || "").trim().toLocaleLowerCase());
  $("hint-btn").hidden = aiHasChoices;
  $("hint-btn").textContent = "Pista";
  $("review-btn").hidden = true;

  if (result.nextAction === "finish" || session.turn >= session.config.duration) {
    $("answer-area").innerHTML = '<button id="finish-ai-session" class="primary" type="button">Ver resumen →</button>';
    $("finish-ai-session").addEventListener("click", finishSession);
    return;
  }

  if (session.turn < 3) {
    const options = Array.isArray(aiCurrentExercise.options) ? aiCurrentExercise.options : [];
    const validClosedChoice = Boolean(aiCurrentExercise.prompt && String(aiCurrentExercise.expectedAnswer || "").trim() &&
      options.length === 3 && options.some(option => String(option).trim().toLocaleLowerCase() === String(aiCurrentExercise.expectedAnswer).trim().toLocaleLowerCase()));
    $("answer-area").innerHTML = validClosedChoice
      ? options.map((option,index) => '<button class="answer-option ai-answer-option" type="button" data-ai-choice="' + index + '">' + renderClickableTargetText(option) + '</button>').join("")
      : '<p class="muted">El tutor está preparando una pregunta cerrada con respuesta verificable.</p><button id="retry-ai-options" class="secondary" type="button">Reintentar</button>';
    $("answer-area").querySelectorAll("[data-ai-choice]").forEach(button => button.addEventListener("click", () => submitAITutorAnswer(options[Number(button.dataset.aiChoice)])));
    bindTargetWords($("answer-area"));
    $("retry-ai-options")?.addEventListener("click", () => startAITutorSession(session.config));
  } else if (aiCurrentExercise.prompt && String(aiCurrentExercise.expectedAnswer || "").trim()) {
    $("answer-area").innerHTML =
      '<input id="ai-answer" class="answer-input" placeholder="Escribe tu respuesta…" autocomplete="off">' +
      '<button id="submit-ai-answer" class="primary" type="button">Enviar respuesta →</button>';
    $("submit-ai-answer").addEventListener("click", () => submitAITutorAnswer($("ai-answer").value));
    $("ai-answer").addEventListener("keydown", event => {
      if (event.key === "Enter") submitAITutorAnswer($("ai-answer").value);
    });
  } else {
    $("answer-area").innerHTML = '<p class="muted">La actividad no tiene una respuesta verificable. Se solicitará una pregunta concreta.</p><button id="retry-ai-options" class="secondary" type="button">Reintentar</button>';
    $("retry-ai-options").addEventListener("click", () => startAITutorSession(session.config));
  }
}

async function submitAITutorAnswer(answer) {
  const activeSession = session;
  const cleanAnswer = String(answer || "").trim();
  if (!cleanAnswer) {
    showFeedback("Escribe una respuesta antes de continuar.", false);
    return;
  }
  speech.stop();
  const submitButton = $("submit-ai-answer");
  const answerInput = $("ai-answer");
  if (submitButton) submitButton.remove();
  if (answerInput) answerInput.disabled = true;
  $("answer-area").querySelectorAll("[data-ai-choice]").forEach(button => { button.disabled = true; });
  try {
    const evaluatedExercise = aiCurrentExercise;
    const locallyCorrect = evaluateAnswer(cleanAnswer, {
      target: evaluatedExercise.expectedAnswer || "",
      acceptedAnswers: evaluatedExercise.acceptedAnswers || [],
      allowTypo: true
    });
    aiEvaluationPending = true;
    aiContinueRequested = false;
    showAnswerFeedback({
      correct: locallyCorrect,
      expected: evaluatedExercise.expectedAnswer || "",
      explanation: locallyCorrect ? "" : "La respuesta no coincide con la solución esperada.",
      selected: cleanAnswer,
      options: evaluatedExercise.options || [],
      correctOption: evaluatedExercise.expectedAnswer || "",
      showContinue: true
    });
    const conversationHistory = [
      ...aiHistory,
      { role: "assistant", content: JSON.stringify(aiLastResult) }
    ];
    const result = await requestTutorTurn({
      task: "evaluate_and_continue",
      learner: getAILearnerContext(),
      session: {
        duration: session.config.duration,
        turn: session.turn + 1,
        topic: session.config.topic,
        diagnostic: false,
        currentExercise: aiCurrentExercise,
        performance: {
          streak: session.streak,
          consecutiveCorrect: session.consecutiveCorrect,
          consecutiveErrors: session.consecutiveErrors,
          recentErrors: session.errors.slice(-5),
          vocabulary: session.vocabulary.slice(-20)
        }
      },
      history: conversationHistory,
      userMessage: cleanAnswer + (routeMode && session.turn + 1 === routeQuestionCount
        ? " Esta respuesta completa la unidad. La siguiente actividad debe ser una tarea integradora escrita que combine el tema completo; no incluyas alternativas."
        : session.turn + 1 < 3
          ? " La próxima actividad debe ser una pregunta de selección múltiple con tres alternativas plausibles en exercise.options."
          : " Desde ahora la próxima actividad debe requerir que escriba la respuesta, sin alternativas.") + " Mantén las instrucciones en español (idioma origen) dentro de message y separa el texto a evaluar en exercise.prompt; nunca mezcles una orden en idioma objetivo con la frase preguntada. Incluye una pista breve y una respuesta esperada verificable; la interfaz revelará la solución como segunda ayuda."
    }, undefined, { signal: sessionAbortController?.signal });
    if (session !== activeSession || sessionAbortController?.signal.aborted) return;
    aiHistory = [
      ...conversationHistory,
      { role: "user", content: cleanAnswer }
    ];
    applyLearnerUpdate(session, result.learnerUpdate);
    const modelEvaluation = result.evaluation || {};
    const evaluation = {
      ...modelEvaluation,
      status: locallyCorrect ? "correct" : "incorrect",
      feedback: locallyCorrect ? "" : (modelEvaluation.feedback || "La respuesta debe coincidir con una solución válida de la actividad.")
    };
    recordTutorEvaluation(session, {
      exerciseId: "ai-turn-" + (session.turn + 1),
      prompt: evaluatedExercise.prompt || aiLastResult.message,
      submitted: cleanAnswer,
      expected: evaluatedExercise.expectedAnswer || "",
      status: evaluation.status || "not_applicable",
      feedback: evaluation.feedback || "",
      skill: evaluation.skill || "Producción"
    });
    aiPendingTurn = {
      result, evaluation, exercise: evaluatedExercise, answer: cleanAnswer,
      routeIntegrationQuestion: Boolean(routeMode && routeIntegration && session.turn >= 11)
    };
    aiEvaluationPending = false;
    showAnswerFeedback({
      correct: evaluation.status === "correct",
      expected: evaluatedExercise.expectedAnswer || "",
      explanation: evaluation.status === "correct" ? "" : evaluation.feedback || "Revisa la estructura y vuelve a intentarlo.",
      selected: cleanAnswer,
      options: evaluatedExercise.options || [],
      correctOption: evaluatedExercise.expectedAnswer || "",
      showContinue: true
    });
    $("streak").textContent = session.streak;
    $("word-count").textContent = session.vocabulary.length;
    $("error-count").textContent = session.errors.length;
    if (routeMode) saveRouteDraft();
    if (aiContinueRequested) {
      aiContinueRequested = false;
      continueAfterAnswer();
    }
  } catch (error) {
    aiEvaluationPending = false;
    aiContinueRequested = false;
    if (session === activeSession && !sessionAbortController?.signal.aborted) showAITutorError(error, cleanAnswer);
  }
}

async function requestAdaptiveHint() {
  if (aiHintPending || !session || !aiLastResult || aiHintLevel >= 1) return;
  const activeSession = session;
  const activeExercise = aiCurrentExercise;
  const button = $("hint-btn");
  aiHintPending = true;
  button.disabled = true;
  button.textContent = "Generando pista…";
  const history = [
    ...aiHistory,
    { role: "assistant", content: JSON.stringify(aiLastResult) }
  ];
  try {
    const result = await requestTutorTurn({
      task: "request_hint",
      learner: getAILearnerContext(),
      session: {
        duration: session.config.duration,
        turn: session.turn,
        topic: session.config.topic,
        currentExercise: aiCurrentExercise,
        performance: {
          streak: session.streak,
          consecutiveCorrect: session.consecutiveCorrect,
          consecutiveErrors: session.consecutiveErrors,
          recentErrors: session.errors.slice(-5),
          vocabulary: session.vocabulary.slice(-20)
        }
      },
      history,
      userMessage: "Dame una pista adicional, más específica que la anterior, para resolver la actividad actual. No reveles la respuesta ni cambies de actividad."
    }, undefined, { signal: sessionAbortController?.signal });
    if (session !== activeSession || aiCurrentExercise !== activeExercise || !aiMode) return;
    const hint = result.exercise?.hint;
    if (typeof hint !== "string" || !hint.trim()) {
      throw new Error("El tutor no generó una pista adicional.");
    }
    aiHintLevel = 1;
    showFeedback("Pista: " + hint.trim(), true);
    const segments = (result.speechSegments || []).filter(item =>
      item && typeof item.text === "string" && item.text.trim() &&
      item.locale === (session.config.languageLocale || session.config.languageId)
    );
    appendSpeechButtons($("feedback"), segments);
    speech.speakSequence(segments, { automatic: true });
    button.textContent = "Ver respuesta";
  } catch (error) {
    if (session === activeSession && aiCurrentExercise === activeExercise) {
      showFeedback("No se pudo obtener otra pista. Puedes intentarlo nuevamente. " + (error.message || ""), false);
      button.textContent = "Reintentar pista";
    }
  } finally {
    aiHintPending = false;
    if (session === activeSession && aiCurrentExercise === activeExercise && aiMode) button.disabled = false;
  }
}

function showAITutorError(error, previousAnswer) {
  speech.stop();
  $("lesson-content").textContent = "No se pudo completar la solicitud al tutor IA.";
  $("feedback").textContent = error.message || "Error de conexión.";
  $("feedback").classList.remove("hidden", "bad");
  $("feedback").classList.add("bad");
  $("answer-area").innerHTML =
    (previousAnswer
      ? '<button id="retry-ai" class="primary" type="button">Reintentar envío</button>'
      : '<button id="retry-ai" class="primary" type="button">Reintentar sesión</button>') +
    '<button id="continue-local" class="secondary" type="button">Continuar sin tutor IA</button>';
  $("retry-ai").addEventListener("click", () => {
    const retryButton = $("retry-ai");
    if (retryButton.disabled) return;
    retryButton.disabled = true;
    retryButton.textContent = "Reintentando…";
    if (previousAnswer) submitAITutorAnswer(previousAnswer);
    else startAITutorSession(session.config);
  });
  $("continue-local").addEventListener("click", () => {
    aiMode = false;
    aiHistory = [];
    aiLastResult = null;
    aiCurrentExercise = null;
    renderLesson();
  });
}

function saveRouteDraft() {
  if (!routeMode || !session) return;
  routeDraft = {
    languageId: session.config.languageId,
    unitId: activeRouteUnit?.id || routeDraft?.unitId || "foundations",
    questionCount: routeQuestionCount,
    session: JSON.parse(JSON.stringify(session)),
    integration: routeIntegration,
    integrationAttempts: routeIntegrationAttempts,
    pendingFeedback,
    localPendingAnswer,
    aiPendingTurn,
    aiMode,
    aiHistory,
    aiLastResult,
    aiCurrentExercise,
    aiPendingFeedback,
    routeIntegrationHintLevel,
    failed: session.turn >= routeQuestionCount && !routeIntegration
  };
  try { localStorage.setItem(ROUTE_STORAGE_KEY + ":" + session.config.languageId, JSON.stringify(routeDraft)); } catch {}
  $("route-resume").classList.add("hidden");
}
function startRouteSession(resume = false) {
  catalog = getSelectedCatalog();
  if (!catalog) return;
  routeDraft = getRouteDraftForLanguage(catalog.id);
  const units = getRouteUnitsForCatalog(catalog);
  const requestedUnitId = resume && routeDraft?.unitId ? routeDraft.unitId : selectedRouteUnitId;
  activeRouteUnit = units.find(unit => unit.id === requestedUnitId) || units[0];
  if (!activeRouteUnit) return;
  const unitIndex = units.findIndex(unit => unit.id === activeRouteUnit.id);
  const routeProgress = getRouteProgressForLanguage(catalog.id);
  if (!isRouteUnitUnlocked(units,unitIndex,routeProgress)) return;
  const useAI = !catalog.exercises.length;
  const hasMatchingDraft = Boolean(routeDraft?.session && routeDraft.languageId === catalog.id && routeDraft.unitId === activeRouteUnit.id);
  routeQuestionCount = Number(hasMatchingDraft ? routeDraft.questionCount : activeRouteUnit.questionCount || 10);
  resume = Boolean(resume && hasMatchingDraft);
  if (useAI && !aiConfigured) {
    $("route-start").textContent = "Ruta en preparación";
    return;
  }
  if (resume && hasMatchingDraft) {
    session = routeDraft.session;
    pendingFeedback = routeDraft.pendingFeedback || null;
    localPendingAnswer = routeDraft.localPendingAnswer || null;
    aiPendingTurn = routeDraft.aiPendingTurn || null;
    routeIntegration = Boolean(routeDraft.integration);
    routeIntegrationAttempts = Number(routeDraft.integrationAttempts || 0);
    aiMode = Boolean(routeDraft.aiMode);
    aiHistory = routeDraft.aiHistory || [];
    aiLastResult = routeDraft.aiLastResult || null;
    aiCurrentExercise = routeDraft.aiCurrentExercise || null;
    aiPendingFeedback = routeDraft.aiPendingFeedback || null;
    routeIntegrationHintLevel = Number(routeDraft.routeIntegrationHintLevel || 0);
  } else {
    routeQuestionCount = Number(activeRouteUnit.questionCount || 10);
    session = createSession({
      language:catalog.label, languageId:catalog.id, languageLocale:catalog.locale,
      duration:useAI ? routeQuestionCount + 1 : routeQuestionCount,
      questionCount:useAI ? routeQuestionCount + 1 : routeQuestionCount,
      level:"zero", topic:activeRouteUnit.topic, routeMode:true, routeUnitId:activeRouteUnit.id
    });
    routeIntegration = false;
    routeIntegrationAttempts = 0;
    pendingFeedback = null;
    localPendingAnswer = null;
    aiPendingTurn = null;
    aiMode = useAI;
    aiHistory = [];
    aiLastResult = null;
    aiCurrentExercise = null;
    aiPendingFeedback = null;
    routeIntegrationHintLevel = 0;
  }
  routeMode = true;
  session.config.routeMode = true;
  saveRouteDraft();
  renderRouteDashboard();
  sessionAbortController?.abort();
  sessionAbortController = new AbortController();
  sessionFinished = false;
  reviewMode = false;
  $("lesson-panel").classList.remove("hidden");
  $("summary-panel").classList.add("hidden");
  showSessionView("Ruta");
  if (aiPendingTurn) {
    renderAITutorTurn(aiLastResult);
    showAnswerFeedback({
      correct: aiPendingTurn.evaluation?.status === "correct",
      expected: aiPendingTurn.exercise?.expectedAnswer || "",
      explanation: aiPendingTurn.evaluation?.status === "correct" ? "" : aiPendingTurn.evaluation?.feedback || "",
      selected: aiPendingTurn.answer || "",
      options: aiPendingTurn.exercise?.options || [],
      correctOption: aiPendingTurn.exercise?.expectedAnswer || ""
    });
  } else if (localPendingAnswer) {
    renderLesson({ exercise: localPendingAnswer.exercise, answered: true });
    showAnswerFeedback({
      correct: localPendingAnswer.correct, expected: localPendingAnswer.expected,
      expectedLocale: localPendingAnswer.expectedLocale,
      explanation: localPendingAnswer.correct ? "" : localPendingAnswer.explanation,
      selected: localPendingAnswer.selected, options: localPendingAnswer.options || [],
      correctOption: localPendingAnswer.expected
    });
  } else if (session.turn > routeQuestionCount) renderRouteAssessmentFailed();
  else if (routeIntegration && aiMode && aiLastResult) renderAITutorTurn(aiLastResult);
  else if (routeIntegration) renderRouteIntegration();
  else if (session.turn >= routeQuestionCount) renderRouteIntegration();
  else if (aiMode && aiLastResult) renderAITutorTurn(aiLastResult);
  else if (aiMode) startAITutorSession(session.config);
  else renderLesson();
}
function renderRouteIntegration() {
  $("lesson-panel").classList.add("route-integration-active");
  $("hint-btn").hidden = false;
  $("hint-btn").disabled = false;
  $("hint-btn").textContent = "Pista";
  speech.stop();
  const scenarios = {
    daily: catalog.id === "en"
      ? { prompt:"Escribe una presentación completa: saluda, di tu nombre y de dónde eres.", target:"Good morning, my name is Ana and I am from Chile.", accepted:["Good morning, I'm Ana and I'm from Chile.","Hello, my name is Ana and I am from Chile."], hints:["Incluye saludo, nombre y procedencia.","Empieza con «Good morning» y continúa con «my name is Ana»."] }
      : { prompt:"Escribe una presentación completa: saluda, di tu nombre y de dónde eres.", target:"Bom dia, meu nome é Ana e sou do Chile.", accepted:["Bom dia! Eu me chamo Ana e sou do Chile.","Olá, meu nome é Ana e sou do Chile."], hints:["Incluye saludo, nombre y procedencia.","Empieza con «Bom dia» y continúa con «meu nome é Ana»."] },
    travel: catalog.id === "en"
      ? { prompt:"En una estación, escribe una frase completa para decir que quieres comprar un billete.", target:"I want to buy a ticket, please.", accepted:["I would like to buy a ticket, please.","I want to buy a ticket."], hints:["Incluye want (querer) y ticket (billete).","Empieza con «I want to buy…»."] }
      : { prompt:"En una estación, escribe una frase completa para decir que quieres comprar un pasaje.", target:"Quero comprar uma passagem, por favor.", accepted:["Eu quero comprar uma passagem, por favor.","Quero comprar uma passagem."], hints:["Incluye quero (quiero), comprar y passagem (pasaje).","Empieza con «Quero comprar…»."] },
    food: catalog.id === "en"
      ? { prompt:"En un café, escribe una frase completa para pedir un café de forma cortés.", target:"I would like a coffee, please.", accepted:["I'd like a coffee, please.","Can I have a coffee, please?"], hints:["Usa una forma cortés de pedir y menciona coffee.","Empieza con «I would like…»."] }
      : { prompt:"En un café, escribe una frase completa para pedir un café de forma cortés.", target:"Eu gostaria de um café, por favor.", accepted:["Gostaria de um café, por favor.","Queria um café, por favor."], hints:["Usa gostaria de para expresar «quisiera» y menciona café.","Empieza con «Eu gostaria de…»."] },
    work: catalog.id === "en"
      ? { prompt:"En una conversación, escribe una frase completa: trabajas en una oficina y necesitas ayuda.", target:"I work in an office and I need help.", accepted:["I work at an office and need help.","I work in an office. I need help."], hints:["Une trabajo y necesidad con and.","Empieza con «I work in an office…»."] }
      : { prompt:"En una conversación, escribe una frase completa: trabajas en una oficina y necesitas ayuda.", target:"Eu trabalho em um escritório e preciso de ajuda.", accepted:["Trabalho em um escritório e preciso de ajuda.","Eu trabalho no escritório e preciso de ajuda."], hints:["Une trabajo y necesidad con e.","Empieza con «Eu trabalho em um escritório…»."] }
  };
  const scenario = scenarios[activeRouteUnit?.topic || "daily"] || scenarios.daily;
  const prompt = scenario.prompt;
  pendingFeedback = null;
  routeIntegrationHintLevel = Number(routeIntegrationHintLevel || 0);
  currentExercise = {
    id:"route-integration-" + (activeRouteUnit?.id || "foundations"), prompt,
    target:scenario.target, allowTypo:true, acceptedAnswers:scenario.accepted,
    hints:scenario.hints,
    explanation:"Esta actividad integra el vocabulario y las estructuras de la unidad " + (activeRouteUnit?.title || "Fundamentos") + "."
  };
  $("lesson-phase").textContent = "HITO INTEGRADOR";
  $("turn-count").textContent = "Actividad final";
  $("progress-bar").style.width = "100%";
  $("hint-btn").textContent = routeIntegrationHintLevel >= 1 ? "Ver respuesta" : "Pista";
  $("hint-btn").hidden = routeIntegrationHintLevel >= 2;
  $("lesson-content").innerHTML = getExerciseIllustration({ topic:activeRouteUnit?.topic, prompt }) + '<p class="eyebrow">UNIDAD ' + (activeRouteUnit?.number || "01") + ' · ' + escapeHTML(activeRouteUnit?.title || "FUNDAMENTOS").toUpperCase() + '</p><h3>' + escapeHTML(prompt) + '</h3><p>Combina lo practicado en las tres etapas anteriores.</p>';
  bindSpeakerButtons($("lesson-content"));
  $("answer-area").innerHTML = '<textarea id="route-integration-answer" class="answer-input" rows="3" placeholder="Escribe tu respuesta completa…"></textarea><button id="route-integration-submit" class="primary" type="button">Comprobar actividad</button>';
  $("route-integration-submit").addEventListener("click", () => {
    const answer = $("route-integration-answer").value.trim();
    if (evaluateAnswer(answer, currentExercise)) {
      session.routeIntegrationComplete = true;
      routeDraft = null;
      try { localStorage.removeItem(ROUTE_STORAGE_KEY + ":" + session.config.languageId); } catch {}
      $("route-resume").classList.add("hidden");
      pendingFeedback = { text:"Actividad integradora completada. Unidad superada.", expected:currentExercise.target };
      finishSession();
    } else {
      routeIntegrationAttempts += 1;
      routeIntegrationHintLevel = Math.min(routeIntegrationHintLevel + 1, 2);
      saveRouteDraft();
      const helpText = routeIntegrationHintLevel === 1 ? currentExercise.hints[0] : "Respuesta de referencia: " + currentExercise.target;
      $("feedback").innerHTML = '<p class="answer-status incorrect">Todavía no coincide. Inténtalo otra vez.</p><p class="answer-explanation">' + (routeIntegrationHintLevel === 1 ? "Pista: " : "Ver respuesta: ") + escapeHTML(helpText) + '</p>';
      $("hint-btn").textContent = "Ver respuesta";
      if (routeIntegrationHintLevel >= 2) $("hint-btn").hidden = true;
      $("feedback").classList.remove("hidden","bad");
      $("route-integration-answer").value = answer;
      $("route-integration-answer").focus();
    }
  });
}
function renderRouteAssessmentFailed() {
  $("lesson-panel").classList.remove("route-integration-active");
  pendingFeedback = null;
  saveRouteDraft();
  $("lesson-phase").textContent = "REFUERZO NECESARIO";
  $("turn-count").textContent = session.correct + " / " + routeQuestionCount + " correctas";
  $("progress-bar").style.width = "100%";
  $("lesson-content").innerHTML = '<div class="feedback-note"><span>Actividad integradora pendiente</span><p>Completa la actividad integradora para registrar el puntaje de esta unidad.</p></div>';
  $("answer-area").innerHTML = '<button id="route-retry" class="primary" type="button">Repetir la unidad</button>';
  $("route-retry").addEventListener("click", () => {
    const useAI = !catalog.exercises.length;
    session = createSession({ ...session.config, duration:useAI ? routeQuestionCount + 1 : routeQuestionCount, questionCount:useAI ? routeQuestionCount + 1 : routeQuestionCount });
    routeIntegration = false;
    routeIntegrationAttempts = 0;
    pendingFeedback = null;
    aiMode = useAI;
    aiHistory = [];
    aiLastResult = null;
    aiCurrentExercise = null;
    aiPendingFeedback = null;
    saveRouteDraft();
    if (useAI) startAITutorSession(session.config);
    else renderLesson();
  });
}
function getTopicExercises() {
  const matches = catalog.exercises.filter(exercise => session.config.topic === "random" || exercise.topic === session.config.topic);
  return matches.length ? matches : catalog.exercises;
}

function chooseExercise() {
  let exercises = getTopicExercises();
  const adaptation = getAdaptation(session);
  let candidates = exercises.filter(exercise => !session.answers.some(answer => answer.exerciseId === exercise.id));
  if (!candidates.length && !routeMode) {
    exercises = catalog.exercises;
    candidates = exercises.filter(exercise => !session.answers.some(answer => answer.exerciseId === exercise.id));
  }
  if (!candidates.length) return null;
  if (adaptation.mode === "scaffold") {
    const easier = candidates.filter(exercise => exercise.level === "A1");
    if (easier.length) candidates = easier;
  } else if (adaptation.mode === "challenge") {
    const harder = candidates.filter(exercise => exercise.level === "A2");
    if (harder.length) candidates = harder;
  }
  if (session.config.level === "zero") {
    const beginner = candidates.filter(exercise => exercise.level === "A1");
    if (beginner.length) candidates = beginner;
  } else if (session.config.level === "advanced") {
    const advanced = candidates.filter(exercise => exercise.level === "A2");
    if (advanced.length) candidates = advanced;
  }
  return candidates[0];
}

function levelLabel(level) {
  return ({zero:"principiante",basic:"intermedio",intermediate:"intermedio",advanced:"avanzado"})[level] || "intermedio";
}

function renderLesson({ exercise: exerciseOverride = null, answered = false } = {}) {
  $("lesson-panel").classList.remove("route-integration-active");
  if (session.turn >= session.config.duration && !answered) { finishSession(); return; }
  reviewMode = false;
  const questionIndex = answered ? Math.max(0, session.turn - 1) : session.turn;
  currentExercise = exerciseOverride || chooseExercise();
  localHintLevel = 0;
  if (!currentExercise) { finishSession(); return; }
  const adaptation = getAdaptation(session);
  const routePhase = routeMode ? getRoutePhase(questionIndex,routeQuestionCount) : null;
  $("lesson-phase").textContent = routeMode ? routePhase.label : "CONVERSACIÓN GUIADA";
  $("turn-count").textContent = "Pregunta " + (questionIndex + 1) + " / " + (routeMode ? routeQuestionCount : session.config.duration);
  $("progress-bar").style.width = (questionIndex / (routeMode ? routeQuestionCount : session.config.duration) * 100) + "%";
  $("streak").textContent = session.streak;
  $("word-count").textContent = session.vocabulary.length;
  $("error-count").textContent = session.errors.length;
  pendingFeedback = null;
  const questionSpeechSegments = getExerciseSpeechSegments(currentExercise);
  const promptMarkup = currentExercise.promptLanguage === "target"
    ? renderClickableTargetText(currentExercise.prompt)
    : renderVariantTerms(currentExercise.prompt);
  const instructionMarkup = currentExercise.instruction
    ? '<p class="exercise-instruction">' + escapeHTML(currentExercise.instruction) + '</p>' : "";
  const questionAudioMarkup = questionSpeechSegments.map(item => speakerButton(item.text, item.locale)).join(" ");
  $("lesson-content").innerHTML = getExerciseIllustration(currentExercise) + (routeMode ? '<p class="eyebrow">' + routePhase.label + '</p>' : '<p class="eyebrow">TEMA: ' + escapeHTML(topicLabels[session.config.topic].toUpperCase()) + ' · NIVEL ' + escapeHTML(levelLabel(session.config.level).toUpperCase()) + '</p>') + instructionMarkup + '<h3>' + promptMarkup + '</h3>' + questionAudioMarkup;
  bindVariantLinks($("lesson-content"));
  bindSpeakerButtons($("lesson-content"));
  bindTargetWords($("lesson-content"));
  speech.stop();
  speech.speakSequence(questionSpeechSegments, { automatic: true });
  const useMultipleChoice = routeMode
    ? routePhase.id !== "sentences" && Array.isArray(currentExercise.options) && currentExercise.options.length >= 2
    : questionIndex < 3;
  if (useMultipleChoice) {
    const options = currentExercise.options || [];
    $("answer-area").innerHTML = options.map((option,index) => '<div class="answer-option-row"><button class="answer-option" data-choice="' + index + '">' + renderClickableTargetText(option) + '</button>' + speakerButton(option, currentExercise.optionsLocale || (currentExercise.speechMode === "listening" ? "es-CL" : catalog.locale)) + '</div>').join("");
    $("answer-area").querySelectorAll("[data-choice]").forEach(button => button.addEventListener("click", () => submitAnswer(options[Number(button.dataset.choice)])));
    bindSpeakerButtons($("answer-area"));
    bindTargetWords($("answer-area"));
  } else {
    $("answer-area").innerHTML = '<input id="free-answer" class="answer-input" placeholder="Escribe tu respuesta…" autocomplete="off"><button id="submit-free" class="primary" type="button">Enviar respuesta →</button>';
    $("submit-free").addEventListener("click", () => submitAnswer($("free-answer").value));
    $("free-answer").addEventListener("keydown", event => { if (event.key === "Enter") submitAnswer($("free-answer").value); });
  }
  $("feedback").classList.add("hidden");
  $("hint-btn").disabled = false;
  $("hint-btn").hidden = routeMode ? routePhase.id !== "sentences" : questionIndex < 3;
  $("hint-btn").textContent = "Pista";
  $("review-btn").disabled = false;
  $("review-btn").hidden = false;
}

function submitAnswer(answer) {
  const result = recordAnswer(session, currentExercise, answer);
  $("submit-free")?.remove();
  localPendingAnswer = {
    correct: result.correct, expected: currentExercise.target,
    expectedLocale: currentExercise.answerLocale || (currentExercise.speechMode === "listening" ? "es-CL" : catalog.locale),
    explanation: currentExercise.explanation || "", selected: String(answer || ""),
    exercise: currentExercise, options: currentExercise.options || []
  };
  updateStats();
  showAnswerFeedback({
    correct: result.correct, expected: currentExercise.target,
    expectedLocale: currentExercise.answerLocale || (currentExercise.speechMode === "listening" ? "es-CL" : catalog.locale),
    explanation: result.correct ? "" : currentExercise.explanation,
    selected: String(answer || ""), options: currentExercise.options || [],
    correctOption: currentExercise.target
  });
  if (routeMode) saveRouteDraft();
}

function updateStats() {
  $("streak").textContent = session.streak;
  $("word-count").textContent = session.vocabulary.length;
  $("error-count").textContent = session.errors.length;
}
function showAnswerFeedback({ correct, expected, expectedLocale, explanation, selected, options = [], correctOption, showContinue = true }) {
  $("answer-area").querySelector(".answer-waiting")?.remove();
  $("answer-area").querySelector("#continue-answer")?.remove();
  const expectedText = !correct && expected ? '<p class="answer-correct-text">Respuesta correcta: ' + renderClickableTargetText(expected) + ' ' + speakerButton(expected, expectedLocale || session?.config.languageLocale || catalog?.locale) + '</p>' : "";
  const explanationText = !correct && explanation ? '<p class="answer-explanation">' + renderVariantTerms(explanation) + '</p>' : "";
  $("feedback").innerHTML = (correct ? '<p class="answer-status correct">Correcto</p>' : '<p class="answer-status incorrect">Incorrecto</p>') + expectedText + explanationText;
  $("feedback").classList.remove("hidden","bad");
  $("hint-btn").disabled = true;
  $("hint-btn").hidden = true;
  $("review-btn").disabled = true;
  $("answer-area").querySelectorAll("[data-choice],[data-ai-choice]").forEach(button => {
    const value = button.textContent.trim().toLocaleLowerCase();
    const correctValue = correct ? (selected || correctOption || expected) : (correctOption || expected);
    const isCorrect = value === String(correctValue || "").trim().toLocaleLowerCase();
    const isSelected = value === String(selected || "").trim().toLocaleLowerCase();
    button.classList.toggle("answer-correct", isCorrect);
    button.classList.toggle("answer-incorrect", !correct && isSelected && !isCorrect);
    button.disabled = true;
  });
  $("answer-area").querySelectorAll("input").forEach(input => { input.disabled = true; });
  $("answer-area").querySelectorAll("button:not([data-choice]):not([data-ai-choice]):not([data-speak])").forEach(button => { button.disabled = true; });
  if (showContinue) {
    $("answer-area").insertAdjacentHTML("beforeend", '<button id="continue-answer" class="primary answer-continue" type="button">Continuar →</button>');
    $("continue-answer").addEventListener("click", continueAfterAnswer);
  } else {
    $("answer-area").insertAdjacentHTML("beforeend", '<p class="muted answer-waiting">Preparando la siguiente pregunta…</p>');
  }
  bindSpeakerButtons($("feedback"));
  bindTargetWords($("feedback"));
}
function continueAfterAnswer() {
  if (aiEvaluationPending) {
    aiContinueRequested = true;
    const button = $("continue-answer");
    if (button) {
      button.disabled = true;
      button.textContent = "Continuando…";
    }
    return;
  }
  $("feedback").classList.add("hidden");
  if (aiMode && aiPendingTurn) {
    const pending = aiPendingTurn;
    aiPendingTurn = null;
    const evaluation = pending.evaluation || {};
    if (routeMode && pending.routeIntegrationQuestion) {
      if (evaluation.status === "correct") {
        session.routeIntegrationComplete = true;
        pendingFeedback = { text: evaluation.feedback || "Actividad integradora completada.", expected: pending.exercise.expectedAnswer || "" };
        finishSession();
      } else renderRouteAssessmentFailed();
      return;
    }
    if (routeMode && session.turn === routeQuestionCount && !routeIntegration) {
      routeIntegration = true;
      if (pending.result?.exercise) pending.result.nextAction = "answer";
    }
    if (pending.result?.nextAction === "finish" || (!routeMode && session.turn >= session.config.duration)) {
      finishSession();
      return;
    }
    renderAITutorTurn(pending.result);
    if (routeMode) saveRouteDraft();
    return;
  }
  localPendingAnswer = null;
  if (routeMode) {
    if (session.turn >= routeQuestionCount) {
      routeIntegration = true;
      saveRouteDraft();
      renderRouteIntegration();
      return;
    }
    saveRouteDraft();
  } else if (session.turn >= session.config.duration) {
    finishSession();
    return;
  }
  renderLesson();
}
function showFeedback(message, positive) {
  $("feedback").textContent = message;
  $("feedback").classList.remove("hidden","bad");
  if (!positive) $("feedback").classList.add("bad");
}

$("hint-btn").addEventListener("click", () => {
  speech.stop();
  if (reviewMode && reviewExercise) {
    if (reviewHintLevel === 0) {
      reviewHintLevel = 1;
      showFeedback("Pista: " + (reviewExercise.hint || reviewExercise.explanation || "Identifica la palabra clave de la consigna."), true);
      $("hint-btn").textContent = "Ver respuesta";
    } else {
      reviewHintLevel = 2;
      showFeedback("Respuesta: " + reviewExercise.target, true);
      $("hint-btn").hidden = true;
    }
    return;
  }
  if (aiMode) {
    if (aiHintLevel >= 2) { $("hint-btn").hidden = true; return; }
    if (aiHintLevel === 1) {
      aiHintLevel = 2;
      showFeedback("Respuesta: " + (aiCurrentExercise?.expectedAnswer || "Consulta la corrección al responder."), true);
      $("hint-btn").hidden = true;
      return;
    }
    const storedHints = Array.isArray(aiCurrentExercise?.hints) ? aiCurrentExercise.hints : [];
    const hint = storedHints[0] || aiCurrentExercise?.hint;
    if (typeof hint === "string" && hint.trim()) {
      aiHintLevel = 1;
      showFeedback("Pista: " + hint.trim(), true);
      const hintSegments = (aiLastResult?.speechSegments || []).filter(item =>
        item && typeof item.text === "string" && item.text.trim() &&
        item.locale === (session.config.languageLocale || session.config.languageId) &&
        hint.toLocaleLowerCase().includes(item.text.toLocaleLowerCase())
      );
      appendSpeechButtons($("feedback"), hintSegments);
      speech.speakSequence(hintSegments, { automatic: true });
      $("hint-btn").textContent = "Ver respuesta";
      return;
    }
    requestAdaptiveHint();
    return;
  }
  if (!currentExercise) return;
  if (routeMode && routeIntegration && Array.isArray(currentExercise.hints)) {
    if (routeIntegrationHintLevel === 0) {
      routeIntegrationHintLevel = 1;
      showFeedback("Pista: " + currentExercise.hints[0], true);
      $("hint-btn").textContent = "Ver respuesta";
    } else {
      routeIntegrationHintLevel = 2;
      showFeedback("Respuesta: " + currentExercise.target, true);
      $("hint-btn").hidden = true;
    }
    saveRouteDraft();
    return;
  }
  if (!currentExercise) return;
  if (localHintLevel === 0) {
    localHintLevel = 1;
    showFeedback("Pista: " + (currentExercise.hint || currentExercise.explanation || "Identifica primero la palabra clave de la consigna."), true);
    appendCatalogSpeech($("feedback"), currentExercise, "hintSpeechSegments");
    $("hint-btn").textContent = "Ver respuesta";
  } else {
    localHintLevel = 2;
    showFeedback("Respuesta: " + currentExercise.target, true);
    $("hint-btn").hidden = true;
  }
});

$("review-btn").addEventListener("click", () => {
  const lastError = [...session.errors].reverse().find(error => error.exerciseId);
  if (!lastError) { showFeedback("Todavía no hay errores registrados para repasar.", true); return; }
  reviewExercise = catalog.exercises.find(exercise => exercise.id === lastError.exerciseId);
  if (!reviewExercise) return;
  reviewMode = true;
  $("lesson-phase").textContent = "REPASO";
  reviewHintLevel = 0;
  $("hint-btn").hidden = false;
  $("hint-btn").disabled = false;
  $("hint-btn").textContent = "Pista";
  speech.stop();
  $("lesson-content").innerHTML = '<h3>Intenta reconstruir esta frase:</h3><p>' + escapeHTML(reviewExercise.prompt) + '</p><p>La respuesta se comprobará sin consumir un turno de la sesión.</p>';
  $("answer-area").innerHTML = '<input id="review-answer" class="answer-input" placeholder="Escribe tu respuesta…"><button class="primary" id="check-review" type="button">Comprobar repaso</button>';
  $("check-review").addEventListener("click", () => {
    const ok = evaluateAnswer($("review-answer").value, reviewExercise);
    $("hint-btn").hidden = true;
    showFeedback(ok ? "Correcto. " + reviewExercise.explanation : "Respuesta de referencia: " + reviewExercise.target + ". " + reviewExercise.explanation, ok);
    appendCatalogSpeech($("feedback"), reviewExercise, "explanationSpeechSegments", true);
    $("answer-area").innerHTML = '<button class="secondary" id="back-to-practice" type="button">Volver a la práctica</button>';
    $("back-to-practice").addEventListener("click", renderLesson);
  });
});

function finishSession() {
  if (!session || sessionFinished) return;
  sessionFinished = true;
  if (routeMode && session.routeIntegrationComplete) {
    const attempted = Math.max(1, session.answers.length || session.turn);
    const correct = Number(session.correct) || 0;
    const accuracy = Math.round(correct / attempted * 100);
    const stars = Math.min(5, Math.floor(accuracy / 20));
    const state = getRouteProgressForLanguage(session.config.languageId);
    state.completedUnits = state.completedUnits || {};
    state.completedUnits[activeRouteUnit?.id || "foundations"] = { completed:true, stars, accuracy, correct, attempted, completedAt:new Date().toISOString() };
    saveRouteProgressForLanguage(session.config.languageId,state);
    selectedRouteUnitId = activeRouteUnit?.id || "foundations";
    routeSelectionTouched = false;
    try { localStorage.removeItem(ROUTE_STORAGE_KEY + ":" + session.config.languageId); } catch {}
    try { localStorage.removeItem("adaptive-language-tutor.route-started:" + session.config.languageId); } catch {}
    try { localStorage.removeItem("adaptive-language-tutor.route-completed:" + session.config.languageId); } catch {}
    routeDraft = null;
    $("route-resume").classList.add("hidden");
    renderRouteDashboard();
  }
  speech.stop();
  $("lesson-panel").classList.add("hidden");
  $("summary-panel").classList.remove("hidden");
  $("session-status").textContent = "";
  const summary = buildSummary(session);
  const finalFeedback = pendingFeedback;
  pendingFeedback = null;
  persistSession(progress, session, summary);
  saveProgress(progress);
  refreshDashboard();
  const summaryLocale = session.config.languageLocale || session.config.languageId;
  const attemptedCount = Number(summary.attempted) || session.answers.length;
  const correctCount = Number(summary.correct) || 0;
  const accuracyPercent = attemptedCount ? Math.round(correctCount / attemptedCount * 100) : 0;
  const accuracyMessage = accuracyPercent === 100 ? "Perfecto" : accuracyPercent > 80 ? "Muy bien" : accuracyPercent > 60 ? "Bien" : accuracyPercent >= 40 ? "Vas progresando" : "Sigue practicando";
  const errorCount = summary.errors.length;
  const errors = summary.errors.map(item => '<li><span class="summary-submitted">' + escapeHTML(item.submitted) + '</span><span class="summary-arrow"> → </span><span class="summary-expected">' + escapeHTML(item.expected) + '</span></li>').join("");
  const vocabularyText = summary.vocabulary.map(item =>
    '<li>' + renderClickableTargetText(item.term) + ' ' + speakerButton(item.term, summaryLocale) + '</li>'
  ).join("");
  const focusItems = [...new Set([topicLabels[session.config.topic], ...summary.recommendedFocus, ...(summary.reviewPatterns || [])].filter(Boolean))];
  const routeScoreMarkup = routeMode && session.routeIntegrationComplete
    ? '<p class="summary-route-score">' + (Math.min(5,Math.floor(accuracyPercent/20))) + '/5 estrellas en ' + escapeHTML(activeRouteUnit?.title || "la unidad") + '</p>' : "";
  $("summary-content").innerHTML = '<h2 class="summary-title">Resumen</h2>' +
    '<div class="summary-accuracy"><strong>' + accuracyPercent + '%</strong><span>' + accuracyMessage + '</span>' + routeScoreMarkup + '</div>' +
    '<section class="summary-section"><h3 class="summary-error-title">Errores ' + errorCount + '/' + attemptedCount + '</h3><ul>' +
    (errors || '<li>Sin errores</li>') + '</ul></section>' +
    '<section class="summary-section"><h3>Vocabulario</h3><ul>' +
    (vocabularyText || '<li>Sin palabras nuevas</li>') + '</ul></section>' +
    '<section class="summary-section"><h3>Temas</h3><ul>' +
    focusItems.map(item => '<li>' + escapeHTML(item) + '</li>').join("") + '</ul></section>';
  bindSpeakerButtons($("summary-content"));
  speech.speakSequence(summary.vocabulary.map(item => ({ text: item.term, locale: summaryLocale })), { automatic: true });
}

$("new-session").addEventListener("click", () => {
  closeSessionAndReturn();
});

// Main navigation and language onboarding
function showScreen(name) {
  $("session-view").classList.add("hidden");
  $("app-shell").classList.remove("session-active");
  if (name === "theory") {
    $("theory-detail").classList.add("hidden");
    $("theory-topic-list").classList.add("hidden");
    $("theory-grid").classList.remove("hidden");
  }
  if (name === "exercises") {
    $("exercise-choice-panel").classList.remove("hidden");
    $("review-exercises").classList.add("hidden");
    selectedExerciseMode = "practice";
    document.querySelectorAll("[data-mode]").forEach(item => item.classList.toggle("selected", item.dataset.mode === "practice"));
    $("screen-exercises").classList.remove("review-selected");
    $("setup-panel").classList.add("hidden");
    $("practice-toggle")?.setAttribute("aria-expanded","false");
    $("start-session").textContent = "Comenzar práctica";
    $("topic").disabled = false;
  }
  if (name === "route") renderRouteDashboard();
  if (name === "stats") refreshDashboard();
  document.querySelectorAll(".app-screen").forEach(screen => screen.classList.toggle("hidden", screen.id !== "screen-" + name));
  $("app-shell").classList.remove("session-active");
  document.querySelectorAll(".nav-item").forEach(button => {
    const active = button.dataset.screen === name;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  window.scrollTo(0, 0);
}
function showSessionView(mode) {
  document.querySelectorAll(".app-screen").forEach(screen => screen.classList.add("hidden"));
  $("session-view").classList.remove("hidden");
  $("app-shell").classList.add("session-active");
  $("session-mode-label").textContent = mode === "review" ? "Repaso" : "Práctica";
  window.scrollTo(0, 0);
}
function closeSessionAndReturn() {
  sessionAbortController?.abort();
  sessionAbortController = null;
  speech.stop();
  session = null;
  reviewProgressDraft = null;
  aiMode = false;
  aiHistory = [];
  aiLastResult = null;
  aiCurrentExercise = null;
  aiPendingTurn = null;
  localPendingAnswer = null;
  aiHintPending = false;
  aiHintLevel = 0;
  sessionFinished = false;
  currentExercise = null;
  reviewMode = false;
  $("lesson-panel").classList.remove("hidden");
  $("summary-panel").classList.add("hidden");
  $("session-view").classList.add("hidden");
  $("app-shell").classList.remove("session-active");
  $("exercise-choice-panel").classList.remove("hidden");
  $("review-exercises").classList.add("hidden");
  const returnScreen = routeMode ? "route" : "exercises";
  routeMode = false;
  showScreen(returnScreen);
}

 document.querySelectorAll("[data-screen]").forEach(button => button.addEventListener("click", () => showScreen(button.dataset.screen)));
document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => {
  selectedExerciseMode = button.dataset.mode;
  document.querySelectorAll("[data-mode]").forEach(item => item.classList.toggle("selected", item === button));
  if (selectedExerciseMode === "review") {
    $("setup-panel").classList.add("hidden");
    $("practice-toggle")?.setAttribute("aria-expanded","false");
    $("screen-exercises").classList.add("review-selected");
    startSpacedReview();
    return;
  }
  $("screen-exercises").classList.remove("review-selected");
  $("review-exercises").classList.add("hidden");
  $("setup-panel").classList.toggle("hidden");
  $("practice-toggle")?.setAttribute("aria-expanded",String(!$("setup-panel").classList.contains("hidden")));
  $("topic").disabled = false;
  $("start-session").textContent = "Comenzar práctica";
  $("ai-status").classList.remove("hidden");
}));
$("route-start-exercises")?.addEventListener("click", () => showScreen("exercises"));
$("route-unit-list")?.addEventListener("click", event => {
  const button = event.target.closest("[data-route-unit]");
  if (!button || button.disabled) return;
  selectedRouteUnitId = button.dataset.routeUnit;
  routeSelectionTouched = true;
  renderRouteDashboard();
});
$("route-start").addEventListener("click", () => startRouteSession(Boolean(routeDraft?.session && routeDraft.unitId === selectedRouteUnitId)));
$("route-resume").addEventListener("click", () => startRouteSession(true));
$("route-reset").addEventListener("click", () => $("route-reset-confirm").showModal());
$("cancel-route-reset").addEventListener("click", () => $("route-reset-confirm").close());
$("confirm-route-reset").addEventListener("click", () => {
  $("route-reset-confirm").close();
  const languageId = getSelectedCatalog()?.id;
  if (!languageId) return;
  try {
    localStorage.removeItem(ROUTE_UNITS_KEY + ":" + languageId);
    localStorage.removeItem(ROUTE_STORAGE_KEY + ":" + languageId);
    localStorage.removeItem("adaptive-language-tutor.route-started:" + languageId);
    localStorage.removeItem("adaptive-language-tutor.route-completed:" + languageId);
  } catch {}
  routeDraft = null;
  activeRouteUnit = null;
  selectedRouteUnitId = "foundations";
  routeSelectionTouched = false;
  routeMode = false;
  renderRouteDashboard();
});
$("setup-back")?.addEventListener("click", () => showScreen("exercises"));
$("session-close").addEventListener("click", () => {
  if (sessionFinished || routeMode) closeSessionAndReturn();
  else $("session-confirm").showModal();
});
$("cancel-session-close").addEventListener("click", () => $("session-confirm").close());
$("confirm-session-close").addEventListener("click", () => {
  $("session-confirm").close();
  closeSessionAndReturn();
});

const theoryContent = {
  grammar: ["Gramática", [
    ["Pronombres personales", "Los pronombres indican quién realiza la acción. Su forma y frecuencia de uso dependen del idioma; en algunas lenguas pueden omitirse cuando el verbo ya identifica a la persona."],
    ["Artículos", "Los artículos acompañan al sustantivo y pueden indicar si hablamos de algo conocido o no. Algunos idiomas distinguen género y número; otros no utilizan artículos."],
    ["Verbo ser y estar", "Este tema expresa identidad, características, estados y ubicación. Algunos idiomas usan dos verbos diferentes; otros concentran varios significados en una sola forma."],
    ["Tiempo presente", "Se utiliza para hábitos, hechos generales y situaciones actuales. La conjugación puede cambiar según la persona, el número y el tipo de verbo."],
    ["Pasado", "Permite hablar de acciones terminadas o situaciones anteriores. Aprende las formas regulares e irregulares dentro de frases completas."],
    ["Futuro", "Expresa planes, predicciones e intenciones. Cada idioma utiliza sus propias formas verbales o construcciones auxiliares."]
  ]],
  vocabulary: ["Vocabulario", [
    ["Saludos", "Saludos y despedidas formales e informales. Aprende a elegirlos según la hora, la situación y la relación con la otra persona."],
    ["Personas y familia", "Vocabulario para hablar de personas, relaciones y familia. Aprende cada sustantivo con sus marcas gramaticales cuando corresponda."],
    ["Tiempo y fechas", "Días, meses, horas y expresiones temporales para organizar actividades y contar cuándo suceden las cosas."],
    ["Comida y bebida", "Ingredientes, comidas, bebidas y vocabulario para pedir, comprar o expresar preferencias."],
    ["Viajes y transporte", "Palabras para desplazarse, comprar pasajes, orientarse y resolver situaciones habituales durante un viaje."]
  ]],
  expressions: ["Expresiones", [
    ["Presentarse", "Estructuras para saludar, decir tu nombre, explicar de dónde eres y conocer a otra persona."],
    ["Pedir ayuda", "Formas directas y corteses de solicitar ayuda, pedir que repitan y explicar que no has entendido."],
    ["En un café", "Frases para pedir alimentos y bebidas, consultar opciones y pagar de manera educada."],
    ["Preguntar y aclarar", "Preguntas para pedir ubicaciones, precios, horarios y confirmar que has entendido la respuesta."],
    ["Conversación cotidiana", "Preguntas abiertas y respuestas breves para mantener una conversación y mostrar interés."]
  ]]
};
const theorySamples = {
  "Portugués brasileño":{pronouns:"eu, você, ele, ela, nós, vocês, eles/elas",greeting:"Olá! Bom dia! Até logo!",intro:"Meu nome é Ana. Sou do Chile.",articles:"o, a, os, as; um, uma, uns, umas"},
  "Inglés":{pronouns:"I, you, he, she, it, we, they",greeting:"Hello! Good morning! See you later!",intro:"My name is Ana. I'm from Chile.",articles:"the; a, an"},
  "Italiano":{pronouns:"io, tu, lui, lei, noi, voi, loro",greeting:"Ciao! Buongiorno! A presto!",intro:"Mi chiamo Ana. Sono del Cile.",articles:"il, lo, la, i, gli, le; un, uno, una"},
  "Alemán":{pronouns:"ich, du, er, sie, es, wir, ihr, sie",greeting:"Hallo! Guten Morgen! Bis später!",intro:"Ich heiße Ana. Ich komme aus Chile.",articles:"der, die, das; ein, eine"},
  "Ruso":{pronouns:"я, ты, он, она, оно, мы, вы, они",greeting:"Здравствуйте! Доброе утро! До свидания!",intro:"Меня зовут Ана. Я из Чили.",articles:"El ruso no utiliza artículos equivalentes a el/la o un/una."},
  "Francés":{pronouns:"je, tu, il, elle, nous, vous, ils, elles",greeting:"Bonjour! Salut! À bientôt!",intro:"Je m'appelle Ana. Je viens du Chili.",articles:"le, la, les; un, une, des"},
  "Español":{pronouns:"yo, tú, él, ella, nosotros, vosotros/ustedes, ellos",greeting:"¡Hola! ¡Buenos días! ¡Hasta luego!",intro:"Me llamo Ana. Soy de Chile.",articles:"el, la, los, las; un, una, unos, unas"},
  "Japonés":{pronouns:"私, あなた, 彼, 彼女, 私たち",greeting:"こんにちは。おはようございます。またね。",intro:"私はアナです。チリ出身です。",articles:"El japonés no utiliza artículos equivalentes a el/la o un/una."},
  "Chino mandarín":{pronouns:"我, 你, 他, 她, 我们, 你们, 他们",greeting:"你好！早上好！再见！",intro:"我叫安娜。我来自智利。",articles:"El chino mandarín no utiliza artículos equivalentes a el/la o un/una."},
  "Coreano":{pronouns:"나, 너, 그, 그녀, 우리, 여러분",greeting:"안녕하세요! 좋은 아침이에요! 안녕히 가세요!",intro:"제 이름은 아나예요. 저는 칠레에서 왔어요.",articles:"El coreano no utiliza artículos equivalentes a el/la o un/una."},
  "Neerlandés":{pronouns:"ik, jij, hij, zij, wij, jullie, zij",greeting:"Hallo! Goedemorgen! Tot ziens!",intro:"Ik heet Ana. Ik kom uit Chili.",articles:"de, het; een"},
  "Árabe":{pronouns:"أنا, أنت, هو, هي, نحن, أنتم, هم",greeting:"مرحباً! صباح الخير! إلى اللقاء!",intro:"اسمي آنا. أنا من تشيلي.",articles:"الـ es el artículo definido; no existe un artículo indefinido equivalente."},
  "Hindi":{pronouns:"मैं, तुम, वह, हम, आप, वे",greeting:"नमस्ते! सुप्रभात! फिर मिलेंगे!",intro:"मेरा नाम आना है। मैं चिली से हूँ।",articles:"El hindi no utiliza artículos equivalentes a el/la o un/una."},
  "Turco":{pronouns:"ben, sen, o, biz, siz, onlar",greeting:"Merhaba! Günaydın! Görüşürüz!",intro:"Benim adım Ana. Şililiyim.",articles:"bir puede funcionar como artículo indefinido; no hay artículo definido separado."},
  "Griego":{pronouns:"εγώ, εσύ, αυτός, αυτή, εμείς, εσείς, αυτοί",greeting:"Γεια σου! Καλημέρα! Τα λέμε!",intro:"Με λένε Άννα. Είμαι από τη Χιλή.",articles:"ο, η, το; ένας, μία, ένα"},
  "Polaco":{pronouns:"ja, ty, on, ona, my, wy, oni/one",greeting:"Cześć! Dzień dobry! Do zobaczenia!",intro:"Mam na imię Ana. Jestem z Chile.",articles:"El polaco no utiliza artículos equivalentes a el/la o un/una."},
  "Sueco":{pronouns:"jag, du, han, hon, vi, ni, de",greeting:"Hej! God morgon! Vi ses!",intro:"Jag heter Ana. Jag kommer från Chile.",articles:"en, ett; el definido suele expresarse como sufijo."},
  "Noruego":{pronouns:"jeg, du, han, hun, vi, dere, de",greeting:"Hei! God morgen! Ha det!",intro:"Jeg heter Ana. Jeg kommer fra Chile.",articles:"en, ei, et; el definido suele expresarse como sufijo."},
  "Danés":{pronouns:"jeg, du, han, hun, vi, I, de",greeting:"Hej! Godmorgen! Vi ses!",intro:"Jeg hedder Ana. Jeg kommer fra Chile.",articles:"en, et; el definido suele expresarse como sufijo."},
  "Hebreo":{pronouns:"אני, אתה, את, הוא, היא, אנחנו, אתם, הם",greeting:"שלום! בוקר טוב! להתראות!",intro:"קוראים לי אנה. אני מצ׳ילה.",articles:"ה־ es el artículo definido; no existe un artículo indefinido equivalente."},
  "Vietnamita":{pronouns:"tôi, bạn, anh ấy, cô ấy, chúng tôi, họ",greeting:"Xin chào! Chào buổi sáng! Tạm biệt!",intro:"Tôi tên là Ana. Tôi đến từ Chile.",articles:"El vietnamita no utiliza artículos equivalentes a el/la o un/una."},
  "Indonesio":{pronouns:"saya, kamu, dia, kami, kita, mereka",greeting:"Halo! Selamat pagi! Sampai jumpa!",intro:"Nama saya Ana. Saya dari Chili.",articles:"El indonesio no utiliza artículos equivalentes a el/la o un/una."},
  "Tailandés":{pronouns:"ฉัน, คุณ, เขา, เรา, พวกเขา",greeting:"สวัสดี! อรุณสวัสดิ์! แล้วพบกันใหม่!",intro:"ฉันชื่ออานา ฉันมาจากชิลี",articles:"El tailandés no utiliza artículos equivalentes a el/la o un/una."}
};
const pronounTranslations = {
  "Portugués brasileño":["yo","tú / usted","él","ella","nosotros","ustedes","ellos / ellas"],
  "Inglés":["yo","tú / ustedes","él","ella","ello / eso","nosotros","ellos / ellas"],
  "Italiano":["yo","tú","él","ella","nosotros","ustedes","ellos / ellas"],
  "Alemán":["yo","tú","él","ella","ello","nosotros","vosotros","ellos / ellas"],
  "Ruso":["yo","tú","él","ella","ello","nosotros","usted / ustedes","ellos / ellas"],
  "Francés":["yo","tú","él","ella","nosotros","usted / ustedes","ellos","ellas"],
  "Español":["yo","tú","él","ella","nosotros","vosotros / ustedes","ellos / ellas"],
  "Japonés":["yo","tú","él","ella","nosotros"],
  "Chino mandarín":["yo","tú","él","ella","nosotros","ustedes","ellos / ellas"],
  "Coreano":["yo","tú","él","ella","nosotros","ustedes"],
  "Neerlandés":["yo","tú","él","ella","nosotros","ustedes","ellos / ellas"],
  "Árabe":["yo","tú (masculino)","tú (femenino)","él","ella","nosotros","ustedes","ellos"],
  "Hindi":["yo","tú","él / ella","nosotros","usted / ustedes","ellos / ellas"],
  "Turco":["yo","tú","él / ella","nosotros","usted / ustedes","ellos / ellas"],
  "Griego":["yo","tú","él","ella","nosotros","ustedes","ellos"],
  "Polaco":["yo","tú","él","ella","nosotros","ustedes","ellos / ellas"],
  "Sueco":["yo","tú","él","ella","nosotros","ustedes","ellos / ellas"],
  "Noruego":["yo","tú","él","ella","nosotros","ustedes","ellos / ellas"],
  "Danés":["yo","tú","él","ella","nosotros","ustedes","ellos / ellas"],
  "Hebreo":["yo","tú (masculino)","tú (femenino)","él","ella","nosotros","ustedes","ellos"],
  "Vietnamita":["yo","tú","él","ella","nosotros (excl.)","ellos / ellas"],
  "Indonesio":["yo (formal)","tú","él / ella","nosotros (excl.)","nosotros (incl.)","ellos / ellas"],
  "Tailandés":["yo","tú / usted","él / ella","nosotros","ellos / ellas"]
};
const verbLessons = {
  "Portugués brasileño": {
    lead:"Portugués distingue ser (identidad, características y origen) de estar (estado temporal y ubicación). Con você/vocês se usa la forma de tercera persona.",
    tables:[["SER · identidad","Persona","Forma"],["eu","sou"],["você / ele / ela","é"],["nós","somos"],["vocês / eles / elas","são"],["ESTAR · estado y ubicación","Persona","Forma"],["eu","estou"],["você / ele / ela","está"],["nós","estamos"],["vocês / eles / elas","estão"]],
    example:"Eu sou chilena. / Hoje estou cansada. / Estamos em casa.",
    rule:"SER: origen, identidad y rasgos definitorios. ESTAR: estados, condiciones y ubicación. Atención: estar también se usa en estar + gerundio (estou estudando)."
  },
  "Inglés":{
    lead:"El inglés utiliza un solo verbo principal, to be, para los significados habituales de ser y estar. La forma cambia según la persona.",
    tables:[["TO BE · presente","Persona","Forma"],["I","am"],["you / we / they","are"],["he / she / it","is"]],
    example:"I am Chilean (soy chileno/a). / I am tired (estoy cansado/a). / We are at home (estamos en casa).",
    rule:"En preguntas se invierte el orden (Are you ready?). En negativo se añade not (is not / isn't). No se traduce mecánicamente ser/estar: el contexto determina el sentido."
  },
  "Italiano":{
    lead:"Essere expresa identidad, origen y características; stare se usa especialmente con estados, permanencia y algunas construcciones. La ubicación normalmente usa essere.",
    tables:[["ESSERE","Persona","Forma"],["io","sono"],["tu","sei"],["lui / lei","è"],["noi","siamo"],["voi","siete"],["loro","sono"],["STARE","Persona","Forma"],["io","sto"],["tu","stai"],["lui / lei","sta"],["noi","stiamo"],["voi","state"],["loro","stanno"]],
    example:"Sono cileno. / Sto bene. / Sto a casa (me quedo en casa).",
    rule:"Essere: identidad, origen y ubicación (Sono a Roma). Stare: estado o permanencia (Sto bene). Stare + gerundio expresa acción en curso (sto studiando)."
  },
  "Alemán":{
    lead:"Se usa sein para identidad, características, estados y ubicación; no hay una oposición equivalente a ser/estar del español.",
    tables:[["SEIN · presente","Persona","Forma"],["ich","bin"],["du","bist"],["er / sie / es","ist"],["wir","sind"],["ihr","seid"],["sie / Sie","sind"]],
    example:"Ich bin Chilene (soy chileno). / Ich bin müde (estoy cansado). / Wir sind zu Hause (estamos en casa).",
    rule:"El verbo es irregular y debe memorizarse. Para indicar cambio o convertirse se usa werden (ich werde müde = me estoy cansando). La ubicación se expresa con sein y una expresión de lugar."
  },
  "Ruso":{
    lead:"En presente, el ruso normalmente omite el verbo equivalente a ser/estar cuando une sujeto y atributo. El verbo быть aparece con claridad en pasado y futuro.",
    tables:[["БЫТЬ · formas útiles","Tiempo / persona","Forma"],["presente","normalmente se omite"],["pasado masc. / fem.","был / была"],["futuro · я","буду"],["futuro · ты","будешь"],["futuro · он / она","будет"],["futuro · мы / вы / они","будем / будете / будут"]],
    example:"Я студент (soy estudiante). / Она дома (ella está en casa). / Я был дома (estuve en casa). / Я буду дома (estaré en casa).",
    rule:"No añadas есть en una oración nominal presente normal. El pasado concuerda en género y el futuro utiliza буду + infinitivo."
  },
  "Francés":{
    lead:"Être cubre la mayoría de los usos de ser y estar. Es irregular y aparece en identidad, descripción, estado y ubicación.",
    tables:[["ÊTRE · presente","Persona","Forma"],["je","suis"],["tu","es"],["il / elle / on","est"],["nous","sommes"],["vous","êtes"],["ils / elles","sont"]],
    example:"Je suis chilien (soy chileno). / Je suis fatigué (estoy cansado). / Nous sommes à Paris (estamos en París).",
    rule:"Memoriza las seis formas: no siguen un patrón regular. Para indicar permanencia o estado que continúa también puede aparecer rester (Je reste ici)."
  },
  "Español":{
    lead:"El español distingue ser y estar. La elección depende de identidad/rasgo, estado/condición o ubicación; no es simplemente una diferencia entre permanente y temporal.",
    tables:[["SER · presente","Persona","Forma"],["yo","soy"],["tú","eres"],["él / ella / usted","es"],["nosotros","somos"],["vosotros","sois"],["ellos / ustedes","son"],["ESTAR · presente","Persona","Forma"],["yo","estoy"],["tú","estás"],["él / ella / usted","está"],["nosotros","estamos"],["vosotros","estáis"],["ellos / ustedes","están"]],
    example:"Soy de Chile (origen). / Estoy cansado (estado). / Estamos en casa (ubicación).",
    rule:"SER: identidad, origen, profesión y características. ESTAR: ubicación, estado y resultado. Excepción importante: ser listo = inteligente; estar listo = preparado."
  },
  "Neerlandés":{
    lead:"Zijn expresa identidad, estado y ubicación. La forma verbal cambia con la persona y jij tiene una forma especial en preguntas.",
    tables:[["ZIJN · presente","Persona","Forma"],["ik","ben"],["jij / je","bent (pregunta: ben jij?)"],["hij / zij / het","is"],["wij / jullie / zij","zijn"]],
    example:"Ik ben student. / Zij is moe. / We zijn thuis.",
    rule:"El verbo es irregular. En una pregunta con jij, la -t desaparece cuando el verbo va delante: Ben jij klaar?"
  },
  "Japonés":{
    lead:"です (desu) funciona como cópula para identificar o describir; います/あります expresan existencia o ubicación. No cambia según la persona.",
    tables:[["CÓPULA · forma cortés","Uso","Forma"],["presente afirmativo","です (desu)"],["presente negativo","ではありません / じゃありません"],["pasado afirmativo","でした"],["pasado negativo","ではありませんでした"]],
    example:"私は学生です (Soy estudiante). / 私は家にいます (Estoy en casa).",
    rule:"El sujeto suele omitirse si se entiende. Para personas y animales se usa います; para objetos y plantas, あります. El orden habitual sitúa el verbo al final."
  },
  "Chino mandarín":{
    lead:"是 (shì) une sujeto e identidad; 在 (zài) indica ubicación. Los verbos no se conjugan por persona ni número.",
    tables:[["SER / IDENTIDAD","Uso","Forma"],["identidad","我是学生 (wǒ shì xuésheng)"],["ESTAR / UBICACIÓN","Uso","Forma"],["ubicación","我在家 (wǒ zài jiā)"],["estado / existencia","我很好 (wǒ hěn hǎo)"]],
    example:"我是智利人 (Soy chileno/a). / 我在家 (Estoy en casa).",
    rule:"No uses 是 delante de adjetivos simples: 很好 significa estar bien. Para ubicación utiliza 在. El verbo no cambia según yo/tú/él."
  },
  "Coreano":{
    lead:"이다 (ida) es la cópula de identidad; 있다 (itda) expresa existencia, posesión o ubicación. Las terminaciones cambian según cortesía y tiempo.",
    tables:[["IDENTIDAD · estilo cortés","Uso","Forma"],["después de consonante","이에요"],["después de vocal","예요"],["forma formal","입니다"],["ESTAR / EXISTIR","Uso","Forma"],["presente cortés","있어요"],["pasado cortés","있었어요"],["negación","없어요 (no hay / no tener)"]],
    example:"저는 학생이에요 (Soy estudiante). / 집에 있어요 (Estoy en casa).",
    rule:"La cópula se une al sustantivo: 학생이에요, 의사예요. Para ubicación se usa el marcador 에 + 있어요. La cortesía es esencial."
  },
  "Árabe":{
    lead:"En presente, las oraciones nominales suelen omitir el verbo ser/estar. كان (kāna) expresa ser/estar en pasado y cambia según género y número.",
    tables:[["PRESENTE","Ejemplo","Significado"],["أنا طالب","anā ṭālib","Soy estudiante"],["هي في البيت","hiya fī al-bayt","Ella está en casa"],["PASADO · كان","Persona","Forma"],["هو","كان (kāna)"],["هي","كانت (kānat)"],["هم","كانوا (kānū)"]],
    example:"أنا من تشيلي (Soy de Chile). / أنا في البيت (Estoy en casa). / كنت في البيت (Estuve en casa).",
    rule:"No añadas كان en una oración nominal presente simple. El adjetivo y el sustantivo pueden concordar en género y número; el árabe tiene diferencias dialectales."
  },
  "Hindi":{
    lead:"होना (honā) significa ser/estar. En presente, हूँ / हो / है / हैं cambian con la persona, el número y el nivel de respeto; algunas formas también concuerdan con género.",
    tables:[["होना · presente","Persona","Forma"],["मैं","हूँ (hū̃)"],["तुम","हो (ho)"],["वह","है (hai)"],["हम","हैं (haĩ)"],["आप / वे","हैं (haĩ)"]],
    example:"मैं चिली से हूँ (Soy de Chile). / वह घर पर है (Él/ella está en casa).",
    rule:"आप utiliza la forma respetuosa हैं. En construcciones de pasado y participio, el género del sujeto puede cambiar la forma verbal."
  },
  "Turco":{
    lead:"Turco expresa identidad con sufijos de cópula añadidos al sustantivo o adjetivo. La terminación cambia por persona y armonía vocálica; el pronombre puede omitirse.",
    tables:[["CÓPULA · presente","Persona","Ejemplo"],["ben","öğretmenim"],["sen","öğretmensin"],["o","öğretmen"],["biz","öğretmeniz"],["siz","öğretmensiniz"],["onlar","öğretmen(ler)"]],
    example:"Ben Şililiyim (Soy chileno/a). / Evdeyim (Estoy en casa).",
    rule:"El sufijo depende de la última vocal (armonía vocálica). En tercera persona singular puede no aparecer un sufijo audible. La ubicación suele marcarse con -de/-da."
  },
  "Griego":{
    lead:"Είμαι (eímai) cubre ser y estar. Es irregular y conserva una forma propia para cada persona.",
    tables:[["ΕΙΜΑΙ · presente","Persona","Forma"],["εγώ","είμαι"],["εσύ","είσαι"],["αυτός / αυτή","είναι"],["εμείς","είμαστε"],["εσείς","είστε"],["αυτοί / αυτές","είναι"]],
    example:"Είμαι από τη Χιλή (Soy de Chile). / Είμαι κουρασμένος (Estoy cansado). / Είμαστε στο σπίτι (Estamos en casa).",
    rule:"El adjetivo concuerda en género y número. La ubicación se expresa con una preposición y el caso correspondiente."
  },
  "Polaco":{
    lead:"Być significa ser/estar y es irregular. El verbo cambia según la persona; en pasado también concuerda en género.",
    tables:[["BYĆ · presente","Persona","Forma"],["ja","jestem"],["ty","jesteś"],["on / ona / ono","jest"],["my","jesteśmy"],["wy","jesteście"],["oni / one","są"]],
    example:"Jestem z Chile (Soy de Chile). / Jestem w domu (Estoy en casa).",
    rule:"En pasado se distingue género: byłem (masculino), byłam (femenino). El presente de być es obligatorio en estas oraciones."
  },
  "Sueco":{
    lead:"Vara cubre ser y estar. En presente, la forma är es la misma para todas las personas.",
    tables:[["VARA · presente","Persona","Forma"],["jag","är"],["du","är"],["han / hon / den / det","är"],["vi / ni / de","är"]],
    example:"Jag är från Chile (Soy de Chile). / Jag är trött (Estoy cansado/a). / Vi är hemma (Estamos en casa).",
    rule:"La forma no cambia con la persona. Para el pasado se usa var; para el supino/participio, varit."
  },
  "Noruego":{
    lead:"Være expresa ser/estar y utiliza er para todas las personas en presente.",
    tables:[["VÆRE · presente","Persona","Forma"],["jeg","er"],["du","er"],["han / hun / det","er"],["vi / dere / de","er"]],
    example:"Jeg er fra Chile (Soy de Chile). / Jeg er trøtt (Estoy cansado/a). / Vi er hjemme (Estamos en casa).",
    rule:"La forma presente no cambia por persona. El pasado es var y el participio ha sido/estado se forma con vært."
  },
  "Danés":{
    lead:"Være cubre ser y estar; en presente la forma er se utiliza con todas las personas.",
    tables:[["VÆRE · presente","Persona","Forma"],["jeg","er"],["du","er"],["han / hun / det","er"],["vi / I / de","er"]],
    example:"Jeg er fra Chile (Soy de Chile). / Jeg er træt (Estoy cansado/a). / Vi er hjemme (Estamos en casa).",
    rule:"El presente no cambia según la persona. El pasado es var y el participio es været."
  },
  "Hebreo":{
    lead:"En presente, el hebreo suele usar oraciones nominales sin verbo ser/estar. היה (hayá) aparece en pasado y cambia según género y número.",
    tables:[["PRESENTE","Ejemplo","Significado"],["אני סטודנט","ani student","Soy estudiante (masculino)"],["אני בבית","ani babáyit","Estoy en casa"],["PASADO · היה","Persona","Forma"],["él","היה (hayá)"],["ella","הייתה (haytá)"],["ellos","היו (hayú)"]],
    example:"אני מצ׳ילה (Soy de Chile). / היא בבית (Ella está en casa).",
    rule:"El verbo presente se omite normalmente. En pasado, la forma concuerda con género y número; el futuro utiliza יהיה y sus variantes."
  },
  "Vietnamita":{
    lead:"Là introduce identidad o profesión; ở expresa ubicación. Los verbos no se conjugan por persona y el contexto marca el tiempo.",
    tables:[["IDENTIDAD / UBICACIÓN","Uso","Forma"],["identidad","là"],["ubicación","ở"],["pasado","đã + verbo"],["futuro","sẽ + verbo"]],
    example:"Tôi là sinh viên (Soy estudiante). / Tôi ở nhà (Estoy en casa).",
    rule:"No cambies el verbo según yo/tú/él. Para marcar pasado o futuro se añaden partículas como đã o sẽ."
  },
  "Indonesio":{
    lead:"Indonesio suele omitir la cópula en frases nominales; adalah da énfasis o define, y berada indica ubicación. No hay conjugación por persona.",
    tables:[["IDENTIDAD / UBICACIÓN","Uso","Forma"],["definición","adalah"],["ubicación","berada"],["pasado","sudah + verbo"],["futuro","akan + verbo"]],
    example:"Saya mahasiswa (Soy estudiante). / Saya berada di rumah (Estoy en casa).",
    rule:"En conversación, la cópula suele omitirse. El tiempo se expresa mediante palabras como sudah (ya) y akan (futuro), no mediante terminaciones verbales."
  },
  "Tailandés":{
    lead:"เป็น (pen) expresa identidad o profesión; อยู่ (yùu) indica ubicación o permanencia. Los verbos no se conjugan por persona.",
    tables:[["IDENTIDAD / UBICACIÓN","Uso","Forma"],["identidad / profesión","เป็น (pen)"],["ubicación / permanencia","อยู่ (yùu)"],["pasado","เคย / แล้ว según contexto"],["futuro","จะ (jà) + verbo"]],
    example:"ฉันเป็นนักเรียน (Soy estudiante). / ฉันอยู่ที่บ้าน (Estoy en casa).",
    rule:"No existe flexión verbal por persona. La cortesía se expresa con partículas como ครับ / ค่ะ y el tiempo mediante marcadores."
  }
};
const tenseLessons = {
  "Portugués brasileño":{
    present:[["eu","falo"],["tu","falas (uso regional)"],["você / ele / ela","fala"],["nós","falamos"],["a gente","fala"],["vocês / eles / elas","falam"]],
    past:"Ontem eu falei português.",
    pastEs:"Ayer hablé portugués.",
    pastRule:"El pretérito perfeito indica una acción terminada. En verbos regulares, -ar usa -ei, -aste, -ou, -amos, -aram; -er usa -i, -este, -eu, -emos, -eram; -ir usa -i, -iste, -iu, -imos, -iram. El sujeto você/vocês exige tercera persona. En Brasil, a gente + verbo en tercera persona singular es muy frecuente. En regiones que usan tu, la norma es tu falaste; en el habla coloquial también se oye tu falou.",
    pastForms:[
      ["eu","falei","Eu falei com Ana ontem.","Ayer hablé con Ana."],
      ["tu","falaste","Tu falaste com Ana ontem.","Ayer hablaste con Ana (uso regional; la concordancia coloquial puede variar)."],
      ["você / ele / ela","falou","Você falou com Ana ontem.","Ayer hablaste / habló con Ana."],
      ["nós","falamos","Nós falamos com Ana ontem.","Ayer hablamos con Ana."],
      ["a gente","falou","A gente falou com Ana ontem.","Ayer hablamos con Ana (muy habitual en Brasil)."],
      ["vocês / eles / elas","falaram","Vocês falaram com Ana ontem.","Ayer hablaron con Ana."]
    ],
    future:"Amanhã eu vou falar português.",
    futureEs:"Mañana hablaré portugués.",
    futureRule:"En portugués brasileño hablado predomina ir en presente + infinitivo. El futuro simple es correcto, pero suele sonar más formal o escrito. La forma auxiliar ir cambia según la persona; el infinitivo principal no cambia. Con tu, vais es la forma estándar; en algunas regiones brasileñas se oye tu vai. A gente usa vai.",
    futureForms:[
      ["eu","vou falar","Eu vou falar com Ana amanhã.","Mañana hablaré con Ana."],
      ["tu","vais falar","Tu vais falar com Ana amanhã.","Mañana hablarás con Ana (forma estándar; el uso brasileño regional puede variar)."],
      ["você / ele / ela","vai falar","Você vai falar com Ana amanhã.","Mañana hablarás / hablará con Ana."],
      ["nós","vamos falar","Nós vamos falar com Ana amanhã.","Mañana hablaremos con Ana."],
      ["a gente","vai falar","A gente vai falar com Ana amanhã.","Mañana hablaremos con Ana (muy habitual en Brasil)."],
      ["vocês / eles / elas","vão falar","Vocês vão falar com Ana amanhã.","Mañana hablarán con Ana."]
    ],
    futureSimpleForms:[["eu","falarei"],["tu","falarás"],["você / ele / ela","falará"],["nós","falaremos"],["a gente","falará"],["vocês / eles / elas","falarão"]],
    exceptions:"Irregulares frecuentes en pretérito perfeito: ser/ir → fui, estar → estive, ter → tive, fazer → fiz, dizer → disse, trazer → trouxe, pôr → pus, ver → vi, vir → vim. En futuro simple cambian algunas raíces: dizer → direi, fazer → farei, trazer → trarei, pôr → porei, ter → terei, vir → virei, ser → serei."
  },
  "Inglés":{present:[["I","speak"],["you / we / they","speak"],["he / she / it","speaks"]],past:"Yesterday I spoke English.",pastEs:"Ayer hablé inglés.",pastRule:"Speak es irregular: speak – spoke – spoken. El pasado no cambia según la persona.",future:"Tomorrow I will speak English.",futureEs:"Mañana hablaré inglés.",futureRule:"Will + verbo base expresa futuro. También se usa be going to para planes e intenciones."},
  "Italiano":{present:[["io","parlo"],["tu","parli"],["lui / lei","parla"],["noi","parliamo"],["voi","parlate"],["loro","parlano"]],past:"Ieri ho parlato italiano.",pastEs:"Ayer hablé italiano.",pastRule:"El passato prossimo usa avere/essere + participio. Parlare forma parlato; algunos verbos de movimiento usan essere.",future:"Domani parlerò italiano.",futureEs:"Mañana hablaré italiano.",futureRule:"El futuro simple de parlare añade terminaciones: parlerò, parlerai, parlerà, parleremo, parlerete, parleranno."},
  "Alemán":{present:[["ich","spreche"],["du","sprichst"],["er / sie / es","spricht"],["wir","sprechen"],["ihr","sprecht"],["sie / Sie","sprechen"]],past:"Gestern habe ich Deutsch gesprochen.",pastEs:"Ayer hablé alemán.",pastRule:"En conversación se usa mucho Perfekt: haben + participio (gesprochen). Algunos verbos de movimiento forman el perfecto con sein.",future:"Morgen werde ich Deutsch sprechen.",futureEs:"Mañana hablaré alemán.",futureRule:"Werden + infinitivo forma el futuro. En conversación también se usa el presente con una referencia temporal."},
  "Ruso":{present:[["я","говорю"],["ты","говоришь"],["он / она","говорит"],["мы","говорим"],["вы","говорите"],["они","говорят"]],past:"Вчера я говорил по-русски. / говорила",pastEs:"Ayer hablé ruso (forma masculina / femenina).",pastRule:"El pasado concuerda en género singular: говорил (masculino), говорила (femenino); en plural, говорили.",future:"Завтра я буду говорить по-русски.",futureEs:"Mañana hablaré ruso.",futureRule:"El futuro imperfectivo se forma con буду + infinitivo. Los verbos perfectivos suelen usar una forma simple de futuro."},
  "Francés":{present:[["je","parle"],["tu","parles"],["il / elle / on","parle"],["nous","parlons"],["vous","parlez"],["ils / elles","parlent"]],past:"Hier, j'ai parlé français.",pastEs:"Ayer hablé francés.",pastRule:"El passé composé usa avoir/être + participio (parlé). La mayoría de verbos utiliza avoir; verbos pronominales y algunos de movimiento usan être.",future:"Demain, je parlerai français.",futureEs:"Mañana hablaré francés.",futureRule:"El futur simple añade terminaciones al infinitivo: parlerai, parleras, parlera, parlerons, parlerez, parleront."},
  "Español":{present:[["yo","hablo"],["tú","hablas"],["él / ella / usted","habla"],["nosotros","hablamos"],["vosotros","habláis"],["ellos / ustedes","hablan"]],past:"Ayer hablé español.",pastEs:"Ayer hablé español.",pastRule:"En verbos regulares -ar, el pretérito usa -é, -aste, -ó, -amos, -asteis, -aron. Hay irregulares como tener → tuve.",future:"Mañana hablaré español.",futureEs:"Mañana hablaré español.",futureRule:"El futuro simple añade al infinitivo -é, -ás, -á, -emos, -éis, -án. También se usa ir a + infinitivo."},
  "Japonés":{present:[["わたし / 私","話します (hanashimasu)"],["あなた","話します (hanashimasu)"],["かれ / 彼","話します (hanashimasu)"],["わたしたち / 私たち","話します (hanashimasu)"]],past:"昨日、日本語を話しました。",pastEs:"Ayer hablé japonés.",pastRule:"La forma cortés pasada añade ました (mashita) a la base verbal. No cambia por persona; el contexto indica quién habla.",future:"明日、日本語を話します。",futureEs:"Mañana hablaré japonés.",futureRule:"No existe un tiempo futuro verbal separado: se usa la forma no pasada 話します junto a una referencia como 明日 (mañana)."},
  "Chino mandarín":{present:[["我","说 (shuō)"],["你","说 (shuō)"],["他 / 她","说 (shuō)"],["我们","说 (shuō)"],["他们","说 (shuō)"]],past:"昨天我说了中文。",pastEs:"Ayer hablé chino.",pastRule:"El verbo no se conjuga por persona. 了 marca una acción completada; el contexto temporal también es importante.",future:"明天我会说中文。",futureEs:"Mañana hablaré chino.",futureRule:"会 (huì) puede indicar futuro o posibilidad. El verbo permanece igual para todas las personas."},
  "Coreano":{present:[["저는","말해요"],["너는","말해"],["그는 / 그녀는","말해요"],["우리는","말해요"],["여러분은","말해요"]],past:"어제 한국어를 말했어요.",pastEs:"Ayer hablé coreano.",pastRule:"El pasado cortés suele añadir -았어요 / -었어요 según la vocal de la raíz. 말하다 → 말했어요.",future:"내일 한국어를 말할 거예요.",futureEs:"Mañana hablaré coreano.",futureRule:"-(으)ㄹ 거예요 expresa planes o predicciones. La terminación depende de si la raíz termina en vocal o consonante."},
  "Neerlandés":{present:[["ik","spreek"],["jij / je","spreekt"],["hij / zij","spreekt"],["wij / jullie / zij","spreken"]],past:"Gisteren sprak ik Nederlands.",pastEs:"Ayer hablé neerlandés.",pastRule:"Spreken es irregular en pasado: sprak (singular), spraken (plural); el participio es gesproken.",future:"Morgen zal ik Nederlands spreken.",futureEs:"Mañana hablaré neerlandés.",futureRule:"Zullen + infinitivo expresa futuro o intención. También es habitual usar el presente con una referencia temporal."},
  "Árabe":{present:[["أنا","أتكلم"],["أنتَ / أنتِ","تتكلم"],["هو / هي","يتكلم / تتكلم"],["نحن","نتكلم"],["أنتم","تتكلمون"],["هم","يتكلمون"]],past:"تحدثتُ العربية أمس.",pastEs:"Ayer hablé árabe.",pastRule:"El pasado se forma con una raíz y terminaciones personales; género y número afectan varias formas. La conjugación puede variar entre árabe estándar y dialectos.",future:"سأتكلم العربية غدًا.",futureEs:"Mañana hablaré árabe.",futureRule:"سـ o سوف delante del presente expresa futuro. El verbo concuerda con persona, género y número."},
  "Hindi":{present:[["मैं","बोलता हूँ / बोलती हूँ"],["तुम","बोलते हो / बोलती हो"],["वह","बोलता है / बोलती है"],["हम","बोलते हैं / बोलती हैं"],["आप","बोलते हैं / बोलती हैं"]],past:"मैंने कल हिंदी बोली।",pastEs:"Ayer hablé hindi.",pastRule:"El pasado puede usar ने con verbos transitivos en construcciones perfectivas; el participio concuerda con género y número según la estructura.",future:"मैं कल हिंदी बोलूँगा / बोलूँगी।",futureEs:"Mañana hablaré hindi (masculino / femenino).",futureRule:"La forma futura cambia por persona y género: बोलूँगा (masculino), बोलूँगी (femenino)."},
  "Turco":{present:[["ben","konuşurum"],["sen","konuşursun"],["o","konuşur"],["biz","konuşuruz"],["siz","konuşursunuz"],["onlar","konuşurlar"]],past:"Dün Türkçe konuştum.",pastEs:"Ayer hablé turco.",pastRule:"El pasado directo añade -dı/-di/-du/-dü o variantes sordas -tı/-ti/-tu/-tü según armonía vocálica y consonante final.",future:"Yarın Türkçe konuşacağım.",futureEs:"Mañana hablaré turco.",futureRule:"El futuro añade -(y)acak/-(y)ecek y terminaciones personales; la vocal sigue la armonía vocálica."},
  "Griego":{present:[["εγώ","μιλάω"],["εσύ","μιλάς"],["αυτός / αυτή","μιλάει"],["εμείς","μιλάμε"],["εσείς","μιλάτε"],["αυτοί","μιλάνε"]],past:"Χθες μίλησα ελληνικά.",pastEs:"Ayer hablé griego.",pastRule:"El aoristo expresa una acción pasada completa. Μιλάω cambia a μίλησα; muchos verbos tienen raíz de pasado propia.",future:"Αύριο θα μιλήσω ελληνικά.",futureEs:"Mañana hablaré griego.",futureRule:"Θα + forma de aoristo expresa futuro. La partícula θα precede al verbo."},
  "Polaco":{present:[["ja","mówię"],["ty","mówisz"],["on / ona","mówi"],["my","mówimy"],["wy","mówicie"],["oni / one","mówią"]],past:"Wczoraj mówiłem po polsku. / mówiłam",pastEs:"Ayer hablé polaco (masculino / femenino).",pastRule:"El pasado concuerda en género y número: mówiłem (masculino), mówiłam (femenino). La persona también se marca con terminaciones.",future:"Jutro będę mówić po polsku.",futureEs:"Mañana hablaré polaco.",futureRule:"Para verbos imperfectivos se usa będę + infinitivo. Los perfectivos forman el futuro con una forma simple."},
  "Sueco":{present:[["jag","talar"],["du","talar"],["han / hon","talar"],["vi","talar"],["ni","talar"],["de","talar"]],past:"I går talade jag svenska.",pastEs:"Ayer hablé sueco.",pastRule:"Talade es pasado regular. Los verbos suecos no cambian según la persona.",future:"I morgon ska jag tala svenska.",futureEs:"Mañana hablaré sueco.",futureRule:"Ska + infinitivo expresa plan o intención. También se usa kommer att para predicciones."},
  "Noruego":{present:[["jeg","snakker"],["du","snakker"],["han / hun","snakker"],["vi","snakker"],["dere","snakker"],["de","snakker"]],past:"I går snakket jeg norsk.",pastEs:"Ayer hablé noruego.",pastRule:"Snakket es pasado regular. La forma verbal no cambia según la persona.",future:"I morgen skal jeg snakke norsk.",futureEs:"Mañana hablaré noruego.",futureRule:"Skal + infinitivo expresa intención o plan. También puede usarse kommer til å para predicción."},
  "Danés":{present:[["jeg","taler"],["du","taler"],["han / hun","taler"],["vi","taler"],["I","taler"],["de","taler"]],past:"I går talte jeg dansk.",pastEs:"Ayer hablé danés.",pastRule:"Talte es la forma pasada de tale. La forma verbal no cambia según la persona.",future:"I morgen vil jeg tale dansk.",futureEs:"Mañana hablaré danés.",futureRule:"Vil + infinitivo expresa voluntad o futuro. También se usa el presente con una referencia temporal."},
  "Hebreo":{present:[["אני","מדבר / מדברת"],["אתה / את","מדבר / מדברת"],["הוא / היא","מדבר / מדברת"],["אנחנו","מדברים / מדברות"],["הם / הן","מדברים / מדברות"]],past:"דיברתי עברית אתמול.",pastEs:"Ayer hablé hebreo.",pastRule:"El pasado cambia por persona, género y número. דיברתי es la forma de primera persona singular para ambos géneros.",future:"אדבר עברית מחר.",futureEs:"Mañana hablaré hebreo.",futureRule:"El futuro utiliza prefijos personales; la raíz verbal se mantiene con patrones propios del binyán."},
  "Vietnamita":{present:[["tôi","nói"],["bạn","nói"],["anh ấy / cô ấy","nói"],["chúng tôi","nói"],["họ","nói"]],past:"Hôm qua tôi đã nói tiếng Việt.",pastEs:"Ayer hablé vietnamita.",pastRule:"El verbo no se conjuga. Đã puede marcar pasado o acción completada; el contexto también puede expresar el tiempo.",future:"Ngày mai tôi sẽ nói tiếng Việt.",futureEs:"Mañana hablaré vietnamita.",futureRule:"Sẽ marca futuro; el verbo nói no cambia por persona."},
  "Indonesio":{present:[["saya","berbicara"],["kamu","berbicara"],["dia","berbicara"],["kami / kita","berbicara"],["mereka","berbicara"]],past:"Kemarin saya sudah berbicara bahasa Indonesia.",pastEs:"Ayer hablé indonesio.",pastRule:"El verbo no cambia por persona. Sudah indica que algo ya ocurrió o está completado.",future:"Besok saya akan berbicara bahasa Indonesia.",futureEs:"Mañana hablaré indonesio.",futureRule:"Akan marca futuro y va antes del verbo; no se modifica el verbo."},
  "Tailandés":{present:[["ฉัน","พูด"],["คุณ","พูด"],["เขา","พูด"],["เรา","พูด"],["พวกเขา","พูด"]],past:"เมื่อวานฉันพูดภาษาไทยแล้ว",pastEs:"Ayer hablé tailandés.",pastRule:"El verbo no se conjuga por persona. Marcadores como แล้ว y expresiones temporales indican acción completada.",future:"พรุ่งนี้ฉันจะพูดภาษาไทย",futureEs:"Mañana hablaré tailandés.",futureRule:"จะ (jà) delante del verbo marca futuro o intención; el verbo no cambia."}
};
function renderTenseLesson(languageName, topicIndex) {
  const lesson = tenseLessons[languageName];
  if (!lesson) return '<p class="theory-slide-text">Revisa la forma verbal dentro de una frase completa y compara cómo cambia según el tiempo, la persona y el aspecto.</p>';
  const locale = getSelectedCatalog()?.locale || "und";
  if (topicIndex === 3) {
    const rows = lesson.present.map(([person,form]) => '<tr><td>' + escapeHTML(person) + '</td><td><strong class="theory-target-word">' + escapeHTML(form) + '</strong> ' + speakerButton(form, locale) + '</td></tr>').join("");
    return '<p class="theory-slide-text">El presente se usa para hábitos, hechos y situaciones actuales. Observa qué formas cambian y cuáles permanecen iguales:</p><table class="theory-pronoun-table"><thead><tr><th>Persona</th><th>Forma verbal</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }
  const isPast = topicIndex === 4;
  if (languageName === "Portugués brasileño" && (isPast || topicIndex === 5)) {
    const forms = isPast ? lesson.pastForms : lesson.futureForms;
    const rows = forms.map(([person,form,targetExample,translation]) =>
      '<tr><td><strong>' + escapeHTML(person) + '</strong></td><td><strong class="theory-target-word">' + escapeHTML(form) + '</strong> ' + speakerButton(form,locale) + '</td><td>' + escapeHTML(targetExample) + ' ' + speakerButton(targetExample,locale) + '</td><td>' + escapeHTML(translation) + '</td></tr>'
    ).join("");
    const header = '<thead><tr><th>Pronombre</th><th>Forma verbal</th><th>Ejemplo en portugués</th><th>Español</th></tr></thead>';
    const simpleFuture = !isPast && lesson.futureSimpleForms
      ? '<h3>Futuro simple (más formal)</h3><table class="theory-pronoun-table"><thead><tr><th>Pronombre</th><th>Forma</th></tr></thead><tbody>' + lesson.futureSimpleForms.map(([person,form]) => '<tr><td>' + escapeHTML(person) + '</td><td><strong class="theory-target-word">' + escapeHTML(form) + '</strong> ' + speakerButton(form,locale) + '</td></tr>').join("") + '</tbody></table>'
      : "";
    return '<p class="theory-slide-text">' + escapeHTML(isPast ? "El pretérito perfeito se usa para acciones concluidas en un momento pasado. La terminación depende del infinitivo y del sujeto." : "Para hablar del futuro, el portugués brasileño suele usar ir conjugado + infinitivo. El futuro simple existe, pero es más formal.") + '</p><table class="theory-pronoun-table">' + header + '<tbody>' + rows + '</tbody></table><p class="theory-slide-text"><strong>Regla aplicada:</strong> ' + escapeHTML(isPast ? lesson.pastRule : lesson.futureRule) + '</p>' + simpleFuture + '<section class="theory-example"><span>Excepciones e irregulares</span><p>' + escapeHTML(lesson.exceptions) + '</p></section>';
  }
  const example = isPast ? lesson.past : lesson.future;
  const translation = isPast ? lesson.pastEs : lesson.futureEs;
  const rule = isPast ? lesson.pastRule : lesson.futureRule;
  return '<p class="theory-slide-text">' + (isPast ? "El pasado permite narrar acciones anteriores. Observa esta frase y la forma verbal utilizada:" : "El futuro expresa planes, predicciones e intenciones. Observa esta construcción:") + '</p><section class="theory-example"><span>' + (isPast ? "Ejemplo en pasado" : "Ejemplo en futuro") + '</span><p class="theory-target-word">' + escapeHTML(example) + ' ' + speakerButton(example, locale) + '</p><p>' + escapeHTML(translation) + '</p><p class="theory-slide-text">' + escapeHTML(rule) + '</p></section>';
}
function renderPronounTable(sample, languageName, locale) {
  if (!sample?.pronouns) return "";
  const words = sample.pronouns.split(/\s*,\s*/);
  const meanings = pronounTranslations[languageName] || [];
  const rows = words.map((word,index) => '<tr><td><strong class="theory-target-word">' + escapeHTML(word) + '</strong> ' + speakerButton(word, locale) + '</td><td>' + escapeHTML(meanings[index] || "forma personal") + '</td></tr>').join("");
  return '<table class="theory-pronoun-table"><thead><tr><th>Pronombre</th><th>Significado</th></tr></thead><tbody>' + rows + '</tbody></table><p class="theory-footnote">Pulsa el icono para escuchar cada forma. El significado puede variar según el contexto y el grado de formalidad.</p>';
}
function renderVerbLesson(languageName) {
  const lesson = verbLessons[languageName];
  if (!lesson) return '<p class="theory-slide-text">La forma de expresar identidad, estado y ubicación depende de este idioma. Compara siempre la estructura verbal con una frase real y revisa las formas personales en el contexto de la unidad.</p>';
  const headers = ["Persona","Forma","Uso","Ejemplo","Significado"];
  const locale = getSelectedCatalog()?.locale || "und";
  const rows = lesson.tables.map(row => {
    if (row.length === 3 && headers.includes(row[1]) && headers.includes(row[2])) {
      return '<tr><th colspan="3">' + escapeHTML(row[0]) + '</th></tr>';
    }
    if (row.length === 3) {
      return '<tr><td>' + escapeHTML(row[0]) + '</td><td><strong class="theory-target-word">' + escapeHTML(row[1]) + '</strong> ' + speakerButton(row[0], locale) + '</td><td>' + escapeHTML(row[2]) + '</td></tr>';
    }
    return '<tr><td>' + escapeHTML(row[0]) + '</td><td><strong class="theory-target-word">' + escapeHTML(row[1]) + '</strong> ' + speakerButton(row[1], locale) + '</td></tr>';
  }).join("");
  return '<p class="theory-slide-text">' + escapeHTML(lesson.lead) + '</p><table class="theory-pronoun-table"><tbody>' + rows + '</tbody></table><section class="theory-example"><span>Ejemplos aplicados</span><p>' + escapeHTML(lesson.example) + '</p><p class="theory-slide-text">' + escapeHTML(lesson.rule) + '</p></section>';
}
const appliedTheoryContent = {
  "Inglés": {
    "Vocabulario": [
      [["hello","hola","neutral"],["good morning","buenos días","mañana"],["good evening","buenas tardes/noches","tarde/noche"],["goodbye","adiós","neutral"],["see you later","hasta luego","informal"]],
      [["mother","madre"],["father","padre"],["brother","hermano"],["sister","hermana"],["parents","padres"]],
      [["today","hoy"],["tomorrow","mañana"],["yesterday","ayer"],["Monday","lunes"],["at eight","a las ocho"]],
      [["the bill","la cuenta"],["a table for two","una mesa para dos"],["still water","agua sin gas"],["the menu","el menú"],["without onions","sin cebolla"]],
      [["ticket","billete / entrada"],["station","estación"],["platform","andén"],["on the right","a la derecha"],["how much is it?","¿cuánto cuesta?"]]
    ],
    "Expresiones": [
      [["My name is…","Me llamo…"],["Nice to meet you.","Mucho gusto."],["I'm from Chile.","Soy de Chile."],["Where are you from?","¿De dónde eres?"]],
      [["Could you help me?","¿Podría ayudarme?"],["Could you repeat that, please?","¿Podría repetirlo, por favor?"],["I don't understand.","No entiendo."],["Could you speak more slowly?","¿Podría hablar más despacio?"]],
      [["I'd like a coffee, please.","Quisiera un café, por favor."],["Could I see the menu?","¿Podría ver el menú?"],["The bill, please.","La cuenta, por favor."],["Can I pay by card?","¿Puedo pagar con tarjeta?"]],
      [["Where is the station?","¿Dónde está la estación?"],["What time does the train leave?","¿A qué hora sale el tren?"],["How much does it cost?","¿Cuánto cuesta?"],["Could you show me on the map?","¿Podría mostrármelo en el mapa?"]],
      [["How are you?","¿Cómo estás?"],["I'm fine, thanks.","Estoy bien, gracias."],["What are you doing today?","¿Qué haces hoy?"],["See you tomorrow.","Nos vemos mañana."]]
    ]
  },
  "Portugués brasileño": {
    "Vocabulario": [
      [["olá","hola","neutral"],["bom dia","buenos días","mañana"],["boa tarde","buenas tardes","tarde"],["boa noite","buenas noches","noche"],["até logo","hasta luego","neutral"]],
      [["mãe","madre"],["pai","padre"],["irmão","hermano"],["irmã","hermana"],["pais","padres"]],
      [["hoje","hoy"],["amanhã","mañana"],["ontem","ayer"],["segunda-feira","lunes"],["às oito","a las ocho"]],
      [["a conta","la cuenta"],["uma mesa para dois","una mesa para dos"],["água sem gás","agua sin gas"],["o cardápio","el menú"],["sem cebola","sin cebolla"]],
      [["a passagem","el pasaje"],["a estação","la estación"],["a plataforma","el andén"],["à direita","a la derecha"],["quanto custa?","¿cuánto cuesta?"]]
    ],
    "Expresiones": [
      [["Meu nome é…","Me llamo…"],["Muito prazer!","¡Mucho gusto!"],["Sou do Chile.","Soy de Chile."],["De onde você é?","¿De dónde eres?"]],
      [["Você pode me ajudar?","¿Puedes ayudarme?"],["Pode repetir, por favor?","¿Puede repetir, por favor?"],["Não entendi.","No entendí."],["Pode falar mais devagar?","¿Puede hablar más despacio?"]],
      [["Eu gostaria de um café, por favor.","Quisiera un café, por favor."],["Posso ver o cardápio?","¿Puedo ver el menú?"],["A conta, por favor.","La cuenta, por favor."],["Posso pagar com cartão?","¿Puedo pagar con tarjeta?"]],
      [["Onde fica a estação?","¿Dónde queda la estación?"],["A que horas o trem sai?","¿A qué hora sale el tren?"],["Quanto custa?","¿Cuánto cuesta?"],["Pode me mostrar no mapa?","¿Puede mostrármelo en el mapa?"]],
      [["Tudo bem?","¿Todo bien?"],["Tudo bem, obrigado/a.","Todo bien, gracias."],["O que você vai fazer hoje?","¿Qué vas a hacer hoy?"],["Até amanhã.","Hasta mañana."]]
    ]
  }
};
const articleLessons = {
  "Inglés": {
    intro:"El inglés distingue artículo definido, indefinido y ausencia de artículo. La elección depende de si el referente es identificable y de si el sustantivo es contable.",
    rows:[["the","el / la / los / las","referente específico o conocido","the book · el libro"],["a","un / una","sustantivo contable singular antes de sonido consonántico","a book · un libro"],["an","un / una","sustantivo contable singular antes de sonido vocálico","an apple · una manzana"],["—","sin artículo","plural o incontable en sentido general","Books are useful · Los libros son útiles"]],
    rule:"Usa a/an según el sonido, no la letra: an hour, a university. No uses a/an con plurales ni incontables."
  },
  "Portugués brasileño": {
    intro:"El artículo concuerda con género y número. En portugués brasileño es frecuente usar artículo definido delante de nombres propios y posesivos, aunque el uso varía por región.",
    rows:[["o / a","el / la","masculino / femenino singular","o livro · el libro / a casa · la casa"],["os / as","los / las","masculino / femenino plural","os livros · los libros / as casas · las casas"],["um / uma","un / una","indefinido singular","um carro · un auto / uma mesa · una mesa"],["uns / umas","unos / unas","indefinido plural","uns amigos · unos amigos"]],
    rule:"Aprende el sustantivo junto con su género. Las contracciones son frecuentes: de + o = do; em + a = na; a + a = à."
  },
  "Francés": {
    intro:"El artículo francés concuerda en género y número. Ante vocal o h muda, le y la se contraen en l'.",
    rows:[["le / la / l'","el / la","definido singular masculino / femenino","le livre · el libro / l'amie · la amiga"],["les","los / las","definido plural","les maisons · las casas"],["un / une","un / una","indefinido singular","un livre · un libro / une table · una mesa"],["des","unos / unas","indefinido plural","des amis · unos amigos"]],
    rule:"Después de una negación, un artículo partitivo suele convertirse en de/d': Je ne bois pas de café. No traduzcas siempre el artículo español palabra por palabra."
  },
  "Alemán": {
    intro:"El alemán distingue género gramatical (masculino, femenino y neutro), número y caso. El artículo cambia según la función del sustantivo.",
    rows:[["der","el","masculino nominativo","der Mann · el hombre"],["die","la / las","femenino singular o plural nominativo","die Frau · la mujer / die Kinder · los niños"],["das","lo / el","neutro nominativo","das Kind · el niño"],["ein / eine","un / una","indefinido nominativo masculino/neutro y femenino","ein Tisch · una mesa / eine Lampe · una lámpara"]],
    rule:"Memoriza cada sustantivo con su artículo. En acusativo masculino der cambia a den y ein cambia a einen; los artículos también cambian en dativo y genitivo."
  }
};
function renderAppliedLanguageTopic(languageName, category, index, locale) {
  const items = appliedTheoryContent[languageName]?.[category]?.[index];
  if (!items) return null;
  const firstHeader = languageName === "Inglés" ? "English" : "Português";
  const rows = items.map(([term,meaning,context=""]) =>
    '<tr><td><strong class="theory-target-word">' + escapeHTML(term) + '</strong> ' + speakerButton(term,locale) + '</td><td>' + escapeHTML(meaning) + '</td>' +
    (items.some(item=>item[2]) ? '<td>' + escapeHTML(context) + '</td>' : '') + '</tr>'
  ).join("");
  return '<p class="theory-slide-text">' + (category === "Vocabulario" ? "Palabras útiles organizadas por situación. Aprende el término junto con su contexto." : "Frases listas para usar en situaciones cotidianas; observa el nivel de cortesía.") + '</p>' +
    '<table class="theory-pronoun-table"><thead><tr><th>' + firstHeader + '</th><th>Español</th>' + (items.some(item=>item[2])?'<th>Contexto</th>':'') + '</tr></thead><tbody>' + rows + '</tbody></table>';
}
function renderArticleLesson(languageName, locale) {
  const lesson = articleLessons[languageName];
  if (!lesson) return null;
  const rows = lesson.rows.map(([form,meaning,usage,example]) =>
    '<tr><td><strong class="theory-target-word">' + escapeHTML(form) + '</strong> ' + speakerButton(form,locale) + '</td><td>' + escapeHTML(meaning) + '</td><td>' + escapeHTML(usage) + '</td><td>' + escapeHTML(example) + '</td></tr>'
  ).join("");
  return '<p class="theory-slide-text">' + escapeHTML(lesson.intro) + '</p><table class="theory-pronoun-table"><thead><tr><th>Forma</th><th>Significado</th><th>Uso</th><th>Ejemplo</th></tr></thead><tbody>' + rows + '</tbody></table><p class="theory-slide-text"><strong>Regla práctica:</strong> ' + escapeHTML(lesson.rule) + '</p>';
}
function renderItalianAppliedTopic(category, index, locale) {
  const rows = (items) => items.map(([term, meaning, note = ""]) =>
    '<tr><td><strong class="theory-target-word">' + escapeHTML(term) + '</strong> ' + speakerButton(term, locale) + '</td><td>' + escapeHTML(meaning) + '</td>' + (note ? '<td>' + escapeHTML(note) + '</td>' : '') + '</tr>'
  ).join("");
  if (category === "Gramática" && index === 1) {
    return '<p class="theory-slide-text">En italiano el artículo concuerda con el sustantivo en género y número. La forma masculina depende del sonido inicial; la forma femenina se contrae ante vocal.</p>' +
      '<h3>Artículos definidos</h3><table class="theory-pronoun-table"><thead><tr><th>Forma y ejemplo</th><th>Significado</th><th>Cuándo se usa</th></tr></thead><tbody>' +
      rows([["il libro","el libro","Masculino singular; consonante común"],["lo studente","el estudiante","Masculino singular; s + consonante, z, gn, ps"],["l’amico","el amigo","Masculino singular ante vocal"],["la casa","la casa","Femenino singular ante consonante"],["l’amica","la amiga","Femenino singular ante vocal"],["i libri","los libros","Plural de il"],["gli studenti / gli amici","los estudiantes / los amigos","Plural de lo y l’ masculino"],["le case","las casas","Plural femenino"]]) +
      '</tbody></table><h3>Artículos indefinidos</h3><table class="theory-pronoun-table"><thead><tr><th>Forma y ejemplo</th><th>Significado</th></tr></thead><tbody>' +
      rows([["un libro","un libro"],["uno studente","un estudiante"],["un amico","un amigo (sin apóstrofo)"],["una casa","una casa"],["un’amica","una amiga (con apóstrofo)"]]) +
      '</tbody></table><p class="theory-slide-text"><strong>Regla práctica:</strong> no escribas *il studente ni *la amica. Compara siempre el artículo con la primera letra/sonido del sustantivo y memoriza el sustantivo junto con su artículo.</p>';
  }
  if (category === "Gramática" && index === 4) {
    const people = ["io","tu","lui / lei","noi","voi","loro"];
    const forms = [["ho parlato","sono andato/a"],["hai parlato","sei andato/a"],["ha parlato","è andato/a"],["abbiamo parlato","siamo andati/e"],["avete parlato","siete andati/e"],["hanno parlato","sono andati/e"]];
    return '<p class="theory-slide-text">El pasado más usado en conversación es el <strong>passato prossimo</strong>: auxiliar en presente (avere o essere) + participio pasado. Se usa para acciones terminadas: ayer, la semana pasada, esta mañana.</p>' +
      '<h3>Conjugación aplicada</h3><table class="theory-pronoun-table"><thead><tr><th>Persona</th><th>parlare · hablar</th><th>andare · ir</th></tr></thead><tbody>' +
      people.map((person,i)=>'<tr><td>'+person+'</td><td><strong class="theory-target-word">'+forms[i][0]+'</strong> '+speakerButton(forms[i][0],locale)+'</td><td><strong class="theory-target-word">'+forms[i][1]+'</strong> '+speakerButton(forms[i][1],locale)+'</td></tr>').join("") +
      '</tbody></table><section class="theory-example"><span>Ejemplos reales</span><p class="theory-target-word">Ieri ho parlato con Maria. ' + speakerButton("Ieri ho parlato con Maria.",locale) + '</p><p>Ayer hablé con María.</p><p class="theory-target-word">Domenica siamo andati a Roma. ' + speakerButton("Domenica siamo andati a Roma.",locale) + '</p><p>El domingo fuimos a Roma.</p></section><p class="theory-slide-text"><strong>Auxiliar:</strong> avere se usa con la mayoría de los verbos transitivos (ho mangiato); essere con muchos verbos de movimiento/cambio de estado y verbos reflexivos (sono arrivato, mi sono svegliato). Con essere, el participio concuerda en género y número: andato/a/i/e. Hay verbos cuyo auxiliar debe aprenderse con el verbo.</p>';
  }
  if (category === "Gramática" && index === 5) {
    const people = ["io","tu","lui / lei","noi","voi","loro"];
    const forms = [["parlerò","sarò"],["parlerai","sarai"],["parlerà","sarà"],["parleremo","saremo"],["parlerete","sarete"],["parleranno","saranno"]];
    return '<p class="theory-slide-text">El <strong>futuro semplice</strong> expresa predicciones, promesas e intenciones futuras. Las terminaciones son las mismas para los verbos en -are, -ere e -ire, aunque la raíz puede cambiar.</p><table class="theory-pronoun-table"><thead><tr><th>Persona</th><th>parlare · hablar</th><th>essere · ser/estar</th></tr></thead><tbody>' +
      people.map((person,i)=>'<tr><td>'+person+'</td><td><strong class="theory-target-word">'+forms[i][0]+'</strong> '+speakerButton(forms[i][0],locale)+'</td><td><strong class="theory-target-word">'+forms[i][1]+'</strong> '+speakerButton(forms[i][1],locale)+'</td></tr>').join("") +
      '</tbody></table><section class="theory-example"><span>Ejemplos</span><p class="theory-target-word">Domani parlerò con il professore. ' + speakerButton("Domani parlerò con il professore.",locale) + '</p><p>Mañana hablaré con el profesor.</p><p class="theory-target-word">L’anno prossimo saremo in Italia. ' + speakerButton("L’anno prossimo saremo in Italia.",locale) + '</p><p>El próximo año estaremos en Italia.</p></section><p class="theory-slide-text"><strong>Formación:</strong> los verbos en -are cambian la a por e (parlare → parler-); se añaden -ò, -ai, -à, -emo, -ete, -anno. Essere y avere son irregulares: sarò y avrò. En conversación, el presente con una expresión temporal también puede indicar futuro.</p>';
  }
  const vocabulary = {
    "Vocabulario": [
      [["ciao","hola / chao","Informal"],["buongiorno","buenos días / buenas tardes","Formal o neutral"],["buonasera","buenas tardes / noches","Desde la tarde"],["arrivederci","hasta luego","Formal"],["a presto","hasta pronto","Neutral"]],
      [["la madre","la madre"],["il padre","el padre"],["il fratello","el hermano"],["la sorella","la hermana"],["i genitori","los padres"],["il figlio / la figlia","el hijo / la hija"]],
      [["oggi","hoy"],["domani","mañana"],["ieri","ayer"],["lunedì","lunes"],["la settimana","la semana"],["alle otto","a las ocho"]],
      [["il conto","la cuenta"],["un tavolo per due","una mesa para dos"],["l’acqua naturale","agua sin gas"],["il menù","el menú"],["vorrei…","quisiera…"],["senza…","sin…"]],
      [["il biglietto","el billete / pasaje"],["la stazione","la estación"],["il binario","el andén / vía"],["a destra","a la derecha"],["a sinistra","a la izquierda"],["quanto costa?","¿cuánto cuesta?"]]
    ],
    "Expresiones": [
      [["Mi chiamo…","Me llamo…"],["Piacere!","¡Mucho gusto!"],["Sono cileno/a.","Soy chileno/a."],["Vengo dal Cile.","Vengo de Chile."]],
      [["Mi può aiutare?","¿Me puede ayudar? (formal)"],["Può ripetere, per favore?","¿Puede repetir, por favor?"],["Non ho capito.","No entendí."],["Parla più lentamente, per favore.","Hable más despacio, por favor."]],
      [["Vorrei un caffè, per favore.","Quisiera un café, por favor."],["Posso vedere il menù?","¿Puedo ver el menú?"],["Il conto, per favore.","La cuenta, por favor."],["È possibile pagare con carta?","¿Se puede pagar con tarjeta?"]],
      [["Dov’è la stazione?","¿Dónde está la estación?"],["A che ora parte il treno?","¿A qué hora sale el tren?"],["Quanto costa?","¿Cuánto cuesta?"],["Può indicarmelo sulla mappa?","¿Puede indicármelo en el mapa?"]],
      [["Come va?","¿Cómo estás?"],["Tutto bene, grazie.","Todo bien, gracias."],["Che cosa fai oggi?","¿Qué haces hoy?"],["Ci vediamo domani.","Nos vemos mañana."]]
    ]
  };
  if (category === "Vocabulario" || category === "Expresiones") {
    const items = vocabulary[category]?.[index];
    if (!items) return null;
    const heading = category === "Vocabulario" ? "Palabras para usar en contexto" : "Frases listas para una situación real";
    return '<p class="theory-slide-text">' + heading + '. Escucha cada expresión y fíjate en su traducción y registro.</p><table class="theory-pronoun-table"><thead><tr><th>Italiano</th><th>Español / uso</th></tr></thead><tbody>' + rows(items) + '</tbody></table>';
  }
  return null;
}
let activeTheoryTopics = [];
let activeTheoryIndex = 0;
let activeTheoryCategory = "";
function openTheoryTopic(index) {
  activeTheoryIndex = Math.max(0, Math.min(index, activeTheoryTopics.length - 1));
  const [title, body] = activeTheoryTopics[activeTheoryIndex];
  const sample = theorySamples[$("language").value] || null;
  const sampleByTopic = activeTheoryCategory === "Gramática"
    ? (activeTheoryIndex === 0 ? sample?.pronouns : activeTheoryIndex === 1 ? sample?.articles : null)
    : activeTheoryCategory === "Vocabulario" && activeTheoryIndex === 0
      ? sample?.greeting
      : activeTheoryCategory === "Expresiones" && activeTheoryIndex === 0
        ? sample?.intro : null;
  const sampleLabel = activeTheoryIndex === 0 && activeTheoryCategory === "Gramática" ? "Ejemplo de pronombres"
    : activeTheoryIndex === 1 && activeTheoryCategory === "Gramática" ? "Artículos"
    : activeTheoryCategory === "Vocabulario" ? "Ejemplo de saludos" : "Ejemplo";
  const languageName = $("language").value === "other" ? $("custom-language-name").value.trim() : $("language").value;
  const locale = getSelectedCatalog()?.locale || "und";
  let detailMarkup = '<p class="theory-slide-text">' + escapeHTML(body) + '</p>';
  const italianApplied = languageName === "Italiano"
    ? renderItalianAppliedTopic(activeTheoryCategory, activeTheoryIndex, locale)
    : null;
  const appliedLanguage = renderAppliedLanguageTopic(languageName, activeTheoryCategory, activeTheoryIndex, locale);
  const articleLesson = activeTheoryCategory === "Gramática" && activeTheoryIndex === 1
    ? renderArticleLesson(languageName, locale) : null;
  if (italianApplied || appliedLanguage) {
    detailMarkup = italianApplied || appliedLanguage;
  } else if (articleLesson) {
    detailMarkup = articleLesson;
  } else if (activeTheoryCategory === "Gramática" && activeTheoryIndex === 0) {
    detailMarkup = '<p class="theory-slide-text">Los pronombres indican quién participa en la oración. Estas son las formas personales más habituales:</p>' + renderPronounTable(sample, languageName, locale);
  } else if (activeTheoryCategory === "Gramática" && activeTheoryIndex === 1 && sample?.articles) {
    detailMarkup += '<section class="theory-example"><span>Artículos de este idioma</span><p class="theory-target-word">' + escapeHTML(sample.articles) + '</p><p class="theory-slide-text">Observa género, número y si el artículo es definido o indefinido. Algunos idiomas expresan estas diferencias mediante sufijos o no usan artículos.</p></section>';
  } else if (activeTheoryCategory === "Gramática" && activeTheoryIndex === 2) {
    detailMarkup = renderVerbLesson(languageName);
  } else if (activeTheoryCategory === "Gramática" && activeTheoryIndex >= 3) {
    detailMarkup = renderTenseLesson(languageName, activeTheoryIndex);
  } else if (sampleByTopic) {
    detailMarkup += '<section class="theory-example"><span>' + escapeHTML(sampleLabel) + ' · ' + escapeHTML(languageDefinitions[$("language").value]?.label || languageName) + '</span><p class="theory-target-word">' + escapeHTML(sampleByTopic) + '</p></section>';
  }
  $("theory-title").textContent = title;
  $("theory-category").textContent = activeTheoryCategory;
  $("theory-description").innerHTML = detailMarkup;
  bindSpeakerButtons($("theory-description"));
  $("theory-counter").textContent = (activeTheoryIndex + 1) + " / " + activeTheoryTopics.length;
  $("theory-prev").disabled = activeTheoryIndex === 0;
  $("theory-next").disabled = activeTheoryIndex === activeTheoryTopics.length - 1;
  $("theory-detail").classList.remove("hidden");
}
document.querySelectorAll("[data-theory]").forEach(button => button.addEventListener("click", () => {
  const [title, topics] = theoryContent[button.dataset.theory];
  activeTheoryCategory = title;
  activeTheoryTopics = topics;
  $("theory-list-title").textContent = title;
  $("theory-list-items").innerHTML = topics.map(([name],index) =>
    '<button class="theory-topic-row" type="button" data-theory-topic="' + index + '"><span>' + escapeHTML(name) + '</span><span aria-hidden="true">→</span></button>'
  ).join("");
  $("theory-grid").classList.add("hidden");
  $("theory-topic-list").classList.remove("hidden");
  $("theory-list-items").querySelectorAll("[data-theory-topic]").forEach(item =>
    item.addEventListener("click", () => openTheoryTopic(Number(item.dataset.theoryTopic)))
  );
}));
$("theory-list-back").addEventListener("click", () => {
  $("theory-topic-list").classList.add("hidden");
  $("theory-grid").classList.remove("hidden");
});
$("theory-back").addEventListener("click", () => $("theory-detail").classList.add("hidden"));
$("theory-close").addEventListener("click", () => $("theory-detail").classList.add("hidden"));
$("theory-prev").addEventListener("click", () => openTheoryTopic(activeTheoryIndex - 1));
$("theory-next").addEventListener("click", () => openTheoryTopic(activeTheoryIndex + 1));
$("variant-close").addEventListener("click", () => $("variant-dialog").close());
function persistSettings() {
  const savedSettings = {
    selectedLanguage: $("language").value,
    duration: $("duration").value,
    level: $("level").value,
    topic: $("topic").value,
    customLanguageName: $("language").value === "other" ? $("custom-language-name").value.trim() : ""
  };
  localStorage.setItem("adaptive-language-tutor.settings", JSON.stringify(savedSettings));
}
$("welcome-start").addEventListener("click", () => {
  if ($("language").value && localStorage.getItem("adaptive-language-tutor.settings")) {
    $("welcome-screen").classList.add("hidden");
    $("app-shell").classList.remove("hidden");
    showScreen("route");
  } else {
    $("app-shell").classList.add("hidden");
    $("language-picker").showModal();
  }
});
$("open-language-picker").addEventListener("click", () => {
  const custom = $("language").value === "other";
  $("custom-language-fields").classList.toggle("hidden", !custom);
  $("language-apply").classList.toggle("hidden", !custom);
  $("language-picker").showModal();
});
$("language-cancel").addEventListener("click", () => {
  $("language-picker").close();
  if (!$("language").value || !localStorage.getItem("adaptive-language-tutor.settings")) {
    $("welcome-screen").classList.remove("hidden");
    $("app-shell").classList.add("hidden");
  }
});
document.querySelectorAll("[data-language]").forEach(button => button.addEventListener("click", () => {
  $("language").value = button.dataset.language;
  if (button.dataset.language === "other") {
    $("custom-language-fields").classList.remove("hidden");
    $("language-apply").classList.remove("hidden");
    $("custom-language-name").focus();
    updateLanguageFlag();
    return;
  }
  $("custom-language-name").value = "";
  try { persistSettings(); } catch {}
  updateLanguageFlag();
  $("language-picker").close();
  $("welcome-screen").classList.add("hidden");
  $("app-shell").classList.remove("hidden");
  showScreen("route");
  refreshDashboard();
}));
$("language-apply").addEventListener("click", () => {
  const selected = getSelectedCatalog();
  if (!selected) {
    $("audio-status").textContent = "Escribe el nombre del idioma para continuar.";
    return;
  }
  try { persistSettings(); } catch {}
  updateLanguageFlag();
  $("language-picker").close();
  $("welcome-screen").classList.add("hidden");
  $("app-shell").classList.remove("hidden");
  showScreen("route");
  refreshDashboard();
});

