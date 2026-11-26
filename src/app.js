import { createSession, recordAnswer, recordTutorEvaluation, evaluateAnswer, buildSummary, getAdaptation, applyLearnerUpdate } from "./core/pedagogy.js";
import { loadProgress, saveProgress, persistSession, getDueCards, gradeReview, getProgressStats } from "./core/storage.js";
import { checkTutorHealth, requestTutorTurn } from "./core/tutor-client.js";
import { escapeHTML } from "./core/html.js";
import { createSpeechController } from "./core/speech.js";

const $ = id => document.getElementById(id);
const languageDefinitions = {
  "Italiano": { id:"it-IT", label:"Italiano", locale:"it-IT", flag:"🇮🇹" }
};
const catalogs = Object.fromEntries(Object.entries(languageDefinitions).map(([name,definition]) => [name, definition.catalog || { id:definition.id, label:definition.label, locale:definition.locale, exercises:[] }]));
const speech = createSpeechController({ onStatus: updateAudioStatus });
function updateAudioStatus(status) {
  const toggles = [document.getElementById("audio-toggle"), document.getElementById("session-audio-toggle"), document.getElementById("theory-audio-toggle")].filter(Boolean);
  toggles.forEach(toggle => {
    toggle.textContent = status.enabled ? "🔊" : "🔇";
    toggle.setAttribute("aria-pressed", String(status.enabled));
    toggle.setAttribute("aria-label", status.enabled ? "Desactivar audio" : "Activar audio");
    toggle.title = status.enabled ? "Audio activado" : "Audio desactivado";
    toggle.classList.toggle("audio-off", !status.enabled);
  });
}

