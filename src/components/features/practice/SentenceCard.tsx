"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Play, Pause, RotateCcw, Sparkles, Volume2 } from "lucide-react";
import { SentenceResponse } from "@/types";
import { getChunkSlashIndices } from "@/lib/diff/chunk-splitter";
import { calculatePlaybackWpmMap, PlaybackSpeed } from "@/lib/diff/wpm-calculator";
import {
  getWordTranslation,
  fetchWordTranslationAsync,
  cleanWord,
} from "@/lib/practice/word-dictionary";
import {
  isAndroidBrowser,
  isIOSBrowser,
  getShadowingPlaybackSettleDelayMs,
} from "@/hooks/use-audio-recorder";

const VOLUME_BOOST_STORAGE_KEY = "shadowlog_volume_boost";
// Gain multipliers (> 1.0 amplifies HTMLAudioElement via Web Audio API GainNode + Compressor limiter)
const BOOST_GAIN_NORMAL = 2.2;
const BOOST_GAIN_SHADOWING = 2.6;

interface SentenceCardProps {
  sentence: SentenceResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
  showChunkSlash?: boolean;
  isRecording?: boolean;
  recordingType?: "repeating" | "shadowing";
}

interface ParsedWord {
  id: number;
  text: string;
  charStart: number;
  charEnd: number;
  startProgress: number;
  endProgress: number;
}

// Subtle pre-roll delay (250ms on iOS/Desktop, 380ms on Android) before audio starts playing.
// Allows the user's eye to lock onto the highlighted first word and wakes up Bluetooth earbuds from standby.
const AUDIO_PLAYBACK_DELAY_MS = 250;
const AUDIO_PLAYBACK_DELAY_ANDROID_MS = 380;
// Safety fallback timeout if `shadowlog:shadowing-mic-ready` does not arrive within 1.8s
const SHADOWING_PREPARE_FALLBACK_MS = 1800;

/**
 * Finds the best English voice available in the browser's SpeechSynthesis.
 */
function findBestEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const enVoices = voices.filter(
    (v) => v.lang.startsWith("en-") || v.lang === "en"
  );
  if (enVoices.length === 0) return null;

  const preferredNames = [
    "Google US English",
    "Google UK English Female",
    "Google UK English Male",
    "Samantha",
    "Karen",
    "Daniel",
    "Microsoft Aria Online",
    "Microsoft Jenny Online",
  ];

  for (const name of preferredNames) {
    const found = enVoices.find((v) => v.name === name);
    if (found) return found;
  }

  const enUS = enVoices.find((v) => v.lang === "en-US");
  if (enUS) return enUS;

  return enVoices[0] || null;
}

