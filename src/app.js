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
  "Inglés": { id:"en-US", label:"Inglés", locale:"en-US", flag:"🇺🇸", catalog:english },
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
  "Polaco": { id:"pl-PL", label:"Polaco", locale:"pl-PL", flag:"🇵🇱" }
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
    ? '<h3>' + escapeHTML(aiCurrentExercise.prompt) + '</h3>'
    : '<p class="muted">Responde libremente para continuar la conversación.</p>';
  const previous = aiPendingFeedback;
  aiPendingFeedback = null;
  const feedback = previous
    ? '<div class="feedback-note"><span>Respuesta anterior</span><p>' + escapeHTML(previous.text) + '</p>' +
      (previous.expected ? '<p class="model-answer">Respuesta modelo: ' + escapeHTML(previous.expected) + ' ' + speakerButton(previous.expected, session.config.languageLocale || session.config.languageId) + '</p>' : '') + '</div>'
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
  $("lesson-content").innerHTML = feedbackMarkup + '<p class="eyebrow">TEMA: ' + escapeHTML(topicLabels[session.config.topic].toUpperCase()) + ' · NIVEL ' + escapeHTML(levelLabel(session.config.level).toUpperCase()) + '</p><h3>' + escapeHTML(currentExercise.prompt) + '</h3>';
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
  showScreen("exercises");
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
$("setup-back")?.addEventListener("click", () => showScreen("exercises"));
$("session-close").addEventListener("click", () => {
  if (sessionFinished) closeSessionAndReturn();
  else $("session-confirm").showModal();
});
$("cancel-session-close").addEventListener("click", () => $("session-confirm").close());
$("confirm-session-close").addEventListener("click", () => {
  $("session-confirm").close();
  closeSessionAndReturn();
});

const theoryContent = {
  grammar: ["Gramática", [
    ["Pronombres personales", "Los pronombres indican quién realiza la acción. En inglés: I, you, he, she, it, we, they. En portugués: eu, você, ele, ela, nós, vocês, eles/elas. Observa que el uso y la omisión del pronombre cambian entre idiomas."],
    ["Artículos", "Los artículos acompañan al sustantivo. Inglés: the (definido), a/an (indefinido). Portugués: o/a/os/as y um/uma/uns/umas. En portugués el artículo concuerda en género y número."],
    ["Verbo ser y estar", "En inglés ambos sentidos suelen expresarse con be: I am tired / I am Chilean. En portugués se distinguen ser (identidad o característica) y estar (estado o ubicación): eu sou / eu estou."],
    ["Tiempo presente", "Se usa para hábitos, hechos y situaciones actuales. Inglés: I work; she works (tercera persona añade -s). Portugués: eu trabalho, você trabalha. Aprende cada forma junto con su pronombre."],
    ["Pasado", "Permite hablar de acciones terminadas. Inglés: worked (regular), went (irregular). Portugués: trabalhei, fui. Memoriza los verbos frecuentes dentro de frases completas."],
    ["Futuro", "En inglés se usa will + verbo o going to. En portugués cotidiano es frecuente ir + infinitivo: vou estudar (voy a estudiar)."]
  ]],
  vocabulary: ["Vocabulario", [
    ["Saludos", "Inglés: hello, good morning, good evening, see you. Portugués: olá, bom dia, boa tarde, até logo. El saludo cambia según el momento y la formalidad."],
    ["Personas y familia", "Inglés: person, friend, mother, brother, family. Portugués: pessoa, amigo, mãe, irmão, família. Aprende las palabras con su artículo cuando el idioma lo requiera."],
    ["Tiempo y fechas", "Inglés: today, tomorrow, yesterday, week, month. Portugués: hoje, amanhã, ontem, semana, mês. Practica fechas y expresiones temporales en contexto."],
    ["Comida y bebida", "Inglés: water, bread, meal, coffee. Portugués: água, pão, refeição, café. Añade expresiones para pedir y agradecer."],
    ["Viajes y transporte", "Inglés: ticket, station, luggage, departure. Portugués: passagem, estação, bagagem, partida. Incluye preguntas sobre horarios y direcciones."]
  ]],
  expressions: ["Expresiones", [
    ["Presentarse", "Inglés: My name is… / I'm from Chile. Portugués: Meu nome é… / Sou do Chile. Usa estas estructuras para iniciar una conversación."],
    ["Pedir ayuda", "Inglés: Could you help me? / I don't understand. Portugués: Você pode me ajudar? / Não entendi. Could y poderia suavizan una petición."],
    ["En un café", "Inglés: I'd like a coffee, please. Portugués: Eu gostaria de um café, por favor. Añade por favor y gracias para mantener un tono cortés."],
    ["Preguntar y aclarar", "Inglés: Where is…? / How much is it? Portugués: Onde fica…? / Quanto custa? Escucha la respuesta y confirma la información."],
    ["Conversación cotidiana", "Inglés: What do you do? / How was your day? Portugués: O que você faz? / Como foi seu dia? Las preguntas abiertas ayudan a mantener el diálogo."]
  ]]
};
let activeTheoryTopics = [];
let activeTheoryIndex = 0;
let activeTheoryCategory = "";
function openTheoryTopic(index) {
  activeTheoryIndex = Math.max(0, Math.min(index, activeTheoryTopics.length - 1));
  const [title, body] = activeTheoryTopics[activeTheoryIndex];
  $("theory-title").textContent = title;
  $("theory-category").textContent = activeTheoryCategory;
  $("theory-description").innerHTML = '<p class="theory-slide-text">' + escapeHTML(body) + '</p>';
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

