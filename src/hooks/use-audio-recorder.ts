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

/**
 * Checks if a microphone device label corresponds to Bluetooth / wireless earbuds.
 * Wired headsets, the phone's earpiece mic ("Headset earpiece" on Android Chrome) and USB mics
 * are NOT Bluetooth and do not trigger HFP/SCO call mode, so they are excluded.
 */
export function isBluetoothMicLabel(label: string): boolean {
  if (!label) return false;
  if (/wired|earpiece|有線|usb/i.test(label)) return false;
  return /airpods|bluetooth|headset|wireless|buds|galaxy\s*buds|pixel\s*buds|wh-|wf-|earbuds|hands-free|ハンズフリー/i.test(
    label
  );
}

/**
 * Checks if the current browser is running on Android.
 */
export function isAndroidBrowser(userAgent?: string): boolean {
  const ua =
    userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  return /android/i.test(ua);
}

/**
 * Checks if the current browser is running on iOS / iPadOS (including iPadOS desktop-mode UA).
 */
export function isIOSBrowser(userAgent?: string, maxTouchPoints?: number): boolean {
  const ua =
    userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  const touch =
    maxTouchPoints ??
    (typeof navigator !== "undefined" ? navigator.maxTouchPoints || 0 : 0);
  // iPadOS 13+ reports a Macintosh UA; distinguish by touch support
  return /macintosh/i.test(ua) && touch > 1;
}

/**
 * Builds optimal MediaTrackConstraints for the given recording mode.
 * - Repeating: full DSP (AEC / NS / AGC) for clean speech capture.
 * - Shadowing on Android (e.g. Galaxy S26 + Galaxy Buds FE): leaving noiseSuppression or
 *   autoGainControl enabled triggers WebRTC VOICE_COMMUNICATION / HAL DSP ducking, which
 *   severely attenuates model audio playback, so ALL DSP flags are disabled.
 * - Shadowing on iOS / Desktop: keeps the previously verified behavior (AEC off only), so
 *   iPhone + earphones (already confirmed fixed) and PC recording levels are not regressed.
 */
