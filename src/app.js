import { createSession, recordAnswer, recordTutorEvaluation, evaluateAnswer, buildSummary, getAdaptation, applyLearnerUpdate } from "./core/pedagogy.js";
import { loadProgress, saveProgress, persistSession, getDueCards, gradeReview, getProgressStats } from "./core/storage.js";
import { italian } from "./content/it.js";
import { checkTutorHealth, requestTutorTurn } from "./core/tutor-client.js";
import { escapeHTML } from "./core/html.js";
import { createSpeechController } from "./core/speech.js";

const $ = id => document.getElementById(id);
function setActiveScreen(name) {
  if (name === "theory") {
    $("theory-detail")?.classList.add("hidden");
    $("theory-topic-list")?.classList.add("hidden");
    $("theory-grid")?.classList.remove("hidden");
    speech.stop();
  }
  document.querySelectorAll(".app-screen").forEach(screen => {
    screen.classList.toggle("hidden", screen.id !== "screen-" + name);
  });
  document.querySelectorAll(".nav-item[data-screen]").forEach(button => {
    const active = button.dataset.screen === name;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  if (name === "stats") refreshDashboard();
}
function setSessionView(active) {
  $("app-shell").classList.toggle("session-active", Boolean(active));
}
const catalogs = { "Italiano": italian };
let activeQuestionAudio = [];
const speech = createSpeechController({ onStatus: updateAudioStatus });
function updateAudioStatus(status) {
  const toggle = document.getElementById("audio-toggle");
  const sessionToggle = document.getElementById("session-audio-toggle");
  const label = document.getElementById("audio-status");
  if (toggle) {
    toggle.textContent = status.enabled ? "🔊" : "🔇";
    toggle.setAttribute("aria-pressed", String(status.enabled));
    toggle.setAttribute("aria-label", status.enabled ? "Desactivar lectura automática" : "Activar lectura automática");
    toggle.title = status.enabled ? "Lectura automática activada" : "Lectura automática desactivada";
  }
  if (sessionToggle) {
    sessionToggle.textContent = status.enabled ? "🔊" : "🔇";
    sessionToggle.setAttribute("aria-pressed", String(status.enabled));
    sessionToggle.setAttribute("aria-label", status.enabled ? "Desactivar lectura automática" : "Activar lectura automática");
  }
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
    const questionSegments = [...document.querySelectorAll("#lesson-content [data-question-segment]")]
      .filter(node => node.getClientRects().length > 0)
      .map(node => ({ text: node.dataset.audioText, locale: node.dataset.locale }));
    speech.speakSequence(questionSegments.length ? questionSegments : visibleSegments.length ? visibleSegments : activeQuestionAudio, { automatic: true });
  }
}
$("audio-toggle").addEventListener("click", toggleAudio);
$("session-audio-toggle").addEventListener("click", toggleAudio);
document.querySelectorAll(".nav-item[data-screen]:not([disabled])").forEach(button => {
  button.addEventListener("click", () => setActiveScreen(button.dataset.screen));
});
$("select-language").addEventListener("click", () => $("language-selector").showModal());
$("language-selector").querySelector("form").addEventListener("click", event => {
  if (event.target.closest(".language-option")) {
    event.preventDefault();
    $("language-selector").close();
  }
});
$("open-training").addEventListener("click", () => setActiveScreen("training"));
$("welcome-continue").addEventListener("click", () => {
  $("screen-welcome").classList.add("hidden");
  $("screen-languages").classList.remove("hidden");
  document.querySelector(".bottom-nav").classList.remove("hidden");
  setActiveScreen("languages");
});

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
let session = null;
let catalog = null;
let diagnostic = null;
let currentExercise = null;
let reviewExercise = null;
let reviewMode = false;
let progress = loadProgress();
let dueReviewCards = [];
let reviewIndex = 0;
let aiConfigured = false;
let aiReady = false;
let aiMode = false;
let aiHistory = [];
let aiLastResult = null;
let aiCurrentExercise = null;
let aiHintLevel = 0;
let aiHintPending = false;
let sessionFinished = false;

function refreshDashboard() {
  const languageId = getSelectedCatalog()?.id;
  const stats = getProgressStats(progress, languageId);
  const due = getDueCards(progress, Date.now(), languageId);
  $("progress-dashboard").innerHTML =
    '<p class="eyebrow">TU PROGRESO GUARDADO</p>' +
    '<div class="progress-summary"><span><strong>' + stats.sessions + '</strong> sesiones</span>' +
    '<span><strong>' + stats.vocabulary + '</strong> palabras</span>' +
    '<span><strong>' + stats.averageAccuracy + '%</strong> precisión media</span></div>' +
    '<p class="muted">' + due.length + ' repasos pendientes para este idioma.</p>' +
    (due.length ? '<button id="start-spaced-review" class="secondary" type="button">Iniciar repaso (' + due.length + ') →</button>' : '');
  const reviewButton = $("start-spaced-review");
  if (reviewButton) reviewButton.addEventListener("click", startSpacedReview);

  const root = $("statistics-content");
  if (!root) return;
  const selectedView = root.querySelector("#stats-view-select")?.value || "global";
  const sessions = progress.sessions.filter(item => item.languageId === languageId);
  const attempted = sessions.reduce((sum,item) => sum + (Number(item.attempted) || 0), 0);
  const correct = sessions.reduce((sum,item) => sum + (Number(item.correct) || 0), 0);
  const accuracy = attempted ? Math.round(correct / attempted * 100) : stats.averageAccuracy;
  const languageName = "Italiano";
  const languageFlag = "🇮🇹";
  const table = '<section class="stats-table-card"><h2>Progreso por idioma</h2>' +
    '<div class="stats-table-wrap"><table class="stats-language-table"><thead><tr><th>Indicador</th><th title="' + languageName + '">' + languageFlag + '</th></tr></thead><tbody>' +
    '<tr><th scope="row">Sesiones</th><td>' + stats.sessions + '</td></tr>' +
    '<tr><th scope="row">Palabras</th><td>' + stats.vocabulary + '</td></tr>' +
    '<tr><th scope="row">Precisión</th><td>' + accuracy + '%</td></tr>' +
    '<tr><th scope="row">Progreso de Ruta</th><td aria-label="Ruta aún no habilitada">—</td></tr></tbody></table></div></section>';

  const daily = new Map();
  for (const item of sessions) {
    if (!item.completedAt) continue;
    const day = String(item.completedAt).slice(0,10);
    if (!daily.has(day)) daily.set(day,{attempted:0,correct:0});
    const record = daily.get(day);
    record.attempted += Number(item.attempted) || 0;
    record.correct += Number(item.correct) || 0;
  }
  const practicedDays = [...daily.entries()].sort(([a],[b]) => a.localeCompare(b)).slice(-15);
  let chartMarkup = "";
  if (selectedView === "global") {
    chartMarkup = attempted
      ? '<div class="stats-horizontal-list" role="list" aria-label="Precisión por idioma"><div class="stats-horizontal-row" role="listitem"><div class="stats-horizontal-label"><span>' + languageFlag + ' ' + languageName + '</span><strong>' + accuracy + '%</strong></div><div class="stats-horizontal-track" role="img" aria-label="' + languageName + ': ' + accuracy + '%"><span style="width:' + accuracy + '%"></span></div></div></div><p class="chart-note">Precisión acumulada por idioma.</p>'
      : '<p class="empty-chart">Completa una sesión para ver la precisión acumulada.</p>';
  } else if (!practicedDays.length) {
    chartMarkup = '<p class="empty-chart">Todavía no hay días de práctica registrados para ' + languageName + '.</p>';
  } else {
    const width=760,height=340,left=42,right=42,top=28,bottom=62;
    const plotWidth=width-left-right,plotHeight=height-top-bottom;
    const maxQuestions=Math.max(1,...practicedDays.map(([,item])=>item.attempted));
    const questionMax=Math.max(5,Math.ceil(maxQuestions/5)*5);
    const xAt=i=>practicedDays.length===1?left+plotWidth/2:left+i*plotWidth/(practicedDays.length-1);
    const yAccuracy=value=>top+(100-value)*plotHeight/100;
    const yQuestions=value=>top+(questionMax-value)*plotHeight/questionMax;
    const grid=[0,25,50,75,100].map(value=>'<line x1="'+left+'" y1="'+yAccuracy(value)+'" x2="'+(width-right)+'" y2="'+yAccuracy(value)+'" class="chart-gridline"/><text x="3" y="'+(yAccuracy(value)+4)+'" class="chart-axis-label">'+Math.round(questionMax*value/100)+'</text><text x="'+(width-right+5)+'" y="'+(yAccuracy(value)+4)+'" class="chart-axis-label">'+value+'%</text>').join("");
    const questionPoints=practicedDays.map(([,item],i)=>xAt(i)+","+yQuestions(item.attempted)).join(" ");
    const accuracyPoints=practicedDays.map(([,item],i)=>xAt(i)+","+yAccuracy(item.attempted?item.correct/item.attempted*100:0)).join(" ");
    const dots=practicedDays.map(([,item],i)=>{
      const pct=item.attempted?Math.round(item.correct/item.attempted*100):0;
      return '<circle cx="'+xAt(i)+'" cy="'+yQuestions(item.attempted)+'" r="7" class="stats-question-dot"><title>'+item.attempted+' preguntas</title></circle><circle cx="'+xAt(i)+'" cy="'+yAccuracy(pct)+'" r="7" class="stats-accuracy-dot"><title>'+pct+'% precisión</title></circle><text x="'+xAt(i)+'" y="'+(height-25)+'" text-anchor="middle" class="chart-axis-label">'+(i+1)+'</text>';
    }).join("");
    chartMarkup='<div class="stats-chart-scroll"><svg class="stats-line-chart stats-language-chart" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Preguntas respondidas y precisión por día practicado">'+grid+'<polyline class="stats-question-line" points="'+questionPoints+'"/><polyline class="stats-accuracy-line" points="'+accuracyPoints+'"/>'+dots+'<text x="'+(left+plotWidth/2)+'" y="'+(height-4)+'" text-anchor="middle" class="chart-axis-title">Días</text></svg></div><div class="stats-chart-legend"><span><i class="legend-question"></i>Preguntas respondidas</span><span><i class="legend-accuracy"></i>Precisión (%)</span></div><p class="chart-note">Últimos '+practicedDays.length+' días practicados · sin días de inactividad.</p>';
  }
  root.innerHTML=table+'<section class="progress-chart-card"><div class="stats-chart-heading"><h2>Evolución</h2><label class="stats-view-picker"><span class="visually-hidden">Vista del gráfico</span><select id="stats-view-select" aria-label="Seleccionar vista de estadísticas"><option value="global">🌐 Global</option><option value="'+languageId+'">'+languageFlag+' '+languageName+'</option></select></label></div><div class="stats-chart-stage">'+chartMarkup+'</div></section>';
  root.querySelector("#stats-view-select").value=selectedView;
  root.querySelector("#stats-view-select").addEventListener("change", refreshDashboard);
}
refreshDashboard();
checkTutorHealth().then(status => {
  aiConfigured = Boolean(status.ai?.configured);
  $("ai-status").textContent = aiConfigured
    ? "Tutor IA disponible · " + (status.ai.provider || "proveedor configurado")
    : "API IA sin configurar · se mantiene el modo local";
}).catch(() => {
  $("ai-status").textContent = "Backend IA no disponible · se mantiene el modo local";
}).finally(() => {
  aiReady = true;
  $("start-session").disabled = false;
});

function startSpacedReview() {
  speech.stop();
  catalog = getSelectedCatalog();
  if (!catalog) { $("ai-status").textContent = "Indica el nombre del idioma y un locale válido (por ejemplo, fr-FR)."; return; }
  dueReviewCards = getDueCards(progress, Date.now(), catalog.id);
  reviewIndex = 0;
  if (!dueReviewCards.length) { refreshDashboard(); return; }
  setActiveScreen("training");
  setSessionView(true);
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
    $("lesson-panel").classList.add("hidden");
    $("setup-panel").classList.remove("hidden");
    setSessionView(false);
    $("session-status").textContent = "Repaso completado";
    refreshDashboard();
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
      const result = gradeReview(progress, card.key, recalled);
      saveProgress(progress);
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
    const result = gradeReview(progress, card.key, correct);
    saveProgress(progress);
    const interval = result?.nextIntervalDays || 1;
    showFeedback(correct
      ? "Correcto. Próximo repaso en " + interval + " días."
      : "Respuesta de referencia: " + expected + ". " + (exercise?.explanation || card.explanation) + " La tarjeta volverá mañana.", correct);
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
  const config = { language:catalog.label, languageId:catalog.id, languageLocale:catalog.locale || catalog.id, duration:Number($("duration").value), level:$("level").value, topic:$("topic").value };
  session = createSession(config);
  activeQuestionAudio = [];
  setActiveScreen("training");
  setSessionView(true);
  sessionFinished = false;
  reviewMode = false;
  $("setup-panel").classList.add("hidden");
  $("summary-panel").classList.add("hidden");
  $("lesson-panel").classList.remove("hidden");
  $("session-status").textContent = aiConfigured ? "Tutor IA en sesión" : "Sesión local";
  if (aiConfigured) {
    startAITutorSession(config);
  } else {
    aiMode = false;
    if (config.level === "diagnostic") startDiagnostic();
    else { session.config.level = config.level; renderLesson(); }
  }
});

