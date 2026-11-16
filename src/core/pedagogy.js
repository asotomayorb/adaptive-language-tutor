const normalize = (value = "") => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[¿?¡!.,;:]/g, "").replace(/\s+/g, " ").trim();

export function applyLearnerUpdate(session, learnerUpdate) {
  const estimatedLevel = learnerUpdate?.estimatedLevel;
  if (typeof estimatedLevel === "string" && estimatedLevel.trim()) {
    session.config.estimatedLevel = estimatedLevel.trim().slice(0, 32);
  }

  const patterns = Array.isArray(learnerUpdate?.errorsToReview)
    ? learnerUpdate.errorsToReview
        .filter(item => typeof item === "string")
        .map(item => item.trim().slice(0, 160))
        .filter(Boolean)
    : [];
  session.errorsToReview ||= [];
  for (const pattern of patterns) {
    if (!session.errorsToReview.some(item => item.toLocaleLowerCase() === pattern.toLocaleLowerCase())) {
      session.errorsToReview.push(pattern);
    }
  }
  session.errorsToReview = session.errorsToReview.slice(-8);
  return session.config.estimatedLevel || null;
}

export function createSession(config) {
  return {
    config: { ...config },
    turn: 0,
    correct: 0,
    attempted: 0,
    streak: 0,
    bestStreak: 0,
    consecutiveCorrect: 0,
    consecutiveErrors: 0,
    errors: [],
    errorsToReview: [],
    vocabulary: [],
    reviewQueue: [],
    answers: []
  };
}

export function evaluateAnswer(rawAnswer, exercise) {
  const answer = normalize(rawAnswer);
  const accepted = [exercise.target, ...(exercise.acceptedAnswers || [])].map(normalize);
  return answer.length > 0 && accepted.includes(answer);
}

export function recordAnswer(session, exercise, rawAnswer) {
  const correct = evaluateAnswer(rawAnswer, exercise);
  const attempt = {
    turn: session.turn + 1,
    exerciseId: exercise.id,
    prompt: exercise.prompt,
    submitted: String(rawAnswer || "").trim(),
    expected: exercise.target,
    correct
  };

  session.attempted += 1;
  session.answers.push(attempt);

  if (correct) {
    session.correct += 1;
    session.streak += 1;
    session.bestStreak = Math.max(session.bestStreak, session.streak);
    session.consecutiveCorrect += 1;
    session.consecutiveErrors = 0;
    if (!session.vocabulary.some(item => item.term === exercise.term)) {
      session.vocabulary.push({ term: exercise.term, meaning: exercise.meaning, language: session.config.language });
    }
  } else {
    session.streak = 0;
    session.consecutiveErrors += 1;
    session.consecutiveCorrect = 0;
    session.errors.push({ ...attempt, explanation: exercise.explanation, skill: exercise.skill });
    session.reviewQueue.push({ exerciseId: exercise.id, dueAfter: session.turn + 2, attempts: 0 });
  }

  session.turn += 1;
  return { correct, attempt, adaptation: getAdaptation(session) };
}

export function getAdaptation(session) {
  if (session.consecutiveErrors >= 2) {
    return { mode: "scaffold", message: "Vamos a simplificar: una frase más corta y una pista adicional." };
  }
  if (session.consecutiveCorrect >= 3) {
    return { mode: "challenge", message: "Tres aciertos seguidos. Podemos aumentar ligeramente la dificultad." };
  }
  return { mode: "standard", message: "" };
}

export function getDueReviews(session) {
  return session.reviewQueue.filter(item => item.dueAfter <= session.turn);
}

export function buildSummary(session) {
  const accuracy = session.attempted ? Math.round((session.correct / session.attempted) * 100) : 0;
  return {
    turns: session.turn,
    attempted: session.attempted,
    correct: session.correct,
    accuracy,
    bestStreak: session.bestStreak,
    errors: session.errors,
    vocabulary: session.vocabulary,
    recommendedFocus: [...new Set(session.errors.map(error => error.skill).filter(Boolean))],
    reviewPatterns: [...new Set((session.errorsToReview || []).filter(Boolean))]
  };
}

export function normalizeForComparison(value) {
  return normalize(value);
}


export function recordTutorEvaluation(session, {
  exerciseId, prompt, submitted, expected = "", status = "not_applicable",
  feedback = "", skill = "Producción"
}) {
  const evaluated = ["correct", "partially_correct", "incorrect"].includes(status);
  const correct = status === "correct";
  const attempt = {
    turn: session.turn + 1,
    exerciseId,
    prompt,
    submitted: String(submitted || "").trim(),
    expected: String(expected || ""),
    correct,
    evaluationStatus: evaluated ? status : "not_applicable"
  };

  session.turn += 1;
  session.answers.push(attempt);

  if (!evaluated) return { attempt, correct: false, evaluated: false };

  session.attempted += 1;
  if (correct) {
    session.correct += 1;
    session.streak += 1;
    session.bestStreak = Math.max(session.bestStreak, session.streak);
    session.consecutiveCorrect += 1;
    session.consecutiveErrors = 0;
  } else {
    session.streak = 0;
    session.consecutiveErrors += 1;
    session.consecutiveCorrect = 0;
    if (status === "incorrect" || status === "partially_correct") {
      session.errors.push({
        ...attempt,
        explanation: feedback || "",
        skill: skill || "Producción"
      });
    }
  }

  return { attempt, correct, evaluated: true };
}
