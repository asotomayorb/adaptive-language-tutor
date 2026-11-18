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
  const label = document.getElementById("audio-status");
  toggles.forEach(toggle => {
    toggle.textContent = status.enabled ? "🔊" : "🔇";
    toggle.setAttribute("aria-pressed", String(status.enabled));
    toggle.setAttribute("aria-label", status.enabled ? "Desactivar audio" : "Activar audio");
    toggle.title = status.enabled ? "Audio activado" : "Audio desactivado";
    toggle.classList.toggle("audio-off", !status.enabled);
  });
  if (label) {
    label.textContent = !status.supported
      ? "Este navegador no ofrece lectura de voz; puedes continuar practicando por escrito."
      : status.fallback
        ? "No hay una voz instalada para " + status.locale + "; se usará la voz predeterminada del dispositivo."
        : status.error ? "La voz seleccionada no pudo reproducir este fragmento." : "";
  }
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
  if (/_{2,}/.test(sentence)) {
    return { text: sentence.replace(/_{2,}/g, "…").replace(/[“”]/g, "").trim(), locale: catalog?.locale || "und" };
  }
  return { text: prompt, locale: "es-CL" };
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
    $("route-resume").classList.toggle("hidden", !routeDraft?.session);
    let completed = false;
    try { completed = Boolean(selectedCatalog && localStorage.getItem("adaptive-language-tutor.route-completed:" + selectedCatalog.id) === "true"); } catch {}
    const routeAvailable = Boolean(selectedCatalog?.exercises?.length || aiConfigured);
    $("route-start").textContent = completed ? "Unidad completada" : routeAvailable ? "Comenzar unidad" : "Ruta en preparación";
    $("route-start").disabled = Boolean(completed || !routeAvailable);
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
let reviewProgressDraft = null;
let aiConfigured = false;
let aiReady = false;
let aiMode = false;
let aiHistory = [];
let aiLastResult = null;
let aiCurrentExercise = null;
let aiHintLevel = 0;
let aiHintPending = false;
let sessionFinished = false;
let selectedExerciseMode = "global";
let sessionAbortController = null;
let routeMode = false;
let routeIntegration = false;
let routeIntegrationAttempts = 0;
let routeDraft = null;
const ROUTE_STORAGE_KEY = "adaptive-language-tutor.route-progress";
function getRouteDraftForLanguage(languageId) {
  if (!languageId) return null;
  try { return JSON.parse(localStorage.getItem(ROUTE_STORAGE_KEY + ":" + languageId) || "null"); }
  catch { return null; }
}

function refreshDashboard() {
  const languageId = getSelectedCatalog()?.id;
  const stats = getProgressStats(progress, languageId);
  const due = getDueCards(progress, Date.now(), languageId).filter(card => card.cardType !== "pattern");
  const progressDashboard = $("progress-dashboard");
  if (progressDashboard) progressDashboard.replaceChildren();
  const reviewCount = $("review-count");
  if (reviewCount) reviewCount.textContent = String(due.length);
  const reviewDashboard = $("review-dashboard");
  if (reviewDashboard) reviewDashboard.innerHTML = due.length
    ? "<strong>" + due.length + " errores pendientes.</strong><p>Este apartado contiene únicamente respuestas incorrectas registradas en sesiones anteriores.</p>"
    : "No tienes repasos pendientes. Los errores que cometas durante las sesiones aparecerán aquí.";
  const statsContent = $("statistics-content");
  if (statsContent) {
    const sessions = progress.sessions.filter(item => !languageId || item.languageId === languageId).slice(-8);
    const bars = sessions.map((item, index) => '<div class="progress-bar-column"><span>' + item.accuracy + '%</span><i style="height:' + Math.max(5, item.accuracy) + '%"></i><small>' + (index + 1) + '</small></div>').join("");
    statsContent.innerHTML =
      '<div class="stat-card"><span>Sesiones completadas</span><strong>' + stats.sessions + '</strong></div>' +
      '<div class="stat-card"><span>Palabras aprendidas</span><strong>' + stats.vocabulary + '</strong></div>' +
      '<div class="stat-card"><span>Precisión media</span><strong>' + stats.averageAccuracy + '%</strong></div>' +
      '<div class="stat-card"><span>Repasos pendientes</span><strong>' + due.length + '</strong></div>' +
      '<section class="progress-chart-card"><h2>Avance por sesión</h2>' +
      (bars ? '<div class="progress-chart" role="img" aria-label="Precisión de las últimas sesiones">' + bars + '</div><p>Precisión de cada sesión completada</p>' : '<p class="empty-chart">Completa tu primera sesión para ver aquí tu evolución.</p>') +
      '</section>';
  }
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
if (routeDraft?.session) $("route-resume").classList.remove("hidden");
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
});