function getAILearnerContext(config = session.config) {
  return {
    nativeLanguage: "es",
    nativeLanguageLocale: config.nativeLanguageLocale || "es-CL",
    targetLanguage: config.languageId,
    targetLanguageLabel: config.language,
    targetLanguageLocale: config.languageLocale || catalog?.locale || config.languageId,
    level: config.estimatedLevel || config.level,
    topic: config.topic,
    sessionDuration: config.duration
  };
}

async function startAITutorSession(config) {
  aiMode = true;
  aiHistory = [];
  aiLastResult = null;
  aiCurrentExercise = null;
  $("stats").hidden = false;
  $("hint-btn").hidden = false;
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
        diagnostic: config.level === "diagnostic",
        performance: { streak: 0, consecutiveCorrect: 0, consecutiveErrors: 0 }
      },
      history: [],
      userMessage: "Inicia mi sesión de aprendizaje. Preséntame una primera actividad adecuada a mi nivel y tema, y conversa conmigo en español mientras practico el idioma objetivo."
    });
    applyLearnerUpdate(session, result.learnerUpdate);
    renderAITutorTurn(result);
  } catch (error) {
    showAITutorError(error, null);
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
  const questionSegments = (result.questionSegments || []).filter(item =>
    item && typeof item.text === "string" && item.text &&
    typeof item.locale === "string" && item.locale &&
    typeof item.isTarget === "boolean"
  );
  const prompt = aiCurrentExercise.prompt
    ? '<h3 class="mixed-question" aria-label="' + escapeHTML(aiCurrentExercise.prompt) + '">' + (questionSegments.length
        ? questionSegments.map(item => item.isTarget
          ? '<button class="target-fragment" type="button" data-question-segment="true" data-audio-text="' + escapeHTML(item.text) + '" data-speak="' + escapeHTML(item.text) + '" data-locale="' + escapeHTML(item.locale) + '" aria-label="Reproducir fragmento en idioma objetivo">' + escapeHTML(item.text) + '</button>'
          : '<span data-question-segment="true" data-audio-text="' + escapeHTML(item.text) + '" data-locale="' + escapeHTML(item.locale) + '">' + escapeHTML(item.text) + '</span>'
        ).join("")
        : escapeHTML(aiCurrentExercise.prompt)) + '</h3>'
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
  $("lesson-content").innerHTML = message + feedback + prompt + vocabularyMarkup;
  bindSpeakerButtons($("lesson-content"));
  const initialQuestionAudio = questionSegments.map(item => ({ text: item.text, locale: item.locale }));
  activeQuestionAudio = initialQuestionAudio;
  speech.speakSequence(initialQuestionAudio, { automatic: true });
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
        diagnostic: session.config.level === "diagnostic",
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
    });
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
    showAITutorError(error, cleanAnswer);
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
    });
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
  $("answer-area").innerHTML = previousAnswer
    ? '<button id="retry-ai" class="primary" type="button">Reintentar envío</button>'
    : '<button id="retry-ai" class="primary" type="button">Reintentar sesión</button>';
  $("retry-ai").addEventListener("click", () => {
    const retryButton = $("retry-ai");
    if (retryButton.disabled) return;
    retryButton.disabled = true;
    retryButton.textContent = "Reintentando…";
    if (previousAnswer) submitAITutorAnswer(previousAnswer);
    else startAITutorSession(session.config);
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

function startDiagnostic() {
  const beginner = catalog.exercises.filter(exercise => exercise.level === "A1").slice(0,3);
  const challenge = catalog.exercises.filter(exercise => exercise.level === "A2").slice(0,1);
  diagnostic = { questions:[...beginner, ...challenge], index:0, score:0 };
  renderDiagnosticQuestion();
}

function renderDiagnosticQuestion() {
  const exercise = diagnostic.questions[diagnostic.index];
  $("lesson-phase").textContent = "DIAGNÓSTICO · " + (diagnostic.index + 1) + " / 4";
  $("turn-count").textContent = "Evaluación inicial";
  $("progress-bar").style.width = (diagnostic.index / 4 * 100) + "%";
  $("stats").hidden = true;
  $("lesson-content").innerHTML = '<h3 data-question-segment="true" data-audio-text="' + escapeHTML(exercise.prompt) + '" data-locale="es-CL">' + escapeHTML(exercise.prompt) + '</h3><p>Responde según lo que ya sabes. Estas preguntas no cuentan en los turnos de práctica.</p>';
  speech.stop();
  $("answer-area").innerHTML = exercise.options.map((option,index) =>
    '<button class="answer-option" data-diagnostic="' + index + '">' + escapeHTML(option) + '</button>'
  ).join("");
  $("answer-area").querySelectorAll("[data-diagnostic]").forEach(button => button.addEventListener("click", event => {
    if (event.target.closest("[data-speak]")) return;
    if (Number(button.dataset.diagnostic) === exercise.options.indexOf(exercise.target)) diagnostic.score += 1;
    diagnostic.index += 1;
    if (diagnostic.index < 4) renderDiagnosticQuestion();
    else finishDiagnostic();
  }));
  $("answer-area").querySelectorAll("[data-speak]").forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    speech.speak(button.dataset.speak, catalog.locale);
  }));
  activeQuestionAudio = [{ text: exercise.prompt, locale: "es-CL" }];
  autoSpeak(exercise.prompt, "es-CL");
  $("hint-btn").hidden = true;
  $("review-btn").hidden = true;
  $("feedback").classList.add("hidden");
}

