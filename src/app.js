import { createSession, recordAnswer, recordTutorEvaluation, evaluateAnswer, buildSummary, getAdaptation, applyLearnerUpdate } from "./core/pedagogy.js";
import { loadProgress, saveProgress, persistSession, getDueCards, gradeReview, getProgressStats } from "./core/storage.js";
import { ptBR } from "./content/pt-BR.js";
import { english } from "./content/en.js";
import { checkTutorHealth, requestTutorTurn } from "./core/tutor-client.js";
import { escapeHTML } from "./core/html.js";
import { createSpeechController } from "./core/speech.js";

const $ = id => document.getElementById(id);
const catalogs = { "Portugués brasileño": ptBR, "Inglés": english };
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
  const selected = $("language").value;
  if (selected !== "other") return catalogs[selected] || null;
  const label = $("custom-language-name").value.trim();
  const locale = $("custom-language-locale").value.trim();
  if (!label || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/i.test(locale)) return null;
  return { id: locale, label, locale, exercises: [] };
}
function updateCustomLanguageFields() {
  const custom = $("language").value === "other";
  $("custom-language-name-field").classList.toggle("hidden", !custom);
  $("custom-language-locale-field").classList.toggle("hidden", !custom);
  $("custom-language-name").required = custom;
  $("custom-language-locale").required = custom;
}
let session = null;
let catalog = null;
let diagnostic = null;
let currentExercise = null;
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
  if (statsContent) statsContent.innerHTML =
    '<div class="stat-card"><span>Sesiones completadas</span><strong>' + stats.sessions + '</strong></div>' +
    '<div class="stat-card"><span>Palabras aprendidas</span><strong>' + stats.vocabulary + '</strong></div>' +
    '<div class="stat-card"><span>Precisión media</span><strong>' + stats.averageAccuracy + '%</strong></div>' +
    '<div class="stat-card"><span>Repasos pendientes</span><strong>' + due.length + '</strong></div>';
}
$("language").addEventListener("change", () => {
  updateCustomLanguageFields();
  refreshDashboard();
});
$("custom-language-name").addEventListener("input", refreshDashboard);
$("custom-language-locale").addEventListener("input", refreshDashboard);
try {
  const savedSettings = JSON.parse(localStorage.getItem("adaptive-language-tutor.settings") || "{}");
  if (savedSettings.selectedLanguage) {
    $("language").value = savedSettings.selectedLanguage;
    $("language-gate").classList.add("hidden");
    $("app-shell").classList.remove("hidden");
  }
  if (savedSettings.duration) $("duration").value = String(savedSettings.duration);
  if (savedSettings.level) $("level").value = savedSettings.level;
  if (savedSettings.topic) $("topic").value = savedSettings.topic;
  if (savedSettings.customLanguageName) $("custom-language-name").value = savedSettings.customLanguageName;
  if (savedSettings.customLanguageLocale) $("custom-language-locale").value = savedSettings.customLanguageLocale;
} catch { /* Ignore malformed optional settings; progress storage remains independent. */ }
updateCustomLanguageFields();
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
  if (!catalog) { $("ai-status").textContent = "Indica el nombre del idioma y un locale válido (por ejemplo, fr-FR)."; return; }
  dueReviewCards = getDueCards(progress, Date.now(), catalog.id).filter(card => card.cardType !== "pattern");
  reviewProgressDraft = JSON.parse(JSON.stringify(progress));
  reviewIndex = 0;
  if (!dueReviewCards.length) { refreshDashboard(); return; }
  showSessionView("review");
  $("setup-panel").classList.add("hidden");
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
    $("ai-status").textContent = "Indica el nombre del idioma y un locale válido (por ejemplo, fr-FR).";
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
  const durationMinutes = Number($("duration").value);
  const config = { language:catalog.label, languageId:catalog.id, languageLocale:catalog.locale || catalog.id, duration:durationMinutes * 2, durationMinutes, level:$("level").value, topic:$("topic").value };
  persistSettings();
  sessionAbortController?.abort();
  sessionAbortController = new AbortController();
  session = createSession(config);
  sessionFinished = false;
  reviewMode = false;
  $("setup-panel").classList.add("hidden");
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
    sessionDuration: config.duration
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
  $("turn-count").textContent = "Turno " + Math.min(session.turn + 1, session.config.duration) + " / " + session.config.duration;
  $("progress-bar").style.width = (session.turn / session.config.duration * 100) + "%";
  $("streak").textContent = session.streak;
  $("word-count").textContent = session.vocabulary.length;
  $("error-count").textContent = session.errors.length;

  const message = '<p>' + escapeHTML(result.message || "") + '</p>';
  const prompt = aiCurrentExercise.prompt
    ? '<h3>' + escapeHTML(aiCurrentExercise.prompt) + '</h3>'
    : '<p class="muted">Responde libremente para continuar la conversación.</p>';
  const feedback = result.evaluation?.feedback
    ? '<p class="ai-feedback">' + escapeHTML(result.evaluation.feedback) + '</p>'
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

  $("answer-area").innerHTML =
    '<input id="ai-answer" class="answer-input" placeholder="Escribe tu respuesta…" autocomplete="off">' +
    '<button id="submit-ai-answer" class="primary" type="button">Enviar respuesta →</button>';
  $("submit-ai-answer").addEventListener("click", () => submitAITutorAnswer($("ai-answer").value));
  $("ai-answer").addEventListener("keydown", event => {
    if (event.key === "Enter") submitAITutorAnswer($("ai-answer").value);
  });
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
      userMessage: cleanAnswer
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
      prompt: aiCurrentExercise.prompt || aiLastResult.message,
      submitted: cleanAnswer,
      expected: aiCurrentExercise.expectedAnswer || "",
      status: evaluation.status || "not_applicable",
      feedback: evaluation.feedback || "",
      skill: evaluation.skill || "Producción"
    });
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
  }
  return candidates[session.turn % candidates.length];
}

