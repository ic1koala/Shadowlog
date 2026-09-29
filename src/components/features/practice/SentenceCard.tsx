"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react";
import { SentenceResponse } from "@/types";
import { getChunkSlashIndices } from "@/lib/diff/chunk-splitter";

interface SentenceCardProps {
  sentence: SentenceResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
  showChunkSlash?: boolean;
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
  showChunkSlash = false,
}: SentenceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showJapanese, setShowJapanese] = useState(true);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
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

  // Reset playback and highlight state when sentence changes
  useEffect(() => {
    setIsPlaying(false);
    setActiveWordIndex(null);
    prevWordIndexRef.current = null;
    setPillStyle({ left: 0, top: 0, width: 0, height: 0, opacity: 0 });
    wordRefs.current = [];
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

  const togglePlayAudio = useCallback(() => {
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
        };

        audio.onerror = () => {
          console.warn("TTS audio playback failed, falling back to SpeechSynthesis");
          audioRef.current = null;
          clearPendingPlay();
          stopAnimationLoop();
          speakWithSpeechSynthesis(sentence.english);
        };
      }

      audioRef.current.playbackRate = playbackSpeed;

      if (isPlaying) {
        clearPendingPlay();
        audioRef.current.pause();
        setIsPlaying(false);
        setActiveWordIndex(null);
        stopAnimationLoop();
      } else {
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
      }
      return;
    }

    // Path B: SpeechSynthesis
    if (isPlaying) {
      clearPendingPlay();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setActiveWordIndex(null);
    } else {
      speakWithSpeechSynthesis(sentence.english);
    }
  }, [
    sentence,
    isPlaying,
    playbackSpeed,
    parsedWords,
    clearPendingPlay,
    speakWithSpeechSynthesis,
    startAnimationLoop,
    stopAnimationLoop,
  ]);

  const changeSpeed = (speed: number) => {
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
        {/* English sentence with smooth sliding karaoke pill */}
        <div ref={containerRef} className="relative p-1 -m-1">
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
              return (
                <span
                  key={w.id}
                  ref={(el) => {
                    wordRefs.current[idx] = el;
                  }}
                  className={`relative inline-block px-1 py-0.5 rounded-lg mr-1.5 select-none transition-colors duration-150 ${
                    isCurrent ? "text-white" : "text-foreground"
                  }`}
                >
                  {w.text}
                  {hasSlash && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none select-none absolute -right-[7px] top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400 font-normal text-[0.78em] leading-none opacity-85"
                    >
                      /
                    </span>
                  )}
                </span>
              );
            })}
          </p>
        </div>


        {showJapanese && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed pt-0.5 sm:pt-1">
            {sentence.japanese}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-2 border-t border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlayAudio}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-xl text-sm font-medium transition min-h-[44px] ${
              isPlaying
                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-600/30"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "一時停止" : "フレーズ音声を聴く"}
          </button>

          {/* Speed Selector with circular active indicator */}
          <div className="flex items-center bg-muted/70 p-1 rounded-full text-xs font-medium gap-1 shadow-inner">
            {[0.6, 1.0, 1.2].map((spd) => {
              const isSelected = playbackSpeed === spd;
              return (
                <button
                  key={spd}
                  onClick={() => changeSpeed(spd)}
                  className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 text-xs font-semibold ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-500/30 scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  title={`再生速度 ${spd === 1.0 ? "1x" : `${spd}x`}`}
                  aria-label={`再生速度 ${spd === 1.0 ? "1x" : `${spd}x`}`}
                >
                  {spd === 1.0 ? "1x" : `${spd}x`}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setShowJapanese((prev) => !prev)}
          className="text-xs text-muted-foreground hover:text-foreground transition underline underline-offset-4 py-1 min-h-[36px]"
        >
          {showJapanese ? "日本語訳を隠す" : "日本語訳を表示"}
        </button>
      </div>
    </div>
  );
}
