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
      fallbackToSpeechSynthesis(cleanWord, options);
    };

    await audio.play();
    return;
  } catch {
    // Play rejected or failed — fallback to SpeechSynthesis
    fallbackToSpeechSynthesis(cleanWord, options);
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

  // Workaround for iOS WebKit bug: calling speak() immediately after cancel() drops the utterance.
  // We use a small setTimeout (50ms) to ensure the cancel queue is fully cleared.
  window.speechSynthesis.cancel();

  setTimeout(() => {
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
  }, 50);
}
