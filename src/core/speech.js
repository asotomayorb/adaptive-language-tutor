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
  const findVoice = locale => {
    try { return findVoiceForLocale(synthesis?.getVoices?.() || [], locale); } catch { return null; }
  };
  let enabled = true;
  let pendingRequest = null;
  let listeningForVoices = false;
  try { enabled = storage?.getItem(preferenceKey) !== "false"; } catch {}

  function getVoices() {
    try { return synthesis?.getVoices?.() || []; } catch { return []; }
  }
  function flushPendingRequest() {
    if (!pendingRequest) return;
    const voices = getVoices();
    if (!voices.length) return;
    const request = pendingRequest;
    pendingRequest = null;
    if (request.type === "single") speak(request.text, request.locale, request.options);
    else speakSequence(request.segments, request.options);
  }
  function waitForVoices(request) {
    if (getVoices().length) return false;
    pendingRequest = request;
    if (!listeningForVoices) {
      listeningForVoices = true;
      if (typeof synthesis?.addEventListener === "function") {
        synthesis.addEventListener("voiceschanged", flushPendingRequest);
      } else if (synthesis) {
        const previous = synthesis.onvoiceschanged;
        synthesis.onvoiceschanged = event => {
          try { previous?.call(synthesis, event); } catch {}
          flushPendingRequest();
        };
      }
    }
    return true;
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    try { storage?.setItem(preferenceKey, String(enabled)); } catch {}
    if (!enabled) { try { synthesis?.cancel?.(); } catch {} }
    onStatus({ enabled, supported, speaking:false, paused:false });
    return enabled;
  }

  function createUtterance(text, locale, onEnd, onBoundary) {
    const utterance = new Utterance(String(text || "").trim());
    if (locale) utterance.lang = locale;
    let voices = [];
    try { voices = synthesis.getVoices?.() || []; } catch {}
    const voice = findVoiceForLocale(voices, locale);
    if (voice) onStatus({ enabled, supported });
    if (voice) utterance.voice = voice;
    else if (locale) onStatus({ enabled, supported, fallback: true, locale });
    utterance.onerror = () => onStatus({ enabled, supported, error: true, locale, speaking:false, paused:false });
    utterance.onboundary = event => onBoundary?.(event);
    utterance.onend = () => { onStatus({ enabled, supported, speaking:false, paused:false }); onEnd?.(); };
    return utterance;
  }

  function speak(text, locale, { automatic = false, onEnd, onBoundary } = {}) {
    const phrase = String(text || "").trim();
    if (!phrase || !supported || (automatic && !enabled)) return { spoken: false, reason: "unavailable" };
    // Never let the browser silently substitute its default (often source-language)
    // voice when the requested target-language voice is not installed.
    if (locale && !findVoice(locale)) {
      if (waitForVoices({ type:"single", text:phrase, locale, options:{ automatic, onEnd, onBoundary } })) {
        onStatus({ enabled, supported, speaking:false, paused:false, waitingForVoices:true, locale });
        return { spoken:true, pending:true };
      }
      onStatus({ enabled, supported, speaking:false, paused:false, missingVoice:true, locale });
      return { spoken:false, reason:"voice-unavailable" };
    }
    pendingRequest = null;
    try {
      synthesis.cancel?.();
      synthesis.speak(createUtterance(phrase, locale, onEnd, onBoundary));
      onStatus({ enabled, supported, speaking:true, paused:false, locale });
      return { spoken: true };
    } catch (error) {
      onStatus({ enabled, supported, error: true, locale });
      return { spoken: false, reason: "playback-error" };
    }
  }

  function speakSequence(segments, { automatic = false } = {}) {
    const requested = (Array.isArray(segments) ? segments : [])
      .filter(item => item && String(item.text || "").trim() && item.locale);
    if (!requested.length || !supported || (automatic && !enabled)) {
      return { spoken:false, reason:requested.length ? "unavailable" : "empty" };
    }
    const voices = getVoices();
    if (!voices.length && waitForVoices({ type:"sequence", segments:requested, options:{ automatic } })) {
      onStatus({ enabled, supported, speaking:false, paused:false, waitingForVoices:true, locale:requested[0].locale });
      return { spoken:true, pending:true };
    }
    const valid = requested.filter(item => findVoice(item.locale));
    if (!valid.length || valid.length !== requested.length) {
      const missing = requested.find(item => !findVoice(item.locale));
      if (missing) onStatus({ enabled, supported, speaking:false, paused:false, missingVoice:true, locale:missing.locale });
      return { spoken:false, reason:"voice-unavailable" };
    }
    pendingRequest = null;
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