function startSpacedReview() {
  speech.stop();
  catalog = getSelectedCatalog();
  if (!catalog) { $("ai-status").textContent = "Selecciona un idioma del mosaico."; return; }
  dueReviewCards = getDueCards(progress, Date.now(), catalog.id).filter(card => card.cardType !== "pattern");
  reviewProgressDraft = JSON.parse(JSON.stringify(progress));
  reviewIndex = 0;
  if (!dueReviewCards.length) { reviewProgressDraft = null; refreshDashboard(); return; }
  sessionFinished = false;
  showSessionView("review");
  $("summary-panel").classList.add("hidden");
  $("lesson-panel").classList.remove("hidden");
  $("session-status").textContent = "Repaso programado";
  reviewMode = true;
  aiMode = false;
  $("stats").hidden = true;
  $("hint-btn").hidden = true;
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
  $("lesson-phase").textContent = "REPETICIÓN ESPACIADA";
  $("turn-count").textContent = "Tarjeta " + (reviewIndex + 1) + " / " + dueReviewCards.length;
  $("progress-bar").style.width = (reviewIndex / dueReviewCards.length * 100) + "%";
  $("feedback").classList.add("hidden");

  if (card.cardType === "pattern") {
    $("lesson-content").innerHTML = '<p class="eyebrow">REPASO DE PATRÓN</p><h3>' + escapeHTML(card.pattern) + '</h3><p>Intenta recordar una frase propia que aplique este patrón. Este repaso no consume turnos de práctica.</p>';
    $("answer-area").innerHTML = '<p class="muted">¿Pudiste recordar y aplicar el patrón?</p><button id="pattern-recalled" class="primary" type="button">Lo recordé</button><button id="pattern-practice" class="secondary" type="button">Necesito practicarlo</button>';
    const gradePattern = recalled => {
      const result = gradeReview(reviewProgressDraft || progress, card.key, recalled);
      showFeedback(recalled
        ? "Registrado. Próximo repaso en " + (result?.nextIntervalDays || 1) + " días."
        : "Registrado. Volverá a aparecer mañana; intenta crear una frase nueva con este patrón.", recalled);
      $("answer-area").innerHTML = '<button id="next-spaced" class="secondary" type="button">Siguiente →</button>';
      $("next-spaced").addEventListener("click", () => { reviewIndex += 1; renderSpacedReview(); });
    };
    $("pattern-recalled").addEventListener("click", () => gradePattern(true));
    $("pattern-practice").addEventListener("click", () => gradePattern(false));
    return;
  }

  $("lesson-content").innerHTML = '<p class="eyebrow">REPASO PROGRAMADO</p><h3>' + escapeHTML(exercise?.prompt || card.prompt || "") + '</h3><p>Escribe la respuesta sin mirar la solución. Este repaso no consume turnos de práctica.</p>';
  $("answer-area").innerHTML = '<input id="spaced-answer" class="answer-input" placeholder="Escribe tu respuesta…"><button id="check-spaced" class="primary" type="button">Comprobar respuesta</button>';
  $("check-spaced").addEventListener("click", () => {
    const answer = $("spaced-answer").value;
    const checkExercise = exercise || { target: expected, acceptedAnswers: [] };
    const correct = evaluateAnswer(answer, checkExercise);
    const result = gradeReview(reviewProgressDraft || progress, card.key, correct);
    const interval = result?.nextIntervalDays || 1;
    showFeedback(correct
      ? "Correcto. Próximo repaso en " + interval + " días."
      : "Respuesta de referencia: " + expected + ". " + (exercise?.explanation || card.explanation) + " La tarjeta volverá mañana.", correct);
    appendCatalogSpeech($("feedback"), exercise || { target: expected }, "explanationSpeechSegments", true);
    $("answer-area").innerHTML = '<button id="next-spaced" class="secondary" type="button">Siguiente →</button>';
    $("next-spaced").addEventListener("click", () => { reviewIndex += 1; renderSpacedReview(); });
  });
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
  $("session-status").textContent = aiConfigured ? "Tutor IA en sesión" : "Sesión local";
  showSessionView(selectedExerciseMode);
  if (aiConfigured) {
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
      userMessage: "Inicia directamente con una actividad concreta adecuada al nivel y tema seleccionados. No hagas diagnóstico, no estimes mi nivel ni hagas preguntas abiertas para evaluarlo. No presentes una prueba inicial. Explícame brevemente la tarea y espera mi respuesta."
    }, undefined, { signal: sessionAbortController?.signal });
    if (session !== activeSession || sessionAbortController?.signal.aborted) return;
    applyLearnerUpdate(session, result.learnerUpdate);
    renderAITutorTurn(result);
  } catch (error) {
    if (session === activeSession && !sessionAbortController?.signal.aborted) showAITutorError(error, null);
  }
}

