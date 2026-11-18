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
function autoSpeak(text, locale = catalog?.locale) {
  if (text && speech.enabled) speech.speak(text, locale, { automatic: true });
}
const topicLabels = { daily:"vida cotidiana", travel:"viajes", food:"comida y restaurantes", work:"trabajo y estudios", random:"tema sorpresa" };
function getSelectedCatalog() {
  return catalogs[$("language").value] || null;
}
function updateLanguageFlag() {
  $("selected-language-flag").textContent = languageDefinitions[$("language").value]?.flag || "🌐";
}
let session = null;
let catalog = null;
let diagnostic = null;
let currentExercise = null;
let pendingFeedback = null;
let aiPendingFeedback = null;
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
try { routeDraft = JSON.parse(localStorage.getItem(ROUTE_STORAGE_KEY) || "null"); } catch { routeDraft = null; }

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
  updateLanguageFlag();
  refreshDashboard();
});
try {
  const savedSettings = JSON.parse(localStorage.getItem("adaptive-language-tutor.settings") || "{}");
  if (savedSettings.selectedLanguage) {
    $("language").value = savedSettings.selectedLanguage;
    $("welcome-screen").classList.add("hidden");
    $("app-shell").classList.remove("hidden");
    updateLanguageFlag();
  }
  if (savedSettings.duration) $("duration").value = String(savedSettings.duration);
  if (savedSettings.level) $("level").value = savedSettings.level;
  if (savedSettings.topic) $("topic").value = savedSettings.topic;

} catch { /* Ignore malformed optional settings; progress storage remains independent. */ }
updateLanguageFlag();
refreshDashboard();
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
  $("lesson-phase").textContent = "TUTOR IA · CONVERSACIÓN";
  $("turn-count").textContent = "Pregunta " + Math.min(session.turn + 1, session.config.duration) + " / " + session.config.duration;
  $("progress-bar").style.width = (session.turn / session.config.duration * 100) + "%";
  $("streak").textContent = session.streak;
  $("word-count").textContent = session.vocabulary.length;
  $("error-count").textContent = session.errors.length;

  const message = '<p>' + escapeHTML(result.message || "") + '</p>';
  const prompt = aiCurrentExercise.prompt
    ? '<h3>' + renderVariantTerms(aiCurrentExercise.prompt) + '</h3>'
    : '<p class="muted">Responde libremente para continuar la conversación.</p>';
  const previous = aiPendingFeedback;
  aiPendingFeedback = null;
  const feedback = previous
    ? '<div class="feedback-note"><span>Respuesta anterior</span><p>' + escapeHTML(previous.text) + '</p>' +
      (previous.expected ? '<p class="model-answer">Respuesta modelo: ' + renderVariantTerms(previous.expected) + ' ' + speakerButton(previous.expected, session.config.languageLocale || session.config.languageId) + '</p>' : '') + '</div>'
    : "";
  const vocabulary = (result.learnerUpdate?.vocabulary || []).filter(item => item?.term);
  const vocabularyMarkup = vocabulary.length
    ? '<div class="ai-vocabulary"><span class="muted">Vocabulario</span>' + vocabulary.map(item =>
        '<span class="vocabulary-item">' + escapeHTML(item.term) + speakerButton(item.term, session.config.languageId) + '</span>'
      ).join("") + '</div>'
    : "";
  const speechSegments = (result.speechSegments || []).filter(item =>
    item && typeof item.text === "string" && item.text.trim() &&
    typeof item.locale === "string" && item.locale.trim()
  );
  const speechMarkup = speechSegments.length
    ? '<div class="ai-speech-segments"><span class="muted">Pronunciación</span>' + speechSegments.map(item =>
        '<span class="vocabulary-item">' + escapeHTML(item.text) + speakerButton(item.text, item.locale) + '</span>'
      ).join("") + '</div>'
    : "";
  $("lesson-content").innerHTML = message + feedback + prompt + speechMarkup + vocabularyMarkup;
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
      userMessage: cleanAnswer + (session.turn + 1 < 3
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
    aiPendingFeedback = {
      text: evaluation.feedback || (evaluation.status === "correct" ? "Correcto." : "Respuesta revisada."),
      expected: evaluatedExercise.expectedAnswer || ""
    };
    $("streak").textContent = session.streak;
    $("word-count").textContent = session.vocabulary.length;
    $("error-count").textContent = session.errors.length;
    renderAITutorTurn(result);
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
    failed: session.turn >= 10 && !routeIntegration && session.correct < 8
  };
  try { localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(routeDraft)); } catch {}
  $("route-resume").classList.remove("hidden");
}
function startRouteSession(resume = false) {
  catalog = getSelectedCatalog();
  if (!catalog) return;
  if (!catalog.exercises.length) {
    $("route-start").textContent = "Ruta aún no disponible para este idioma";
    return;
  }
  if (resume && routeDraft?.session && routeDraft.languageId === catalog.id) {
    session = routeDraft.session;
    pendingFeedback = routeDraft.pendingFeedback || null;
    routeIntegration = Boolean(routeDraft.integration);
    routeIntegrationAttempts = Number(routeDraft.integrationAttempts || 0);
  } else {
    session = createSession({
      language:catalog.label, languageId:catalog.id, languageLocale:catalog.locale,
      duration:10, questionCount:10, level:"zero", topic:"daily", routeMode:true
    });
    routeIntegration = false;
    routeIntegrationAttempts = 0;
    pendingFeedback = null;
    saveRouteDraft();
  }
  routeMode = true;
  session.config.routeMode = true;
  sessionAbortController?.abort();
  sessionAbortController = new AbortController();
  sessionFinished = false;
  aiMode = false;
  reviewMode = false;
  $("lesson-panel").classList.remove("hidden");
  $("summary-panel").classList.add("hidden");
  showSessionView("Ruta");
  if (routeIntegration) renderRouteIntegration();
  else if (session.turn >= 10) renderRouteAssessmentFailed();
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
    target: catalog.id === "en-US" ? "Hello, my name is Ana and I am from Chile." : "Olá, meu nome é Ana e sou do Chile.",
    acceptedAnswers: catalog.id === "en-US"
      ? ["Hello, I'm Ana and I'm from Chile.","Hi, my name is Ana. I am from Chile."]
      : ["Olá! Eu me chamo Ana e sou do Chile.","Oi, meu nome é Ana. Eu sou do Chile."],
    explanation:"La actividad integra saludo, presentación y procedencia."
  };
  $("lesson-phase").textContent = "HITO INTEGRADOR";
  $("turn-count").textContent = "Actividad final";
  $("progress-bar").style.width = "100%";
  $("lesson-content").innerHTML = (previous ? '<div class="feedback-note"><span>Respuesta anterior</span><p>' + escapeHTML(previous.text) + '</p><p class="model-answer">Respuesta modelo: ' + escapeHTML(previous.expected) + ' ' + speakerButton(previous.expected, catalog.locale) + '</p></div>' : '') + '<p class="eyebrow">UNIDAD 01 · FUNDAMENTOS</p><h3>' + escapeHTML(prompt) + '</h3><p>Combina lo practicado en los diez ejercicios anteriores.</p>';
  bindSpeakerButtons($("lesson-content"));
  $("answer-area").innerHTML = '<textarea id="route-integration-answer" class="answer-input" rows="3" placeholder="Escribe tu presentación…"></textarea><button id="route-integration-submit" class="primary" type="button">Comprobar actividad</button>';
  $("route-integration-submit").addEventListener("click", () => {
    const answer = $("route-integration-answer").value.trim();
    if (evaluateAnswer(answer, currentExercise)) {
      session.routeIntegrationComplete = true;
      routeDraft = null;
      try { localStorage.removeItem(ROUTE_STORAGE_KEY); } catch {}
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
  $("lesson-content").innerHTML = '<div class="feedback-note"><span>Unidad aún no superada</span><p>Necesitas al menos 8 respuestas correctas de 10. Tu resultado fue ' + session.correct + '/10. Puedes repetir la comprobación.</p></div>';
  $("answer-area").innerHTML = '<button id="route-retry" class="primary" type="button">Repetir los 10 ejercicios</button>';
  $("route-retry").addEventListener("click", () => {
    session = createSession({ ...session.config, duration:10, questionCount:10 });
    routeIntegration = false;
    routeIntegrationAttempts = 0;
    pendingFeedback = null;
    saveRouteDraft();
    renderLesson();
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
  const previous = pendingFeedback;
  pendingFeedback = null;
  const feedbackMarkup = previous
    ? '<div class="feedback-note"><span>Respuesta anterior</span><p>' + escapeHTML(previous.text) + '</p><p class="model-answer">Respuesta modelo: ' + escapeHTML(previous.expected) + ' ' + speakerButton(previous.expected, catalog.locale) + '</p></div>'
    : "";
  $("lesson-content").innerHTML = feedbackMarkup + '<p class="eyebrow">TEMA: ' + escapeHTML(topicLabels[session.config.topic].toUpperCase()) + ' · NIVEL ' + escapeHTML(levelLabel(session.config.level).toUpperCase()) + '</p><h3>' + renderVariantTerms(currentExercise.prompt) + '</h3>';
  bindVariantLinks($("lesson-content"));
  bindSpeakerButtons($("lesson-content"));
  speech.stop();
  if (session.turn < 3) {
    const options = currentExercise.options || [];
    $("answer-area").innerHTML = options.map((option,index) => '<div class="answer-option-row"><button class="answer-option" data-choice="' + index + '">' + escapeHTML(option) + '</button>' + speakerButton(option, catalog.locale) + '</div>').join("");
    $("answer-area").querySelectorAll("[data-choice]").forEach(button => button.addEventListener("click", () => submitAnswer(options[Number(button.dataset.choice)])));
    bindSpeakerButtons($("answer-area"));
    autoSpeak(options.join(". "), catalog.locale);
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
  pendingFeedback = {
    text: result.correct ? "Correcto. " + currentExercise.explanation : "No era correcto. " + currentExercise.explanation,
    expected: currentExercise.target
  };
  updateStats();
  if (routeMode) {
    saveRouteDraft();
    if (session.turn >= 10) {
      if (session.correct >= 8) {
        routeIntegration = true;
        saveRouteDraft();
        renderRouteIntegration();
      } else renderRouteAssessmentFailed();
      return;
    }
    renderLesson();
    return;
  }
  if (session.turn >= session.config.duration) {
    finishSession();
    return;
  }
  renderLesson();
}

function updateStats() {
  $("streak").textContent = session.streak;
  $("word-count").textContent = session.vocabulary.length;
  $("error-count").textContent = session.errors.length;
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
    $("route-start").textContent = "Unidad completada";
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
  $("summary-content").innerHTML = (finalFeedback ? '<div class="feedback-note"><span>Última respuesta</span><p>' + escapeHTML(finalFeedback.text) + '</p><p class="model-answer">Respuesta modelo: ' + escapeHTML(finalFeedback.expected) + ' ' + speakerButton(finalFeedback.expected, summaryLocale) + '</p></div>' : '') + '<p class="intro">Completaste ' + summary.turns + ' preguntas de ' + escapeHTML(session.config.language) + '.</p><ul class="summary-list">' + diagnosticText + aiLevelText + '<li>Respuestas evaluadas como correctas: ' + summary.correct + '/' + summary.attempted + ' (' + summary.accuracy + '%).</li><li>Mejor racha: ' + summary.bestStreak + '.</li><li>Vocabulario aprendido: ' + vocabularyText + '.</li><li>Errores evaluados para reforzar: ' + summary.errors.length + '.</li><li>Focos y patrones recomendados: ' + focus + '.</li></ul>';
  bindSpeakerButtons($("summary-content"));
  speech.speakSequence(summary.vocabulary.map(item => ({ text: item.term, locale: summaryLocale })), { automatic: true });
}

$("new-session").addEventListener("click", () => {
  closeSessionAndReturn();
});

// Main navigation and language onboarding
function showScreen(name) {
  $("session-view").classList.add("hidden");
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
  $("theory-title").textContent = title;
  $("theory-category").textContent = activeTheoryCategory;
  $("theory-description").innerHTML = '<p class="theory-slide-text">' + escapeHTML(body) + '</p>' +
    (sampleByTopic ? '<section class="theory-example"><span>' + escapeHTML(sampleLabel) + ' · ' + escapeHTML(languageDefinitions[$("language").value]?.label || "") + '</span><p>' + escapeHTML(sampleByTopic) + '</p></section>' : '');
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
  };
  localStorage.setItem("adaptive-language-tutor.settings", JSON.stringify(savedSettings));
}
$("welcome-start").addEventListener("click", () => {
  $("welcome-screen").classList.add("hidden");
  if ($("language").value && localStorage.getItem("adaptive-language-tutor.settings")) {
    $("app-shell").classList.remove("hidden");
    showScreen("route");
  } else {
    $("app-shell").classList.add("hidden");
    $("language-picker").showModal();
  }
});
$("open-language-picker").addEventListener("click", () => {
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
  try { persistSettings(); } catch {}
  updateLanguageFlag();
  $("language-picker").close();
  $("welcome-screen").classList.add("hidden");
  $("app-shell").classList.remove("hidden");
  showScreen("route");
  refreshDashboard();
}));