export function buildAudioConstraints(
  mode: "repeating" | "shadowing",
  deviceId?: string,
  isAndroid: boolean = isAndroidBrowser()
): MediaTrackConstraints & Record<string, unknown> {
  const isShadowing = mode === "shadowing";
  const fullBypass = isShadowing && isAndroid;

  const constraints: MediaTrackConstraints & Record<string, unknown> = isShadowing
    ? fullBypass
      ? { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      : { echoCancellation: false, noiseSuppression: true }
    : { echoCancellation: true, noiseSuppression: true, autoGainControl: true };

  if (deviceId) {
    constraints.deviceId = { ideal: deviceId };
  }

  if (fullBypass) {
    // Chromium-specific flags to prevent Android WebRTC AudioManager from entering voice-call DSP mode
    constraints.googEchoCancellation = false;
    constraints.googAutoGainControl = false;
    constraints.googAutoGainControl2 = false;
    constraints.googNoiseSuppression = false;
    constraints.googHighpassFilter = false;
    constraints.googTypingNoiseDetection = false;
  }

  return constraints;
}

/**
 * Selects the best microphone device based on platform and user preferences.
 * - On Android: Opening a Bluetooth earbud microphone (e.g., Galaxy Buds FE) forces the OS
 *   to switch Bluetooth from A2DP (high-volume stereo media) to HFP/SCO (call mode, heavily ducked).
 *   Therefore, unless the user explicitly manually chose a Bluetooth mic, Android automatically
 *   prefers the phone's built-in microphone for input while keeping Bluetooth earbuds on A2DP for output.
 * - On iOS / Desktop: Continues to auto-select AirPods / Bluetooth headsets when connected.
 */
export function pickPreferredMicDevice(
  audioInputs: MediaDeviceInfo[],
  options: {
    isAndroid: boolean;
    savedId?: string | null;
    savedLabel?: string | null;
    isManualSelection?: boolean;
  }
): MediaDeviceInfo | undefined {
  if (audioInputs.length === 0) return undefined;
  const labelsPresent = audioInputs.some((d) => Boolean(d.label));

  // 1. If user manually selected a device, or if on iOS/Desktop with a saved device
  if (options.savedId || options.savedLabel) {
    let savedMatch = audioInputs.find(
      (d) => d.deviceId && d.deviceId === options.savedId
    );
    if (!savedMatch && options.savedLabel) {
      savedMatch = audioInputs.find(
        (d) => d.label && d.label === options.savedLabel
      );
    }

    if (savedMatch) {
      // On Android, ignore previously auto-saved Bluetooth mics unless manually chosen by the user
      if (
        options.isAndroid &&
        !options.isManualSelection &&
        isBluetoothMicLabel(savedMatch.label)
      ) {
        savedMatch = undefined;
      } else {
        return savedMatch;
      }
    }
  }

  if (!labelsPresent) return undefined;

  // 2. Android: only intervene when a Bluetooth input exists (to keep earbuds in A2DP stereo mode).
  //    Without Bluetooth (wired earphones / no earphones), keep the OS default exactly as before.
  if (options.isAndroid) {
    const hasBluetoothInput = audioInputs.some((d) => isBluetoothMicLabel(d.label));
    if (!hasBluetoothInput) return undefined;

    const nonBtDevices = audioInputs.filter(
      (d) =>
        d.deviceId &&
        d.deviceId !== "default" &&
        d.deviceId !== "communications" &&
        !isBluetoothMicLabel(d.label)
    );
    // Prefer wired headset mic (best quality, no HFP), then phone built-in / speakerphone mic
    const wired = nonBtDevices.find((d) => /wired|有線|usb/i.test(d.label));
    const explicitBuiltIn = nonBtDevices.find((d) =>
      /本体|内蔵|built-in|speakerphone|スピーカーフォン|bottom|handset|microphone|マイク/i.test(
        d.label
      )
    );
    return wired || explicitBuiltIn || nonBtDevices[0];
  }

  // 3. iOS / Desktop smart suggestion: auto-pick AirPods or Bluetooth headset
  const btDevice = audioInputs.find((d) => isBluetoothMicLabel(d.label));
  return btDevice;
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
  const [hasLabels, setHasLabels] = useState<boolean>(false);

  const STORAGE_KEY_ID = "shadowlog_mic_device_id";
  const STORAGE_KEY_LABEL = "shadowlog_mic_device_label";
  const STORAGE_KEY_MANUAL = "shadowlog_mic_manual_select";

  // Select device (explicit user action) and persist to localStorage
  const setSelectedDeviceId = useCallback(
    (deviceId: string) => {
      setSelectedDeviceIdState(deviceId);
      try {
        if (typeof window !== "undefined") {
          if (deviceId) {
            localStorage.setItem(STORAGE_KEY_ID, deviceId);
            localStorage.setItem(STORAGE_KEY_MANUAL, "true");
            // Also save label if available to survive deviceId regenerating on Bluetooth reconnect
            const found = devices.find((d) => d.deviceId === deviceId);
            if (found && found.label) {
              localStorage.setItem(STORAGE_KEY_LABEL, found.label);
            }
          } else {
            localStorage.removeItem(STORAGE_KEY_ID);
            localStorage.removeItem(STORAGE_KEY_LABEL);
            localStorage.removeItem(STORAGE_KEY_MANUAL);
          }
        }
      } catch {
        // ignore localStorage errors
      }
    },
    [devices]
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate audio input devices (Bluetooth, internal, USB) and restore previous selection
  const refreshDevices = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices?.enumerateDevices
    )
      return;
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(
        (d) => d.kind === "audioinput" && (d.deviceId || d.label)
      );
      setDevices(audioInputs);

      const labelsPresent = audioInputs.some((d) => Boolean(d.label));
      setHasLabels(labelsPresent);

      // Restore previously saved microphone or apply platform-appropriate smart suggestion
      try {
        const savedId = localStorage.getItem(STORAGE_KEY_ID);
        const savedLabel = localStorage.getItem(STORAGE_KEY_LABEL);
        const isManualSelection =
          localStorage.getItem(STORAGE_KEY_MANUAL) === "true";
        const isAndroid = isAndroidBrowser();

        const matched = pickPreferredMicDevice(audioInputs, {
          isAndroid,
          savedId,
          savedLabel,
          isManualSelection,
        });

        if (matched) {
          setSelectedDeviceIdState(matched.deviceId);
          if (matched.deviceId !== savedId) {
            localStorage.setItem(STORAGE_KEY_ID, matched.deviceId);
          }
          if (matched.label) {
            localStorage.setItem(STORAGE_KEY_LABEL, matched.label);
          }
        } else if (isAndroid && !isManualSelection && savedLabel && isBluetoothMicLabel(savedLabel)) {
          // Clear legacy auto-saved Bluetooth mic on Android so it doesn't force HFP/SCO call mode
          setSelectedDeviceIdState("");
          localStorage.removeItem(STORAGE_KEY_ID);
          localStorage.removeItem(STORAGE_KEY_LABEL);
        }
      } catch {
        // ignore localStorage errors
      }
    } catch (e) {
      console.warn("Failed to enumerate audio devices:", e);
    }
  }, []);

  // Proactively request microphone access to unlock device labels (AirPods / External mics)
  const requestDeviceAccess = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia)
      return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately release track so recording indicator turns off
      stream.getTracks().forEach((track) => track.stop());
      await refreshDevices();
      return true;
    } catch (err) {
      console.warn(
        "Microphone permission request was cancelled or denied:",
        err
      );
      return false;
    }
  }, [refreshDevices]);

  // Initial device enumeration & listen for device changes (Bluetooth connect/disconnect)
  useEffect(() => {
    refreshDevices();

    // Check if permission is already granted; if so, unlock labels immediately
    if (typeof window !== "undefined" && navigator.permissions?.query) {
      try {
        navigator.permissions
          .query({ name: "microphone" as PermissionName })
          .then((permissionStatus) => {
            if (permissionStatus.state === "granted") {
              requestDeviceAccess();
            }
            permissionStatus.onchange = () => {
              if (permissionStatus.state === "granted") {
                requestDeviceAccess();
              }
            };
          })
          .catch(() => {});
      } catch {
        // ignore
      }
    }

    if (
      typeof window !== "undefined" &&
      navigator.mediaDevices?.addEventListener
    ) {
      const handler = () => {
        refreshDevices();
      };
      navigator.mediaDevices.addEventListener("devicechange", handler);
      return () => {
        navigator.mediaDevices.removeEventListener("devicechange", handler);
      };
    }
  }, [refreshDevices, requestDeviceAccess]);

  const cleanupAudio = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (
      audioContextRef.current &&
      audioContextRef.current.state !== "closed"
    ) {
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

  const startRecording = useCallback(
    async (mode: "repeating" | "shadowing" = "repeating") => {
      // If repeating: stop any playing model audio before opening the microphone
      if (mode === "repeating" && typeof window !== "undefined") {
        window.dispatchEvent(new Event("shadowlog:stop-model-audio"));
      }
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

        // Determine effective device ID.
        // On Android in shadowing mode, avoid Bluetooth earbud mic unless manually forced by user,
        // so wireless earbuds (e.g. Galaxy Buds FE) stay in high-volume A2DP stereo mode.
        let effectiveDeviceId = selectedDeviceId;
        const isAndroid = isAndroidBrowser();
        if (isAndroid && mode === "shadowing") {
          let isManual = false;
          try {
            isManual = localStorage.getItem(STORAGE_KEY_MANUAL) === "true";
          } catch {
            // ignore
          }
          const currentDev = devices.find((d) => d.deviceId === effectiveDeviceId);
          if (!isManual && (!currentDev || isBluetoothMicLabel(currentDev.label))) {
            const preferredNonBt = pickPreferredMicDevice(devices, {
              isAndroid: true,
              isManualSelection: false,
            });
            if (preferredNonBt?.deviceId) {
              effectiveDeviceId = preferredNonBt.deviceId;
            }
          }
        }

        // Request microphone stream (full DSP bypass only for Android shadowing)
        let stream: MediaStream;
        const baseConstraints = buildAudioConstraints(mode, effectiveDeviceId || undefined, isAndroid);

        // Standard-only version (without Chromium goog* extensions) for fallbacks
        const standardConstraints = (withDevice: boolean): MediaTrackConstraints => {
          const { echoCancellation, noiseSuppression, autoGainControl } = baseConstraints;
          const c: MediaTrackConstraints = { echoCancellation, noiseSuppression };
          if (autoGainControl !== undefined) c.autoGainControl = autoGainControl;
          if (withDevice && effectiveDeviceId) c.deviceId = { ideal: effectiveDeviceId };
          return c;
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: baseConstraints,
          });
        } catch (constraintErr) {
          // Fallback 1: Standard constraints without Chromium goog* extensions
          console.warn(
            "Retrying getUserMedia with standard constraints for Bluetooth compatibility:",
            constraintErr
          );
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: standardConstraints(true),
            });
          } catch {
            // Final fallback: any microphone
            stream = await navigator.mediaDevices.getUserMedia({
              audio: standardConstraints(false),
            });
          }
        }

        streamRef.current = stream;

        // Re-assert raw track constraints on Android shadowing only (iOS/desktop keep verified behavior)
        const activeTrack = stream.getAudioTracks()[0];
        if (mode === "shadowing" && isAndroid && activeTrack?.applyConstraints) {
          activeTrack
            .applyConstraints({
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            })
            .catch(() => {});
        }

        // Refresh devices to get device labels if permission was just granted
        await refreshDevices();

        // Save the active track's label only if not an unwanted Bluetooth auto-capture on Android
        if (
          activeTrack &&
          activeTrack.label &&
          effectiveDeviceId &&
          (!isAndroid || !isBluetoothMicLabel(activeTrack.label))
        ) {
          try {
            localStorage.setItem(STORAGE_KEY_LABEL, activeTrack.label);
          } catch {
            // ignore
          }
        }

        // Notify listeners (e.g. SentenceCard) that the mic stream is active so model audio
        // can resume/boost volume if Android OS briefly ducked or suspended playback during mic init
        if (mode === "shadowing" && typeof window !== "undefined") {
          window.dispatchEvent(new Event("shadowlog:shadowing-mic-ready"));
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
          const audioCtx =
            mode === "shadowing"
              ? new AudioCtx({ latencyHint: "playback" })
              : new AudioCtx();
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
  }, [cleanupAudio, updateVolumeMeter, selectedDeviceId, devices, refreshDevices]);

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
    hasLabels,
    requestDeviceAccess,
    refreshDevices,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
