"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react";
import { SentenceResponse } from "@/types";
import { getChunkSlashIndices } from "@/lib/diff/chunk-splitter";
import { calculatePlaybackWpmMap, PlaybackSpeed } from "@/lib/diff/wpm-calculator";
import {
  getWordTranslation,
  fetchWordTranslationAsync,
  cleanWord,
} from "@/lib/practice/word-dictionary";

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

// Subtle pre-roll delay (250ms) before audio starts playing.
// This allows the user's eye to lock onto the highlighted first word and completely prevents the visual highlight from lagging behind speech onset.
const AUDIO_PLAYBACK_DELAY_MS = 250;

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
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1.0);
  const [flippedWordIndices, setFlippedWordIndices] = useState<Set<number>>(new Set());
  const [dynamicTranslations, setDynamicTranslations] = useState<Record<string, string>>({});
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [, setVoicesLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const playDelayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth sliding karaoke pill state & refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const prevWordIndexRef = useRef<number | null>(null);
  const [isImmediate, setIsImmediate] = useState(true);
  const [pillStyle, setPillStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  const updatePillPosition = useCallback(
    (index: number | null, immediate = false) => {
      if (index === null || !containerRef.current) {
        setPillStyle((prev) => ({ ...prev, opacity: 0 }));
        return;
      }
      const el = wordRefs.current[index];
      const container = containerRef.current;
      if (!el || !container) return;

      const containerRect = container.getBoundingClientRect();
      const wordRect = el.getBoundingClientRect();

      // Pad around the word text to create a clean, comfortable pill
      const padX = 5;
      const padY = 2;

      setIsImmediate(immediate);
      setPillStyle({
        left: wordRect.left - containerRect.left - padX,
        top: wordRect.top - containerRect.top - padY,
        width: wordRect.width + padX * 2,
        height: wordRect.height + padY * 2,
        opacity: 1,
      });
    },
    []
  );

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
  }, []);

  const stopModelAudio = useCallback(() => {
    clearPendingPlay();
    stopAnimationLoop();
    if (audioRef.current) {
      audioRef.current.pause();
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
    prevWordIndexRef.current = null;
    setPillStyle({ left: 0, top: 0, width: 0, height: 0, opacity: 0 });
    wordRefs.current = [];
    setFlippedWordIndices(new Set());
    setDynamicTranslations({});
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

    // Pre-load audio metadata if base64 is available to measure real duration and calculate dynamic WPM
    if (sentence?.audioBase64) {
      const audio = new Audio(`data:audio/mp3;base64,${sentence.audioBase64}`);
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
        setActiveWordIndex(null);
        clearPendingPlay();
        stopAnimationLoop();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("shadowlog:model-audio-ended"));
        }
      };
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
  }, [sentence?.id, sentence?.audioBase64, clearPendingPlay, stopAnimationLoop]);

  // Synchronize smooth sliding pill position with activeWordIndex
  useEffect(() => {
    if (activeWordIndex === null || !isPlaying) {
      prevWordIndexRef.current = null;
      setPillStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const isFirstWord = prevWordIndexRef.current === null;
    prevWordIndexRef.current = activeWordIndex;
    updatePillPosition(activeWordIndex, isFirstWord);
  }, [activeWordIndex, isPlaying, updatePillPosition]);

  // Recalculate position on window resize so pill stays aligned with wrapped text
  useEffect(() => {
    const handleResize = () => {
      if (activeWordIndex !== null && isPlaying) {
        updatePillPosition(activeWordIndex, true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeWordIndex, isPlaying, updatePillPosition]);

  // Re-measure when web fonts finish loading
  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        if (activeWordIndex !== null && isPlaying) {
          updatePillPosition(activeWordIndex, true);
        }
      });
    }
  }, [activeWordIndex, isPlaying, updatePillPosition]);

  const speakWithSpeechSynthesis = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      clearPendingPlay();
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = playbackSpeed;
      utterance.pitch = 1.0;

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
        setActiveWordIndex(null);
        clearPendingPlay();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("shadowlog:model-audio-ended"));
        }
      };

      utterance.onerror = (e) => {
        console.warn("SpeechSynthesis error:", e);
        setIsPlaying(false);
        setActiveWordIndex(null);
        clearPendingPlay();
      };

      setIsPlaying(true);
      if (parsedWords.length > 0) {
        setActiveWordIndex(0);
      }

      playDelayTimerRef.current = setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, AUDIO_PLAYBACK_DELAY_MS);
    },
    [playbackSpeed, parsedWords, clearPendingPlay]
  );

  const playModelAudio = useCallback(() => {
    if (!sentence) return;

    // Path A: OpenAI TTS-1 audio (base64 MP3)
    if (sentence.audioBase64) {
      if (!audioRef.current) {
        const audio = new Audio(`data:audio/mp3;base64,${sentence.audioBase64}`);
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
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

      if (audioRef.current.duration && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
        setAudioDuration(audioRef.current.duration);
      }

      audioRef.current.playbackRate = playbackSpeed;

      clearPendingPlay();
      // Immediately highlight the first word to draw focus and prepare learner
      setIsPlaying(true);
      if (parsedWords.length > 0) {
        setActiveWordIndex(0);
      }

      // Delay audio playback start slightly (~250ms) so user is ready and highlight firmly leads
      playDelayTimerRef.current = setTimeout(() => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .then(() => {
            startAnimationLoop();
          })
          .catch(() => {
            setIsPlaying(false);
            setActiveWordIndex(null);
            stopAnimationLoop();
          });
      }, AUDIO_PLAYBACK_DELAY_MS);
      return;
    }

    // Path B: SpeechSynthesis
    speakWithSpeechSynthesis(sentence.english);
  }, [
    sentence,
    playbackSpeed,
    parsedWords,
    clearPendingPlay,
    speakWithSpeechSynthesis,
    startAnimationLoop,
    stopAnimationLoop,
  ]);

  const togglePlayAudio = useCallback(() => {
    if (isPlaying) {
      stopModelAudio();
    } else {
      playModelAudio();
    }
  }, [isPlaying, stopModelAudio, playModelAudio]);

  // Listen for external trigger to start model audio (e.g. shadowing recording start)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleForcePlay = () => {
      playModelAudio();
    };
    window.addEventListener("shadowlog:play-model-audio", handleForcePlay);
    return () => window.removeEventListener("shadowlog:play-model-audio", handleForcePlay);
  }, [playModelAudio]);

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

  // Animation duration dynamically adjusted to playback speed for natural gliding
  const animDuration = Math.round(240 / playbackSpeed);

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
        {/* English sentence with smooth sliding karaoke pill (tap to toggle Japanese translation) */}
        <div
          ref={containerRef}
          className="relative p-1 -m-1 select-none rounded-xl"
        >
          {/* Smooth sliding karaoke highlight pill */}
          <div
            aria-hidden="true"
            className="absolute rounded-lg bg-blue-600 shadow-sm pointer-events-none"
            style={{
              transform: `translate3d(${pillStyle.left}px, ${pillStyle.top}px, 0)`,
              width: `${pillStyle.width}px`,
              height: `${pillStyle.height}px`,
              opacity: isPlaying && activeWordIndex !== null && pillStyle.width > 0 ? 1 : 0,
              transition: isImmediate
                ? "opacity 150ms ease"
                : `transform ${animDuration}ms cubic-bezier(0.25, 1, 0.5, 1), width ${animDuration}ms cubic-bezier(0.25, 1, 0.5, 1), height ${animDuration}ms cubic-bezier(0.25, 1, 0.5, 1), opacity 150ms ease`,
            }}
          />

          <p className="text-xl sm:text-3xl font-semibold leading-relaxed tracking-normal text-foreground flex flex-wrap gap-y-2 items-baseline relative z-10">
            {parsedWords.map((w, idx) => {
              const isCurrent = isPlaying && activeWordIndex === idx;
              const hasSlash = showChunkSlash && chunkSlashIndices.has(idx);
              const isFlipped = flippedWordIndices.has(idx);
              const cleaned = cleanWord(w.text);
              const translation = dynamicTranslations[cleaned] || getWordTranslation(w.text);

              return (
                <span
                  key={w.id}
                  ref={(el) => {
                    wordRefs.current[idx] = el;
                  }}
                  className={`relative inline-block select-none align-baseline transition-colors duration-150 ${
                    hasSlash ? "mr-2.5 sm:mr-3" : "mr-1.5"
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => toggleWordFlip(idx, w.text, e)}
                    className="group/word inline-grid word-flip-perspective cursor-pointer focus:outline-hidden align-baseline"
                    title={isFlipped ? "タップで英語に戻す（発音再生）" : `タップで「${translation}」にフリップ（発音再生）`}
                    aria-label={isFlipped ? `${w.text} (日本語: ${translation}、発音再生)` : `${w.text} (発音再生)`}
                  >
                    <span
                      className={`grid grid-cols-1 grid-rows-1 items-center justify-center transition-transform duration-350 ease-out word-flip-preserve-3d ${
                        isFlipped ? "word-flip-rotated-180" : ""
                      }`}
                    >
                      {/* Front: English word */}
                      <span
                        className={`col-start-1 row-start-1 px-1 py-0.5 rounded-lg word-flip-backface-hidden transition-all duration-150 ${
                          isCurrent
                            ? "text-white font-semibold"
                            : "text-foreground group-hover/word:text-primary group-hover/word:bg-primary/5 underline decoration-dotted decoration-muted-foreground/40 underline-offset-4 group-hover/word:decoration-primary"
                        }`}
                      >
                        {w.text}
                      </span>

                      {/* Back: Japanese meaning */}
                      <span
                        className={`col-start-1 row-start-1 px-1.5 py-0.5 rounded-md text-xs sm:text-sm font-bold word-flip-backface-hidden word-flip-rotated-180 transition-all duration-150 flex items-center justify-center whitespace-nowrap ${
                          isCurrent
                            ? "bg-amber-400 text-amber-950 shadow-xs"
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
                      className="pointer-events-none select-none absolute -right-[8px] sm:-right-[9px] top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 font-extrabold text-[0.95em] leading-none opacity-95 drop-shadow-2xs"
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
            <span>{isPlaying ? "一時停止" : "フレーズ音声を聴く"}</span>
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