function renderAITutorTurn(result) {
  speech.stop();
  aiLastResult = result;
  aiCurrentExercise = result.exercise || {};
  aiHintLevel = 0;
  aiHintPending = false;
  $("hint-btn").disabled = false;
  $("hint-btn").textContent = "Pista";
  $("lesson-phase").textContent = routeMode && routeIntegration ? "HITO INTEGRADOR" : "TUTOR IA · CONVERSACIÓN";
  $("turn-count").textContent = routeMode && routeIntegration
    ? "Actividad integradora"
    : "Pregunta " + Math.min(session.turn + 1, session.config.duration) + " / " + session.config.duration;
  $("progress-bar").style.width = (session.turn / session.config.duration * 100) + "%";
  $("streak").textContent = session.streak;
  $("word-count").textContent = session.vocabulary.length;
  $("error-count").textContent = session.errors.length;

  const message = '<p>' + renderVariantTerms(result.message || "") + '</p>';
  const prompt = aiCurrentExercise.prompt
    ? '<h3>' + renderVariantTerms(aiCurrentExercise.prompt) + '</h3>'
    : '<p class="muted">Responde libremente para continuar la conversación.</p>';
  const speechSegments = (result.speechSegments || []).filter(item =>
    item && typeof item.text === "string" && item.text.trim() &&
    typeof item.locale === "string" && item.locale.trim()
  );
  const speechMarkup = speechSegments.length
    ? '<div class="ai-speech-segments">' + speechSegments.map(item =>
        '<span class="vocabulary-item">' + escapeHTML(item.text) + speakerButton(item.text, item.locale) + '</span>'
      ).join("") + '</div>'
    : "";
  const promptAudio = aiCurrentExercise.prompt
    ? speakerButton(aiCurrentExercise.prompt, session.config.languageLocale || session.config.languageId)
    : "";
  $("lesson-content").innerHTML = message + prompt + promptAudio + speechMarkup;
  bindSpeakerButtons($("lesson-content"));
  bindVariantLinks($("lesson-content"));
  speech.speakSequence(speechSegments, { automatic: true });
  $("feedback").classList.add("hidden");
  $("hint-btn").hidden = false;
  $("review-btn").hidden = true;

  if (result.nextAction === "finish" || session.turn >= session.config.duration) {
    $("answer-area").innerHTML = '<button id="finish-ai-session" class="primary" type="button">Ver resumen →</button>';
    $("finish-ai-session").addEventListener("click", finishSession);
    return;
  }

  if (session.turn < 3) {
    const options = Array.isArray(aiCurrentExercise.options) ? aiCurrentExercise.options : [];
    $("answer-area").innerHTML = options.length >= 2
      ? options.map((option,index) => '<button class="answer-option ai-answer-option" type="button" data-ai-choice="' + index + '">' + escapeHTML(option) + '</button>').join("")
      : '<p class="muted">El tutor está preparando las alternativas. Reintenta para continuar.</p><button id="retry-ai-options" class="secondary" type="button">Reintentar</button>';
    $("answer-area").querySelectorAll("[data-ai-choice]").forEach(button => button.addEventListener("click", () => submitAITutorAnswer(options[Number(button.dataset.aiChoice)])));
    $("retry-ai-options")?.addEventListener("click", () => startAITutorSession(session.config));
  } else {
    $("answer-area").innerHTML =
      '<input id="ai-answer" class="answer-input" placeholder="Escribe tu respuesta…" autocomplete="off">' +
      '<button id="submit-ai-answer" class="primary" type="button">Enviar respuesta →</button>';
    $("submit-ai-answer").addEventListener("click", () => submitAITutorAnswer($("ai-answer").value));
    $("ai-answer").addEventListener("keydown", event => {
      if (event.key === "Enter") submitAITutorAnswer($("ai-answer").value);
    });
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
  if (submitButton) submitButton.disabled = true;
  if (answerInput) answerInput.disabled = true;
  $("answer-area").querySelectorAll("[data-ai-choice]").forEach(button => { button.disabled = true; });
  try {
    const evaluatedExercise = aiCurrentExercise;
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
      userMessage: cleanAnswer + (routeMode && session.turn + 1 === 10
        ? " Esta respuesta completa la comprobación de dominio de diez preguntas. La siguiente actividad debe ser una tarea integradora escrita que combine el tema completo; no incluyas alternativas."
        : session.turn + 1 < 3
          ? " La próxima actividad debe ser una pregunta de selección múltiple con tres alternativas plausibles en exercise.options."
          : " Desde ahora la próxima actividad debe requerir que escriba la respuesta, sin alternativas.")
    }, undefined, { signal: sessionAbortController?.signal });
    if (session !== activeSession || sessionAbortController?.signal.aborted) return;
    aiHistory = [
      ...conversationHistory,
      { role: "user", content: cleanAnswer }
    ];
    applyLearnerUpdate(session, result.learnerUpdate);
    const evaluation = result.evaluation || {};
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
    showAnswerFeedback({
      correct: evaluation.status === "correct",
      expected: evaluatedExercise.expectedAnswer || "",
      explanation: evaluation.status === "correct" ? "" : evaluation.feedback || "Revisa la estructura y vuelve a intentarlo.",
      selected: cleanAnswer,
      options: evaluatedExercise.options || [],
      correctOption: evaluatedExercise.expectedAnswer || ""
    });
    $("streak").textContent = session.streak;
    $("word-count").textContent = session.vocabulary.length;
    $("error-count").textContent = session.errors.length;
    if (routeMode) saveRouteDraft();
  } catch (error) {
    if (session === activeSession && !sessionAbortController?.signal.aborted) showAITutorError(error, cleanAnswer);
  }
}