export function SentenceCard({
  sentence,
  isLoading,
  onRefresh,
  showChunkSlash = true,
  isRecording = false,
  recordingType = "repeating",
}: SentenceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1.0);
  const [flippedWordIndices, setFlippedWordIndices] = useState<Set<number>>(new Set());
  const [dynamicTranslations, setDynamicTranslations] = useState<Record<string, string>>({});
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isVolumeBoosted, setIsVolumeBoosted] = useState<boolean>(false);
  // Web Audio boost is disabled on iOS: routing <audio> through AudioContext there makes playback
  // follow the silent switch and can go silent if the context is suspended. iPhone doesn't need it.
  const [isBoostSupported, setIsBoostSupported] = useState<boolean>(false);
  const [, setVoicesLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackAudioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const connectedElementsRef = useRef<WeakSet<HTMLAudioElement>>(new WeakSet());
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const playDelayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const awaitingShadowingMicRef = useRef<boolean>(false);
  const activePrimerStopRef = useRef<(() => void) | null>(null);

  const stopBluetoothPrimer = useCallback(() => {
    if (activePrimerStopRef.current) {
      activePrimerStopRef.current();
      activePrimerStopRef.current = null;
    }
  }, []);

  // Initialize volume boost preference (auto-enabled by default on Android to counteract Bluetooth/OS ducking)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasWebAudio = Boolean(
      window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    );
    const supported = hasWebAudio && !isIOSBrowser();
    setIsBoostSupported(supported);
    if (!supported) {
      setIsVolumeBoosted(false);
      return;
    }
    try {
      const saved = localStorage.getItem(VOLUME_BOOST_STORAGE_KEY);
      if (saved === "true") {
        setIsVolumeBoosted(true);
      } else if (saved === "false") {
        setIsVolumeBoosted(false);
      } else if (isAndroidBrowser()) {
        setIsVolumeBoosted(true);
      }
    } catch {
      if (isAndroidBrowser()) {
        setIsVolumeBoosted(true);
      }
    }
  }, []);

  // Close the playback AudioContext on unmount to avoid leaking audio contexts
  useEffect(() => {
    return () => {
      stopBluetoothPrimer();
      const ctx = playbackAudioCtxRef.current;
      if (ctx && ctx.state !== "closed") {
        ctx.close().catch(() => {});
      }
      playbackAudioCtxRef.current = null;
      gainNodeRef.current = null;
    };
  }, [stopBluetoothPrimer]);

  // Compute target Web Audio gain value
  const getTargetGain = useCallback(
    (boosted: boolean, rec: boolean, recType?: "repeating" | "shadowing") => {
      if (!boosted) return 1.0;
      return rec && recType === "shadowing"
        ? BOOST_GAIN_SHADOWING
        : BOOST_GAIN_NORMAL;
    },
    []
  );

  // Connect HTMLAudioElement to Web Audio API GainNode + DynamicsCompressorNode (soft limiter)
  const ensureWebAudioBoost = useCallback(
    (audio: HTMLAudioElement) => {
      if (typeof window === "undefined") return;
      audio.volume = 1.0;
      if (!isBoostSupported) return;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;

      try {
        let ctx = playbackAudioCtxRef.current;
        if (!ctx || ctx.state === "closed") {
          ctx = new AudioCtx({ latencyHint: "playback" });
          playbackAudioCtxRef.current = ctx;

          const gainNode = ctx.createGain();
          gainNode.gain.value = getTargetGain(
            isVolumeBoosted,
            isRecording,
            recordingType
          );

          // Soft limiter so boosted audio never clips even at 2.6x gain
          const compressor = ctx.createDynamicsCompressor();
          compressor.threshold.value = -3;
          compressor.knee.value = 6;
          compressor.ratio.value = 12;
          compressor.attack.value = 0.003;
          compressor.release.value = 0.15;

          gainNode.connect(compressor);
          compressor.connect(ctx.destination);
          gainNodeRef.current = gainNode;
        }

        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }

        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = getTargetGain(
            isVolumeBoosted,
            isRecording,
            recordingType
          );
        }

        if (!connectedElementsRef.current.has(audio) && gainNodeRef.current) {
          const source = ctx.createMediaElementSource(audio);
          source.connect(gainNodeRef.current);
          connectedElementsRef.current.add(audio);
        }
      } catch (err) {
        // Fallback gracefully to standard HTMLAudioElement output if Web Audio API fails
        console.warn("Web Audio API boost connection skipped:", err);
      }
    },
    [getTargetGain, isVolumeBoosted, isRecording, recordingType, isBoostSupported]
  );

  // Emits a sub-audible (-74 dB, gain 0.0002) continuous sine primer through Web Audio API.
  // Digital 0.0 is ignored by Bluetooth A2DP codecs and wireless earbud DACs (e.g. Galaxy Buds FE),
  // causing the first ~0.5s (1 word) to be swallowed while the earbud DAC wakes up or re-locks
  // after Android AudioFlinger opens the microphone. Non-zero sub-audible PCM keeps the Bluetooth
  // sink awake and locked so word 1 is 100% audible from 0.00s.
  const primeBluetoothAudioOutput = useCallback(
    (durationMs: number) => {
      if (typeof window === "undefined" || !isBoostSupported) return;
      stopBluetoothPrimer();

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;

      try {
        let ctx = playbackAudioCtxRef.current;
        if (!ctx || ctx.state === "closed") {
          if (audioRef.current) {
            ensureWebAudioBoost(audioRef.current);
            ctx = playbackAudioCtxRef.current;
          } else {
            ctx = new AudioCtx({ latencyHint: "playback" });
            playbackAudioCtxRef.current = ctx;
          }
        }
        if (!ctx) return;

        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }

        const osc = ctx.createOscillator();
        const primerGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 440;
        // 0.0002 (-74 dB) is completely inaudible to humans but non-zero in 16-bit PCM (~6 LSBs)
        primerGain.gain.value = 0.0002;

        osc.connect(primerGain);
        primerGain.connect(ctx.destination);
        osc.start();

        let stopped = false;
        const cleanup = () => {
          if (stopped) return;
          stopped = true;
          try {
            osc.stop();
          } catch {
            // ignore
          }
          try {
            osc.disconnect();
            primerGain.disconnect();
          } catch {
            // ignore
          }
        };

        const timer = setTimeout(() => {
          cleanup();
          if (activePrimerStopRef.current === stopFn) {
            activePrimerStopRef.current = null;
          }
        }, Math.max(100, durationMs));

        const stopFn = () => {
          clearTimeout(timer);
          cleanup();
        };
        activePrimerStopRef.current = stopFn;
      } catch {
        // Ignore primer errors gracefully
      }
    },
    [isBoostSupported, stopBluetoothPrimer, ensureWebAudioBoost]
  );

  // Dynamically update GainNode whenever boost toggle or shadowing state changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = getTargetGain(
        isVolumeBoosted,
        isRecording,
        recordingType
      );
    }
    if (audioRef.current) {
      audioRef.current.volume = 1.0;
    }
  }, [isVolumeBoosted, isRecording, recordingType, getTargetGain]);

  const toggleVolumeBoost = useCallback(() => {
    setIsVolumeBoosted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(VOLUME_BOOST_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Self-healing OpenAI TTS audio state when a sentence is loaded without pre-attached audioBase64
  const [fetchedAudioBase64, setFetchedAudioBase64] = useState<string | undefined>(undefined);
  const resolvedAudioBase64 = sentence?.audioBase64 || fetchedAudioBase64;

  const stopAnimationLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const clearPendingPlay = useCallback(() => {
    if (playDelayTimerRef.current) {
      clearTimeout(playDelayTimerRef.current);
      playDelayTimerRef.current = null;
    }
    awaitingShadowingMicRef.current = false;
    setIsPreparingAudio(false);
    stopBluetoothPrimer();
  }, [stopBluetoothPrimer]);

  const stopModelAudio = useCallback(() => {
    clearPendingPlay();
    stopAnimationLoop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.muted = false;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setActiveWordIndex(null);
  }, [clearPendingPlay, stopAnimationLoop]);

  // Immediately stop model audio when microphone recording starts in repeating mode
  useEffect(() => {
    if (isRecording && recordingType !== "shadowing") {
      stopModelAudio();
    }
  }, [isRecording, recordingType, stopModelAudio]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleForceStop = () => stopModelAudio();
    window.addEventListener("shadowlog:stop-model-audio", handleForceStop);
    return () => window.removeEventListener("shadowlog:stop-model-audio", handleForceStop);
  }, [stopModelAudio]);

  // Pronounce an individual English word via SpeechSynthesis (User request ②)
  const speakSingleWord = useCallback(
    (rawWord: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const cleaned = cleanWord(rawWord);
      if (!cleaned) return;

      try {
        // If whole sentence model audio is playing, pause it so single word pronunciation is clearly audible
        if (isPlaying) {
          stopModelAudio();
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleaned);
        utterance.lang = "en-US";
        utterance.rate = 0.85; // Clean, natural, articulate pronunciation pace for single-word learning
        utterance.pitch = 1.0;

        const bestVoice = findBestEnglishVoice(voicesRef.current);
        if (bestVoice) {
          utterance.voice = bestVoice;
          utterance.lang = bestVoice.lang;
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("Single-word speech synthesis error:", err);
      }
    },
    [isPlaying, stopModelAudio]
  );

  // Toggle word flip between English and Japanese, and pronounce the word
  const toggleWordFlip = useCallback(
    (idx: number, rawWord: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setFlippedWordIndices((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) {
          next.delete(idx);
        } else {
          next.add(idx);
        }
        return next;
      });

      // Pronounce the English word on tap (User request ②)
      speakSingleWord(rawWord);

      // Background contextual refinement for any word not covered by static dictionary
      const cleaned = cleanWord(rawWord);
      const currentTrans = dynamicTranslations[cleaned] || getWordTranslation(rawWord);
      if (currentTrans.startsWith("訳: ") && sentence?.english) {
        fetchWordTranslationAsync(rawWord, sentence.english).then((refined) => {
          if (refined && refined !== currentTrans) {
            setDynamicTranslations((prev) => ({ ...prev, [cleaned]: refined }));
          }
        });
      }
    },
    [dynamicTranslations, sentence?.english, speakSingleWord]
  );

  // Parse English sentence into words with weighted timing distribution for natural speech pacing
  const parsedWords = useMemo<ParsedWord[]>(() => {
    if (!sentence?.english) return [];
    const words: { id: number; text: string; charStart: number; charEnd: number; weight: number }[] = [];
    const regex = /\S+/g;
    let match: RegExpExecArray | null;
    let id = 0;
    while ((match = regex.exec(sentence.english)) !== null) {
      // Base weight of 3.0 + word character length
      // Gives short words ("a", "to", "I") a natural acoustic minimum duration instead of rushing past them
      const weight = match[0].length + 3.0;
      words.push({
        id: id++,
        text: match[0],
        charStart: match.index,
        charEnd: match.index + match[0].length,
        weight,
      });
    }

    const totalWeight = words.reduce((sum, w) => sum + w.weight, 0);
    let accumulated = 0;
    return words.map((w) => {
      const startProgress = accumulated / totalWeight;
      accumulated += w.weight;
      const endProgress = accumulated / totalWeight;
      return {
        id: w.id,
        text: w.text,
        charStart: w.charStart,
        charEnd: w.charEnd,
        startProgress,
        endProgress,
      };
    });
  }, [sentence?.english]);

  // Compute chunk break indices without modifying words or layout
  const chunkSlashIndices = useMemo(() => {
    if (!showChunkSlash || parsedWords.length === 0) return new Set<number>();
    return getChunkSlashIndices(parsedWords.map((w) => w.text));
  }, [showChunkSlash, parsedWords]);

  // Dynamic WPM map (0.6x, 1.0x, 1.2x) calculated from real audio duration & word count
  const speedWpmMap = useMemo(() => {
    const count = parsedWords.length || sentence?.wordCount || 0;
    return calculatePlaybackWpmMap(count, audioDuration);
  }, [parsedWords.length, sentence?.wordCount, audioDuration]);

  const startAnimationLoop = useCallback(() => {
    stopAnimationLoop();

    const updateHighlight = () => {
      const audio = audioRef.current;
      if (!audio || audio.paused || audio.ended) {
        stopAnimationLoop();
        return;
      }

      if (audio.duration && audio.duration > 0 && parsedWords.length > 0) {
        // OpenAI TTS MP3 audio typically has ~0.35s of trailing silence at the end.
        // Calibrate active speech duration so the final word doesn't lag after the audio has finished
        const trailingSilence = 0.35;
        const activeDuration = Math.max(0.4, audio.duration - trailingSilence);

        // Lead-time offset (~0.25s adjusted for playback rate)
        // Highlights the word slightly ahead of speech onset to match cognitive reading speed
        const leadTime = 0.25 * audio.playbackRate;
        const effectiveTime = Math.max(0, audio.currentTime + leadTime);
        const progress = Math.min(0.999, effectiveTime / activeDuration);

        let currentIdx = 0;
        for (let i = 0; i < parsedWords.length; i++) {
          if (progress < parsedWords[i].endProgress || i === parsedWords.length - 1) {
            currentIdx = i;
            break;
          }
        }
        setActiveWordIndex(currentIdx);
      }

      rafIdRef.current = requestAnimationFrame(updateHighlight);
    };

    rafIdRef.current = requestAnimationFrame(updateHighlight);
  }, [parsedWords, stopAnimationLoop]);

  // Pre-load SpeechSynthesis voices (Chrome loads them asynchronously)
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        voicesRef.current = available;
        setVoicesLoaded(true);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  // Reset playback, highlight state, and audio element when sentence changes
  useEffect(() => {
    setIsPlaying(false);
    setActiveWordIndex(null);
    setFlippedWordIndices(new Set());
    setDynamicTranslations({});
    setFetchedAudioBase64(undefined);
    clearPendingPlay();
    stopAnimationLoop();
    setAudioDuration(null);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current = null;
    }

    return () => {
      clearPendingPlay();
      stopAnimationLoop();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current = null;
      }
    };
  }, [sentence?.id, clearPendingPlay, stopAnimationLoop]);

  // Self-healing OpenAI TTS fallback: if sentence has English text but lacks audioBase64
  // (e.g. loaded from review card or local fallback), fetch OpenAI TTS MP3 automatically
  // so mobile playback never falls back to OS speechSynthesis (which breaks shadowing recording).
  useEffect(() => {
    if (!sentence?.english || sentence.audioBase64 || fetchedAudioBase64) return;
    let cancelled = false;

    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: sentence.english,
        level: sentence.level,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { audioBase64?: string } | null) => {
        if (!cancelled && data?.audioBase64) {
          setFetchedAudioBase64(data.audioBase64);
        }
      })
      .catch(() => {
        // Ignore network error; SpeechSynthesis fallback remains as last resort
      });

    return () => {
      cancelled = true;
    };
  }, [sentence?.id, sentence?.english, sentence?.level, sentence?.audioBase64, fetchedAudioBase64]);

  // Pre-load audio metadata when resolvedAudioBase64 is available to measure real duration and calculate dynamic WPM
  useEffect(() => {
    if (!resolvedAudioBase64) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current = null;
    }

    const audio = new Audio(`data:audio/mp3;base64,${resolvedAudioBase64}`);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration);
      }
    };

    if (audio.readyState >= 1 && audio.duration && isFinite(audio.duration) && audio.duration > 0) {
      setAudioDuration(audio.duration);
    } else {
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    }

    audio.onended = () => {
      setIsPlaying(false);
      setIsPreparingAudio(false);
      setActiveWordIndex(null);
      clearPendingPlay();
      stopAnimationLoop();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("shadowlog:model-audio-ended"));
      }
    };

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [resolvedAudioBase64, clearPendingPlay, stopAnimationLoop]);

  const speakWithSpeechSynthesis = useCallback(
    (text: string, customDelayMs?: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      const delayMs =
        customDelayMs ??
        (isAndroidBrowser() ? AUDIO_PLAYBACK_DELAY_ANDROID_MS : AUDIO_PLAYBACK_DELAY_MS);

      clearPendingPlay();
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = playbackSpeed;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const bestVoice = findBestEnglishVoice(voicesRef.current);
      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
      }

      // Word boundary event for highlighting words as they are spoken
      utterance.onboundary = (e: SpeechSynthesisEvent) => {
        if (e.name === "word") {
          const charIndex = e.charIndex;
          const idx = parsedWords.findIndex(
            (w) => charIndex >= w.charStart && charIndex <= w.charEnd
          );
          if (idx !== -1) {
            setActiveWordIndex(idx);
          }
        }
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPreparingAudio(false);
        setActiveWordIndex(null);
        clearPendingPlay();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("shadowlog:model-audio-ended"));
        }
      };

      utterance.onerror = (e) => {
        console.warn("SpeechSynthesis error:", e);
        setIsPlaying(false);
        setIsPreparingAudio(false);
        setActiveWordIndex(null);
        clearPendingPlay();
      };

      setIsPlaying(true);
      if (parsedWords.length > 0) {
        setActiveWordIndex(0);
      }

      primeBluetoothAudioOutput(delayMs + 120);

      playDelayTimerRef.current = setTimeout(() => {
        setIsPreparingAudio(false);
        window.speechSynthesis.speak(utterance);
      }, delayMs);
    },
    [playbackSpeed, parsedWords, clearPendingPlay, primeBluetoothAudioOutput]
  );

  // Ensure the HTMLAudioElement is created and routed through Web Audio boost if enabled
  const ensureAudioElementReady = useCallback(() => {
    if (!resolvedAudioBase64 || !sentence) return null;

    if (!audioRef.current) {
      const audio = new Audio(`data:audio/mp3;base64,${resolvedAudioBase64}`);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setIsPreparingAudio(false);
        setActiveWordIndex(null);
        clearPendingPlay();
        stopAnimationLoop();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("shadowlog:model-audio-ended"));
        }
      };

      audio.onerror = () => {
        console.warn("TTS audio playback failed, falling back to SpeechSynthesis");
        audioRef.current = null;
        clearPendingPlay();
        stopAnimationLoop();
        speakWithSpeechSynthesis(sentence.english);
      };
    }

    const audio = audioRef.current;
    if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
      setAudioDuration(audio.duration);
    }

    audio.playbackRate = playbackSpeed;
    audio.volume = 1.0;

    if (isVolumeBoosted || connectedElementsRef.current.has(audio)) {
      ensureWebAudioBoost(audio);
    }

    return audio;
  }, [
    resolvedAudioBase64,
    sentence,
    playbackSpeed,
    isVolumeBoosted,
    ensureWebAudioBoost,
    clearPendingPlay,
    stopAnimationLoop,
    speakWithSpeechSynthesis,
  ]);

  // Starts model audio playback after `delayMs` while keeping Bluetooth earbuds awake with a sub-audible primer
  const startActualModelPlayback = useCallback(
    (delayMs: number, isShadowingMode = false) => {
      if (!sentence) return;

      if (resolvedAudioBase64) {
        const audio = ensureAudioElementReady();
        if (!audio) return;

        if (playDelayTimerRef.current) {
          clearTimeout(playDelayTimerRef.current);
          playDelayTimerRef.current = null;
        }

        audio.pause();
        audio.currentTime = 0;

        setIsPlaying(true);
        if (isShadowingMode) {
          setIsPreparingAudio(true);
        }
        if (parsedWords.length > 0) {
          setActiveWordIndex(0);
        }

        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = getTargetGain(
            isVolumeBoosted,
            isShadowingMode || isRecording,
            isShadowingMode ? "shadowing" : recordingType
          );
        }

        // Stream sub-audible non-zero PCM so wireless earbuds (e.g. Galaxy Buds FE) wake up
        // and finish locking their Bluetooth audio route before word 1 begins at 0.00s.
        primeBluetoothAudioOutput(delayMs + 150);

        playDelayTimerRef.current = setTimeout(() => {
          playDelayTimerRef.current = null;
          setIsPreparingAudio(false);
          if (!audioRef.current) return;

          audioRef.current.muted = false;
          audioRef.current.volume = 1.0;
          if (
            playbackAudioCtxRef.current &&
            playbackAudioCtxRef.current.state === "suspended"
          ) {
            playbackAudioCtxRef.current.resume().catch(() => {});
          }
          if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = getTargetGain(
              isVolumeBoosted,
              isShadowingMode || isRecording,
              isShadowingMode ? "shadowing" : recordingType
            );
          }

          audioRef.current.currentTime = 0;
          audioRef.current
            .play()
            .then(() => {
              startAnimationLoop();
            })
            .catch(() => {
              setIsPlaying(false);
              setIsPreparingAudio(false);
              setActiveWordIndex(null);
              stopAnimationLoop();
            });
        }, delayMs);
        return;
      }

      // Path B: SpeechSynthesis
      speakWithSpeechSynthesis(sentence.english, delayMs);
    },
    [
      sentence,
      resolvedAudioBase64,
      ensureAudioElementReady,
      parsedWords.length,
      isVolumeBoosted,
      isRecording,
      recordingType,
      getTargetGain,
      primeBluetoothAudioOutput,
      startAnimationLoop,
      stopAnimationLoop,
      speakWithSpeechSynthesis,
    ]
  );

  const playModelAudio = useCallback(() => {
    if (!sentence) return;
    clearPendingPlay();
    const isShadow = isRecording && recordingType === "shadowing";
    const delayMs = isAndroidBrowser()
      ? AUDIO_PLAYBACK_DELAY_ANDROID_MS
      : AUDIO_PLAYBACK_DELAY_MS;
    startActualModelPlayback(delayMs, isShadow);
  }, [sentence, clearPendingPlay, isRecording, recordingType, startActualModelPlayback]);

  // Stage 1 of Shadowing Audio Handshake (`shadowlog:prepare-model-audio`):
  // Fired synchronously when the user taps "シャドーイング録音".
  // Does NOT start playing the sentence yet (which would cause the first word to be swallowed
  // while getUserMedia opens the mic and Android re-negotiates the Bluetooth audio route).
  // Instead, unlocks the audio context / element inside the user gesture, starts the Bluetooth
  // DAC primer, highlights word 0, and waits for `shadowlog:shadowing-mic-ready`.
  const prepareShadowingModelAudio = useCallback(() => {
    if (!sentence) return;
    clearPendingPlay();
    stopAnimationLoop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    awaitingShadowingMicRef.current = true;
    setIsPlaying(true);
    setIsPreparingAudio(true);
    if (parsedWords.length > 0) {
      setActiveWordIndex(0);
    }

    const audio = ensureAudioElementReady();
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = getTargetGain(
        isVolumeBoosted,
        true,
        "shadowing"
      );
    }

    // Wake up playback AudioContext and Bluetooth earbud DAC immediately inside user gesture
    primeBluetoothAudioOutput(SHADOWING_PREPARE_FALLBACK_MS + 600);

    // On iOS Safari (where Web Audio boost is disabled), unlock HTMLAudioElement inside user tap
    // so that the subsequent async `.play()` after `shadowing-mic-ready` is permitted.
    if (audio && isIOSBrowser()) {
      audio.muted = true;
      audio
        .play()
        .then(() => {
          if (awaitingShadowingMicRef.current && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          if (audioRef.current) {
            audioRef.current.muted = false;
          }
        })
        .catch(() => {
          if (audioRef.current) {
            audioRef.current.muted = false;
          }
        });
    }

    // Safety fallback: if `shadowlog:shadowing-mic-ready` does not arrive within 1.8s, start playback anyway
    playDelayTimerRef.current = setTimeout(() => {
      playDelayTimerRef.current = null;
      if (!awaitingShadowingMicRef.current) return;
      awaitingShadowingMicRef.current = false;
      startActualModelPlayback(0, true);
    }, SHADOWING_PREPARE_FALLBACK_MS);
  }, [
    sentence,
    clearPendingPlay,
    stopAnimationLoop,
    parsedWords.length,
    ensureAudioElementReady,
    getTargetGain,
    isVolumeBoosted,
    primeBluetoothAudioOutput,
    startActualModelPlayback,
  ]);

  const togglePlayAudio = useCallback(() => {
    if (isPlaying) {
      stopModelAudio();
    } else {
      playModelAudio();
    }
  }, [isPlaying, stopModelAudio, playModelAudio]);

  // Listen for external trigger to start or prepare model audio
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleForcePlay = () => {
      playModelAudio();
    };
    const handlePrepareShadowing = () => {
      prepareShadowingModelAudio();
    };
    window.addEventListener("shadowlog:play-model-audio", handleForcePlay);
    window.addEventListener("shadowlog:prepare-model-audio", handlePrepareShadowing);
    return () => {
      window.removeEventListener("shadowlog:play-model-audio", handleForcePlay);
      window.removeEventListener("shadowlog:prepare-model-audio", handlePrepareShadowing);
    };
  }, [playModelAudio, prepareShadowingModelAudio]);

  // Stage 2 of Shadowing Audio Handshake (`shadowlog:shadowing-mic-ready`):
  // Fired by `use-audio-recorder.ts` AFTER `getUserMedia`, `applyConstraints`, volume-meter
  // `AudioContext`, and `mediaRecorder.start(1000)` have all completed.
  // Waits for the Bluetooth audio sink to finish settling (`650ms` on Android, `280ms` on others)
  // while priming the earbuds, and then starts playback cleanly from `currentTime = 0` (word 1).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleShadowingMicReady = () => {
      if (audioRef.current) {
        audioRef.current.volume = 1.0;
      }
      if (isBoostSupported) {
        if (
          playbackAudioCtxRef.current &&
          playbackAudioCtxRef.current.state === "suspended"
        ) {
          playbackAudioCtxRef.current.resume().catch(() => {});
        }
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = getTargetGain(
            isVolumeBoosted,
            true,
            "shadowing"
          );
        }
      }

      if (awaitingShadowingMicRef.current) {
        awaitingShadowingMicRef.current = false;
        const settleDelayMs = getShadowingPlaybackSettleDelayMs();
        startActualModelPlayback(settleDelayMs, true);
      }
    };
    window.addEventListener(
      "shadowlog:shadowing-mic-ready",
      handleShadowingMicReady
    );
    return () =>
      window.removeEventListener(
        "shadowlog:shadowing-mic-ready",
        handleShadowingMicReady
      );
  }, [
    isBoostSupported,
    getTargetGain,
    isVolumeBoosted,
    startActualModelPlayback,
  ]);

  const changeSpeed = (speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm animate-pulse space-y-4">
        <div className="h-5 w-24 sm:h-6 sm:w-32 bg-muted rounded-full" />
        <div className="h-8 sm:h-10 w-full bg-muted rounded-lg" />
        <div className="h-4 sm:h-5 w-3/4 bg-muted rounded-lg" />
        <div className="pt-4 flex gap-3 sm:gap-4">
          <div className="h-10 w-20 sm:h-10 sm:w-24 bg-muted rounded-lg" />
          <div className="h-10 w-20 sm:h-10 sm:w-24 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!sentence) {
    return (
      <div className="w-full bg-card rounded-2xl p-5 sm:p-8 border border-border text-center space-y-4">
        <p className="text-sm text-muted-foreground">フレーズが設定されていません。「この条件で生成開始」をクリックしてください。</p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-5 py-3 sm:py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition shadow-sm min-h-[48px]"
        >
          <Sparkles className="w-4 h-4" />
          フレーズを生成する
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-primary/10 text-primary font-medium text-[11px] sm:text-xs rounded-full uppercase tracking-wider">
            {sentence.industry}
          </span>
          <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-secondary text-secondary-foreground font-medium text-[11px] sm:text-xs rounded-full capitalize">
            {sentence.level}
          </span>
          <span className="text-[11px] sm:text-xs text-muted-foreground">
            {sentence.wordCount} words
          </span>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-muted-foreground hover:text-foreground transition px-2 py-1.5 rounded-lg hover:bg-muted min-h-[36px]"
          title="別のフレーズを生成"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          別のフレーズ
        </button>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {/* English sentence with blue bold karaoke highlight (tap word to toggle Japanese translation) */}
        <div className="relative p-1 -m-1 select-none rounded-xl">
          <p className="text-xl sm:text-3xl font-semibold leading-snug tracking-normal text-foreground flex flex-wrap gap-y-0.5 sm:gap-y-1 items-baseline relative z-10">
            {parsedWords.map((w, idx) => {
              const isCurrent = isPlaying && activeWordIndex === idx;
              const hasSlash = showChunkSlash && chunkSlashIndices.has(idx);
              const isFlipped = flippedWordIndices.has(idx);
              const cleaned = cleanWord(w.text);
              const translation = dynamicTranslations[cleaned] || getWordTranslation(w.text);

              return (
                <span
                  key={w.id}
                  className={`relative inline-block select-none align-baseline transition-colors duration-150 ${
                    hasSlash ? "mr-3 sm:mr-3.5" : "mr-1 sm:mr-1.5"
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => toggleWordFlip(idx, w.text, e)}
                    className="group/word inline-flex word-flip-perspective cursor-pointer focus:outline-hidden align-baseline"
                    title={isFlipped ? "タップで英語に戻す（発音再生）" : `タップで「${translation}」にフリップ（発音再生）`}
                    aria-label={isFlipped ? `${w.text} (日本語: ${translation}、発音再生)` : `${w.text} (発音再生)`}
                  >
                    <span
                      className={`relative inline-flex items-center justify-center transition-transform duration-350 ease-out word-flip-preserve-3d ${
                        isFlipped ? "word-flip-rotated-180" : ""
                      }`}
                    >
                      {/* Front: English word (in-flow when unflipped so word width is natural) */}
                      <span
                        className={`${
                          isFlipped
                            ? "absolute inset-0 flex items-center justify-center pointer-events-none"
                            : "relative inline-block"
                        } px-0.5 py-0 rounded-md word-flip-backface-hidden transition-colors duration-100 whitespace-nowrap ${
                          isCurrent
                            ? "text-blue-600 dark:text-blue-400 font-extrabold underline decoration-solid decoration-blue-600 dark:decoration-blue-400 decoration-2 underline-offset-[3px]"
                            : "text-foreground group-hover/word:text-primary group-hover/word:bg-primary/5 underline decoration-dotted decoration-muted-foreground/40 underline-offset-[3px] group-hover/word:decoration-primary"
                        }`}
                      >
                        {w.text}
                      </span>

                      {/* Back: Japanese meaning (only in-flow when flipped so it never stretches unflipped English words) */}
                      <span
                        className={`${
                          isFlipped
                            ? "relative inline-flex"
                            : "absolute inset-0 pointer-events-none overflow-hidden"
                        } px-1.5 py-0 rounded-md text-xs sm:text-sm font-bold word-flip-backface-hidden word-flip-rotated-180 transition-all duration-150 items-center justify-center whitespace-nowrap ${
                          isCurrent
                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/40 font-extrabold shadow-xs"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-xs"
                        }`}
                      >
                        {translation}
                      </span>
                    </span>
                  </button>

                  {hasSlash && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none select-none absolute -right-[9px] sm:-right-[10px] top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 font-extrabold text-[0.95em] leading-none opacity-95 drop-shadow-2xs"
                    >
                      /
                    </span>
                  )}
                </span>
              );
            })}
          </p>
        </div>

        {/* Japanese translation displayed by default */}
        {sentence.japanese && (
          <div className="pt-2 sm:pt-3 border-t border-border/60 space-y-1">
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-normal">
              {sentence.japanese}
            </p>
            <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1.5 pt-0.5">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span>英単語をタップすると日本語の意味にフリップします</span>
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-2 border-t border-border">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={togglePlayAudio}
            disabled={isRecording && recordingType !== "shadowing"}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 ${
              isPlaying
                ? "bg-emerald-700 text-white shadow-md ring-2 ring-emerald-500/40"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/25 active:scale-95"
            }`}
            title={isRecording && recordingType !== "shadowing" ? "録音中はお手本音声の混入を防ぐため再生できません" : undefined}
          >
            {isPlaying ? <Pause className="w-4 h-4 shrink-0" /> : <Play className="w-4 h-4 shrink-0 fill-current" />}
            <span>
              {isPreparingAudio
                ? "イヤホン接続確認中..."
                : isPlaying
                  ? "一時停止"
                  : "フレーズ音声を聴く"}
            </span>
          </button>

          {/* Speed Selector with dynamic WPM capsule indicators */}
          <div className="flex items-center bg-muted/70 p-1 rounded-xl gap-1 shadow-inner shrink-0">
            {([0.6, 1.0, 1.2] as const).map((spd) => {
              const isSelected = playbackSpeed === spd;
              const wpmVal = speedWpmMap[spd];
              return (
                <button
                  key={spd}
                  type="button"
                  onClick={() => changeSpeed(spd)}
                  className={`w-[48px] sm:w-[52px] h-[38px] sm:h-[40px] rounded-lg flex flex-col items-center justify-center transition-all duration-200 select-none ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs font-bold ring-1 ring-blue-500/30 scale-102"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  title={`再生速度 ${spd === 1.0 ? "1.0x" : `${spd}x`} (実効話速: 約${wpmVal} WPM)`}
                  aria-label={`再生速度 ${spd === 1.0 ? "1.0x" : `${spd}x`} (約${wpmVal} WPM)`}
                >
                  <span className="text-xs font-bold leading-tight">
                    {spd === 1.0 ? "1.0x" : `${spd}x`}
                  </span>
                  <span
                    className={`text-[10px] leading-tight font-medium ${
                      isSelected ? "text-blue-100" : "text-muted-foreground"
                    }`}
                  >
                    ~{wpmVal}
                  </span>
                </button>
              );
            })}
            <span className="text-[9px] font-bold text-muted-foreground/70 px-1 select-none hidden xs:inline uppercase tracking-tight">
              WPM
            </span>
          </div>

          {/* Volume Boost Button (counteracts Android/Bluetooth earphone ducking during shadowing; hidden on iOS) */}
          {isBoostSupported && (
          <button
            type="button"
            onClick={() => {
              const nextBoost = !isVolumeBoosted;
              toggleVolumeBoost();
              if (nextBoost && audioRef.current) {
                ensureWebAudioBoost(audioRef.current);
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition min-h-[40px] shrink-0 cursor-pointer border ${
              isVolumeBoosted
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 shadow-2xs"
                : "bg-muted/60 text-muted-foreground hover:text-foreground border-border/60"
            }`}
            title="Android＋ワイヤレスイヤホン（Galaxy Buds等）でのシャドーイング時に、お手本音声が小さくなる現象を防ぐ音量増幅モードです"
            aria-pressed={isVolumeBoosted}
          >
            <Volume2
              className={`w-3.5 h-3.5 shrink-0 ${
                isVolumeBoosted ? "text-amber-500" : "text-muted-foreground"
              }`}
            />
            <span>{isVolumeBoosted ? "音量ブースト ON" : "音量ブースト"}</span>
          </button>
          )}
        </div>

        {flippedWordIndices.size > 0 && (
          <button
            type="button"
            onClick={() => setFlippedWordIndices(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground transition py-1 min-h-[36px] self-end sm:self-auto flex items-center gap-1 cursor-pointer"
            title="すべての単語を英語表示に戻す"
          >
            <RotateCcw className="w-3 h-3" />
            単語フリップを戻す ({flippedWordIndices.size})
          </button>
        )}
      </div>
    </div>
  );
}
