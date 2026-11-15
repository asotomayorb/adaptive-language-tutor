import { createSession, recordAnswer, evaluateAnswer, buildSummary, getAdaptation } from "./core/pedagogy.js";
import { ptBR } from "./content/pt-BR.js";
import { english } from "./content/en.js";

const $ = id => document.getElementById(id);
const catalogs = { "Portugués brasileño": ptBR, "Inglés": english };
const topicLabels = { daily:"vida cotidiana", travel:"viajes", food:"comida y restaurantes", work:"trabajo y estudios", random:"tema sorpresa" };
let session = null;
let catalog = null;
let diagnostic = null;
let currentExercise = null;
let reviewExercise = null;
let reviewMode = false;

$("setup-form").addEventListener("submit", event => {
  event.preventDefault();
  catalog = catalogs[$("language").value];
  if (!catalog) return;
  const config = { language:catalog.label, languageId:catalog.id, duration:Number($("duration").value), level:$("level").value, topic:$("topic").value };
  session = createSession(config);
  reviewMode = false;
  $("setup-panel").classList.add("hidden");
  $("summary-panel").classList.add("hidden");
  $("lesson-panel").classList.remove("hidden");
  $("session-status").textContent = "Sesión en curso";
  if (config.level === "diagnostic") startDiagnostic();
  else { session.config.level = config.level; renderLesson(); }
});

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
  $("lesson-content").innerHTML = '<h3>' + exercise.prompt + '</h3><p>Responde según lo que ya sabes. Estas preguntas no cuentan en los turnos de práctica.</p>';
  $("answer-area").innerHTML = exercise.options.map((option,index) => '<button class="answer-option" data-diagnostic="' + index + '">' + option + '</button>').join("");
  $("answer-area").querySelectorAll("[data-diagnostic]").forEach(button => button.addEventListener("click", () => {
    if (Number(button.dataset.diagnostic) === exercise.options.indexOf(exercise.target)) diagnostic.score += 1;
    diagnostic.index += 1;
    if (diagnostic.index < 4) renderDiagnosticQuestion();
    else finishDiagnostic();
  }));
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
  $("lesson-content").innerHTML = '<p class="eyebrow">TEMA: ' + topicLabels[session.config.topic].toUpperCase() + ' · NIVEL ' + levelLabel(session.config.level).toUpperCase() + '</p><h3>' + currentExercise.prompt + '</h3><p>' + (adaptation.message || "Elige una respuesta o escribe la tuya.") + '</p>';
  const options = currentExercise.options.map((option,index) => '<button class="answer-option" data-choice="' + index + '">' + option + '</button>').join("");
  $("answer-area").innerHTML = options + '<input id="free-answer" class="answer-input" placeholder="También puedes escribir tu respuesta…"><button id="submit-free" class="secondary" type="button">Comprobar respuesta escrita</button>';
  $("answer-area").querySelectorAll("[data-choice]").forEach(button => button.addEventListener("click", () => submitAnswer(currentExercise.options[Number(button.dataset.choice)])));
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
  if (!currentExercise) return;
  showFeedback("Pista: " + currentExercise.hint, true);
});

$("review-btn").addEventListener("click", () => {
  const lastError = [...session.errors].reverse().find(error => error.exerciseId);
  if (!lastError) { showFeedback("Todavía no hay errores registrados para repasar.", true); return; }
  reviewExercise = catalog.exercises.find(exercise => exercise.id === lastError.exerciseId);
  if (!reviewExercise) return;
  reviewMode = true;
  $("lesson-phase").textContent = "REPASO";
  $("lesson-content").innerHTML = '<h3>Intenta reconstruir esta frase:</h3><p>' + reviewExercise.prompt + '</p><p>La respuesta se comprobará sin consumir un turno de la sesión.</p>';
  $("answer-area").innerHTML = '<input id="review-answer" class="answer-input" placeholder="Escribe tu respuesta…"><button class="primary" id="check-review" type="button">Comprobar repaso</button>';
  $("check-review").addEventListener("click", () => {
    const ok = evaluateAnswer($("review-answer").value, reviewExercise);
    showFeedback(ok ? "Correcto. " + reviewExercise.explanation : "Respuesta de referencia: " + reviewExercise.target + ". " + reviewExercise.explanation, ok);
    $("answer-area").innerHTML = '<button class="secondary" id="back-to-practice" type="button">Volver a la práctica</button>';
    $("back-to-practice").addEventListener("click", renderLesson);
  });
});

function finishSession() {
  $("lesson-panel").classList.add("hidden");
  $("summary-panel").classList.remove("hidden");
  $("session-status").textContent = "Sesión finalizada";
  const summary = buildSummary(session);
  const diagnosticText = session.config.diagnosticScore === undefined ? "" : '<li>Diagnóstico inicial: ' + session.config.diagnosticScore + '/4 · nivel estimado ' + levelLabel(session.config.level) + '.</li>';
  const focus = summary.recommendedFocus.length ? summary.recommendedFocus.join(", ") : "Mantener la práctica y ampliar vocabulario.";
  $("summary-content").innerHTML = '<p class="intro">Completaste ' + summary.attempted + ' turnos de ' + session.config.language + '.</p><ul class="summary-list">' + diagnosticText + '<li>Respuestas correctas: ' + summary.correct + '/' + summary.attempted + ' (' + summary.accuracy + '%).</li><li>Mejor racha: ' + summary.bestStreak + '.</li><li>Vocabulario aprendido: ' + (summary.vocabulary.map(item => item.term + " (" + item.meaning + ")").join(", ") || "ninguno") + '.</li><li>Errores para reforzar: ' + summary.errors.length + '.</li><li>Próximo foco recomendado: ' + focus + '.</li></ul>';
}

$("new-session").addEventListener("click", () => {
  $("summary-panel").classList.add("hidden");
  $("setup-panel").classList.remove("hidden");
  $("session-status").textContent = "Nueva sesión";
});
$("export-btn").addEventListener("click", () => {
  const data = { exportedAt:new Date().toISOString(), summary:buildSummary(session), config:session.config, answers:session.answers };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = "language-tutor-progress.json"; anchor.click();
  URL.revokeObjectURL(url);
});
