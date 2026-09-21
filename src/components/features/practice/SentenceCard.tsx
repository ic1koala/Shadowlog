"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react";
import { SentenceResponse } from "@/types";

interface SentenceCardProps {
  sentence: SentenceResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
}

interface ParsedWord {
  id: number;
  text: string;
  charStart: number;
  charEnd: number;
}

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

export function SentenceCard({ sentence, isLoading, onRefresh }: SentenceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showJapanese, setShowJapanese] = useState(true);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [, setVoicesLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Parse English sentence into words with character indices for synchronization
  const parsedWords = useMemo<ParsedWord[]>(() => {
    if (!sentence?.english) return [];
    const words: ParsedWord[] = [];
    const regex = /\S+/g;
    let match: RegExpExecArray | null;
    let id = 0;
    while ((match = regex.exec(sentence.english)) !== null) {
      words.push({
        id: id++,
        text: match[0],
        charStart: match.index,
        charEnd: match.index + match[0].length,
      });
    }
    return words;
  }, [sentence?.english]);

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
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current = null;
    }
  }, [sentence?.id]);

  const speakWithSpeechSynthesis = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

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
      };

      utterance.onerror = (e) => {
        console.warn("SpeechSynthesis error:", e);
        setIsPlaying(false);
        setActiveWordIndex(null);
      };

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      if (parsedWords.length > 0) {
        setActiveWordIndex(0);
      }
    },
    [playbackSpeed, parsedWords]
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
        };

        // Real-time word highlighting based on audio playback progress
        audio.ontimeupdate = () => {
          if (!audio.duration || audio.duration <= 0 || parsedWords.length === 0) return;
          const progress = Math.min(0.999, Math.max(0, audio.currentTime / audio.duration));

          // Weighted word mapping based on character lengths
          const totalChars = parsedWords.reduce((acc, w) => acc + w.text.length, 0);
          const targetCharProgress = progress * totalChars;
          let accumulated = 0;
          let currentIdx = 0;
          for (let i = 0; i < parsedWords.length; i++) {
            accumulated += parsedWords[i].text.length;
            if (targetCharProgress <= accumulated || i === parsedWords.length - 1) {
              currentIdx = i;
              break;
            }
          }
          setActiveWordIndex(currentIdx);
        };

        audio.onerror = () => {
          console.warn("TTS audio playback failed, falling back to SpeechSynthesis");
          audioRef.current = null;
          speakWithSpeechSynthesis(sentence.english);
        };
      }

      audioRef.current.playbackRate = playbackSpeed;

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        setActiveWordIndex(null);
      } else {
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            if (parsedWords.length > 0) setActiveWordIndex(0);
          })
          .catch(() => {
            setIsPlaying(false);
            setActiveWordIndex(null);
          });
      }
      return;
    }

    // Path B: SpeechSynthesis
    if (isPlaying) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setActiveWordIndex(null);
    } else {
      speakWithSpeechSynthesis(sentence.english);
    }
  }, [sentence, isPlaying, playbackSpeed, parsedWords, speakWithSpeechSynthesis]);

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
        <p className="text-sm text-muted-foreground">例文がありません。「新しい例文を生成」をクリックしてください。</p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-5 py-3 sm:py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition shadow-sm min-h-[48px]"
        >
          <Sparkles className="w-4 h-4" />
          例文を生成する
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
          title="別の例文を生成"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          別の例文
        </button>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {/* English sentence with karaoke-style real-time word highlighting */}
        <p className="text-xl sm:text-3xl font-semibold leading-relaxed tracking-tight text-foreground flex flex-wrap gap-x-2 gap-y-1.5 items-baseline">
          {parsedWords.map((w, idx) => {
            const isCurrent = activeWordIndex === idx;
            return (
              <span
                key={w.id}
                className={`transition-all duration-150 rounded-lg px-1.5 py-0.5 inline-block ${
                  isCurrent
                    ? "bg-blue-600 text-white font-bold shadow-md scale-105 ring-2 ring-blue-400/40"
                    : "text-foreground"
                }`}
              >
                {w.text}
              </span>
            );
          })}
        </p>

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
            {isPlaying ? "一時停止" : "模範音声を聴く"}
          </button>

          {/* Speed Selector with circular active indicator */}
          <div className="flex items-center bg-muted/70 p-1 rounded-full text-xs font-medium gap-1 shadow-inner">
            {[0.8, 1.0, 1.2].map((spd) => {
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
                  title={`再生速度 ${spd}x`}
                  aria-label={`再生速度 ${spd}x`}
                >
                  {spd}x
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