function finishDiagnostic() {
  const score = diagnostic.score;
  session.config.level = score <= 1 ? "zero" : score <= 3 ? "basic" : "intermediate";
  session.config.diagnosticScore = score;
  $("stats").hidden = false;
  $("hint-btn").hidden = false;
  $("review-btn").hidden = false;
  $("feedback").textContent = "Nivel inicial estimado: " + levelLabel(session.config.level) + ". Es orientativo y se ajustará según tus respuestas.";
  $("feedback").classList.remove("hidden","bad");
  renderLesson();
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
  $("lesson-content").innerHTML = '<p class="eyebrow">TEMA: ' + escapeHTML(topicLabels[session.config.topic].toUpperCase()) + ' · NIVEL ' + escapeHTML(levelLabel(session.config.level).toUpperCase()) + '</p><h3 data-question-segment="true" data-audio-text="' + escapeHTML(currentExercise.prompt) + '" data-locale="es-CL">' + escapeHTML(currentExercise.prompt) + '</h3><p>' + escapeHTML(adaptation.message || "Elige una respuesta o escribe la tuya.") + '</p>';
  speech.stop();
  const options = currentExercise.options.map((option,index) => '<button class="answer-option" data-choice="' + index + '">' + escapeHTML(option) + '</button>').join("");
  $("answer-area").innerHTML = options + '<input id="free-answer" class="answer-input" placeholder="También puedes escribir tu respuesta…"><button id="submit-free" class="secondary" type="button">Comprobar respuesta escrita</button>';
  $("answer-area").querySelectorAll("[data-choice]").forEach(button => button.addEventListener("click", event => {
    if (event.target.closest("[data-speak]")) return;
    submitAnswer(currentExercise.options[Number(button.dataset.choice)]);
  }));
  $("answer-area").querySelectorAll("[data-speak]").forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    speech.speak(button.dataset.speak, catalog.locale);
  }));
  activeQuestionAudio = [{ text: currentExercise.prompt, locale: "es-CL" }];
  autoSpeak(currentExercise.prompt, "es-CL");
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
    $("answer-area").innerHTML = '<button class="secondary" id="back-to-practice" type="button">Volver a la práctica</button>';
    $("back-to-practice").addEventListener("click", renderLesson);
  });
});

