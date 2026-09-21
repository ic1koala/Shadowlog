"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number; // in seconds
  audioBlob: Blob | null;
  audioUrl: string | null;
  volumeLevel: number; // 0.0 to 1.0 for visual meter
  error: string | null;
}

/**
 * Detects if the current environment supports microphone recording.
 * Returns an error message if not supported, or null if supported.
 */
function checkRecordingSupport(): string | null {
  if (typeof window === "undefined") {
    return "サーバー環境では録音できません。";
  }

  // Check secure context (HTTPS or localhost)
  const isSecure = window.isSecureContext;
  if (!isSecure) {
    return "マイク録音にはHTTPS接続が必要です。現在HTTP接続のため、マイクにアクセスできません。ローカルテストの場合は localhost でアクセスするか、Vercelにデプロイしてお試しください。";
  }

  // Check getUserMedia support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return "お使いのブラウザはマイク録音に対応していません。Chrome、Safari、Firefoxの最新版をお試しください。";
  }

  return null;
}

/**
 * Finds the best supported MIME type for MediaRecorder.
 * iOS Safari supports audio/mp4 and audio/aac, but not audio/webm.
 */
function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
    "audio/ogg;codecs=opus",
  ];

  for (const type of types) {
    try {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    } catch {
      continue;
    }
  }

  return "";
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    audioBlob: null,
    audioUrl: null,
    volumeLevel: 0,
    error: null,
  });

  // Audio Input Devices management (for Bluetooth/External Mic switching)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceIdState] = useState<string>("");

  const STORAGE_KEY_ID = "shadowlog_mic_device_id";
  const STORAGE_KEY_LABEL = "shadowlog_mic_device_label";

  // Select device and persist to localStorage
  const setSelectedDeviceId = useCallback((deviceId: string) => {
    setSelectedDeviceIdState(deviceId);
    try {
      if (typeof window !== "undefined") {
        if (deviceId) {
          localStorage.setItem(STORAGE_KEY_ID, deviceId);
          // Also save label if available to survive deviceId regenerating on Bluetooth reconnect
          const found = devices.find((d) => d.deviceId === deviceId);
          if (found && found.label) {
            localStorage.setItem(STORAGE_KEY_LABEL, found.label);
          }
        } else {
          localStorage.removeItem(STORAGE_KEY_ID);
          localStorage.removeItem(STORAGE_KEY_LABEL);
        }
      }
    } catch {
      // ignore localStorage errors
    }
  }, [devices]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate audio input devices (Bluetooth, internal, USB) and restore previous selection
  const refreshDevices = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter((d) => d.kind === "audioinput");
      setDevices(audioInputs);

      // Restore previously saved microphone (by deviceId or label)
      try {
        const savedId = localStorage.getItem(STORAGE_KEY_ID);
        const savedLabel = localStorage.getItem(STORAGE_KEY_LABEL);

        if (savedId || savedLabel) {
          // 1. Try matching by deviceId
          let matched = audioInputs.find((d) => d.deviceId && d.deviceId === savedId);
          // 2. Fallback: match by label (useful for Bluetooth reconnects where deviceId changes)
          if (!matched && savedLabel) {
            matched = audioInputs.find((d) => d.label && d.label === savedLabel);
          }

          if (matched) {
            setSelectedDeviceIdState(matched.deviceId);
            // Update saved ID if it changed
            if (matched.deviceId !== savedId) {
              localStorage.setItem(STORAGE_KEY_ID, matched.deviceId);
            }
          }
        }
      } catch {
        // ignore localStorage errors
      }
    } catch (e) {
      console.warn("Failed to enumerate audio devices:", e);
    }
  }, []);

  // Initial device enumeration & listen for device changes (Bluetooth connect/disconnect)
  useEffect(() => {
    refreshDevices();

    if (typeof window !== "undefined" && navigator.mediaDevices?.addEventListener) {
      const handler = () => {
        refreshDevices();
      };
      navigator.mediaDevices.addEventListener("devicechange", handler);
      return () => {
        navigator.mediaDevices.removeEventListener("devicechange", handler);
      };
    }
  }, [refreshDevices]);

  const cleanupAudio = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const updateVolumeMeter = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i]!;
    }
    const avg = sum / dataArray.length;
    const normalized = Math.min(1.0, avg / 128);

    setState((prev) => ({ ...prev, volumeLevel: normalized }));
    animationFrameRef.current = requestAnimationFrame(updateVolumeMeter);
  }, []);

  const startRecording = useCallback(async () => {
    cleanupAudio();
    setState((prev) => ({
      ...prev,
      error: null,
      audioBlob: null,
      audioUrl: null,
      recordingTime: 0,
      volumeLevel: 0,
    }));
    audioChunksRef.current = [];

    try {
      // Check browser support first
      const supportError = checkRecordingSupport();
      if (supportError) {
        throw new Error(supportError);
      }

      // Request microphone stream with selected device or fallback
      let stream: MediaStream;
      const baseConstraints: MediaTrackConstraints = {
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: baseConstraints,
        });
      } catch (constraintErr) {
        // Fallback for Bluetooth headsets that fail with strict DSP filters (SCO profile issue)
        console.warn("Retrying getUserMedia with relaxed constraints for Bluetooth compatibility:", constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
        });
      }

      streamRef.current = stream;

      // Refresh devices to get device labels if permission was just granted
      refreshDevices();

      // Save the active track's label to ensure Bluetooth device name is remembered even on first grant
      const activeTrack = stream.getAudioTracks()[0];
      if (activeTrack && activeTrack.label && selectedDeviceId) {
        try {
          localStorage.setItem(STORAGE_KEY_LABEL, activeTrack.label);
        } catch {
          // ignore
        }
      }

      // Check MediaRecorder availability
      if (typeof MediaRecorder === "undefined") {
        throw new Error(
          "お使いのブラウザはMediaRecorder APIに対応していません。最新のブラウザをご利用ください。"
        );
      }

      // Web Audio API setup for visual volume meter
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;

      if (AudioCtx) {
        try {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;

          if (audioCtx.state === "suspended") {
            await audioCtx.resume();
          }

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          updateVolumeMeter();
        } catch (audioErr) {
          console.warn("Volume meter setup failed:", audioErr);
        }
      }

      // Determine supported MIME type
      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalType = mediaRecorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: finalType });
        const url = URL.createObjectURL(blob);
        setState((prev) => ({
          ...prev,
          isRecording: false,
          audioBlob: blob,
          audioUrl: url,
          volumeLevel: 0,
        }));
        cleanupAudio();
      };

      mediaRecorder.onerror = () => {
        setState((prev) => ({
          ...prev,
          isRecording: false,
          error: "録音中にエラーが発生しました。マイクの接続を確認してもう一度お試しください。",
        }));
        cleanupAudio();
      };

      mediaRecorder.start(1000);

      // Timer
      timerIntervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
        }));
      }, 1000);

      setState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
      }));
    } catch (err: unknown) {
      cleanupAudio();
      let errorMsg = "マイクへのアクセスに失敗しました。";
      if (err instanceof DOMException) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          errorMsg =
            "マイクの使用が拒否されました。Chromeのアドレスバー左側アイコンをクリックし、「マイク」の許可をオンにしてください。";
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          errorMsg = "選択されたマイクが見つかりませんでした。Bluetoothマイクが接続されているか確認してください。";
        } else if (err.name === "NotReadableError") {
          errorMsg =
            "マイクが他のアプリ（Zoom、Teams、Discordなど）で占有されています。他の通話・録音ソフトを終了して再試行してください。";
        } else if (err.name === "OverconstrainedError") {
          errorMsg = "マイクの設定要件が一致しませんでした。マイク選択で別のマイクを選ぶか、デフォルトに戻してください。";
        } else if (err.name === "AbortError") {
          errorMsg = "マイクの初期化が中断されました。再度お試しください。";
        } else if (err.name === "SecurityError") {
          errorMsg =
            "セキュリティエラー: HTTPS接続が必要です。URLが https:// または localhost で始まることを確認してください。";
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setState((prev) => ({
        ...prev,
        isRecording: false,
        error: errorMsg,
      }));
    }
  }, [cleanupAudio, updateVolumeMeter, selectedDeviceId, refreshDevices]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetRecording = useCallback(() => {
    cleanupAudio();
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    setState({
      isRecording: false,
      isPaused: false,
      recordingTime: 0,
      audioBlob: null,
      audioUrl: null,
      volumeLevel: 0,
      error: null,
    });
  }, [cleanupAudio, state.audioUrl]);

  useEffect(() => {
    return () => {
      cleanupAudio();
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
    };
  }, [cleanupAudio, state.audioUrl]);

  return {
    ...state,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    refreshDevices,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
