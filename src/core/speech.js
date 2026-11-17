const DEFAULT_PREFERENCE_KEY = "adaptive-language-tutor.audio.auto";

export function findVoiceForLocale(voices, locale) {
  if (!Array.isArray(voices) || !locale) return null;
  const wanted = String(locale).toLowerCase();
  const language = wanted.split("-")[0];
  return voices.find(voice => String(voice.lang || "").toLowerCase() === wanted)
    || voices.find(voice => String(voice.lang || "").toLowerCase().startsWith(language + "-"))
    || null;
}

export function createSpeechController({
  synthesis = globalThis.speechSynthesis,
  Utterance = globalThis.SpeechSynthesisUtterance,
  storage = globalThis.localStorage,
  onStatus = () => {},
  preferenceKey = DEFAULT_PREFERENCE_KEY
} = {}) {
  const supported = Boolean(synthesis && typeof synthesis.speak === "function" && Utterance);
  let enabled = true;
  try { enabled = storage?.getItem(preferenceKey) !== "false"; } catch {}

  function setEnabled(value) {
    enabled = Boolean(value);
    try { storage?.setItem(preferenceKey, String(enabled)); } catch {}
    if (!enabled) synthesis?.cancel?.();
    onStatus({ enabled, supported });
    return enabled;
  }

  function speak(text, locale, { automatic = false } = {}) {
    const phrase = String(text || "").trim();
    if (!phrase || !supported || (automatic && !enabled)) return { spoken: false, reason: "unavailable" };
    synthesis.cancel?.();
    const utterance = new Utterance(phrase);
    if (locale) utterance.lang = locale;
    const voices = synthesis.getVoices?.() || [];
    const voice = findVoiceForLocale(voices, locale);
    if (voice) utterance.voice = voice;
    else if (locale) onStatus({ enabled, supported, fallback: true, locale });
    utterance.onerror = () => onStatus({ enabled, supported, error: true, locale });
    synthesis.speak(utterance);
    return { spoken: true, fallback: Boolean(locale && !voice) };
  }

  function stop() { synthesis?.cancel?.(); }

  onStatus({ enabled, supported });
  return {
    supported,
    get enabled() { return enabled; },
    setEnabled,
    speak,
    stop,
    findVoice: locale => findVoiceForLocale(synthesis?.getVoices?.() || [], locale)
  };
}
