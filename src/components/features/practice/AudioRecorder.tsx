"use client";

import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import {
  Mic,
  Square,
  RotateCcw,
  AlertCircle,
  Play,
  Pause,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface AudioRecorderProps {
  onAudioReady: (blob: Blob, durationSeconds: number) => void;
  isTranscribing: boolean;
  disabled?: boolean;
}

export function AudioRecorder({
  onAudioReady,
  isTranscribing,
  disabled = false,
}: AudioRecorderProps) {
  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    volumeLevel,
    error,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const lastDurationRef = useRef<number>(0);

  // Keep track of the final duration before timer resets
  useEffect(() => {
    if (recordingTime > 0) {
      lastDurationRef.current = recordingTime;
    }
  }, [recordingTime]);

  useEffect(() => {
    setIsPlayingRecorded(false);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, [audioUrl]);

  const togglePlayRecorded = () => {
    if (!audioUrl) return;
    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio(audioUrl);
      audioPreviewRef.current.onended = () => setIsPlayingRecorded(false);
    }

    if (isPlayingRecorded) {
      audioPreviewRef.current.pause();
      setIsPlayingRecorded(false);
    } else {
      audioPreviewRef.current.play().then(() => setIsPlayingRecorded(true)).catch(() => setIsPlayingRecorded(false));
    }
  };

  const handleTranscribeClick = () => {
    if (audioBlob) {
      onAudioReady(audioBlob, lastDurationRef.current || 1);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="w-full bg-card rounded-2xl p-5 sm:p-8 border border-border shadow-sm space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
          <Mic className="w-4 h-4 text-primary" />
          シャドーイング録音
        </h3>

        {/* Recording status or Device selector */}
        {isRecording ? (
          <div className="flex items-center gap-2 text-destructive animate-pulse text-xs sm:text-sm font-medium">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-destructive" />
            録音中 {formatTimer(recordingTime)}
          </div>
        ) : (
          devices.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-xl border border-border/60">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary shrink-0" />
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                disabled={isRecording || disabled}
                className="bg-transparent text-foreground text-xs focus:outline-hidden cursor-pointer max-w-[180px] sm:max-w-[240px] truncate"
                aria-label="マイク入力デバイスを選択"
              >
                <option value="">デフォルトマイク</option>
                {devices.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `マイク ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )
        )}
      </div>

      {/* Error Message Box */}
      {error && (
        <div className="flex items-start gap-3 p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">マイクエラー</p>
            <p className="text-xs leading-relaxed opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Volume Visualizer Bar */}
      {isRecording && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>入力音量</span>
            <span>{Math.round(volumeLevel * 100)}%</span>
          </div>
          <div className="w-full h-3 sm:h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-75 ease-out rounded-full"
              style={{ width: `${Math.max(5, Math.min(100, volumeLevel * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Controls Container */}
      <div className="flex flex-col items-center gap-3 sm:gap-4 py-2">
        {!isRecording && !audioBlob && (
          <button
            onClick={startRecording}
            disabled={disabled || isTranscribing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-4 sm:py-3.5 bg-primary text-primary-foreground font-semibold rounded-2xl hover:bg-primary/90 disabled:opacity-50 transition shadow-md hover:shadow-lg active:scale-95 text-base sm:text-sm min-h-[52px]"
          >
            <Mic className="w-5 h-5" />
            シャドーイングを開始
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-4 sm:py-3.5 bg-destructive text-destructive-foreground font-semibold rounded-2xl hover:bg-destructive/90 transition shadow-md active:scale-95 text-base sm:text-sm min-h-[52px]"
          >
            <Square className="w-5 h-5" />
            録音を終了する
          </button>
        )}

        {!isRecording && audioBlob && (
          <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            {/* Primary action — submit for analysis */}
            <button
              onClick={handleTranscribeClick}
              disabled={isTranscribing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition shadow-sm text-base sm:text-sm min-h-[48px] order-first"
            >
              <Send className="w-4 h-4" />
              {isTranscribing ? "解析中..." : "判定する"}
            </button>

            {/* Secondary actions row */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={togglePlayRecorded}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 transition text-sm min-h-[48px]"
              >
                {isPlayingRecorded ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="sm:inline">再生</span>
              </button>

              <button
                onClick={resetRecording}
                disabled={isTranscribing}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 border border-border text-muted-foreground hover:text-foreground font-medium rounded-xl hover:bg-muted transition text-sm min-h-[48px]"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="sm:inline">録り直す</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] sm:text-xs text-center text-muted-foreground">
        フレーズ音声に合わせて、または聴き終わった直後に声に出して発話してください。
      </p>
    </div>
  );
}