function finishSession() {
  if (!session || sessionFinished) return;
  sessionFinished = true;
  setSessionView(false);
  speech.stop();
  $("lesson-panel").classList.add("hidden");
  $("summary-panel").classList.remove("hidden");
  $("session-status").textContent = "Sesión finalizada";
  const summary = buildSummary(session);
  persistSession(progress, session, summary);
  saveProgress(progress);
  refreshDashboard();
  const diagnosticText = session.config.diagnosticScore === undefined ? "" : '<li>Diagnóstico inicial: ' + session.config.diagnosticScore + '/4 · nivel estimado ' + levelLabel(session.config.level) + '.</li>';
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
  activeQuestionAudio = summary.vocabulary.map(item => ({ text: item.term, locale: summaryLocale }));
  speech.speakSequence(activeQuestionAudio, { automatic: true });
}

$("new-session").addEventListener("click", () => {
  speech.stop();
  aiMode = false;
  sessionFinished = false;
  setSessionView(false);
  setActiveScreen("training");
  $("summary-panel").classList.add("hidden");
  $("setup-panel").classList.remove("hidden");
  $("session-status").textContent = "Nueva sesión";
  refreshDashboard();
});

$("session-close").addEventListener("click", () => $("session-confirm").showModal());
$("cancel-session-close").addEventListener("click", () => $("session-confirm").close());
$("confirm-session-close").addEventListener("click", () => {
  $("session-confirm").close();
  speech.stop();
  setSessionView(false);
  $("lesson-panel").classList.add("hidden");
  $("summary-panel").classList.add("hidden");
  $("setup-panel").classList.remove("hidden");
  $("session-status").textContent = "Sesión descartada";
  setActiveScreen("training");
  refreshDashboard();
});

$("export-btn").addEventListener("click", () => {
  const data = { exportedAt:new Date().toISOString(), summary:buildSummary(session), config:session.config, answers:session.answers };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = "language-tutor-progress.json"; anchor.click();
  URL.revokeObjectURL(url);
});


