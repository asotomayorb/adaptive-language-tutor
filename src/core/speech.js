const DEFAULT_PREFERENCE_KEY = "adaptive-language-tutor.audio.auto";

export function findVoiceForLocale(voices, locale) {
  if (!Array.isArray(voices) || !locale) return null;
  const wanted = String(locale).toLowerCase();
  const language = wanted.split("-")[0];
  return voices.find(voice => String(voice.lang || "").toLowerCase() === wanted)
    || voices.find(voice => String(voice.lang || "").toLowerCase() === language)
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
    if (!enabled) { try { synthesis?.cancel?.(); } catch {} }
    onStatus({ enabled, supported });
    return enabled;
  }

  function createUtterance(text, locale) {
    const utterance = new Utterance(String(text || "").trim());
    if (locale) utterance.lang = locale;
    let voices = [];
    try { voices = synthesis.getVoices?.() || []; } catch {}
    const voice = findVoiceForLocale(voices, locale);
    if (voice) onStatus({ enabled, supported });
    if (voice) utterance.voice = voice;
    else if (locale) onStatus({ enabled, supported, fallback: true, locale });
    utterance.onerror = () => onStatus({ enabled, supported, error: true, locale });
    return utterance;
  }

  function speak(text, locale, { automatic = false } = {}) {
    const phrase = String(text || "").trim();
    if (!phrase || !supported || (automatic && !enabled)) return { spoken: false, reason: "unavailable" };
    try {
      synthesis.cancel?.();
      synthesis.speak(createUtterance(phrase, locale));
      return { spoken: true };
    } catch (error) {
      onStatus({ enabled, supported, error: true, locale });
      return { spoken: false, reason: "playback-error" };
    }
  }

  function speakSequence(segments, { automatic = false } = {}) {
    const valid = (Array.isArray(segments) ? segments : [])
      .filter(item => item && String(item.text || "").trim());
    if (!valid.length || !supported || (automatic && !enabled)) return { spoken: false, reason: "unavailable" };
    try {
      synthesis.cancel?.();
      valid.forEach(item => synthesis.speak(createUtterance(item.text, item.locale)));
      return { spoken: true, count: valid.length };
    } catch (error) {
      onStatus({ enabled, supported, error: true });
      return { spoken: false, reason: "playback-error" };
    }
  }

  function stop() { try { synthesis?.cancel?.(); } catch {} }

  onStatus({ enabled, supported });
  return {
    supported,
    get enabled() { return enabled; },
    setEnabled,
    speak,
    speakSequence,
    stop,
    findVoice: locale => { try { return findVoiceForLocale(synthesis?.getVoices?.() || [], locale); } catch { return null; } }
  };
}