let currentActivitySpeechSegments = [];
function toggleAudio() {
  const enabled = speech.setEnabled(!speech.enabled);
  if (!enabled) {
    readingPassageActive = false;
    readingPassagePaused = false;
    updateReadingPassageControl();
    return;
  }
  if (currentExercise?.passage && !sessionFinished) {
    startPassageSpeech(0, { automatic:true, onEnd:() => {
      const remaining = currentActivitySpeechSegments.filter(item => item.role !== "passage");
      speech.speakSequence(remaining, { automatic:true });
    }});
  } else {
    speech.speakSequence(currentActivitySpeechSegments, { automatic:true });
  }
}
document.getElementById("audio-toggle")?.addEventListener("click", toggleAudio);
document.getElementById("session-audio-toggle")?.addEventListener("click", toggleAudio);
function speakerButton(text, locale) {
  const spokenLocale = locale || session?.config?.languageLocale || catalog?.locale || "und";
  return '<button class="speak-button" type="button" data-speak="' + escapeHTML(text) + '" data-locale="' + escapeHTML(spokenLocale) + '" aria-label="Escuchar en ' + escapeHTML(spokenLocale) + '" title="Escuchar (' + escapeHTML(spokenLocale) + ')">▶</button>';
}
function renderClickableTargetText(value) {
  return escapeHTML(value || "");
}
function bindTargetWords() {
  // Word-level translation was intentionally removed from exercise interactions.
}
let readingPassageActive = false;
let readingPassagePaused = false;
let readingPassageOffset = 0;
let readingPassageProgress = 0;
function updateReadingPassageControl() {
  const button = $("reading-tts-toggle");
  const slider = $("reading-tts-progress");
  const restart = $("reading-tts-restart");
  if (button) {
    button.disabled = !speech.supported;
    button.textContent = readingPassageActive && !readingPassagePaused ? "Ⅱ" : "▶";
    button.setAttribute("aria-label", readingPassageActive && !readingPassagePaused ? "Pausar lectura" : "Reproducir lectura");
  }
  if (slider) slider.value = String(readingPassageProgress);
  if (restart) restart.disabled = !speech.supported;
}
function startPassageSpeech(fromOffset = 0, { automatic = false, onEnd } = {}) {
  const passage = currentExercise?.passage || "";
  if (!passage || !speech.supported) return;
  readingPassageOffset = Math.max(0, Math.min(passage.length, fromOffset));
  readingPassageActive = true;
  readingPassagePaused = false;
  const result = speech.speak(passage.slice(readingPassageOffset), session?.config?.languageLocale || catalog?.locale, {
    automatic,
    onBoundary: event => {
      if (Number.isFinite(event?.charIndex)) {
        readingPassageProgress = Math.min(100, Math.round((readingPassageOffset + event.charIndex) / passage.length * 100));
        updateReadingPassageControl();
      }
    },
    onEnd: () => {
      readingPassageActive = false;
      readingPassagePaused = false;
      readingPassageOffset = 0;
      readingPassageProgress = 100;
      updateReadingPassageControl();
      onEnd?.();
    }
  });
  if (!result.spoken) readingPassageActive = false;
  updateReadingPassageControl();
}
function togglePassageSpeech() {
  const passage = currentExercise?.passage;
  if (!passage) return;
  if (readingPassageActive && readingPassagePaused) {
    readingPassagePaused = !speech.resume();
  } else if (readingPassageActive) {
    readingPassagePaused = speech.pause();
  } else {
    const offset = readingPassageProgress >= 100 ? 0 : readingPassageOffset;
    startPassageSpeech(offset);
  }
  updateReadingPassageControl();
}
function restartPassageSpeech() {
  if (!currentExercise?.passage) return;
  speech.stop();
  readingPassageActive = false;
  readingPassagePaused = false;
  readingPassageOffset = 0;
  readingPassageProgress = 0;
  startPassageSpeech(0);
}
function seekPassageSpeech(value) {
  const passage = currentExercise?.passage || "";
  if (!passage) return;
  const wasPlaying = readingPassageActive && !readingPassagePaused;
  const offset = Math.floor(passage.length * Math.max(0, Math.min(100, Number(value) || 0)) / 100);
  speech.stop();
  readingPassageOffset = offset;
  readingPassageProgress = Math.round(offset / passage.length * 100);
  readingPassageActive = false;
  readingPassagePaused = false;
  if (wasPlaying) startPassageSpeech(offset);
  else updateReadingPassageControl();
}
function bindTheoryTargetText(root) {
  const locale = getSelectedCatalog()?.locale || "und";
  root.querySelectorAll(".theory-target-word").forEach(target => {
    const spokenText = target.textContent.trim();
    if (!spokenText) return;
    const adjacentSpeaker = target.nextElementSibling?.matches(".speak-button") ? target.nextElementSibling : null;
    if (spokenText.length > 48) {
      if (!adjacentSpeaker) target.insertAdjacentHTML("afterend", " " + speakerButton(spokenText, locale));
      return;
    }
    adjacentSpeaker?.remove();
    if (target.dataset.theorySpeechBound === "true") return;
    target.dataset.theorySpeechBound = "true";
    target.classList.add("theory-target-tap");
    target.dataset.speak = spokenText;
    target.dataset.locale = locale;
    target.setAttribute("role", "button");
    target.setAttribute("tabindex", "0");
    target.setAttribute("aria-label", "Escuchar " + spokenText + " en italiano");
    const speak = () => speech.speak(spokenText, locale);
    target.addEventListener("click", speak);
    target.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        speak();
      }
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
  const targetLocale = session?.config?.languageLocale || catalog?.locale || "";
  const valid = (segments || []).filter(item => {
    const locale = String(item?.locale || "").toLowerCase();
    return item && typeof item.text === "string" && item.text.trim() &&
      (locale === String(targetLocale).toLowerCase() || locale === "es-cl" || locale === "es");
  });
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
  currentActivitySpeechSegments = segments;
  appendSpeechButtons(root, segments);
  speech.speakSequence(segments, { automatic: true });
}
function getExerciseSpeech(exercise) {
  // Never infer a spoken language from the text itself: Spanish and target-language
  // prompts can be semantically similar and a wrong voice is worse than silence.
  if (exercise?.speechText && exercise?.speechLocale) {
    return { text: exercise.speechText, locale: exercise.speechLocale };
  }
  if (exercise?.prompt && exercise?.promptLocale) {
    return { text: exercise.prompt, locale: exercise.promptLocale };
  }
  return { text: "", locale: "" };
}
function getExerciseSpeechSegments(exercise) {
  const targetLocale = session?.config?.languageLocale || catalog?.locale || "";
  const normalizeLocale = raw => {
    const locale = String(raw || "").trim();
    if (!locale) return "";
    if (locale.toLowerCase() === targetLocale.toLowerCase() ||
        locale.split("-")[0].toLowerCase() === targetLocale.split("-")[0].toLowerCase()) return targetLocale;
    if (locale.toLowerCase() === "es" || locale.toLowerCase().startsWith("es-")) return "es-CL";
    return "";
  };
  const segments = [];
  const add = (text, rawLocale, role) => {
    const phrase = String(text || "").trim();
    const locale = normalizeLocale(rawLocale);
    if (!phrase || !locale) return;
    if (!segments.some(item => item.text === phrase && item.locale.toLowerCase() === locale.toLowerCase())) {
      segments.push({ text:phrase, locale, role });
    }
  };

  // Reading is presented before its Spanish comprehension question, so its
  // spoken sequence follows that same visual order.
  if (exercise?.passage) add(exercise.passage, targetLocale, "passage");
  if (exercise?.instruction) add(exercise.instruction, "es-CL", "instruction");

  const declared = Array.isArray(exercise?.speechSegments) ? exercise.speechSegments : [];
  declared.forEach(item => {
    if (!item?.text || !item?.locale) return;
    const locale = normalizeLocale(item.locale);
    if (!locale) return;
    const declaredLanguage = String(item.language || "").toLowerCase();
    if (declaredLanguage && declaredLanguage !== locale.split("-")[0].toLowerCase()) return;
    add(item.text, locale, item.role || item.languageRole || "declared");
  });

  const spoken = getExerciseSpeech(exercise);
  if (spoken.text && spoken.locale) add(spoken.text, spoken.locale, "prompt");
  const prompt = String(exercise?.prompt || "").trim();
  const promptLocale = exercise?.promptLocale ||
    (exercise?.promptLanguage === "source" || exercise?.promptLanguage === "native" ? "es-CL" :
      exercise?.promptLanguage === "target" ? targetLocale : "");
  if (prompt && promptLocale) add(prompt, promptLocale, "prompt");

  const promptContainsTerm = prompt && String(exercise?.term || "").trim() &&
    prompt.toLocaleLowerCase().includes(String(exercise.term).trim().toLocaleLowerCase());
  if (!declared.length && !exercise?.passage && exercise?.type !== "reading" && exercise?.term && !promptContainsTerm) {
    add(exercise.term, targetLocale, "term");
  }

  const rank = item => item.role === "passage" ? 0 :
    item.locale.toLowerCase() === "es-cl" ? 1 : 2;
  return segments.sort((left,right) => rank(left) - rank(right));
}
function autoSpeak(text, locale = catalog?.locale) {
  if (text && speech.enabled) speech.speak(text, locale, { automatic: true });
}
const topicLabels = { daily:"vida cotidiana", travel:"viajes", food:"comida y restaurantes", work:"trabajo y estudios", reading:"comprensión lectora", random:"tema sorpresa" };
function getSelectedCatalog() {
  return catalogs[$("language").value] || null;
}
function updateLanguageFlag() {
  const selected = $("language").value;
  const flagBadge = $("selected-language-flag");
  if (flagBadge) flagBadge.textContent = languageDefinitions[selected]?.flag || "🌐";
  const languageButton = $("nav-language-button");
  if (languageButton) languageButton.setAttribute("aria-label", "Idioma seleccionado: " + (languageDefinitions[selected]?.label || selected || "sin seleccionar") + ". Cambiar idioma");
  const readingAvailable = Boolean(getSelectedCatalog()?.exercises?.some(exercise => exercise.type === "reading"));
  document.querySelector('[data-mode="reading"]')?.classList.toggle("hidden", !readingAvailable);
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
let reviewCompletedCount = 0;
let reviewTotalCount = 0;
let reviewProcessedKeys = new Set();
let lastActivityConfig = null;
let lastActivityMode = "practice";
let lastActivityExerciseIds = [];
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
  { id:"foundations", number:"01", title:"Inicio del viaje", topic:"daily", icon:"🧭", requiredStars:0, description:"Primeras palabras, expresiones y reglas para comenzar a comunicarte." },
  { id:"travel", number:"02", title:"Viajes y orientación", topic:"travel", icon:"🧭", requiredStars:3, description:"Moverte, preguntar y resolver situaciones." },
  { id:"food", number:"03", title:"Comida y restaurantes", topic:"food", icon:"🍽️", requiredStars:5, description:"Pedir, elegir y expresar preferencias." },
  { id:"work", number:"04", title:"Trabajo y estudios", topic:"work", icon:"💼", requiredStars:3, description:"Hablar de tareas, ocupaciones y ayuda." }
];
let selectedRouteUnitId = "foundations";
let routeSelectionTouched = false;
let activeRouteUnit = null;
let routeQuestionCount = 10;
let routeSummaryNextUnitId = "";
function getRouteDraftForLanguage(languageId) {
  if (!languageId) return null;
  try { return JSON.parse(localStorage.getItem(ROUTE_STORAGE_KEY + ":" + languageId) || "null"); }
  catch { return null; }
}
function getRouteProgressForLanguage(languageId) {
  if (!languageId) return { completedUnits:{} };
  try {
    const saved = JSON.parse(localStorage.getItem(ROUTE_UNITS_KEY + ":" + languageId) || "null");
    if (!saved || typeof saved !== "object") return { completedUnits:{} };
    const completedUnits = Object.fromEntries(Object.entries(saved.completedUnits || {}).map(([unitId,record]) => {
      if (!record || !record.completed) return [unitId,record];
      const accuracy = Math.max(0,Math.min(100,Number(record.accuracy) || 0));
      const derivedStars = Math.min(5,Math.floor(accuracy / 20));
      return [unitId,{ ...record, stars:Math.max(Number(record.stars) || 0,derivedStars) }];
    }));
    return { ...saved, completedUnits };
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
  const earnedStars = Number.isFinite(Number(record?.stars)) ? Number(record.stars) : Math.floor((Number(record?.accuracy) || 0) / 20);
  return Boolean(record?.completed && earnedStars >= Number(units[index].requiredStars || 0));
}
function renderRouteDashboard() {
  const list = $("route-unit-list"), start = $("route-start");
  if (!list || !start) return;
  const selectedCatalog = getSelectedCatalog(), units = getRouteUnitsForCatalog(selectedCatalog);
  const state = getRouteProgressForLanguage(selectedCatalog?.id);
  routeDraft = getRouteDraftForLanguage(selectedCatalog?.id);
  if (!routeSelectionTouched && routeDraft?.unitId && units.some(unit => unit.id === routeDraft.unitId)) selectedRouteUnitId = routeDraft.unitId;
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
  const chapterOneEnd = Math.max(2,Math.ceil(total * 0.4));
  if (index < chapterOneEnd) return { id:"discovery",label:"CAPÍTULO 1 · VOCABULARIO Y REGLAS" };
  return { id:"application",label:"CAPÍTULO 2 · APLICACIÓN PROGRESIVA" };
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
  // Only the current Spanish → Italian pair is surfaced; legacy records stay stored.
  const languageIds = selectedId ? [selectedId] : [];
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
    if (!metrics.length) {
      chartMarkup = '<p class="empty-chart">Completa una sesión para comparar la precisión entre idiomas.</p>';
    } else {
      chartMarkup = '<div class="stats-horizontal-list" role="list" aria-label="Precisión por idioma">' + metrics.map(item =>
        '<div class="stats-horizontal-row" role="listitem"><div class="stats-horizontal-label"><span>' + item.flag + ' ' + escapeHTML(item.label) + '</span><strong>' + item.accuracy + '%</strong></div>' +
        '<div class="stats-horizontal-track" role="img" aria-label="' + escapeHTML(item.label) + ': ' + item.accuracy + '%"><span style="width:' + item.accuracy + '%"></span></div></div>'
      ).join("") + '</div><p class="chart-note">Precisión acumulada por idioma. Las barras ocupan el ancho disponible de la pantalla.</p>';
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
      const width = 760, height = 340, left = 38, right = 38, top = 28, bottom = 64;
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
    '<div class="stats-chart-stage">' + chartMarkup + '</div></section>';
  $("stats-view-select").value = selectedView;
  $("stats-view-select").addEventListener("change", refreshDashboard);
}
$("language").addEventListener("change", () => {
  updateLanguageFlag();
  refreshDashboard();
});
try {
  const savedSettings = JSON.parse(localStorage.getItem("adaptive-language-tutor.settings") || "{}");
  if (savedSettings.selectedLanguage && savedSettings.selectedLanguage !== "Italiano") {
    savedSettings.selectedLanguage = "Italiano";
    localStorage.setItem("adaptive-language-tutor.settings", JSON.stringify(savedSettings));
  }
  $("language").value = "Italiano";
  if (savedSettings.duration) $("duration").value = String(savedSettings.duration);
  if (savedSettings.level) $("level").value = savedSettings.level;
  if (savedSettings.topic) $("topic").value = savedSettings.topic;

} catch { /* Ignore malformed optional settings; progress storage remains independent. */ }
updateLanguageFlag();
showScreen("theory");
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

const REVIEW_SESSION_KEY = "adaptive-language-tutor.review-session";
function loadReviewSessionState(languageId) {
  try {
    const value = JSON.parse(localStorage.getItem(REVIEW_SESSION_KEY + ":" + languageId) || "null");
    return value?.version === 1 && Array.isArray(value.remainingKeys) ? value : null;
  } catch { return null; }
}
function saveReviewSessionState(languageId, state) {
  try { localStorage.setItem(REVIEW_SESSION_KEY + ":" + languageId,JSON.stringify({version:1,...state})); return true; }
  catch { return false; }
}
function clearReviewSessionState(languageId) {
  try { localStorage.removeItem(REVIEW_SESSION_KEY + ":" + languageId); } catch {}
}
function persistReviewQueue() {
  if (!catalog?.id) return;
  const remainingKeys = dueReviewCards.slice(reviewIndex).map(card => card.key);
  if (!remainingKeys.length) {
    clearReviewSessionState(catalog.id);
    return;
  }
  saveReviewSessionState(catalog.id,{
    remainingKeys,
    processedKeys:[...reviewProcessedKeys],
    completed:reviewCompletedCount,
    total:reviewTotalCount,
    updatedAt:new Date().toISOString()
  });
}
function markReviewCardGraded(card) {
  reviewProcessedKeys.add(card.key);
  reviewCompletedCount += 1;
  reviewIndex += 1;
  persistReviewQueue();
  saveProgress(progress);
}
function startSpacedReview() {
  speech.stop();
  catalog = getSelectedCatalog();
  if (!catalog) { $("ai-status").textContent = "Selecciona un idioma del mosaico."; return; }
  const allDue = getDueCards(progress,Date.now(),catalog.id).filter(card => card.cardType !== "pattern");
  const saved = loadReviewSessionState(catalog.id);
  reviewProcessedKeys = new Set(saved?.processedKeys || []);
  const dueByKey = new Map(allDue.map(card => [card.key,card]));
  if (saved) {
    const queued = saved.remainingKeys.map(key => dueByKey.get(key)).filter(Boolean);
    const queuedKeys = new Set(queued.map(card => card.key));
    const newlyDue = allDue.filter(card => !reviewProcessedKeys.has(card.key) && !queuedKeys.has(card.key));
    dueReviewCards = [...queued,...newlyDue];
    reviewCompletedCount = Number(saved.completed) || 0;
    reviewTotalCount = Math.max(Number(saved.total) || 0,reviewCompletedCount + dueReviewCards.length);
  } else {
    dueReviewCards = allDue;
    reviewCompletedCount = 0;
    reviewTotalCount = dueReviewCards.length;
  }
  reviewIndex = 0;
  if (!dueReviewCards.length) {
    clearReviewSessionState(catalog.id);
    reviewMode = false;
    sessionFinished = true;
    $("session-view").classList.add("hidden");
    $("app-shell").classList.remove("session-active");
    showScreen("exercises");
    $("summary-panel").classList.add("hidden");
    $("lesson-panel").classList.remove("hidden");
    $("review-exercises").classList.remove("hidden");
    $("review-dashboard").innerHTML = "No tienes palabras o frases pendientes.";
    refreshDashboard();
    return;
  }
  if (reviewTotalCount < reviewCompletedCount + dueReviewCards.length) reviewTotalCount = reviewCompletedCount + dueReviewCards.length;
  persistReviewQueue();
  sessionFinished = false;
  showSessionView("review");
  $("summary-panel").classList.add("hidden");
  $("lesson-panel").classList.remove("hidden");
  $("session-status").textContent = "";
  reviewMode = true;
  routeMode = false;
  aiMode = false;
  $("stats").hidden = true;
  $("hint-btn").hidden = false;
  $("hint-btn").textContent = "Pista";
  renderSpacedReview();
}

function renderSpacedReview() {
  speech.stop();
  if (reviewIndex >= dueReviewCards.length) {
    clearReviewSessionState(catalog?.id);
    sessionFinished = true;
    $("lesson-panel").classList.add("hidden");
    $("summary-panel").classList.remove("hidden");
    $("summary-content").innerHTML = '<h2 class="summary-title">Repaso finalizado</h2>';
    $("session-status").textContent = "";
    currentActivitySpeechSegments = [];
    renderSummaryActions({ origin:"exercises", mode:"review", canNext:false });
    return;
  }
  const card = dueReviewCards[reviewIndex];
  const exercise = catalog.exercises.find(item => item.id === card.exerciseId);
  const expected = exercise?.target || card.expected;
  const term = exercise?.term || card.term || expected;
  const meaning = exercise?.meaning || card.meaning || "";
  reviewExercise = exercise || { target:expected, term, meaning, hint:card.hint, explanation:card.explanation };
  reviewHintLevel = 0;
  $("lesson-phase").textContent = "REPASO";
  $("turn-count").textContent = (reviewCompletedCount + 1) + " / " + reviewTotalCount;
  $("progress-bar").style.width = ((reviewCompletedCount + 1) / Math.max(1,reviewTotalCount) * 100) + "%";
  $("progress-bar").parentElement.setAttribute("aria-valuenow",String(Math.round((reviewCompletedCount + 1) / Math.max(1,reviewTotalCount) * 100)));
  $("feedback").classList.add("hidden");
  $("hint-btn").hidden = true;
  const reviewSpeechExercise = {
    ...reviewExercise,
    prompt:exercise?.prompt || card.prompt || "",
    promptLocale:exercise?.promptLocale || card.promptLocale || "es-CL",
    term
  };
  currentActivitySpeechSegments = getExerciseSpeechSegments(reviewSpeechExercise);
  const audioMarkup = currentActivitySpeechSegments.map(item => speakerButton(item.text,item.locale)).join(" ");
  $("lesson-content").innerHTML = getExerciseIllustration(exercise || {topic:card.topic || "daily",prompt:card.prompt}) +
    '<div class="activity-phase">REPASO · PALABRAS Y FRASES</div>' +
    '<h3>' + escapeHTML(exercise?.prompt || card.prompt || "Recuerda la expresión.") + '</h3>' + audioMarkup;
  bindSpeakerButtons($("lesson-content"));
  if (currentActivitySpeechSegments.length) speech.speakSequence(currentActivitySpeechSegments,{automatic:true});

  const hasOptions = Array.isArray(exercise?.options) && exercise.options.length >= 2;
  const submitReviewAnswer = answer => {
    const checkExercise = exercise || { target:expected, acceptedAnswers:[] };
    const correct = evaluateAnswer(answer,checkExercise);
    playAnswerFeedbackSound(correct);
    gradeReview(progress,card.key,correct);
    saveProgress(progress);
    markReviewCardGraded(card);
    $("hint-btn").hidden = true;
    showFeedback(correct ? "Correcto." : "Respuesta de referencia:",correct);
    $("feedback").insertAdjacentHTML("beforeend",
      '<div class="review-answer-reveal"><p><strong>' + escapeHTML(term) + '</strong> ' +
      speakerButton(term,session?.config?.languageLocale || catalog.locale) + '</p>' +
      (meaning ? '<p class="review-translation">(' + escapeHTML(meaning) + ')</p>' : '') +
      (!correct && (exercise?.explanation || card.explanation) ? '<p>' + escapeHTML(exercise?.explanation || card.explanation) + '</p>' : '') +
      '</div>');
    bindSpeakerButtons($("feedback"));
    if (reviewIndex >= dueReviewCards.length) {
      renderSpacedReview();
      return;
    }
    $("answer-area").innerHTML = '<button id="next-spaced" class="primary" type="button">Siguiente →</button>';
    $("next-spaced").addEventListener("click",renderSpacedReview);
    if (meaning) speech.speak(term,session?.config?.languageLocale || catalog.locale,{automatic:true});
  };
  if (hasOptions) {
    $("answer-area").innerHTML = exercise.options.map((option,index) =>
      '<button class="answer-option" type="button" data-review-choice="' + index + '">' + escapeHTML(option) + '</button>'
    ).join("");
    $("answer-area").querySelectorAll("[data-review-choice]").forEach(button => button.addEventListener("click",() => {
      $("answer-area").querySelectorAll("[data-review-choice]").forEach(item => item.disabled = true);
      submitReviewAnswer(exercise.options[Number(button.dataset.reviewChoice)]);
    }));
  } else {
    $("answer-area").innerHTML = '<input id="spaced-answer" class="answer-input" placeholder="Escribe tu respuesta…"><button id="check-spaced" class="primary" type="button">Comprobar respuesta</button>';
    $("check-spaced").addEventListener("click",() => submitReviewAnswer($("spaced-answer").value));
  }
}
function startConfiguredActivity(mode, config, excludePrevious = false) {
  catalog = getSelectedCatalog();
  if (!catalog || !config) return;
  const nextConfig = { ...config };
  if (excludePrevious && lastActivityExerciseIds.length) nextConfig.excludeExerciseIds = [...lastActivityExerciseIds];
  else delete nextConfig.excludeExerciseIds;
  sessionAbortController?.abort();
  sessionAbortController = new AbortController();
  session = createSession(nextConfig);
  sessionFinished = false;
  reviewMode = false;
  routeMode = false;
  routeIntegration = false;
  aiMode = false;
  lastActivityConfig = { ...config };
  lastActivityMode = mode;
  $("summary-panel").classList.add("hidden");
  $("lesson-panel").classList.remove("hidden");
  $("session-status").textContent = "";
  showSessionView(mode);
  const useLiveAI = mode !== "reading" && aiConfigured && catalog.exercises.length < nextConfig.duration;
  if (useLiveAI) startAITutorSession(nextConfig);
  else renderLesson();
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
  const requestedQuestionCount = Number($("duration").value);
  const readingBankSize = catalog.exercises.filter(exercise => exercise.type === "reading").length;
  const questionCount = selectedExerciseMode === "reading" && readingBankSize ? Math.min(requestedQuestionCount,readingBankSize) : requestedQuestionCount;
  const config = { language:catalog.label, languageId:catalog.id, languageLocale:catalog.locale || catalog.id, duration:questionCount, questionCount, level:$("level").value, topic:selectedExerciseMode === "reading" ? "reading" : $("topic").value };
  lastActivityConfig = { ...config };
  lastActivityMode = selectedExerciseMode;
  persistSettings();
  sessionAbortController?.abort();
  sessionAbortController = new AbortController();
  session = createSession(config);
  sessionFinished = false;
  reviewMode = false;
  $("summary-panel").classList.add("hidden");
  $("lesson-panel").classList.remove("hidden");
  const useLiveAI = selectedExerciseMode !== "reading" && aiConfigured && catalog.exercises.length < questionCount;
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
      userMessage: "Inicia directamente con una actividad concreta, objetiva y adecuada al nivel y tema seleccionados. No hagas diagnóstico ni preguntas abiertas o subjetivas. Cada pregunta debe tener una única respuesta verificable: prioriza traducción concreta, completar una forma gramatical, identificar una opción o transformar una frase con contexto suficiente. Evita preguntas como «¿cómo responderías?» o «¿qué dirías?» si admiten múltiples respuestas naturales. Para respuestas escritas, define expectedAnswer como solución canónica y acceptedAnswers con todas las variantes lingüísticas correctas razonables; nunca marques como incorrecta una variante equivalente que hayas incluido. Si no puedes definir las variantes válidas de antemano, convierte la actividad en selección múltiple con una sola opción correcta. Escribe las instrucciones siempre en español dentro de message y mantén exercise.prompt separado como texto que se evalúa."
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
  const aiRoutePhase = routeMode && !routeIntegration ? getRoutePhase(Math.min(session.turn,routeQuestionCount-1),routeQuestionCount) : null;
  $("lesson-phase").textContent = routeMode ? routeIntegration ? "HITO INTEGRADOR" : aiRoutePhase.label : topicLabels[session.config.topic].toUpperCase() + " · " + levelLabel(session.config.level).toUpperCase();
  const activityTotal = routeMode ? routeQuestionCount + 1 : session.config.duration;
  $("turn-count").textContent = Math.min(session.turn + 1, activityTotal) + " / " + activityTotal;
  $("progress-bar").style.width = (Math.min(session.turn + 1, activityTotal) / activityTotal * 100) + "%";
  $("progress-bar").parentElement.setAttribute("aria-valuenow",String(Math.round(Math.min(session.turn + 1, activityTotal) / activityTotal * 100)));
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
  const speechExercise = {
    ...aiCurrentExercise,
    instruction,
    speechSegments:Array.isArray(result.speechSegments) && result.speechSegments.length
      ? result.speechSegments : aiCurrentExercise.speechSegments
  };
  const questionSpeechSegments = getExerciseSpeechSegments(speechExercise).filter(item => {
    if (!item || typeof item.text !== "string" || !item.text.trim() || !item.locale) return false;
    const declaredLanguage = String(item.language || "").toLowerCase();
    const localeLanguage = String(item.locale).split("-")[0].toLowerCase();
    return !declaredLanguage || declaredLanguage === localeLanguage;
  });

  currentActivitySpeechSegments = questionSpeechSegments;
  const promptAudio = questionSpeechSegments.map(item => speakerButton(item.text,item.locale)).join(" ");
  $("lesson-content").innerHTML = getExerciseIllustration({ ...aiCurrentExercise, topic:session.config.topic }) +
    '<div class="activity-phase">' + escapeHTML($("lesson-phase").textContent) + '</div>' + instructionMarkup + prompt + promptAudio;
  bindSpeakerButtons($("lesson-content"));
  bindTargetWords($("lesson-content"));
  if (questionSpeechSegments.length) speech.speakSequence(questionSpeechSegments, { automatic:true });
  $("feedback").classList.add("hidden");
  const aiOptions = Array.isArray(aiCurrentExercise.options) ? aiCurrentExercise.options : [];
  const aiShouldUseChoices = routeMode ? !routeIntegration && aiRoutePhase?.id !== "sentences" : session.turn < 3;
  const aiHasChoices = aiShouldUseChoices && aiOptions.length === 3 && aiOptions.some(option => String(option).trim().toLocaleLowerCase() === String(aiCurrentExercise.expectedAnswer || "").trim().toLocaleLowerCase());
  $("hint-btn").hidden = aiShouldUseChoices;
  $("hint-btn").textContent = "Pista";

  if (result.nextAction === "finish" || session.turn >= session.config.duration) {
    $("answer-area").innerHTML = '<button id="finish-ai-session" class="primary" type="button">Ver resumen →</button>';
    $("finish-ai-session").addEventListener("click", finishSession);
    return;
  }

  if (aiShouldUseChoices) {
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
        : (routeMode ? getRoutePhase(Math.min(session.turn + 1,routeQuestionCount-1),routeQuestionCount).id !== "sentences" : session.turn + 1 < 3)
          ? " La próxima actividad debe ser una pregunta de selección múltiple con tres alternativas plausibles en exercise.options."
          : " La próxima actividad debe requerir que escriba la respuesta, sin alternativas.") + " Mantén las instrucciones en español dentro de message y separa el texto evaluado en exercise.prompt. La pregunta debe ser objetiva, no abierta ni subjetiva, y tener una única respuesta verificable. Para respuestas escritas, proporciona expectedAnswer canónica y acceptedAnswers con todas las variantes naturales correctas; si no puedes enumerarlas, cambia a selección múltiple con una única opción correcta. No uses preguntas del tipo «¿cómo responderías?» o «¿qué dirías?» sin contexto que determine una sola respuesta. Incluye una pista breve."
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
      term:evaluatedExercise.term || evaluatedExercise.expectedAnswer || "",
      meaning:evaluatedExercise.meaning || evaluatedExercise.translation || evaluatedExercise.sourceText || evaluatedExercise.prompt || "",
      promptLocale:evaluatedExercise.promptLocale || "es-CL",
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
  $("lesson-panel").dataset.routeUnit = activeRouteUnit.id;
  saveRouteDraft();
  renderRouteDashboard();
  sessionAbortController?.abort();
  sessionAbortController = new AbortController();
  sessionFinished = false;
  reviewMode = false;
  $("lesson-panel").classList.remove("hidden");
  $("summary-panel").classList.add("hidden");
  showSessionView("route");
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
    daily: { prompt:"Traduce al italiano esta frase concreta: «Mañana estudio en casa».", target:"Domani studio a casa.", accepted:["Domani studio a casa"], hints:["Traduce mañana, estudiar y en casa.","Empieza con «Domani…»."] },
    travel: { prompt:"Traduce al italiano esta frase concreta: «Quiero comprar un billete».", target:"Voglio comprare un biglietto.", accepted:["Vorrei comprare un biglietto."], hints:["Traduce quiero, comprar y billete.","Empieza con «Voglio comprare…»."] },
    food: { prompt:"Traduce al italiano esta frase concreta: «Quisiera un café, por favor».", target:"Vorrei un caffè, per favore.", accepted:["Vorrei un caffè per favore"], hints:["Usa una petición cortés.","Empieza con «Vorrei…»."] },
    work: { prompt:"Traduce al italiano esta frase concreta: «Trabajo en una oficina».", target:"Lavoro in un ufficio.", accepted:["Lavoro in ufficio."], hints:["Traduce trabajo y oficina.","Empieza con «Lavoro…»."] }
  };
  const scenario = scenarios[activeRouteUnit?.topic || "daily"] || scenarios.daily;
  const prompt = scenario.prompt;
  pendingFeedback = null;
  routeIntegrationHintLevel = Number(routeIntegrationHintLevel || 0);
  currentExercise = {
    id:"route-integration-" + (activeRouteUnit?.id || "foundations"), prompt, promptLocale:"es-CL",
    target:scenario.target, allowTypo:true, acceptedAnswers:scenario.accepted,
    hints:scenario.hints,
    explanation:"Esta actividad integra el vocabulario y las estructuras de la unidad " + (activeRouteUnit?.title || "Fundamentos") + "."
  };
  $("lesson-phase").textContent = "CAPÍTULO 2 · ACTIVIDAD INTEGRADORA";
  $("turn-count").textContent = (routeQuestionCount + 1) + " / " + (routeQuestionCount + 1);
  $("progress-bar").style.width = "100%";
  $("progress-bar").parentElement.setAttribute("aria-valuenow","100");
  $("hint-btn").textContent = routeIntegrationHintLevel >= 1 ? "Ver respuesta" : "Pista";
  $("hint-btn").hidden = routeIntegrationHintLevel >= 2;
  currentActivitySpeechSegments = getExerciseSpeechSegments(currentExercise);
  const integrationAudio = currentActivitySpeechSegments.map(item => speakerButton(item.text,item.locale)).join(" ");
  $("lesson-content").innerHTML = getExerciseIllustration({ topic:activeRouteUnit?.topic, prompt }) + '<div class="activity-phase">CAPÍTULO 2 · ACTIVIDAD INTEGRADORA</div><p class="eyebrow">UNIDAD ' + (activeRouteUnit?.number || "01") + ' · ' + escapeHTML(activeRouteUnit?.title || "INICIO DEL VIAJE").toUpperCase() + '</p><h3>' + escapeHTML(prompt) + '</h3>' + integrationAudio + '<p>Combina lo practicado en los capítulos anteriores.</p>';
  bindSpeakerButtons($("lesson-content"));
  speech.speakSequence(currentActivitySpeechSegments,{automatic:true});
  $("answer-area").innerHTML = '<textarea id="route-integration-answer" class="answer-input" rows="3" placeholder="Escribe tu respuesta completa…"></textarea><button id="route-integration-submit" class="primary" type="button">Comprobar actividad</button>';
  $("route-integration-submit").addEventListener("click", () => {
    const answer = $("route-integration-answer").value.trim();
    const integrationCorrect = evaluateAnswer(answer, currentExercise);
    playAnswerFeedbackSound(integrationCorrect);
    if (integrationCorrect) {
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
      const revealedAudio = routeIntegrationHintLevel >= 2 ? " " + speakerButton(currentExercise.target,session.config.languageLocale) : "";
      $("feedback").innerHTML = '<p class="answer-status incorrect">Todavía no coincide. Inténtalo otra vez.</p><p class="answer-explanation">' + (routeIntegrationHintLevel === 1 ? "Pista: " : "Ver respuesta: ") + escapeHTML(helpText) + revealedAudio + '</p>';
      $("hint-btn").textContent = "Ver respuesta";
      if (routeIntegrationHintLevel >= 2) $("hint-btn").hidden = true;
      $("feedback").classList.remove("hidden","bad");
      bindSpeakerButtons($("feedback"));
      if (routeIntegrationHintLevel >= 2) speech.speak(currentExercise.target,session.config.languageLocale,{automatic:true});
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
  $("turn-count").textContent = routeQuestionCount + " / " + (routeQuestionCount + 1);
  $("progress-bar").style.width = (routeQuestionCount / (routeQuestionCount + 1) * 100) + "%";
  $("progress-bar").parentElement.setAttribute("aria-valuenow",String(Math.round(routeQuestionCount / (routeQuestionCount + 1) * 100)));
  $("lesson-content").innerHTML = getExerciseIllustration({topic:activeRouteUnit?.topic,prompt:activeRouteUnit?.title}) + '<div class="activity-phase">REFUERZO NECESARIO</div><div class="feedback-note"><span>Actividad integradora pendiente</span><p>Completa la actividad integradora para registrar el puntaje de esta unidad.</p></div>';
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
  if (routeMode && getRoutePhase(session.turn,routeQuestionCount).id === "discovery") {
    const discoveryItems = catalog.exercises.filter(item =>
      item.topic === session.config.topic && item.term && item.meaning && item.type !== "reading"
    );
    const source = discoveryItems[session.turn];
    if (source) {
      const grammarItem = /verbo|conjug|gram[aá]t|tiempo verbal/i.test(String(source.skill || ""));
      if (grammarItem) return source;
      const distractors = [...new Set(discoveryItems
        .filter(item => item.id !== source.id)
        .map(item => String(item.meaning).trim())
        .filter(Boolean))];
      const options = [...new Set([String(source.meaning).trim(), ...distractors])].slice(0,3);
      return {
        id:"route-discovery-" + (activeRouteUnit?.id || session.config.topic) + "-" + source.id,
        level:"A1", topic:session.config.topic, type:"vocabulary", skill:"Vocabulario esencial",
        prompt:"¿Qué significa «" + source.term + "»?",
        promptLocale:"es-CL", promptLanguage:"source", target:source.meaning,
        options:options.length >= 2 ? options : undefined, optionsLocale:"es-CL",
        term:source.term, meaning:source.meaning, speechText:source.term,
        speechLocale:catalog.locale, hint:"Recuerda el significado de esta palabra en el idioma que estás aprendiendo.",
        explanation:source.term + " significa " + source.meaning + "."
      };
    }
  }
  let exercises = getTopicExercises();
  const adaptation = getAdaptation(session);
  let candidates;
  const finalTurn = !routeMode && session.turn === session.config.duration - 1;
  if (session.config.topic === "reading") {
    const answeredIds = new Set(session.answers.map(answer => answer.exerciseId));
    const reading = catalog.exercises.filter(exercise => exercise.type === "reading" && !answeredIds.has(exercise.id));
    if (reading.length) {
      const preferredLevel = session.config.level === "advanced" ? "A2" : "A1";
      const levelRank = exercise => exercise.level === preferredLevel ? 0 : 1;
      reading.sort((a,b) => levelRank(a)-levelRank(b) || String(a.passage || "").trim().split(/\s+/).length-String(b.passage || "").trim().split(/\s+/).length);
      candidates = [reading[0]];
    } else {
      // Never recycle a reading question in the same session. End the session
      // when every distinct reading item has been answered.
      return null;
    }
  } else {
    candidates = exercises.filter(exercise => !session.answers.some(answer => answer.exerciseId === exercise.id) && (finalTurn || !exercise.finalPractice));
    if (finalTurn) {
      const finalExercises = candidates.filter(exercise => exercise.finalPractice);
      if (finalExercises.length) candidates = finalExercises;
    }
  }
  if (routeMode && getRoutePhase(session.turn,routeQuestionCount).id === "application") {
    const chapterOneEnd = Math.max(2,Math.ceil(routeQuestionCount * 0.4));
    const discoverySources = catalog.exercises.filter(item =>
      item.topic === session.config.topic && item.term && item.meaning && item.type !== "reading"
    ).slice(0,chapterOneEnd);
    const isolatedDiscoveryIds = new Set(discoverySources
      .filter(item => /comprensión auditiva|vocabulario/i.test(String(item.skill || "")) &&
        String(item.prompt || "").trim().split(/\s+/).filter(Boolean).length <= 2)
      .map(item => item.id));
    candidates = candidates.filter(exercise => !isolatedDiscoveryIds.has(exercise.id));
  }
  if (!candidates.length && !routeMode && session.config.topic !== "reading") {
    exercises = catalog.exercises;
    candidates = exercises.filter(exercise => !session.answers.some(answer => answer.exerciseId === exercise.id));
  }
  if (session.turn === 0 && Array.isArray(session.config.excludeExerciseIds) && session.config.excludeExerciseIds.length) {
    const freshCandidates = candidates.filter(exercise => !session.config.excludeExerciseIds.includes(exercise.id));
    if (freshCandidates.length) candidates = freshCandidates;
  }
  if (!candidates.length) return null;
  if (routeMode && getRoutePhase(session.turn,routeQuestionCount).id === "application") {
    const difficulty = exercise => {
      const level = exercise.level === "A1" ? 0 : exercise.level === "A2" ? 1 : 2;
      const words = String(exercise.target || exercise.prompt || "").trim().split(/\s+/).filter(Boolean).length;
      return { level, words, length:String(exercise.target || "").length };
    };
    candidates.sort((left,right) => {
      const a = difficulty(left), b = difficulty(right);
      return a.level - b.level || a.words - b.words || a.length - b.length || String(left.id).localeCompare(String(right.id));
    });
  }
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
  return ({zero:"Principiante · A1",basic:"Intermedio · B1",intermediate:"Intermedio · B1",advanced:"Avanzado · C1"})[level] || "Intermedio · B1";
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
  const activityPhaseLabel = routeMode ? routePhase.label : session.config.topic === "reading"
    ? (currentExercise.type === "reading" ? "COMPRENSIÓN DEL TEXTO" : "PRÁCTICA GENERAL")
    : topicLabels[session.config.topic].toUpperCase() + " · " + levelLabel(session.config.level).toUpperCase();
  const activityTotal = routeMode ? routeQuestionCount + 1 : session.config.duration;
  $("turn-count").textContent = (questionIndex + 1) + " / " + activityTotal;
  $("progress-bar").style.width = ((questionIndex + 1) / activityTotal * 100) + "%";
  $("progress-bar").parentElement.setAttribute("aria-valuenow",String(Math.round((questionIndex + 1) / activityTotal * 100)));
  $("streak").textContent = session.streak;
  $("word-count").textContent = session.vocabulary.length;
  $("error-count").textContent = session.errors.length;
  pendingFeedback = null;
  const targetLocale = session.config.languageLocale || session.config.languageId;
  // Every displayed source and target segment keeps its own locale and speaker control.
  const questionSpeechSegments = getExerciseSpeechSegments(currentExercise)
    .filter(item => item.locale && item.text);
  currentActivitySpeechSegments = questionSpeechSegments;
  const promptMarkup = currentExercise.promptLanguage === "target"
    ? renderClickableTargetText(currentExercise.prompt)
    : escapeHTML(currentExercise.prompt);
  const instructionMarkup = currentExercise.instruction
    ? '<p class="exercise-instruction">' + escapeHTML(currentExercise.instruction) + '</p>' : "";
  const questionAudioMarkup = questionSpeechSegments.filter(item => item.role !== "passage")
    .map(item => speakerButton(item.text, item.locale)).join(" ");
  const readingMarkup = currentExercise.passage
    ? '<section class="reading-passage"><span class="reading-passage-kicker">Texto de lectura</span><h3>' + escapeHTML(currentExercise.passageTitle || "Lectura") + '</h3><p>' + escapeHTML(currentExercise.passage) + '</p><div class="reading-player"><button id="reading-tts-toggle" class="reading-player-play" type="button" aria-label="Reproducir lectura">▶</button><input id="reading-tts-progress" class="reading-player-progress" type="range" min="0" max="100" value="0" aria-label="Posición de lectura"><button id="reading-tts-restart" class="reading-player-restart" type="button" aria-label="Reiniciar lectura">↻</button></div></section>'
    : "";
  const readingQuestionType = session.config.topic === "reading"
    ? '<p class="reading-question-type">' + (currentExercise.type === "reading" ? "Comprensión del texto" : "Práctica general") + '</p>' : "";
  $("lesson-content").innerHTML = getExerciseIllustration({ ...currentExercise, topic:currentExercise.topic || session.config.topic }) + '<div class="activity-phase">' + escapeHTML(activityPhaseLabel) + '</div>' + readingQuestionType + readingMarkup + instructionMarkup + '<h3>' + promptMarkup + '</h3>' + questionAudioMarkup;
  updateReadingPassageControl();
  $("reading-tts-toggle")?.addEventListener("click", togglePassageSpeech);
  $("reading-tts-restart")?.addEventListener("click", restartPassageSpeech);
  $("reading-tts-progress")?.addEventListener("change", event => seekPassageSpeech(event.target.value));
  bindSpeakerButtons($("lesson-content"));
  bindTargetWords($("lesson-content"));
  speech.stop();
  readingPassageActive = false;
  readingPassagePaused = false;
  readingPassageOffset = 0;
  readingPassageProgress = 0;
  updateReadingPassageControl();
  if (currentExercise.passage) {
    const passageSpeech = questionSpeechSegments.find(item => item.role === "passage");
    if (passageSpeech && speech.enabled) {
      startPassageSpeech(0, { automatic:true, onEnd:() => {
        speech.speakSequence(questionSpeechSegments.filter(item => item.role !== "passage"), { automatic:true });
      }});
    }
  } else {
    speech.speakSequence(questionSpeechSegments, { automatic:true });
  }
  const useMultipleChoice = currentExercise.type === "reading"
    ? Array.isArray(currentExercise.options) && currentExercise.options.length >= 2
    : routeMode
      ? routePhase.id !== "sentences" && Array.isArray(currentExercise.options) && currentExercise.options.length >= 2
      : questionIndex < session.config.duration - 1 && questionIndex < 3;
  if (useMultipleChoice) {
    const options = currentExercise.options || [];
    $("answer-area").innerHTML = options.map((option,index) => {
      const optionLocale = currentExercise.optionsLocale || (currentExercise.speechMode === "listening" ? "es-CL" : catalog.locale);
      const targetSpeaker = optionLocale.toLowerCase() === targetLocale.toLowerCase() ? speakerButton(option, optionLocale) : "";
      return '<div class="answer-option-row"><button class="answer-option" data-choice="' + index + '">' + renderClickableTargetText(option) + '</button>' + (currentExercise.type === "reading" ? "" : targetSpeaker) + '</div>';
    }).join("");
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
function playAnswerFeedbackSound(correct) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const now = context.currentTime;
    const notes = correct ? [660, 880] : [260, 190];
    notes.forEach((frequency,index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = correct ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + index * 0.13);
      gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.13 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.13 + 0.11);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(now + index * 0.13); oscillator.stop(now + index * 0.13 + 0.12);
    });
    window.setTimeout(() => context.close().catch(() => {}), 650);
  } catch {}
}
function showAnswerFeedback({ correct, expected, expectedLocale, explanation, selected, options = [], correctOption, showContinue = true }) {
  playAnswerFeedbackSound(Boolean(correct));
  $("answer-area").querySelector(".answer-waiting")?.remove();
  $("answer-area").querySelector("#continue-answer")?.remove();
  const resolvedExpectedLocale = expectedLocale || session?.config.languageLocale || catalog?.locale;
  const expectedAudio = resolvedExpectedLocale?.toLowerCase() === (session?.config.languageLocale || catalog?.locale || "").toLowerCase()
    ? " " + speakerButton(expected, resolvedExpectedLocale) : "";
  const expectedText = !correct && expected ? '<p class="answer-correct-text">Respuesta correcta: ' + renderClickableTargetText(expected) + expectedAudio + '</p>' : "";
  const explanationText = !correct && explanation ? '<p class="answer-explanation">' + escapeHTML(explanation) + '</p>' : "";
  $("feedback").innerHTML = (correct ? '<p class="answer-status correct">Correcto</p>' : '<p class="answer-status incorrect">Incorrecto</p>') + expectedText + explanationText;
  $("feedback").classList.remove("hidden","bad");
  $("hint-btn").disabled = true;
  $("hint-btn").hidden = true;
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
      playAnswerFeedbackSound(evaluation.status === "correct");
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
      appendSpeechButtons($("feedback"),[{text:currentExercise.target,locale:session.config.languageLocale}]);
      speech.speak(currentExercise.target,session.config.languageLocale,{automatic:true});
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


function getRouteAssessmentScore() {
  // Use the pedagogy engine's evaluated-attempt counters. In AI sessions,
  // not_applicable conversational turns are recorded in answers but are not
  // scored attempts and must not lower the unit's final accuracy.
  const attempted = Math.max(0, Number(session?.attempted) || 0);
  const correct = Math.min(attempted, Math.max(0, Number(session?.correct) || 0));
  return { attempted, correct };
}
function renderSummaryActions({ origin = "exercises", mode = "practice", canNext = true, nextLabel = "Siguiente ejercicio" } = {}) {
  $("summary-return-label").textContent = origin === "route" ? "Volver a Ruta" : "Volver a Entrenamiento";
  $("summary-restart").hidden = false;
  $("route-summary-next").hidden = !canNext;
  $("summary-next-label").textContent = nextLabel;
  $("new-session").hidden = false;
  $("summary-actions").dataset.origin = origin;
  $("summary-actions").dataset.mode = mode;
}

function finishSession() {
  if (!session || sessionFinished) return;
  sessionFinished = true;
  lastActivityConfig = { ...session.config };
  lastActivityMode = routeMode ? "route" : session.config.topic === "reading" ? "reading" : "practice";
  lastActivityExerciseIds = [...new Set((session.answers || []).map(item => item.exerciseId).filter(Boolean))];
  const routeScore = routeMode ? getRouteAssessmentScore() : null;
  if (routeMode && session.routeIntegrationComplete && routeScore.attempted > 0) {
    const attempted = routeScore.attempted;
    const correct = routeScore.correct;
    const accuracy = attempted ? Math.round(correct / attempted * 100) : 0;
    const stars = Math.min(5, Math.floor(accuracy / 20));
    const state = getRouteProgressForLanguage(session.config.languageId);
    state.completedUnits = state.completedUnits || {};
    const unitId = session.config.routeUnitId || activeRouteUnit?.id || "foundations";
    const previousRecord = state.completedUnits[unitId] || {};
    const bestAccuracy = Math.max(Number(previousRecord.accuracy) || 0, accuracy);
    const bestStars = Math.max(Number(previousRecord.stars) || 0, stars, Math.floor(bestAccuracy / 20));
    state.completedUnits[unitId] = {
      ...previousRecord, completed:true, stars:bestStars, accuracy:bestAccuracy,
      correct:bestAccuracy === accuracy ? correct : previousRecord.correct,
      attempted:bestAccuracy === accuracy ? attempted : previousRecord.attempted,
      completedAt:new Date().toISOString()
    };
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
  if (routeMode && routeScore) {
    summary.attempted = routeScore.attempted;
    summary.correct = routeScore.correct;
    summary.accuracy = routeScore.attempted ? Math.round(routeScore.correct / routeScore.attempted * 100) : 0;
    summary.errors = summary.errors.filter(item => !String(item.exerciseId || "").startsWith("route-integration-"));
  }
  pendingFeedback = null;
  persistSession(progress, session, summary);
  saveProgress(progress);
  refreshDashboard();
  const summaryLocale = session.config.languageLocale || session.config.languageId;
  const attemptedCount = routeMode ? routeScore.attempted : Number(summary.attempted) || session.answers.length;
  const correctCount = routeMode ? routeScore.correct : Number(summary.correct) || 0;
  const accuracyPercent = attemptedCount ? Math.round(correctCount / attemptedCount * 100) : 0;
  const accuracyMessage = accuracyPercent === 100 ? "Perfecto" : accuracyPercent > 80 ? "Muy bien" : accuracyPercent > 60 ? "Bien" : accuracyPercent >= 40 ? "Vas progresando" : "Sigue practicando";
  const routeStars = Math.min(5,Math.floor(accuracyPercent / 20));
  const routeScoreMarkup = routeMode
    ? '<section class="route-result" aria-label="Resultado de la unidad"><div class="summary-route-stars" aria-label="' + routeStars + ' de 5 estrellas">' + "★".repeat(routeStars) + "☆".repeat(5-routeStars) + '</div><p class="route-result-feedback">' + accuracyMessage + '</p></section>'
    : '<div class="summary-accuracy"><strong>' + accuracyPercent + '%</strong><span>' + accuracyMessage + '</span></div>';
  const reinforcementItems = [];
  const seenReinforcement = new Set();
  for (const error of summary.errors || []) {
    const exercise = catalog?.exercises?.find(candidate => candidate.id === error.exerciseId);
    const term = String(error.term || exercise?.term || error.expected || exercise?.target || "").trim();
    if (!term) continue;
    const meaning = String(error.meaning || exercise?.meaning || "").trim();
    const key = term.toLocaleLowerCase() + "|" + meaning.toLocaleLowerCase();
    if (seenReinforcement.has(key)) continue;
    seenReinforcement.add(key);
    reinforcementItems.push({term,meaning});
  }
  const reinforcementMarkup = reinforcementItems.length
    ? '<section class="summary-section route-reinforcement"><h3>Reforzar</h3><ul class="summary-reinforcement-list">' +
      reinforcementItems.map(item => '<li class="summary-reinforcement-item"><div class="summary-reinforcement-target">' +
        renderClickableTargetText(item.term) + ' ' + speakerButton(item.term,summaryLocale) +
        '</div>' + (item.meaning ? '<p class="summary-reinforcement-translation">(' + escapeHTML(item.meaning) + ')</p>' : '') +
        '</li>').join("") + '</ul></section>'
    : "";
  $("summary-content").innerHTML = '<h2 class="summary-title">' + (routeMode ? "Resumen de Ruta" : "Resumen") + '</h2>' +
    routeScoreMarkup + reinforcementMarkup;

  routeSummaryNextUnitId = "";
  let nextLabel = "Siguiente ejercicio";
  let canNext = true;
  if (routeMode) {
    const units = getRouteUnitsForCatalog(catalog);
    const activeIndex = units.findIndex(unit => unit.id === activeRouteUnit?.id);
    const nextUnit = units[activeIndex + 1];
    const routeState = getRouteProgressForLanguage(session.config.languageId);
    const completedRecord = routeState.completedUnits?.[session.config.routeUnitId || activeRouteUnit?.id];
    routeSummaryNextUnitId = session.routeIntegrationComplete && completedRecord?.completed && nextUnit &&
      isRouteUnitUnlocked(units,activeIndex + 1,routeState) ? nextUnit.id : "";
    canNext = Boolean(routeSummaryNextUnitId);
    nextLabel = routeSummaryNextUnitId ? "Siguiente unidad · " + nextUnit.title : "";
  }
  currentActivitySpeechSegments = reinforcementItems.map(item => ({text:item.term,locale:summaryLocale}));
  bindSpeakerButtons($("summary-content"));
  if (currentActivitySpeechSegments.length) speech.speakSequence(currentActivitySpeechSegments,{automatic:true});
  renderSummaryActions({
    origin:routeMode ? "route" : "exercises",
    mode:lastActivityMode,
    canNext,
    nextLabel
  });
}
$("new-session").addEventListener("click",() => {
  closeSessionAndReturn();
});
$("summary-restart")?.addEventListener("click",() => {
  if (routeMode && activeRouteUnit) {
    selectedRouteUnitId = activeRouteUnit.id;
    routeSelectionTouched = true;
    startRouteSession(false);
  } else if (reviewMode) {
    startSpacedReview();
  } else if (lastActivityConfig) {
    startConfiguredActivity(lastActivityMode,lastActivityConfig,false);
  }
});
$("route-summary-next")?.addEventListener("click",() => {
  if (routeMode) {
    if (!routeSummaryNextUnitId) return;
    selectedRouteUnitId = routeSummaryNextUnitId;
    routeSelectionTouched = true;
    startRouteSession(false);
    if (activeRouteUnit?.id !== routeSummaryNextUnitId || !session || session.config.routeUnitId !== routeSummaryNextUnitId) {
      routeSelectionTouched = false;
      closeSessionAndReturn();
      showScreen("theory");
    }
    return;
  }
  if (!reviewMode && lastActivityConfig) startConfiguredActivity(lastActivityMode,lastActivityConfig,true);
});

// Main navigation and language onboarding
function showScreen(name) {
  if (name === "route" || name === "exercises") return;
  speech.stop();
  currentActivitySpeechSegments = [];
  currentExercise = null;
  $("session-view").classList.add("hidden");
  $("app-shell").classList.remove("session-active");
  if (name === "theory") {
    $("theory-detail").classList.add("hidden");
    $("theory-level-list").classList.remove("hidden");
  }
  if (name === "exercises") {
    $("exercise-choice-panel").classList.remove("hidden");
    $("review-exercises").classList.add("hidden");
    selectedExerciseMode = "practice";
    document.querySelectorAll("[data-mode]").forEach(item => item.classList.toggle("selected", item.dataset.mode === "practice"));
    $("screen-exercises").classList.remove("review-selected");
    $("setup-panel").classList.add("hidden");
    $("practice-toggle")?.setAttribute("aria-expanded","false");
    $("start-session").textContent = "Comenzar entrenamiento";
    $("topic").disabled = false;
    $("topic").value = "daily";
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
  $("session-mode-label").textContent = mode === "route" ? "Ruta" : mode === "review" ? "Repaso" : mode === "reading" ? "Comprensión lectora" : "Entrenamiento";
  window.scrollTo(0, 0);
}
function closeSessionAndReturn() {
  sessionAbortController?.abort();
  sessionAbortController = null;
  if (reviewMode && !sessionFinished) persistReviewQueue();
  speech.stop();
  session = null;
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
  currentActivitySpeechSegments = [];
  $("lesson-panel").classList.remove("hidden");
  $("summary-panel").classList.add("hidden");
  $("session-view").classList.add("hidden");
  $("app-shell").classList.remove("session-active");
  $("exercise-choice-panel").classList.remove("hidden");
  $("review-exercises").classList.add("hidden");
  const returnScreen = "theory";
  routeMode = false;
  showScreen(returnScreen);
}

 $("nav-language-button")?.addEventListener("click", () => $("language-picker").showModal());
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
  $("topic").disabled = selectedExerciseMode === "reading";
  $("topic").value = selectedExerciseMode === "reading" ? "reading" : "daily";
  $("start-session").textContent = selectedExerciseMode === "reading" ? "Comenzar lectura" : "Comenzar entrenamiento";
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
    ["Pronombres y ser/estar", "Los pronombres permiten identificar quién habla. Se presentan junto con las formas más frecuentes para decir quién eres o cómo estás, adaptadas al idioma."],
    ["Artículos y concordancia", ""],
    ["Artículos y adjetivos", ""],
    ["Presente habitual", ""],
    ["Pasado (passato prossimo)", ""],
    ["Futuro simple", ""],
    ["Cantidades y artículos", ""],
    ["Preposiciones de lugar", ""]
  ]],
  vocabulary: ["Vocabulario", [
    ["Países e idiomas", ""],
    ["Familia", ""],
    ["Profesiones", ""],
    ["Rutinas y lugares", ""],
    ["Días y fechas", ""],
    ["Comida y productos", ""],
    ["Ciudad y transporte", ""]
  ]],
  expressions: ["Expresiones", [
    ["Saludos y despedidas", "Fórmulas frecuentes para iniciar y cerrar un contacto, con opciones de cortesía según la situación."],
    ["Decir el nombre", "Formas sencillas para decir tu nombre y responder cuando alguien se presenta."],
    ["Cómo estás", "Intercambios breves para preguntar por el estado de otra persona y responder."],
    ["Edad y procedencia", ""],
    ["Rutinas diarias", ""],
    ["La hora", ""],
    ["Pedir en un café", ""],
    ["Precios y pagos", ""],
    ["Ubicación e indicaciones", ""],
    ["Ayuda y necesidades", ""]
  ]]
};
const theoryUnits=[
  {title:"Primeros contactos",categories:{expressions:[0,1,2],grammar:[0]}},
  {title:"Datos personales y entorno",categories:{vocabulary:[0],grammar:[1,2],expressions:[3]}},
  {title:"Rutinas y tiempo",categories:{vocabulary:[1,2,3,4],grammar:[3,4,5],expressions:[4,5]}},
  {title:"Comida y compras",categories:{vocabulary:[5],expressions:[6,7]}},
  {title:"Viajes y orientación",categories:{vocabulary:[6],grammar:[7],expressions:[8,9]}},
  {title:"Números y cantidades",categories:{grammar:[6]}}
];
const theoryCategoryLabels={grammar:"Gramática",vocabulary:"Vocabulario",expressions:"Expresiones"};
function formatItalianTheoryTitle(value) {
  const translations = {
    "essere":"ser",
    "stare":"estar",
    "passato prossimo":"pretérito perfecto compuesto",
    "parlare":"hablar",
    "andare":"ir",
    "paesi e nazionalità":"países y nacionalidades",
    "aggettivi qualificativi":"adjetivos calificativos",
    "articoli determinativi":"artículos definidos",
    "articoli indeterminativi":"artículos indefinidos",
    "accordo in genere e numero":"concordancia de género y número",
    "età e provenienza":"edad y procedencia",
    "nazionalità":"nacionalidad",
    "provenienza":"procedencia",
    "lingue":"idiomas",
    "paesi":"países",
    "aggettivi":"adjetivos"
  };
  const terms = Object.keys(translations).sort((a,b) => b.length - a.length).join("|");
  return String(value).replace(new RegExp("(" + terms + ")","gi"), match => {
    const translation = translations[match.toLowerCase()];
    const label = match.charAt(0).toUpperCase() + match.slice(1);
    return '«<em>' + label + '</em>» (' + translation + ')';
  });
}
function renderItalianAppliedTopic(category, index, locale) {
  const renderLines = value => String(value).split("<br>").map(part => escapeHTML(part)).join("<br>");
  const renderSpokenVariants = value => String(value).replace(/<br\s*\/?>/gi, " / ").split(/\s*(\/|–|—|-)\s*/).filter((part, i) => i % 2 === 0).map(part => {
    const phrase = part.trim();
    if (!phrase) return "";
    return '<span class="theory-speech-variant"><strong class="theory-target-word">' + escapeHTML(phrase) + '</strong> ' + speakerButton(phrase, locale) + '</span>';
  }).filter(Boolean).join('<span class="theory-variant-separator"> / </span>');
  const rows = items => items.map(([term, meaning, note = ""]) =>
    '<tr><td>' + renderSpokenVariants(term) + '</td><td>' + renderLines(meaning) + '</td>' + (note ? '<td>' + escapeHTML(note) + '</td>' : '') + '</tr>'
  ).join("");
  if (category === "Gramática" && index === 0) {
    const pronouns = [["io","yo"],["tu","tú"],["lui / lei","él / ella"],["Lei","usted (formal)"],["noi","nosotros/as"],["voi","ustedes"],["loro","ellos/as"]];
    const verbs = [["io","sono","sto"],["tu","sei","stai"],["lui / lei","è","sta"],["Lei","è","sta"],["noi","siamo","stiamo"],["voi","siete","state"],["loro","sono","stanno"]];
    return '<p class="theory-slide-text">Los pronombres indican quién realiza la acción. «<em>Essere</em>» expresa identidad y características; «<em>stare</em>» expresa estado o condición. Observa cada elemento por separado:</p>' +
      '<h3>Pronombres personales</h3><table class="theory-pronoun-table theory-bilingual-table"><thead><tr><th>Italiano</th><th>Español</th></tr></thead><tbody>' +
      pronouns.map(([term,meaning]) => '<tr><td><strong class="theory-target-word">' + term + '</strong> ' + speakerButton(term,locale) + '</td><td>' + meaning + '</td></tr>').join("") +
      '</tbody></table><h3>Verbos essere y stare</h3><table class="theory-pronoun-table theory-bilingual-table theory-verb-comparison-table"><thead><tr><th>Persona</th><th>Essere</th><th>Stare</th></tr></thead><tbody>' +
      verbs.map(([person,essere,stare]) => '<tr><td>' + person + '</td><td>' + renderSpokenVariants(essere) + '</td><td>' + renderSpokenVariants(stare) + '</td></tr>').join("") +
      '</tbody></table>';
  }
  if (category === "Gramática" && index === 1) {
    const articleTable = (title, tableRows) =>
      '<h3>' + title + '</h3><table class="theory-pronoun-table theory-bilingual-table article-concordance-table"><thead><tr><th>Singular</th><th>Plural</th><th>Sustantivo / regla</th></tr></thead><tbody>' +
      tableRows.map(([singular, plural, rule]) => {
        const match = singular.match(/^(.*?) \((masculino|femenino)\)$/);
        const singularCell = match ? renderSpokenVariants(match[1]) + ' <span>(' + match[2] + ')</span>' : renderSpokenVariants(singular);
        return '<tr><td>' + singularCell + '</td><td>' + (plural === "—" ? "—" : renderSpokenVariants(plural)) + '</td><td>' + escapeHTML(rule) + '</td></tr>';
      }).join("") + '</tbody></table>';
    return '<p class="theory-slide-text">El artículo concuerda con el sustantivo en género y número.</p>' +
      articleTable("Artículos definidos", [
        ["il (masculino)", "i", "Consonante ordinaria"],
        ["lo (masculino)", "gli", "s seguida de consonante; z, gn, ps o x al inicio de palabra"],
        ["l’ (masculino)", "gli", "Vocal"],
        ["la (femenino)", "le", "Consonante"],
        ["l’ (femenino)", "le", "Vocal"]
      ]) +
      articleTable("Artículos indefinidos", [
        ["un (masculino)", "—", "Consonante ordinaria o vocal; sin apóstrofo"],
        ["uno (masculino)", "—", "s seguida de consonante; z, gn, ps o x al inicio de palabra"],
        ["una (femenino)", "—", "Consonante"],
        ["un’ (femenino)", "—", "Vocal"]
      ]);
  }
  if (category === "Gramática" && index === 2) {
    const adjectiveRules = [["-o","-a","-i (masculino) / -e (femenino)"],["-e","—","-i (masculino y femenino)"]];
    const adjectives = [["bello","bonito"],["buono","bueno"],["grande","grande"],["nuovo","nuevo"],["piccolo","pequeño"],["interessante","interesante"]];
    const examples = [["-o","Un ragazzo italiano.","Un chico italiano."],["-a","Una ragazza italiana.","Una chica italiana."],["-e → -i","Due ragazze interessanti.","Dos chicas interesantes."]];
    return '<p class="theory-slide-text">El adjetivo normalmente va después del sustantivo y concuerda con él en género y número.</p>' +
      '<h3>Formación de adjetivos</h3><table class="theory-pronoun-table theory-bilingual-table adjective-rules-table"><thead><tr><th>Terminación</th><th>Femenino</th><th>Plural</th></tr></thead><tbody>' +
      adjectiveRules.map(([ending,feminine,plural]) => '<tr><td><strong>' + ending + '</strong></td><td>' + feminine + '</td><td>' + plural + '</td></tr>').join("") +
      '</tbody></table><h3>Adjetivos frecuentes</h3><table class="theory-pronoun-table theory-bilingual-table adjective-vocabulary-table"><thead><tr><th>Italiano</th><th>Español</th></tr></thead><tbody>' +
      adjectives.map(([word,meaning]) => '<tr><td><strong class="theory-target-word">' + word + '</strong> ' + speakerButton(word,locale) + '</td><td>' + meaning + '</td></tr>').join("") +
      '</tbody></table><section class="theory-example adjective-example-block"><h3>Ejemplos</h3><table class="theory-pronoun-table theory-bilingual-table adjective-examples-table"><thead><tr><th>Terminación</th><th>Ejemplo aplicado</th></tr></thead><tbody>' +
      examples.map(([ending,phrase,translation]) => '<tr><td><strong>' + ending + '</strong></td><td><span class="theory-target-word">' + phrase + '</span> ' + speakerButton(phrase,locale) + '<p>' + translation + '</p></td></tr>').join("") +
      '</tbody></table></section>';
  }
  if (category === "Vocabulario" && index === 0) {
    const countries = [
      ["Italia","Italia","italiano / italiana","italiano / italiana","italiano","italiano"],
      ["Spagna","España","spagnolo / spagnola","español / española","spagnolo","español"],
      ["Francia","Francia","francese","francés / francesa","francese","francés"],
      ["Germania","Alemania","tedesco / tedesca","alemán / alemana","tedesco","alemán"],
      ["Cile","Chile","cileno / cilena","chileno / chilena","spagnolo","español"],
      ["Brasile","Brasil","brasiliano / brasiliana","brasileño / brasileña","portoghese","portugués"]
    ];
    const cell = (term,translation,asCountry=false) => '<td><strong class="theory-target-word">' + term.split(" / ").map(part => escapeHTML(part) + ' ' + speakerButton(part,locale)).join('<span class="theory-variant-separator"> / </span>') + '</strong>' + (asCountry ? ' <span>(' + escapeHTML(translation) + ')</span>' : '<small>' + escapeHTML(translation) + '</small>') + '</td>';
    return '<table class="theory-pronoun-table theory-bilingual-table"><thead><tr><th>País</th><th>Gentilicio</th><th>Idioma</th></tr></thead><tbody>' +
      countries.map(([country,countryEs,nationality,nationalityEs,language,languageEs]) => '<tr>' + cell(country,countryEs,true) + cell(nationality,nationalityEs) + cell(language,languageEs) + '</tr>').join("") +
      '</tbody></table>';
  }
  if (category === "Expresiones" && index >= 0 && index <= 3) {
    const expressions = [
      [["Buongiorno /<br>Buonasera","Buenos días /<br>buenas tardes-noches"],["Ciao","Hola / chao"],["Arrivederci /<br>A presto","Adiós /<br>hasta pronto"]],
      [["Mi chiamo… /<br>Sono…","Me llamo… /<br>soy…"],["Come ti chiami? /<br>Come si chiama?","¿Cómo te llamas? /<br>¿Cómo se llama? (formal)"],["Piacere!","¡Mucho gusto!"]],
      [["Come stai? /<br>Come sta?","¿Cómo estás? /<br>¿Cómo está? (formal)"],["Sto bene, grazie.","Estoy bien, gracias."],["Così così.","Más o menos."],["Non c'è male.","No está mal."],["E tu? /<br>E Lei?","¿Y tú? /<br>¿Y usted?"]],
      [["Quanti anni hai? /<br>Quanti anni ha?","¿Cuántos años tienes? /<br>¿Cuántos años tiene?"],["Ho vent’anni.","Tengo veinte años."],["Di dove sei? /<br>Di dov’è?","¿De dónde eres? /<br>¿De dónde es?"],["Sono del Cile.","Soy de Chile."],["Sono cileno/a.","Soy chileno/a."]]
    ];
    const introductions = [
      "Saluda y despídete según el momento y la cercanía.",
      "Preséntate y pregunta el nombre de otra persona; usa la forma informal con alguien de confianza y la formal para mostrar cortesía.",
      "Pregunta por el estado de alguien y responde. «Come stai?» y «Come sta?» expresan el mismo mensaje en trato informal y formal.",
      "Para preguntar la edad se usa «avere» (tener); para preguntar el origen, «essere» (ser). Las formas con «Lei» son de cortesía."
    ];
    return '<p class="theory-slide-text">' + introductions[index] + '</p><table class="theory-pronoun-table theory-bilingual-table"><thead><tr><th>Italiano</th><th>Español</th></tr></thead><tbody>' + rows(expressions[index]) + '</tbody></table>';
  }
  return null;
}
let activeTheoryTopics = [];
let activeTheoryIndex = 0;
let activeTheoryCategory = "";
let activeTheoryUnit = null;
const theoryCategoryIcons = {
  grammar:'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 6.2C9.6 4.5 6.4 4.1 3 5.1v13.1c3.4-1 6.6-.6 9 1.1 2.4-1.7 5.6-2.1 9-1.1V5.1c-3.4-1-6.6-.6-9 1.1Z"/><path d="M12 6.4v12.8"/></svg>',
  vocabulary:'<span class="vocabulary-abc-glyph" aria-hidden="true">abc</span>',
  expressions:'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5.5h11a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H9l-4.5 3v-3.2A3 3 0 0 1 2 12.5v-4a3 3 0 0 1 2-3Z"/><path d="M10 5.5v-1A2.5 2.5 0 0 1 12.5 2h6A2.5 2.5 0 0 1 21 4.5v6a2.5 2.5 0 0 1-2.5 2.5H18"/></svg>'
};

function openTheoryTopic(index) {
  if (!activeTheoryTopics.length) return;
  activeTheoryIndex = Math.max(0, Math.min(index, activeTheoryTopics.length - 1));
  const [title, body, sourceIndex = activeTheoryIndex, categoryKey] = activeTheoryTopics[activeTheoryIndex];
  activeTheoryCategory = theoryCategoryLabels[categoryKey] || categoryKey || "";
  const locale = getSelectedCatalog()?.locale || "it-IT";
  let detailMarkup = "";
  if (activeTheoryUnit < 2) {
    detailMarkup = renderItalianAppliedTopic(activeTheoryCategory, sourceIndex, locale) ||
      (body ? '<p class="theory-slide-text">' + escapeHTML(body) + '</p>' : "");
  }
  detailMarkup = detailMarkup.replace(/<h3>([\s\S]*?)<\/h3>/g, (_, heading) => '<h3>' + formatItalianTheoryTitle(heading) + '</h3>');
  $("theory-title").innerHTML = formatItalianTheoryTitle(title);
  const categoryIcon = theoryCategoryIcons[activeTheoryTopics[activeTheoryIndex]?.[3]] || "";
  $("theory-category").innerHTML = '<span class="theory-category-icon" aria-hidden="true">' + categoryIcon + '</span><span>' + escapeHTML(activeTheoryCategory) + '</span>';
  $("theory-breadcrumb").textContent = "A1 · Principiante > " + (theoryUnits[activeTheoryUnit]?.title || "");
  $("theory-breadcrumb").classList.remove("hidden");
  $("theory-description").innerHTML = detailMarkup;
  bindSpeakerButtons($("theory-description"));
  bindTheoryTargetText($("theory-description"));
  speech.stop();
  $("theory-counter").textContent = (activeTheoryIndex + 1) + "/" + activeTheoryTopics.length;
  $("theory-counter").classList.remove("hidden");
  $("theory-level-list").classList.add("hidden");
  $("screen-theory").classList.add("is-theory-detail-open");
  $("theory-detail").classList.remove("hidden");
  $("theory-prev").disabled = activeTheoryIndex === 0;
  $("theory-next").disabled = activeTheoryIndex === activeTheoryTopics.length - 1;
}

let expandedTheoryUnit = null;

function populateTheoryTopics(unitIndex) {
  activeTheoryUnit = Number(unitIndex);
  const unit = theoryUnits[activeTheoryUnit];
  activeTheoryTopics = Object.entries(unit.categories).flatMap(([key, indices]) =>
    indices.map(i => {
      const item = theoryContent[key][1][i];
      return [item[0], item[1], i, key];
    })
  );
}

function populateTheoryUnits() {
  const tree = $("theory-tree");
  tree.innerHTML = theoryUnits.map((unit, unitIndex) => {
    const expanded = expandedTheoryUnit === unitIndex;
    const branches = expanded
      ? Object.entries(unit.categories).flatMap(([key, indices]) =>
          indices.map(sourceIndex => {
            const item = theoryContent[key][1][sourceIndex];
            return { key, sourceIndex, title: item[0] };
          })
        ).map((topic, topicIndex, topics) =>
          '<button class="theory-tree-topic" type="button" data-unit-index="' + unitIndex +
          '" data-category="' + topic.key + '" data-theory-topic="' + topic.sourceIndex + '">' +
          '<span class="theory-topic-completion-slot" aria-hidden="true"></span>' +
          '<span class="theory-category-icon theory-tree-category-icon" aria-hidden="true">' + theoryCategoryIcons[topic.key] + '</span>' +
          '<span class="theory-tree-topic-name">' + escapeHTML(topic.title) + '</span></button>'
        ).join("")
      : "";
    return '<section class="theory-tree-unit' + (expanded ? ' is-expanded' : '') + '">' +
      '<button class="theory-unit-row" type="button" data-unit-index="' + unitIndex +
      '" aria-expanded="' + String(expanded) + '">' +
      '<span class="theory-unit-number" style="color:#263e59!important;-webkit-text-fill-color:#263e59">' + (unitIndex + 1) + '.</span>' +
      '<span class="theory-unit-name" style="color:#315b85!important;-webkit-text-fill-color:#315b85">' + escapeHTML(unit.title) + '</span>' +
      '<span class="theory-unit-chevron" aria-hidden="true">' + (expanded ? '⌄' : '›') + '</span>' +
      '</button>' +
      (expanded ? '<div class="theory-tree-branches">' + branches + '</div>' : '') +
      '</section>';
  }).join("");

  tree.querySelectorAll(".theory-unit-row").forEach(button => {
    button.addEventListener("click", () => {
      const unitIndex = Number(button.dataset.unitIndex);
      expandedTheoryUnit = expandedTheoryUnit === unitIndex ? null : unitIndex;
      if (expandedTheoryUnit === null) {
        activeTheoryUnit = null;
        activeTheoryTopics = [];
      } else {
        populateTheoryTopics(expandedTheoryUnit);
      }
      populateTheoryUnits();
    });
  });

  tree.querySelectorAll(".theory-tree-topic").forEach(button => {
    button.addEventListener("click", () => {
      const unitIndex = Number(button.dataset.unitIndex);
      const categoryKey = button.dataset.category;
      const sourceIndex = Number(button.dataset.theoryTopic);
      populateTheoryTopics(unitIndex);
      const topicIndex = activeTheoryTopics.findIndex(topic => topic[2] === sourceIndex && topic[3] === categoryKey);
      if (topicIndex < 0) return;
      activeTheoryCategory = theoryCategoryLabels[categoryKey] || categoryKey;
      openTheoryTopic(topicIndex);
    });
  });
}
$("theory-audio-toggle").addEventListener("click", toggleAudio);
$("theory-back").addEventListener("click", () => {
  speech.stop();
  $("theory-detail").classList.add("hidden");
  $("screen-theory").classList.remove("is-theory-detail-open");
  $("theory-level-list").classList.remove("hidden");
});
$("theory-prev").addEventListener("click", () => openTheoryTopic(activeTheoryIndex - 1));
$("theory-next").addEventListener("click", () => openTheoryTopic(activeTheoryIndex + 1));
populateTheoryUnits();
$("variant-close").addEventListener("click", () => $("variant-dialog").close());
function persistSettings() {
  const savedSettings = {
    selectedLanguage: $("language").value,
    duration: $("duration").value,
    level: $("level").value,
    topic: $("topic").value,
  };
  localStorage.setItem("adaptive-language-tutor.settings", JSON.stringify(savedSettings));
}
$("welcome-start").addEventListener("click", () => {
  if ($("language").value && localStorage.getItem("adaptive-language-tutor.settings")) {
    $("welcome-screen").classList.add("hidden");
    $("app-shell").classList.remove("hidden");
    showScreen("theory");
  } else {
    $("app-shell").classList.add("hidden");
    $("language-picker").showModal();
  }
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
  try { persistSettings(); } catch {}
  updateLanguageFlag();
  $("language-picker").close();
  $("welcome-screen").classList.add("hidden");
  $("app-shell").classList.remove("hidden");
  showScreen("theory");
  refreshDashboard();
}));

