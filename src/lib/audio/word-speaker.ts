/**
 * Word and Phrase Audio Speaker Utility
 * Handles pronunciation playback via OpenAI TTS with fallback to hardened Web Speech API.
 */

// Global state to prevent garbage collection and handle concurrent playbacks
let activeAudioElement: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let voicesCache: SpeechSynthesisVoice[] = [];

/**
 * Returns current active utterance (prevents garbage collection).
 */
export function getActiveUtterance(): SpeechSynthesisUtterance | null {
  return activeUtterance;
}

/**
 * Preloads browser SpeechSynthesis voices if available.
 */
export function initSpeechVoices(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const load = () => {
    voicesCache = window.speechSynthesis.getVoices();
  };

  load();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.addEventListener("voiceschanged", load);
  }
}

/**
 * Finds the best available English voice in the browser.
 */
function getBestEnglishVoice(): SpeechSynthesisVoice | null {
  if (voicesCache.length === 0 && typeof window !== "undefined" && "speechSynthesis" in window) {
    voicesCache = window.speechSynthesis.getVoices();
  }
  if (voicesCache.length === 0) return null;

  const enVoices = voicesCache.filter(
    (v) => v.lang.startsWith("en-") || v.lang === "en"
  );
  if (enVoices.length === 0) return null;

  const preferred = [
    "Google US English",
    "Samantha",
    "Karen",
    "Daniel",
    "Google UK English Female",
    "Microsoft Aria Online",
  ];

  for (const name of preferred) {
    const match = enVoices.find((v) => v.name.includes(name));
    if (match) return match;
  }

  return enVoices.find((v) => v.lang === "en-US") || enVoices[0] || null;
}

/**
 * Clean up currently playing audio or speech.
 */
export function stopAllSpeech(): void {
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement.removeAttribute("src");
    activeAudioElement = null;
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

export interface PlayWordOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

/**
 * Preload word pronunciation audio in the background to ensure instant playback on tap.
 */
export function preloadWordAudio(words: string[]): void {
  if (typeof window === "undefined") return;

  const seen = new Set<string>();
  for (const raw of words) {
    const clean = raw.replace(/^[^\w]+|[^\w]+$/g, "").trim();
    if (!clean || clean.length <= 1) continue;
    const lower = clean.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);

    try {
      const audioUrl = `/api/tts?text=${encodeURIComponent(clean)}`;
      fetch(audioUrl, { method: "GET", cache: "force-cache" }).catch(() => {});
    } catch {
      // ignore
    }
  }
}

/**
 * Plays the pronunciation of a word or short phrase.
 * Priority 1: High-fidelity MP3 from /api/tts (works even when iPhone mute switch is ON).
 * Priority 2: Hardened SpeechSynthesis with iOS Safari bug workarounds.
 */
export async function playWordAudio(rawText: string, options: PlayWordOptions = {}): Promise<void> {
  const { onStart, onEnd } = options;

  // Clean and sanitize the word
  const cleanWord = rawText.replace(/^[^\w]+|[^\w]+$/g, "").trim();
  if (!cleanWord) return;

  stopAllSpeech();

  let fallbackTriggered = false;
  const triggerFallback = () => {
    if (fallbackTriggered) return;
    fallbackTriggered = true;
    fallbackToSpeechSynthesis(cleanWord, options);
  };

  // 1. Try server-side TTS audio (MP3 works even on silent mode)
  try {
    const audioUrl = `/api/tts?text=${encodeURIComponent(cleanWord)}`;
    const audio = new Audio(audioUrl);
    activeAudioElement = audio;

    audio.onplay = () => {
      onStart?.();
    };

    audio.onended = () => {
      activeAudioElement = null;
      onEnd?.();
    };

    audio.onerror = () => {
      // Audio load or network failed — fallback to SpeechSynthesis
      triggerFallback();
    };

    await audio.play();
    return;
  } catch {
    // Play rejected or failed — fallback to SpeechSynthesis
    triggerFallback();
  }
}

/**
 * Fallback SpeechSynthesis with iOS WebKit queue bug workarounds and GC reference holding.
 */
function fallbackToSpeechSynthesis(cleanWord: string, options: PlayWordOptions = {}): void {
  const { onStart, onEnd, onError } = options;

  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onError?.(new Error("Speech synthesis not supported in this browser"));
    onEnd?.();
    return;
  }

  // Ensure speech synthesis is not stuck in paused state (Android / Chrome quirk)
  if (window.speechSynthesis.paused) {
    try {
      window.speechSynthesis.resume();
    } catch {
      // ignore
    }
  }

  const isSpeaking = window.speechSynthesis.speaking || window.speechSynthesis.pending;
  if (isSpeaking) {
    window.speechSynthesis.cancel();
  }

  const executeSpeak = () => {
    try {
      const utterance = new SpeechSynthesisUtterance(cleanWord);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      const voice = getBestEnglishVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }

      utterance.onstart = () => {
        onStart?.();
      };

      utterance.onend = () => {
        activeUtterance = null;
        onEnd?.();
      };

      utterance.onerror = (e) => {
        activeUtterance = null;
        onError?.(e);
        onEnd?.();
      };

      // Retain reference globally to prevent garbage collection from dropping speech halfway
      activeUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      activeUtterance = null;
      onError?.(err);
      onEnd?.();
    }
  };

  // If we had to cancel active speech, wait 30ms to avoid WebKit queue drop bug.
  // Otherwise execute synchronously immediately to preserve user activation gesture!
  if (isSpeaking) {
    setTimeout(executeSpeak, 30);
  } else {
    executeSpeak();
  }
}