async function requestAdaptiveHint() {
  if (aiHintPending || !session || !aiLastResult) return;
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
    aiHintLevel += 1;
    showFeedback("Pista adicional: " + hint.trim(), true);
    const segments = (result.speechSegments || []).filter(item =>
      item && typeof item.text === "string" && item.text.trim() &&
      item.locale === (session.config.languageLocale || session.config.languageId)
    );
    appendSpeechButtons($("feedback"), segments);
    speech.speakSequence(segments, { automatic: true });
    button.textContent = "Pedir otra pista";
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
    failed: session.turn >= 10 && !routeIntegration && session.correct < 8
  };
  try { localStorage.setItem(ROUTE_STORAGE_KEY + ":" + session.config.languageId, JSON.stringify(routeDraft)); } catch {}
  $("route-resume").classList.remove("hidden");
}
function startRouteSession(resume = false) {
  catalog = getSelectedCatalog();
  if (!catalog) return;
  routeDraft = getRouteDraftForLanguage(catalog.id);
  const useAI = !catalog.exercises.length;
  if (useAI && !aiConfigured) {
    $("route-start").textContent = "Ruta en preparación";
    return;
  }
  if (resume && routeDraft?.session && routeDraft.languageId === catalog.id) {
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
  } else {
    session = createSession({
      language:catalog.label, languageId:catalog.id, languageLocale:catalog.locale,
      duration:useAI ? 11 : 10, questionCount:useAI ? 11 : 10, level:"zero", topic:"daily", routeMode:true
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
  }
  routeMode = true;
  session.config.routeMode = true;
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
    const completedTurn = session.turn;
    session.turn = Math.max(0, completedTurn - 1);
    renderLesson();
    session.turn = completedTurn;
    showAnswerFeedback({
      correct: localPendingAnswer.correct, expected: localPendingAnswer.expected,
      explanation: localPendingAnswer.correct ? "" : localPendingAnswer.explanation,
      selected: localPendingAnswer.selected, options: localPendingAnswer.options || [],
      correctOption: localPendingAnswer.expected
    });
  } else if (session.turn >= 11) renderRouteAssessmentFailed();
  else if (routeIntegration && aiMode && aiLastResult) renderAITutorTurn(aiLastResult);
  else if (routeIntegration) renderRouteIntegration();
  else if (session.turn >= 10) renderRouteAssessmentFailed();
  else if (aiMode && aiLastResult) renderAITutorTurn(aiLastResult);
  else if (aiMode) startAITutorSession(session.config);
  else renderLesson();
}
function renderRouteIntegration() {
  speech.stop();
  const prompt = catalog.id === "en"
    ? "Introduce yourself in one short message: say hello, give your name and say where you are from."
    : "Preséntate en un solo mensaje: saluda, di tu nombre y de dónde eres.";
  const previous = pendingFeedback;
  pendingFeedback = null;
  currentExercise = {
    id:"route-integration-fundamentals", prompt,
    target: catalog.id === "en" ? "Hello, my name is Ana and I am from Chile." : "Olá, meu nome é Ana e sou do Chile.",
    acceptedAnswers: catalog.id === "en"
      ? ["Hello, I'm Ana and I'm from Chile.","Hi, my name is Ana. I am from Chile."]
      : ["Olá! Eu me chamo Ana e sou do Chile.","Oi, meu nome é Ana. Eu sou do Chile."],
    explanation:"La actividad integra saludo, presentación y procedencia."
  };
  $("lesson-phase").textContent = "HITO INTEGRADOR";
  $("turn-count").textContent = "Actividad final";
  $("progress-bar").style.width = "100%";
  $("lesson-content").innerHTML = (previous ? '<div class="feedback-note"><span>Respuesta anterior</span><p>' + renderVariantTerms(previous.text) + '</p><p class="model-answer">Respuesta modelo: ' + renderVariantTerms(previous.expected) + ' ' + speakerButton(previous.expected, catalog.locale) + '</p></div>' : '') + '<p class="eyebrow">UNIDAD 01 · FUNDAMENTOS</p><h3>' + escapeHTML(prompt) + '</h3><p>Combina lo practicado en los diez ejercicios anteriores.</p>';
  bindSpeakerButtons($("lesson-content"));
  $("answer-area").innerHTML = '<textarea id="route-integration-answer" class="answer-input" rows="3" placeholder="Escribe tu presentación…"></textarea><button id="route-integration-submit" class="primary" type="button">Comprobar actividad</button>';
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
      saveRouteDraft();
      $("lesson-content").innerHTML = '<div class="feedback-note"><span>Actividad integradora</span><p>La presentación todavía necesita ajustes. Incluye saludo, nombre y procedencia; puedes volver a intentarlo.</p></div><h3>' + escapeHTML(prompt) + '</h3>';
      $("route-integration-answer").value = answer;
    }
  });
}
function renderRouteAssessmentFailed() {
  pendingFeedback = null;
  saveRouteDraft();
  $("lesson-phase").textContent = "REFUERZO NECESARIO";
  $("turn-count").textContent = session.correct + " / 10 correctas";
  $("progress-bar").style.width = "100%";
  const integrationFailed = routeIntegration && session.turn >= 11;
  $("lesson-content").innerHTML = '<div class="feedback-note"><span>' + (integrationFailed ? "Actividad integradora pendiente" : "Unidad aún no superada") + '</span><p>' +
    (integrationFailed ? "La actividad integradora necesita otra oportunidad. Repite la unidad para consolidar el contenido." : "Necesitas al menos 8 respuestas correctas de 10. Tu resultado fue " + session.correct + "/10. Puedes repetir la comprobación.") +
    '</p></div>';
  $("answer-area").innerHTML = '<button id="route-retry" class="primary" type="button">Repetir la unidad</button>';
  $("route-retry").addEventListener("click", () => {
    const useAI = !catalog.exercises.length;
    session = createSession({ ...session.config, duration:useAI ? 11 : 10, questionCount:useAI ? 11 : 10 });
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
  const exercises = getTopicExercises();
  const adaptation = getAdaptation(session);
  let candidates = exercises.filter(exercise => !session.answers.some(answer => answer.exerciseId === exercise.id));
  if (!candidates.length) candidates = exercises;
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
  return candidates[session.turn % candidates.length];
}

function levelLabel(level) {
  return ({zero:"principiante",basic:"intermedio",intermediate:"intermedio",advanced:"avanzado"})[level] || "intermedio";
}

function renderLesson() {
  if (session.turn >= session.config.duration) { finishSession(); return; }
  reviewMode = false;
  currentExercise = chooseExercise();
  const adaptation = getAdaptation(session);
  $("lesson-phase").textContent = "CONVERSACIÓN GUIADA";
  $("turn-count").textContent = "Pregunta " + (session.turn + 1) + " / " + session.config.duration;
  $("progress-bar").style.width = (session.turn / session.config.duration * 100) + "%";
  $("streak").textContent = session.streak;
  $("word-count").textContent = session.vocabulary.length;
  $("error-count").textContent = session.errors.length;
  pendingFeedback = null;
  const questionSpeech = getExerciseSpeech(currentExercise);
  $("lesson-content").innerHTML = '<p class="eyebrow">TEMA: ' + escapeHTML(topicLabels[session.config.topic].toUpperCase()) + ' · NIVEL ' + escapeHTML(levelLabel(session.config.level).toUpperCase()) + '</p><h3>' + renderVariantTerms(currentExercise.prompt) + '</h3>' +
    speakerButton(questionSpeech.text, questionSpeech.locale);
  bindVariantLinks($("lesson-content"));
  bindSpeakerButtons($("lesson-content"));
  speech.stop();
  autoSpeak(questionSpeech.text, questionSpeech.locale);
  if (session.turn < 3) {
    const options = currentExercise.options || [];
    $("answer-area").innerHTML = options.map((option,index) => '<div class="answer-option-row"><button class="answer-option" data-choice="' + index + '">' + escapeHTML(option) + '</button>' + speakerButton(option, catalog.locale) + '</div>').join("");
    $("answer-area").querySelectorAll("[data-choice]").forEach(button => button.addEventListener("click", () => submitAnswer(options[Number(button.dataset.choice)])));
    bindSpeakerButtons($("answer-area"));
  } else {
    $("answer-area").innerHTML = '<input id="free-answer" class="answer-input" placeholder="Escribe tu respuesta…" autocomplete="off"><button id="submit-free" class="primary" type="button">Enviar respuesta →</button>';
    $("submit-free").addEventListener("click", () => submitAnswer($("free-answer").value));
    $("free-answer").addEventListener("keydown", event => { if (event.key === "Enter") submitAnswer($("free-answer").value); });
  }
  $("feedback").classList.add("hidden");
  $("hint-btn").disabled = false;
  $("hint-btn").hidden = false;
  $("review-btn").hidden = false;
}

function submitAnswer(answer) {
  const result = recordAnswer(session, currentExercise, answer);
  localPendingAnswer = {
    correct: result.correct, expected: currentExercise.target,
    explanation: currentExercise.explanation || "", selected: String(answer || ""),
    exercise: currentExercise, options: currentExercise.options || []
  };
  updateStats();
  showAnswerFeedback({
    correct: result.correct, expected: currentExercise.target,
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
function showAnswerFeedback({ correct, expected, explanation, selected, options = [], correctOption }) {
  const expectedText = expected ? '<p class="answer-correct-text">Respuesta correcta: ' + renderVariantTerms(expected) + ' ' + speakerButton(expected, session?.config.languageLocale || catalog?.locale) + '</p>' : "";
  const explanationText = !correct && explanation ? '<p class="answer-explanation">' + renderVariantTerms(explanation) + '</p>' : "";
  $("feedback").innerHTML = (correct ? '<p class="answer-status correct">Correcto</p>' : '<p class="answer-status incorrect">Incorrecto</p>') + expectedText + explanationText;
  $("feedback").classList.remove("hidden","bad");
  $("answer-area").querySelectorAll("[data-choice],[data-ai-choice]").forEach(button => {
    const value = button.textContent.trim().toLocaleLowerCase();
    const isCorrect = value === String(correctOption || expected || "").trim().toLocaleLowerCase();
    const isSelected = value === String(selected || "").trim().toLocaleLowerCase();
    button.classList.toggle("answer-correct", isCorrect);
    button.classList.toggle("answer-incorrect", !correct && isSelected && !isCorrect);
    button.disabled = true;
  });
  $("answer-area").querySelectorAll("input").forEach(input => { input.disabled = true; });
  $("answer-area").querySelectorAll("button:not([data-choice]):not([data-ai-choice]):not([data-speak])").forEach(button => { button.disabled = true; });
  $("answer-area").insertAdjacentHTML("beforeend", '<button id="continue-answer" class="primary answer-continue" type="button">Continuar →</button>');
  bindSpeakerButtons($("feedback"));
  $("continue-answer").addEventListener("click", continueAfterAnswer);
}
function continueAfterAnswer() {
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
    if (routeMode && session.turn === 10 && !routeIntegration) {
      if (session.correct < 8) { renderRouteAssessmentFailed(); return; }
      routeIntegration = true;
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
    if (session.turn >= 10) {
      if (session.correct >= 8) {
        routeIntegration = true;
        saveRouteDraft();
        renderRouteIntegration();
      } else renderRouteAssessmentFailed();
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
  if (aiMode) {
    if (aiHintLevel === 0 && aiCurrentExercise?.hint) {
      aiHintLevel = 1;
      showFeedback("Pista: " + aiCurrentExercise.hint, true);
      const hintSegments = (aiLastResult?.speechSegments || []).filter(item =>
        item && typeof item.text === "string" && item.text.trim() &&
        item.locale === (session.config.languageLocale || session.config.languageId) &&
        aiCurrentExercise.hint.toLocaleLowerCase().includes(item.text.toLocaleLowerCase())
      );
      appendSpeechButtons($("feedback"), hintSegments);
      speech.speakSequence(hintSegments, { automatic: true });
      $("hint-btn").textContent = "Pedir otra pista";
      return;
    }
    requestAdaptiveHint();
    return;
  }
  if (!currentExercise) return;
  showFeedback("Pista: " + currentExercise.hint, true);
  appendCatalogSpeech($("feedback"), currentExercise, "hintSpeechSegments");
});

$("review-btn").addEventListener("click", () => {
  const lastError = [...session.errors].reverse().find(error => error.exerciseId);
  if (!lastError) { showFeedback("Todavía no hay errores registrados para repasar.", true); return; }
  reviewExercise = catalog.exercises.find(exercise => exercise.id === lastError.exerciseId);
  if (!reviewExercise) return;
  reviewMode = true;
  $("lesson-phase").textContent = "REPASO";
  speech.stop();
  $("lesson-content").innerHTML = '<h3>Intenta reconstruir esta frase:</h3><p>' + escapeHTML(reviewExercise.prompt) + '</p><p>La respuesta se comprobará sin consumir un turno de la sesión.</p>';
  $("answer-area").innerHTML = '<input id="review-answer" class="answer-input" placeholder="Escribe tu respuesta…"><button class="primary" id="check-review" type="button">Comprobar repaso</button>';
  $("check-review").addEventListener("click", () => {
    const ok = evaluateAnswer($("review-answer").value, reviewExercise);
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
    try { localStorage.removeItem(ROUTE_STORAGE_KEY); } catch {}
    routeDraft = null;
    $("route-resume").classList.add("hidden");
    localStorage.setItem("adaptive-language-tutor.route-completed:" + session.config.languageId, "true");
    $("route-start").textContent = "Unidad completada";
    $("route-start").disabled = true;
  }
  speech.stop();
  $("lesson-panel").classList.add("hidden");
  $("summary-panel").classList.remove("hidden");
  $("session-status").textContent = "Sesión finalizada";
  const summary = buildSummary(session);
  const finalFeedback = pendingFeedback;
  pendingFeedback = null;
  persistSession(progress, session, summary);
  saveProgress(progress);
  refreshDashboard();
  const diagnosticText = "";
  const aiLevelText = aiMode && session.config.estimatedLevel
    ? '<li>Nivel estimado por el tutor IA: ' + escapeHTML(session.config.estimatedLevel) + '.</li>'
    : "";
  const focusItems = [...summary.recommendedFocus, ...(summary.reviewPatterns || [])];
  const focus = focusItems.length ? focusItems.map(escapeHTML).join("; ") : "Mantener la práctica y ampliar vocabulario.";
  const summaryLocale = session.config.languageLocale || session.config.languageId;
  const vocabularyText = summary.vocabulary.map(item =>
    escapeHTML(item.term) + speakerButton(item.term, summaryLocale) + " (" + escapeHTML(item.meaning) + ")"
  ).join(", ") || "ninguno";
  $("summary-content").innerHTML = (finalFeedback ? '<div class="feedback-note"><span>Última respuesta</span><p>' + escapeHTML(finalFeedback.text) + '</p><p class="model-answer">Respuesta modelo: ' + escapeHTML(finalFeedback.expected) + ' ' + speakerButton(finalFeedback.expected, summaryLocale) + '</p></div>' : '') + '<p class="intro">' + (session.config.routeMode ? "Completaste la unidad Fundamentos: diez preguntas de dominio y una actividad integradora." : "Completaste " + summary.turns + " preguntas de " + escapeHTML(session.config.language) + ".") + '</p><ul class="summary-list">' + diagnosticText + aiLevelText + '<li>Respuestas evaluadas como correctas: ' + summary.correct + '/' + summary.attempted + ' (' + summary.accuracy + '%).</li><li>Mejor racha: ' + summary.bestStreak + '.</li><li>Vocabulario aprendido: ' + vocabularyText + '.</li><li>Errores evaluados para reforzar: ' + summary.errors.length + '.</li><li>Focos y patrones recomendados: ' + focus + '.</li></ul>';
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
  }
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
  $("session-mode-label").textContent = mode === "review" ? "Repaso" : "Global";
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
  $("review-exercises").classList.toggle("hidden", selectedExerciseMode !== "review");
  $("topic").disabled = selectedExerciseMode === "review";
  if (selectedExerciseMode === "review") refreshDashboard();
}));
$("route-start-exercises")?.addEventListener("click", () => showScreen("exercises"));
$("route-start").addEventListener("click", () => startRouteSession(false));
$("route-resume").addEventListener("click", () => startRouteSession(true));
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
  if (activeTheoryCategory === "Gramática" && activeTheoryIndex === 0) {
    detailMarkup = '<p class="theory-slide-text">Los pronombres indican quién participa en la oración. Estas son las formas personales más habituales:</p>' + renderPronounTable(sample, languageName, locale);
  } else if (activeTheoryCategory === "Gramática" && activeTheoryIndex === 1 && sample?.articles) {
    detailMarkup += '<section class="theory-example"><span>Artículos de este idioma</span><p class="theory-target-word">' + escapeHTML(sample.articles) + '</p><p class="theory-slide-text">Observa género, número y si el artículo es definido o indefinido. Algunos idiomas expresan estas diferencias mediante sufijos o no usan artículos.</p></section>';
  } else if (activeTheoryCategory === "Gramática" && activeTheoryIndex === 2) {
    detailMarkup = renderVerbLesson(languageName);
  } else if (activeTheoryCategory === "Gramática" && activeTheoryIndex === 3) {
    detailMarkup += '<section class="theory-example"><span>Ejemplo en contexto</span><p class="theory-target-word">' + escapeHTML(sample?.intro || "") + '</p><p class="theory-slide-text">Identifica el verbo conjugado y observa qué cambia con la persona. Compara la forma base con la forma usada en la oración.</p></section>';
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

