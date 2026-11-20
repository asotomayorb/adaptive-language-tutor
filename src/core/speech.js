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
    utterance.onerror = () => onStatus({ enabled, supported, error: true, locale, speaking:false, paused:false });
    utterance.onend = () => onStatus({ enabled, supported, speaking:false, paused:false });
    return utterance;
  }

  function speak(text, locale, { automatic = false } = {}) {
    const phrase = String(text || "").trim();
    if (!phrase || !supported || (automatic && !enabled)) return { spoken: false, reason: "unavailable" };
    try {
      synthesis.cancel?.();
      synthesis.speak(createUtterance(phrase, locale));
      onStatus({ enabled, supported, speaking:true, paused:false, locale });
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
      onStatus({ enabled, supported, speaking:true, paused:false });
      return { spoken: true, count: valid.length };
    } catch (error) {
      onStatus({ enabled, supported, error: true });
      return { spoken: false, reason: "playback-error" };
    }
  }

  function pause() {
    if (!supported || typeof synthesis.pause !== "function") return false;
    try { synthesis.pause(); onStatus({ enabled, supported, speaking:true, paused:true }); return true; } catch { return false; }
  }

  function resume() {
    if (!supported || typeof synthesis.resume !== "function") return false;
    try { synthesis.resume(); onStatus({ enabled, supported, speaking:true, paused:false }); return true; } catch { return false; }
  }

  function stop() { try { synthesis?.cancel?.(); } catch {} onStatus({ enabled, supported, speaking:false, paused:false }); }

  onStatus({ enabled, supported });
  return {
    supported,
    get enabled() { return enabled; },
    setEnabled,
    speak,
    speakSequence,
    pause,
    resume,
    get paused() { return Boolean(synthesis?.paused); },
    get speaking() { return Boolean(synthesis?.speaking); },
    stop,
    findVoice: locale => { try { return findVoiceForLocale(synthesis?.getVoices?.() || [], locale); } catch { return null; } }
  };
}