function levelLabel(level) {
  return ({zero:"principiante",basic:"básico",intermediate:"intermedio"})[level] || "básico";
}

function renderLesson() {
  if (session.turn >= session.config.duration) { finishSession(); return; }
  reviewMode = false;
  currentExercise = chooseExercise();
  const adaptation = getAdaptation(session);
  $("lesson-phase").textContent = "CONVERSACIÓN GUIADA";
  $("turn-count").textContent = "Turno " + (session.turn + 1) + " / " + session.config.duration;
  $("progress-bar").style.width = (session.turn / session.config.duration * 100) + "%";
  $("streak").textContent = session.streak;
  $("word-count").textContent = session.vocabulary.length;
  $("error-count").textContent = session.errors.length;
  $("lesson-content").innerHTML = '<p class="eyebrow">TEMA: ' + escapeHTML(topicLabels[session.config.topic].toUpperCase()) + ' · NIVEL ' + escapeHTML(levelLabel(session.config.level).toUpperCase()) + '</p><h3>' + escapeHTML(currentExercise.prompt) + '</h3><p>' + escapeHTML(adaptation.message || "Elige una respuesta o escribe la tuya.") + '</p>';
  speech.stop();
  const options = currentExercise.options.map((option,index) => '<div class="answer-option-row"><button class="answer-option" data-choice="' + index + '">' + escapeHTML(option) + '</button>' + speakerButton(option, catalog.locale) + '</div>').join("");
  $("answer-area").innerHTML = options + '<input id="free-answer" class="answer-input" placeholder="También puedes escribir tu respuesta…"><button id="submit-free" class="secondary" type="button">Comprobar respuesta escrita</button>';
  $("answer-area").querySelectorAll("[data-choice]").forEach(button => button.addEventListener("click", event => {
    if (event.target.closest("[data-speak]")) return;
    submitAnswer(currentExercise.options[Number(button.dataset.choice)]);
  }));
  $("answer-area").querySelectorAll("[data-speak]").forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    speech.speak(button.dataset.speak, catalog.locale);
  }));
  autoSpeak(currentExercise.options.join(". "), catalog.locale);
  $("submit-free").addEventListener("click", () => submitAnswer($("free-answer").value));
  $("feedback").classList.add("hidden");
  $("hint-btn").disabled = false;
  $("hint-btn").hidden = false;
  $("review-btn").hidden = false;
}

