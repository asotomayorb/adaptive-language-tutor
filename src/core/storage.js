const STORAGE_KEY = "adaptive-language-tutor.progress";
const INTERVALS_DAYS = [1, 3, 7, 14];

function emptyProgress() {
  return { version: 1, sessions: [], vocabulary: [], reviewCards: [] };
}

export function loadProgress(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1) return emptyProgress();
    return {
      ...emptyProgress(),
      ...parsed,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
      reviewCards: Array.isArray(parsed.reviewCards) ? parsed.reviewCards : []
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function persistSession(progress, session, summary, now = Date.now()) {
  const languageId = session.config.languageId || session.config.language;
  progress.sessions.push({
    completedAt: new Date(now).toISOString(),
    language: session.config.language,
    languageId,
    estimatedLevel: session.config.estimatedLevel || null,
    reviewPatterns: Array.isArray(session.errorsToReview) ? session.errorsToReview.slice(-8) : [],
    attempted: summary.attempted,
    correct: summary.correct,
    accuracy: summary.accuracy
  });
  for (const word of session.vocabulary) {
    const key = languageId + ":" + word.term.toLocaleLowerCase();
    const existing = progress.vocabulary.find(item => item.key === key);
    if (existing) existing.lastSeenAt = new Date(now).toISOString();
    else progress.vocabulary.push({
      key, term: word.term, meaning: word.meaning, language: session.config.language,
      languageId, learnedAt: new Date(now).toISOString(), lastSeenAt: new Date(now).toISOString()
    });
  }
  for (const error of session.errors) {
    if (!error.exerciseId) continue;
    const isAiCard = String(error.exerciseId).startsWith("ai-turn-");
    // AI exercises are generated dynamically; turn numbers repeat across sessions.
    // Include the session timestamp and turn so one session cannot overwrite another.
    if (isAiCard && !String(error.expected || "").trim()) continue;
    const key = languageId + ":" + error.exerciseId +
      (isAiCard ? ":session-" + progress.sessions.length + "-" + now + "-turn-" + error.turn : "");
    const existing = progress.reviewCards.find(card => card.key === key);
    const card = {
      key, exerciseId: error.exerciseId, language: session.config.language,
      languageId, prompt: error.prompt, expected: error.expected,
      explanation: error.explanation || "", skill: error.skill || "",
      intervalIndex: 0, repetitions: 0, lastReviewedAt: null,
      dueAt: new Date(now).toISOString()
    };
    if (existing) {
      Object.assign(existing, card);
    } else {
      progress.reviewCards.push(card);
    }
  }
  const patterns = [...new Set((session.errorsToReview || [])
    .filter(item => typeof item === "string")
    .map(item => item.trim())
    .filter(Boolean))].slice(-8);
  for (const pattern of patterns) {
    const key = languageId + ":pattern:" + pattern.toLocaleLowerCase();
    const existing = progress.reviewCards.find(card => card.key === key);
    if (existing) {
      existing.lastSeenAt = new Date(now).toISOString();
      continue;
    }
    progress.reviewCards.push({
      key, cardType: "pattern", language: session.config.language, languageId,
      pattern, prompt: "Recuerda cómo aplicar este patrón en una frase propia.",
      expected: "", explanation: "Piensa en un ejemplo nuevo que puedas usar en una conversación.",
      skill: "Patrones de uso", intervalIndex: 0, repetitions: 0,
      lastReviewedAt: null, lastSeenAt: new Date(now).toISOString(),
      dueAt: new Date(now + 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return progress;
}

export function getDueCards(progress, now = Date.now(), languageId = null) {
  return progress.reviewCards.filter(card =>
    new Date(card.dueAt).getTime() <= now &&
    (!languageId || card.languageId === languageId)
  ).sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
}

export function gradeReview(progress, key, correct, now = Date.now()) {
  const card = progress.reviewCards.find(item => item.key === key);
  if (!card) return null;
  if (correct) {
    card.repetitions = (card.repetitions || 0) + 1;
    card.intervalIndex = Math.min((card.intervalIndex || 0) + 1, INTERVALS_DAYS.length - 1);
  } else {
    card.repetitions = 0;
    card.intervalIndex = 0;
  }
  const days = correct ? INTERVALS_DAYS[card.intervalIndex] : INTERVALS_DAYS[0];
  card.lastReviewedAt = new Date(now).toISOString();
  card.dueAt = new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
  return { card, nextIntervalDays: days };
}

export function getProgressStats(progress, languageId = null) {
  const sessions = progress.sessions.filter(item => !languageId || item.languageId === languageId);
  const words = progress.vocabulary.filter(item => !languageId || item.languageId === languageId);
  const cards = progress.reviewCards.filter(item => !languageId || item.languageId === languageId);
  return {
    sessions: sessions.length,
    vocabulary: words.length,
    pendingReviews: cards.length,
    dueReviews: getDueCards(progress, Date.now(), languageId).length,
    averageAccuracy: sessions.length
      ? Math.round(sessions.reduce((sum, item) => sum + item.accuracy, 0) / sessions.length)
      : 0
  };
}
