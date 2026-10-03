"use client";

import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import {
  Mic,
  RotateCcw,
  AlertCircle,
  Play,
  Pause,
  Send,
  SlidersHorizontal,
  Headphones,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

interface AudioRecorderProps {
  onAudioReady: (blob: Blob, durationSeconds: number) => void;
  isTranscribing: boolean;
  disabled?: boolean;
  hasEvaluated?: boolean;
  isAdmin?: boolean;
  onRetry?: () => void;
  onRecordingStateChange?: (isRecording: boolean, hasBlob: boolean) => void;
  onRegisterControls?: (controls: {
    start: (mode?: "repeating" | "shadowing") => void;
    stop: () => void;
    reset: () => void;
    submit: () => void;
  }) => void;
}

export function AudioRecorder({
  onAudioReady,
  isTranscribing,
  hasEvaluated = false,
  onRetry,
  onRecordingStateChange,
  onRegisterControls,
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
    hasLabels,
    requestDeviceAccess,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const lastDurationRef = useRef<number>(0);

  // Keep track of the final duration before timer resets
  useEffect(() => {
    if (recordingTime > 0) {
      lastDurationRef.current = recordingTime;
    }
  }, [recordingTime]);

  // Reset submitted state when audioBlob is cleared
  useEffect(() => {
    if (!audioBlob) {
      setHasSubmitted(false);
    }
  }, [audioBlob]);

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

  // Notify parent of recording state changes for floating button bar
  useEffect(() => {
    onRecordingStateChange?.(isRecording, !!audioBlob);
  }, [isRecording, audioBlob, onRecordingStateChange]);

  const handleTranscribeClick = useCallback(() => {
    if (audioBlob) {
      setHasSubmitted(true);
      onAudioReady(audioBlob, lastDurationRef.current || 1);
    }
  }, [audioBlob, onAudioReady]);

  // Expose start/stop/reset/submit controls to parent (for floating action bar)
  useEffect(() => {
    onRegisterControls?.({
      start: (mode = "repeating") => startRecording(mode),
      stop: stopRecording,
      reset: resetRecording,
      submit: handleTranscribeClick,
    });
  }, [onRegisterControls, startRecording, stopRecording, resetRecording, handleTranscribeClick]);

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

  const handleRetryClick = () => {
    setHasSubmitted(false);
    resetRecording();
    onRecordingStateChange?.(false, false);
    onRetry?.();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const isEvaluatedOrSubmitted = hasEvaluated || hasSubmitted || isTranscribing;

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
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Device Selector */}
            {devices.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1.5 rounded-xl border border-border/60 shadow-2xs">
                {devices.find((d) => d.deviceId === selectedDeviceId && /airpods|bluetooth|headset|wireless|buds|wh-|wf-/i.test(d.label)) ? (
                  <Headphones className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                ) : (
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  onFocus={() => {
                    if (!hasLabels) {
                      requestDeviceAccess();
                    }
                  }}
                  disabled={isRecording}
                  className="bg-transparent text-foreground text-xs focus:outline-hidden cursor-pointer max-w-[190px] sm:max-w-[260px] truncate font-medium"
                  aria-label="マイク入力デバイスを選択"
                >
                  <option value="">デフォルトマイク</option>
                  {devices.map((device, idx) => {
                    const isBt = /airpods|bluetooth|headset|wireless|buds|wh-|wf-/i.test(device.label);
                    return (
                      <option key={device.deviceId || idx} value={device.deviceId}>
                        {isBt ? "🎧 " : ""}{device.label || `マイク ${idx + 1}`}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Unlock device labels button: visible when browser hasn't granted labels yet */}
            {!hasLabels && (
              <button
                type="button"
                onClick={requestDeviceAccess}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition shadow-2xs cursor-pointer shrink-0"
                title="ブラウザのマイク許可を有効にしてAirPods等の名称を表示"
              >
                <Headphones className="w-3 h-3" />
                <span>AirPods等の名前を表示</span>
              </button>
            )}

            {/* AirPods active badge */}
            {devices.some((d) => d.deviceId === selectedDeviceId && /airpods|bluetooth|headset|wireless|buds|wh-|wf-/i.test(d.label)) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/20 shrink-0">
                🎧 AirPods接続中
              </span>
            )}
          </div>
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

      {/* Controls Container — start/stop are in the floating bar */}
      <div className="flex flex-col items-center gap-3 sm:gap-4 py-2">
        {/* Idle placeholder — guides user to listen first, then start recording via floating button */}
        {!isRecording && !audioBlob && (
          <div className="text-center space-y-1">
            <p className="text-xs sm:text-sm font-medium text-foreground">
              ① 画面下部から「リピーティング」または「シャドーイング」を選択
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              ※シャドーイング録音はお手本音声とシンクロ再生されます（イヤホン推奨・自動採点）
            </p>
          </div>
        )}

        {/* After recording: submit / preview / redo */}
        {!isRecording && audioBlob && (
          <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            {/* Primary action — submit for analysis (turns gray once evaluated/submitted) */}
            <button
              onClick={handleTranscribeClick}
              disabled={isEvaluatedOrSubmitted}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-2.5 rounded-xl transition shadow-sm text-base sm:text-sm min-h-[48px] order-first ${
                isEvaluatedOrSubmitted
                  ? "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-80"
                  : "bg-primary text-primary-foreground font-semibold hover:bg-primary/90 active:scale-95 cursor-pointer"
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {isTranscribing
                  ? "解析中..."
                  : hasEvaluated || hasSubmitted
                  ? "判定完了"
                  : "判定する"}
              </span>
            </button>

            {/* Secondary actions row */}
            <div className="flex items-center gap-2.5 flex-1">
              <button
                onClick={togglePlayRecorded}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 transition text-sm min-h-[48px]"
              >
                {isPlayingRecorded ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="sm:inline">再生</span>
              </button>

              <button
                onClick={handleRetryClick}
                disabled={isTranscribing}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl transition text-sm min-h-[48px] cursor-pointer ${
                  isEvaluatedOrSubmitted
                    ? "bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold shadow-md shadow-blue-500/20"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold border border-border/80 shadow-2xs active:scale-95"
                }`}
                title="録音を破棄してもう一度練習します（判定前に何度でもやり直せます）"
              >
                <RotateCcw className="w-4 h-4 text-primary" />
                <span className="sm:inline">録り直す</span>
              </button>
            </div>

            {/* Reassurance note for pre-evaluation retries (User request ③) */}
            {!isEvaluatedOrSubmitted && (
              <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center justify-center gap-1.5 pt-1 text-center">
                <span className="text-primary font-bold">💡</span>
                <span>判定前に納得がいくまで、何度でも「録り直す」で再録音・練習できます（チケット消費なし）</span>
              </p>
            )}
          </div>
        )}
      </div>

      <p className="text-[11px] sm:text-xs text-center text-muted-foreground">
        ※リピーティング録音時は模範音声が停止します。シャドーイング録音時はイヤホン装着推奨でお手本と同時に発話し、終了後1.5秒で自動採点されます。
      </p>
    </div>
  );
}