function submitAnswer(answer) {
  const result = recordAnswer(session, currentExercise, answer);
  $("answer-area").querySelectorAll("button").forEach(button => button.disabled = true);
  if (result.correct) {
    showFeedback("Correcto. " + currentExercise.explanation, true);
  } else {
    showFeedback("Respuesta de referencia: " + currentExercise.target + ". " + currentExercise.explanation, false);
  }
  appendCatalogSpeech($("feedback"), currentExercise, "explanationSpeechSegments", true);
  updateStats();
  const next = document.createElement("button");
  next.className = "primary";
  next.type = "button";
  next.textContent = "Continuar →";
  next.addEventListener("click", renderLesson);
  $("answer-area").append(next);
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
  $("summary-content").innerHTML = '<p class="intro">Completaste ' + summary.turns + ' turnos de ' + escapeHTML(session.config.language) + '.</p><ul class="summary-list">' + diagnosticText + aiLevelText + '<li>Respuestas evaluadas como correctas: ' + summary.correct + '/' + summary.attempted + ' (' + summary.accuracy + '%).</li><li>Mejor racha: ' + summary.bestStreak + '.</li><li>Vocabulario aprendido: ' + vocabularyText + '.</li><li>Errores evaluados para reforzar: ' + summary.errors.length + '.</li><li>Focos y patrones recomendados: ' + focus + '.</li></ul>';
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
  $("setup-panel").classList.add("hidden");
  $("session-view").classList.add("hidden");
  $("app-shell").classList.remove("session-active");
  $("exercise-choice-panel").classList.remove("hidden");
  $("review-exercises").classList.add("hidden");
  showScreen("exercises");
}

 document.querySelectorAll("[data-screen]").forEach(button => button.addEventListener("click", () => showScreen(button.dataset.screen)));
document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => {
  selectedExerciseMode = button.dataset.mode;
  $("exercise-choice-panel").classList.add("hidden");
  $("setup-panel").classList.remove("hidden");
  $("setup-title").textContent = selectedExerciseMode === "review" ? "Preparar repaso" : "Preparar sesión";
  $("review-exercises").classList.toggle("hidden", selectedExerciseMode !== "review");
  if (selectedExerciseMode === "review") refreshDashboard();
}));
$("route-start-exercises").addEventListener("click", () => showScreen("exercises"));
$("setup-back").addEventListener("click", () => {
  $("setup-panel").classList.add("hidden");
  $("review-exercises").classList.add("hidden");
  $("exercise-choice-panel").classList.remove("hidden");
});
$("session-close").addEventListener("click", () => {
  if (sessionFinished) closeSessionAndReturn();
  else $("session-confirm").showModal();
});
$("cancel-session-close").addEventListener("click", () => $("session-confirm").close());
$("confirm-session-close").addEventListener("click", () => {
  $("session-confirm").close();
  closeSessionAndReturn();
});
$("language-apply").addEventListener("click", () => {
  const selected = getSelectedCatalog();
  if (!selected) {
    $("audio-status").textContent = "Completa el nombre y locale del idioma.";
    return;
  }
  try { persistSettings(); } catch {}
  document.querySelector(".language-menu")?.removeAttribute("open");
  refreshDashboard();
});
document.querySelectorAll("[data-theory]").forEach(button => button.addEventListener("click", () => {
  const details = {
    grammar:["Gramática","Estructuras y reglas del idioma organizadas por nivel."],
    vocabulary:["Vocabulario","Palabras y expresiones útiles agrupadas por tema."],
    expressions:["Expresiones","Frases habituales para situaciones reales."]
  };
  const [title,description]=details[button.dataset.theory];
  $("theory-title").textContent=title;
  $("theory-description").textContent=description;
  $("theory-detail").classList.remove("hidden");
  document.querySelector(".theory-grid").classList.add("hidden");
}));
$("theory-back").addEventListener("click", () => {
  $("theory-detail").classList.add("hidden");
  document.querySelector(".theory-grid").classList.remove("hidden");
});
function persistSettings() {
  const savedSettings = {
    selectedLanguage: $("language").value,
    duration: $("duration").value,
    level: $("level").value,
    topic: $("topic").value,
    customLanguageName: $("custom-language-name").value.trim(),
    customLanguageLocale: $("custom-language-locale").value.trim()
  };
  localStorage.setItem("adaptive-language-tutor.settings", JSON.stringify(savedSettings));
}

document.querySelectorAll("[data-language]").forEach(button => button.addEventListener("click", () => {
  $("language").value = button.dataset.language;
  $("language").dispatchEvent(new Event("change"));
  try { persistSettings(); } catch {}
  $("language-gate").classList.add("hidden");
  $("app-shell").classList.remove("hidden");
  showScreen("route");
  if (button.dataset.language === "other") document.querySelector(".language-menu")?.setAttribute("open", "");
}));