/* Teoría restaurada desde la interfaz de referencia; contenido y navegación aislados del flujo de entrenamiento. */
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
    ["Viajes y transporte", "Palabras para desplazarse, comprar pasajes, orientarse y resolver situaciones habituales durante un viaje."],
    ["Números cardinales y ordinales", "Aprende a contar, expresar cantidades, precios, fechas, posiciones y orden. Incluye concordancia de género y formación de números compuestos."]
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
function renderGrammarRuleSections(rules, exceptions = "") {
  const clean = value => String(value || "").trim().replace(/^[-•\d.)\s]+/, "").replace(/[.;:]$/, "").trim();
  const splitChildren = value => String(value || "")
    .split(/;\s+|,\s+(?=[^,;]+?\s*→)/)
    .map(clean).filter(Boolean);
  const parseHierarchy = value => String(value || "").split(/(?<=[.!?])\s+/).map(sentence => {
    const item = clean(sentence);
    if (!item) return null;
    const colon = item.indexOf(":");
    if (colon > 0 && colon < item.length - 1) {
      const parent = clean(item.slice(0,colon));
      const children = splitChildren(item.slice(colon + 1));
      return children.length ? { parent, children } : { parent };
    }
    const parts = item.split(/;\s+/).map(clean).filter(Boolean);
    if (parts.length > 1) return { parent:parts[0], children:parts.slice(1) };
    return { parent:item };
  }).filter(Boolean);
  const renderList = nodes => '<ol class="theory-rule-list">' + nodes.map(node =>
    '<li><span class="theory-rule-parent">' + escapeHTML(node.parent) + '</span>' +
    (node.children?.length ? '<ul class="theory-rule-children">' + node.children.map(child => '<li>' + escapeHTML(child) + '</li>').join("") + '</ul>' : '') +
    '</li>'
  ).join("") + '</ol>';
  const rulePoints = parseHierarchy(rules), exceptionPoints = parseHierarchy(exceptions);
  return (rulePoints.length ? '<section class="theory-note theory-rules"><h3>Reglas y usos</h3>' + renderList(rulePoints) + '</section>' : "") +
    (exceptionPoints.length ? '<section class="theory-note theory-exceptions"><h3>Excepciones e irregulares</h3>' + renderList(exceptionPoints) + '</section>' : "");
}
function renderGrammarRuleContent(rule, exceptions = "") {
  const text = String(rule || "").trim();
  const marker = /(?:Atención:|Excepciones?:|Ojo:|No uses\b|No traduzcas\b|No se\b|Nunca\b)/i.exec(text);
  if (!marker) return renderGrammarRuleSections(text,exceptions);
  const mainRules = text.slice(0,marker.index).trim();
  const exceptionText = [text.slice(marker.index).replace(/^(?:Atención:|Excepciones?:|Ojo:)\s*/i,""),exceptions].filter(Boolean).join(" ");
  return renderGrammarRuleSections(mainRules,exceptionText);
}
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
    const rows = forms.map(([person,form]) =>
      '<tr><td><strong>' + escapeHTML(person) + '</strong></td><td><strong class="theory-target-word">' + escapeHTML(form) + '</strong> ' + speakerButton(form,locale) + '</td></tr>'
    ).join("");
    const examples = [0,2,3].map(index => {
      const [person,,targetExample,translation] = forms[index];
      return '<tr><td>' + escapeHTML(person) + '</td><td><span class="theory-target-word">' + escapeHTML(targetExample) + '</span> ' + speakerButton(targetExample,locale) + '<small class="theory-translation">(' + escapeHTML(translation) + ')</small></td></tr>';
    }).join("");
    const header = '<thead><tr><th>Pronombre</th><th>Forma verbal</th></tr></thead>';
    const regularPastTable = isPast ? '<section class="theory-table-block"><h3>Terminaciones regulares</h3><p>Los verbos regulares cambian su terminación de la siguiente manera:</p><div class="theory-table-scroll"><table class="theory-pronoun-table"><thead><tr><th></th><th>-AR · falar</th><th>-ER · comer</th><th>-IR · partir</th></tr></thead><tbody>' +
      [['eu','falei','comi','parti'],['tu','falaste','comeste','partiste'],['você / ele / ela','falou','comeu','partiu'],['nós','falamos','comemos','partimos'],['a gente','falou','comeu','partiu'],['vocês / eles / elas','falaram','comeram','partiram']].map(row => '<tr>' + row.map((cell,index) => '<td>' + (index ? '<strong class="theory-target-word">' + cell + '</strong> ' + speakerButton(cell,locale) : '<strong>' + cell + '</strong>') + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div></section>' : '';
    const pastIrregularTable = isPast ? '<section class="theory-table-block"><h3>Excepciones: verbos irregulares</h3><div class="theory-table-scroll"><table class="theory-pronoun-table"><thead><tr><th>Pronombre</th><th>ser / ir</th><th>estar</th><th>ter</th><th>fazer</th></tr></thead><tbody>' +
      [['eu','fui','estive','tive','fiz'],['tu','foste','estiveste','tiveste','fizeste'],['você / ele / ela','foi','esteve','teve','fez'],['nós','fomos','estivemos','tivemos','fizemos'],['a gente','foi','esteve','teve','fez'],['vocês / eles / elas','foram','estiveram','tiveram','fizeram']].map(row => '<tr>' + row.map((cell,index) => '<td>' + (index ? '<strong class="theory-target-word">' + cell + '</strong> ' + speakerButton(cell,locale) : '<strong>' + cell + '</strong>') + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div></section>' : '';
    const pastIrregularTableTwo = isPast ? '<section class="theory-table-block"><h3>Más verbos irregulares</h3><div class="theory-table-scroll"><table class="theory-pronoun-table"><thead><tr><th>Pronombre</th><th>dizer</th><th>trazer</th><th>pôr</th><th>ver</th><th>vir</th></tr></thead><tbody>' +
      [['eu','disse','trouxe','pus','vi','vim'],['tu','disseste','trouxeste','puseste','viste','vieste'],['você / ele / ela','disse','trouxe','pôs','viu','veio'],['nós','dissemos','trouxemos','pusemos','vimos','viemos'],['a gente','disse','trouxe','pôs','viu','veio'],['vocês / eles / elas','disseram','trouxeram','puseram','viram','vieram']].map(row => '<tr>' + row.map((cell,index) => '<td>' + (index ? '<strong class="theory-target-word">' + cell + '</strong> ' + speakerButton(cell,locale) : '<strong>' + cell + '</strong>') + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div></section>' : '';
    const simpleFuture = !isPast && lesson.futureSimpleForms
      ? '<section class="theory-table-block"><h3>Futuro simple (más formal)</h3><div class="theory-table-scroll"><table class="theory-pronoun-table"><thead><tr><th>Pronombre</th><th>Forma verbal</th></tr></thead><tbody>' + lesson.futureSimpleForms.map(([person,form]) => '<tr><td>' + escapeHTML(person) + '</td><td><strong class="theory-target-word">' + escapeHTML(form) + '</strong> ' + speakerButton(form,locale) + '</td></tr>').join("") + '</tbody></table></div></section>'
      : "";
    const futureIrregularTable = !isPast ? '<section class="theory-table-block"><h3>Excepciones del futuro simple · conjugación</h3><div class="theory-table-scroll"><table class="theory-pronoun-table"><thead><tr><th>Pronombre</th><th>dizer</th><th>fazer</th><th>trazer</th><th>pôr</th><th>ter</th><th>vir</th><th>ser</th></tr></thead><tbody>' +
      [['eu','direi','farei','trarei','porei','terei','virei','serei'],['tu','dirás','farás','trarás','porás','terás','virás','serás'],['você / ele / ela','dirá','fará','trará','porá','terá','virá','será'],['nós','diremos','faremos','traremos','poremos','teremos','viremos','seremos'],['a gente','dirá','fará','trará','porá','terá','virá','será'],['vocês / eles / elas','dirão','farão','trarão','porão','terão','virão','serão']].map(row => '<tr>' + row.map((cell,index) => '<td>' + (index ? '<strong class="theory-target-word">' + cell + '</strong> ' + speakerButton(cell,locale) : '<strong>' + cell + '</strong>') + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div></section>' : '';
    const rule = isPast ? lesson.pastRule : lesson.futureRule;
    const intro = isPast
      ? "El pretérito perfeito expresa acciones concluidas en el pasado. Primero identifica el infinitivo y después aplica la terminación correspondiente a la persona."
      : "En portugués brasileño, el futuro próximo se forma con ir en presente + infinitivo. El futuro simple es correcto, pero tiene un uso más formal.";
    return '<p class="theory-slide-text">' + escapeHTML(intro) + '</p>' + regularPastTable +
      '<section class="theory-table-block"><h3>Conjugación de ejemplo: ' + (isPast ? 'falar en pasado' : 'ir + infinitivo') + '</h3><div class="theory-table-scroll"><table class="theory-pronoun-table">' + header + '<tbody>' + rows + '</tbody></table></div></section>' +
      pastIrregularTable + pastIrregularTableTwo + simpleFuture + futureIrregularTable +
      renderGrammarRuleSections(rule,"") +
      '<section class="theory-example"><span>Ejemplos aplicados</span><div class="theory-table-scroll"><table class="theory-example-table"><thead><tr><th>Pronombre</th><th>Ejemplo aplicado</th></tr></thead><tbody>' + examples + '</tbody></table></div></section>';
  }
  const example = isPast ? lesson.past : lesson.future;
  const translation = isPast ? lesson.pastEs : lesson.futureEs;
  const rule = isPast ? lesson.pastRule : lesson.futureRule;
  return '<p class="theory-slide-text">' + (isPast ? "El pasado permite narrar acciones anteriores. Observa esta frase y la forma verbal utilizada:" : "El futuro expresa planes, predicciones e intenciones. Observa esta construcción:") + '</p>' +
    renderGrammarRuleContent(rule,lesson.exceptions) +
    '<section class="theory-example"><span>' + (isPast ? "Ejemplo en pasado" : "Ejemplo en futuro") + '</span>' + renderTheoryExampleTable(example,translation,locale,languageName) + '</section>';
}
function renderPronounTable(sample, languageName, locale) {
  if (!sample?.pronouns) return "";
  const words = sample.pronouns.split(/\s*,\s*/);
  const meanings = pronounTranslations[languageName] || [];
  const rows = words.map((word,index) => '<tr><td><strong class="theory-target-word">' + escapeHTML(word) + '</strong> ' + speakerButton(word, locale) + '</td><td>' + escapeHTML(meanings[index] || "forma personal") + '</td></tr>').join("");
  return '<table class="theory-pronoun-table"><thead><tr><th>Pronombre</th><th>Significado</th></tr></thead><tbody>' + rows + '</tbody></table><p class="theory-footnote">Pulsa el icono para escuchar cada forma. El significado puede variar según el contexto y el grado de formalidad.</p>';
}
function getTheoryExamplePronoun(example) {
  const text = String(example || "").trim().replace(/^(?:yesterday|tomorrow|ayer|mañana|ontem|amanhã|ieri|domani|gestern|morgen|hier|demain|明日|昨日|昨天|어제|내일)[，、,]?\s*/i,"");
  const unicodeMatch = text.match(/^(私|我|你|他|她|我们|저는|너는|그는|그녀는|우리는|أنا|أنت|هو|هي|نحن|मैं|तुम|वह|हम)/);
  const match = unicodeMatch || text.match(/^(a gente|você|vocês|eu|tu|nós|vós|ele|ela|eles|elas|i|you|he|she|it|we|they|je|j['’]|il|elle|on|nous|vous|ils|elles|ich|du|er|sie|es|wir|ihr|io|lui|lei|noi|voi|loro|я|ты|он|она|мы|вы|они)\b/i);
  return match ? match[0] : "—";
}
function renderTheoryExampleTable(example, translation, locale, languageName = "") {
  const knownTranslations = ({
    "Portugués brasileño":{
      "Eu sou chilena.":"Soy chilena.",
      "Hoje estou cansada.":"Hoy estoy cansada.",
      "Estamos em casa.":"Estamos en casa."
    },
    "Italiano":{
      "Sono cileno.":"Soy chileno.",
      "Sto bene.":"Estoy bien.",
      "Sto a casa":"Me quedo en casa."
    },
    "Neerlandés":{
      "Ik ben student.":"Soy estudiante.",
      "Zij is moe.":"Ella está cansada.",
      "We zijn thuis.":"Estamos en casa."
    }
  })[languageName] || {};
  const rows = String(example || "").split(/\s+\/\s+/).map(raw => {
    const item = raw.trim();
    const translated = item.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
    const target = translated ? translated[1].trim() : item;
    const meaning = translated ? translated[2].trim() : knownTranslations[target] || translation || "";
    return '<tr><td>' + escapeHTML(getTheoryExamplePronoun(target)) + '</td><td><span class="theory-target-word">' + escapeHTML(target) + '</span> ' + speakerButton(target,locale) +
      (meaning ? '<small class="theory-translation">(' + escapeHTML(meaning.replace(/[.]$/,"")) + ')</small>' : '') + '</td></tr>';
  }).join("");
  return '<div class="theory-table-scroll"><table class="theory-example-table"><thead><tr><th>Pronombre</th><th>Ejemplo aplicado</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
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
  return '<p class="theory-slide-text">' + escapeHTML(lesson.lead) + '</p><table class="theory-pronoun-table"><tbody>' + rows + '</tbody></table>' + renderGrammarRuleContent(lesson.rule,lesson.exceptions) + '<section class="theory-example"><span>Ejemplos aplicados</span>' + renderTheoryExampleTable(lesson.example,"",locale,languageName) + '</section>';
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
  if (category === "Vocabulario" && languageName === "Portugués brasileño" && index === 2) {
    const groups = [
      ["Días de la semana",[["segunda-feira","lunes"],["terça-feira","martes"],["quarta-feira","miércoles"],["quinta-feira","jueves"],["sexta-feira","viernes"],["sábado","sábado"],["domingo","domingo"]]],
      ["Meses del año",[["janeiro","enero"],["fevereiro","febrero"],["março","marzo"],["abril","abril"],["maio","mayo"],["junho","junio"],["julho","julio"],["agosto","agosto"],["setembro","septiembre"],["outubro","octubre"],["novembro","noviembre"],["dezembro","diciembre"]]],
      ["Estaciones",[["primavera","primavera"],["verão","verano"],["outono","otoño"],["inverno","invierno"]]],
      ["Partes del día",[["de manhã","por la mañana"],["à tarde","por la tarde"],["à noite","por la noche"],["de madrugada","de madrugada"]]],
      ["Expresiones temporales",[["hoje","hoy"],["ontem","ayer"],["amanhã","mañana"],["depois de amanhã","pasado mañana"],["anteontem","anteayer"],["esta semana","esta semana"],["semana passada","la semana pasada"],["semana que vem","la próxima semana"],["todo dia","todos los días"],["às oito horas","a las ocho"]]]
    ];
    return '<p class="theory-slide-text">Vocabulario temporal esencial para hablar de rutinas, fechas, horarios y planes. Los días y meses se escriben normalmente con minúscula.</p>' +
      groups.map(([heading,entries]) => '<section class="theory-vocab-group"><h3>' + heading + '</h3><table class="theory-pronoun-table"><thead><tr><th>Português</th><th>Español</th></tr></thead><tbody>' +
        entries.map(([term,meaning]) => '<tr><td><strong class="theory-target-word">' + escapeHTML(term) + '</strong> ' + speakerButton(term,locale) + '</td><td>' + escapeHTML(meaning) + '</td></tr>').join("") +
      '</tbody></table></section>').join("");
  }
  if (category === "Vocabulario" && languageName === "Portugués brasileño" && index === 5) {
    const groups = [
      ["Números cardinales",[["zero","cero"],["um / uma","uno / una"],["dois / duas","dos"],["três","tres"],["quatro","cuatro"],["cinco","cinco"],["seis","seis"],["sete","siete"],["oito","ocho"],["nove","nueve"],["dez","diez"],["onze","once"],["doze","doce"],["treze","trece"],["quatorze / catorze","catorce"],["quinze","quince"],["dezesseis","dieciséis"],["dezessete","diecisiete"],["dezoito","dieciocho"],["dezenove","diecinueve"],["vinte","veinte"],["trinta","treinta"],["quarenta","cuarenta"],["cinquenta","cincuenta"],["sessenta","sesenta"],["setenta","setenta"],["oitenta","ochenta"],["noventa","noventa"],["cem","cien"],["cento","ciento (en números compuestos)"],["mil","mil"]]],
      ["Números ordinales",[["primeiro / primeira","primero / primera"],["segundo / segunda","segundo / segunda"],["terceiro / terceira","tercero / tercera"],["quarto / quarta","cuarto / cuarta"],["quinto / quinta","quinto / quinta"],["sexto / sexta","sexto / sexta"],["sétimo / sétima","séptimo / séptima"],["oitavo / oitava","octavo / octava"],["nono / nona","noveno / novena"],["décimo / décima","décimo / décima"]]]
    ];
    return '<p class="theory-slide-text">Los cardinales expresan cantidad; los ordinales indican posición y concuerdan en género con el sustantivo.</p>' +
      groups.map(([heading,entries]) => '<section class="theory-vocab-group"><h3>' + heading + '</h3><table class="theory-pronoun-table"><thead><tr><th>Português</th><th>Español</th></tr></thead><tbody>' +
        entries.map(([term,meaning]) => '<tr><td><strong class="theory-target-word">' + escapeHTML(term) + '</strong> ' + speakerButton(term,locale) + '</td><td>' + escapeHTML(meaning) + '</td></tr>').join("") +
      '</tbody></table></section>').join("") +
      '<section class="theory-note"><strong>Reglas y observaciones</strong><p>Um/uma y dois/duas varían según el género. A partir de 21, se unen decenas y unidades con e: vinte e um, trinta e dois. Los ordinales concuerdan: o primeiro dia, a primeira semana. En Brasil, después de décimo, a menudo se prefiere el cardinal en usos cotidianos (capítulo 11: capítulo onze), según el contexto.</p></section>';
  }
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
  const rows = lesson.rows.map(([form,meaning,usage]) =>
    '<tr><td><strong class="theory-target-word">' + escapeHTML(form) + '</strong> ' + speakerButton(form,locale) + '</td><td>' + escapeHTML(meaning) + '</td><td>' + escapeHTML(usage) + '</td></tr>'
  ).join("");
  const examples = lesson.rows.map(([form,,,example]) =>
    '<p class="theory-target-word">' + escapeHTML(example) + ' ' + speakerButton(example,locale) + '</p><p>' + escapeHTML(form) + '</p>'
  ).join("");
  return '<p class="theory-slide-text">' + escapeHTML(lesson.intro) + '</p><table class="theory-pronoun-table"><thead><tr><th>Forma</th><th>Significado</th><th>Uso</th></tr></thead><tbody>' + rows + '</tbody></table>' + renderGrammarRuleContent(lesson.rule,lesson.exceptions) + '<section class="theory-example"><span>Ejemplos</span>' + examples + '</section>';
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
      '</tbody></table>' + renderGrammarRuleSections("El artículo concuerda con el sustantivo en género y número. La forma masculina depende del sonido inicial; la forma femenina se contrae ante vocal.", "No escribas *il studente ni *la amica. Memoriza el sustantivo junto con su artículo.");
  }
  if (category === "Gramática" && index === 4) {
    const people = ["io","tu","lui / lei","noi","voi","loro"];
    const forms = [["ho parlato","sono andato/a"],["hai parlato","sei andato/a"],["ha parlato","è andato/a"],["abbiamo parlato","siamo andati/e"],["avete parlato","siete andati/e"],["hanno parlato","sono andati/e"]];
    return '<p class="theory-slide-text">El pasado más usado en conversación es el <strong>passato prossimo</strong>: auxiliar en presente (avere o essere) + participio pasado. Se usa para acciones terminadas: ayer, la semana pasada, esta mañana.</p>' +
      '<h3>Conjugación aplicada</h3><table class="theory-pronoun-table"><thead><tr><th>Persona</th><th>parlare · hablar</th><th>andare · ir</th></tr></thead><tbody>' +
      people.map((person,i)=>'<tr><td>'+person+'</td><td><strong class="theory-target-word">'+forms[i][0]+'</strong> '+speakerButton(forms[i][0],locale)+'</td><td><strong class="theory-target-word">'+forms[i][1]+'</strong> '+speakerButton(forms[i][1],locale)+'</td></tr>').join("") +
      '</tbody></table>' + renderGrammarRuleSections("Avere se usa con la mayoría de los verbos transitivos (ho mangiato). Essere se usa con muchos verbos de movimiento, cambio de estado y verbos reflexivos (sono arrivato, mi sono svegliato). Con essere, el participio concuerda en género y número: andato/a/i/e.", "Hay verbos cuyo auxiliar debe aprenderse junto con el verbo.") + '<section class="theory-example"><span>Ejemplos reales</span><p class="theory-target-word">Ieri ho parlato con Maria. ' + speakerButton("Ieri ho parlato con Maria.",locale) + '</p><p>Ayer hablé con María.</p><p class="theory-target-word">Domenica siamo andati a Roma. ' + speakerButton("Domenica siamo andati a Roma.",locale) + '</p><p>El domingo fuimos a Roma.</p></section>';
  }
  if (category === "Gramática" && index === 5) {
    const people = ["io","tu","lui / lei","noi","voi","loro"];
    const forms = [["parlerò","sarò"],["parlerai","sarai"],["parlerà","sarà"],["parleremo","saremo"],["parlerete","sarete"],["parleranno","saranno"]];
    return '<p class="theory-slide-text">El <strong>futuro semplice</strong> expresa predicciones, promesas e intenciones futuras. Las terminaciones son las mismas para los verbos en -are, -ere e -ire, aunque la raíz puede cambiar.</p><table class="theory-pronoun-table"><thead><tr><th>Persona</th><th>parlare · hablar</th><th>essere · ser/estar</th></tr></thead><tbody>' +
      people.map((person,i)=>'<tr><td>'+person+'</td><td><strong class="theory-target-word">'+forms[i][0]+'</strong> '+speakerButton(forms[i][0],locale)+'</td><td><strong class="theory-target-word">'+forms[i][1]+'</strong> '+speakerButton(forms[i][1],locale)+'</td></tr>').join("") +
      '</tbody></table>' + renderGrammarRuleSections("Los verbos en -are cambian la a por e (parlare → parler-). Se añaden -ò, -ai, -à, -emo, -ete, -anno. En conversación, el presente con una expresión temporal también puede indicar futuro.", "Essere y avere son irregulares: sarò y avrò.") + '<section class="theory-example"><span>Ejemplos</span><p class="theory-target-word">Domani parlerò con il professore. ' + speakerButton("Domani parlerò con il professore.",locale) + '</p><p>Mañana hablaré con el profesor.</p><p class="theory-target-word">L’anno prossimo saremo in Italia. ' + speakerButton("L’anno prossimo saremo in Italia.",locale) + '</p><p>El próximo año estaremos en Italia.</p></section>';
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
    detailMarkup += '<section class="theory-example"><span>' + escapeHTML(sampleLabel) + ' · ' + escapeHTML(languageName) + '</span><p class="theory-target-word">' + escapeHTML(sampleByTopic) + '</p></section>';
  }
  $("theory-title").textContent = title;
  $("theory-category").textContent = activeTheoryCategory;
  $("theory-description").innerHTML = detailMarkup;
  bindSpeakerButtons($("theory-description"));
  speech.stop();
  const firstTargetAudio = $("theory-description").querySelector('[data-speak][data-locale="' + locale + '"]');
  if (firstTargetAudio) speech.speak(firstTargetAudio.dataset.speak, locale, { automatic:true });
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
  speech.stop();
  $("theory-topic-list").classList.add("hidden");
  $("theory-grid").classList.remove("hidden");
});
$("theory-back").addEventListener("click", () => {
  speech.stop();
  $("theory-detail").classList.add("hidden");
});
$("theory-prev").addEventListener("click", () => openTheoryTopic(activeTheoryIndex - 1));
$("theory-next").addEventListener("click", () => openTheoryTopic(activeTheoryIndex + 1));
