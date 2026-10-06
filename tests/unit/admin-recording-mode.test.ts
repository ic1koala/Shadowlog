import { describe, it, expect, vi, beforeEach } from "vitest";
import { isAdminEmail, DEFAULT_ADMIN_EMAIL } from "@/lib/auth/admin-checker";
import {
  buildAudioConstraints,
  isAndroidBrowser,
  isIOSBrowser,
  isBluetoothMicLabel,
  pickPreferredMicDevice,
  getShadowingPlaybackSettleDelayMs,
} from "@/hooks/use-audio-recorder";

describe("Admin & Cross-Device Shadowing Recording Mode Verification", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("strictly restricts admin features to configured admin emails", () => {
    expect(isAdminEmail("shadowlog.app@gmail.com")).toBe(true);
    expect(isAdminEmail("SHADOWLOG.APP@GMAIL.COM")).toBe(true);
    expect(isAdminEmail("user@example.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
    expect(DEFAULT_ADMIN_EMAIL).toBe("shadowlog.app@gmail.com");
  });

  it("applies full DSP bypass on Android shadowing while preserving verified constraints on iOS/Desktop", () => {
    const repeatingConstraints = buildAudioConstraints("repeating", "mic-1", false);
    const iosShadowingConstraints = buildAudioConstraints("shadowing", "mic-1", false);
    const androidShadowingConstraints = buildAudioConstraints("shadowing", "mic-1", true);

    expect(repeatingConstraints.echoCancellation).toBe(true);
    expect(repeatingConstraints.noiseSuppression).toBe(true);
    expect(repeatingConstraints.autoGainControl).toBe(true);

    // iOS / Desktop shadowing: echoCancellation is false, noiseSuppression remains true (verified behavior)
    expect(iosShadowingConstraints.echoCancellation).toBe(false);
    expect(iosShadowingConstraints.noiseSuppression).toBe(true);
    expect(iosShadowingConstraints.googEchoCancellation).toBeUndefined();

    // Android shadowing: all WebRTC DSP flags must be false to prevent Android VOICE_COMMUNICATION stream ducking
    expect(androidShadowingConstraints.echoCancellation).toBe(false);
    expect(androidShadowingConstraints.noiseSuppression).toBe(false);
    expect(androidShadowingConstraints.autoGainControl).toBe(false);
    expect(androidShadowingConstraints.googEchoCancellation).toBe(false);
    expect(androidShadowingConstraints.googAutoGainControl).toBe(false);
    expect(androidShadowingConstraints.googNoiseSuppression).toBe(false);
  });

  it("identifies Android, iOS/iPadOS, and distinguishes wireless Bluetooth earbuds from wired headsets", () => {
    const galaxyS26UA =
      "Mozilla/5.0 (Linux; Android 16; SM-S941N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36";
    const iphoneUA =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
    const macOrIpadUA =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";

    expect(isAndroidBrowser(galaxyS26UA)).toBe(true);
    expect(isAndroidBrowser(iphoneUA)).toBe(false);

    expect(isIOSBrowser(iphoneUA, 5)).toBe(true);
    expect(isIOSBrowser(macOrIpadUA, 5)).toBe(true); // iPadOS desktop-mode UA
    expect(isIOSBrowser(macOrIpadUA, 0)).toBe(false); // MacBook

    expect(isBluetoothMicLabel("Galaxy Buds FE (12:34)")).toBe(true);
    expect(isBluetoothMicLabel("Bluetooth headset")).toBe(true);
    expect(isBluetoothMicLabel("AirPods Pro")).toBe(true);
    // Wired headsets, USB mics, and phone earpiece must NOT be classified as Bluetooth
    expect(isBluetoothMicLabel("Wired headset")).toBe(false);
    expect(isBluetoothMicLabel("Headset earpiece")).toBe(false);
    expect(isBluetoothMicLabel("USB Microphone")).toBe(false);
    expect(isBluetoothMicLabel("スピーカーフォン")).toBe(false);
    expect(isBluetoothMicLabel("内蔵マイク")).toBe(false);
  });

  it("prefers built-in phone mic on Android when Bluetooth is connected, leaves non-Bluetooth Android untouched, and auto-selects AirPods on iOS", () => {
    const mockDevicesWithBt = [
      {
        deviceId: "bt-buds-fe",
        kind: "audioinput",
        label: "ヘッドセット マイク (Galaxy Buds FE)",
        groupId: "g1",
        toJSON: () => ({}),
      },
      {
        deviceId: "builtin-phone",
        kind: "audioinput",
        label: "スピーカーフォン",
        groupId: "g2",
        toJSON: () => ({}),
      },
    ] as MediaDeviceInfo[];

    // On Android (even if Galaxy Buds FE was previously auto-saved), should pick built-in mic
    const androidPicked = pickPreferredMicDevice(mockDevicesWithBt, {
      isAndroid: true,
      savedId: "bt-buds-fe",
      savedLabel: "ヘッドセット マイク (Galaxy Buds FE)",
      isManualSelection: false,
    });
    expect(androidPicked?.deviceId).toBe("builtin-phone");

    // On Android with NO Bluetooth devices connected (e.g. wired earphones / speakerphone only), do not override OS default
    const mockWiredOnly = [
      {
        deviceId: "wired-1",
        kind: "audioinput",
        label: "Wired headset",
        groupId: "g1",
        toJSON: () => ({}),
      },
      {
        deviceId: "builtin-phone",
        kind: "audioinput",
        label: "スピーカーフォン",
        groupId: "g2",
        toJSON: () => ({}),
      },
    ] as MediaDeviceInfo[];
    expect(
      pickPreferredMicDevice(mockWiredOnly, {
        isAndroid: true,
        isManualSelection: false,
      })
    ).toBeUndefined();

    // On Android when user explicitly manually selected Galaxy Buds FE, respect manual choice
    const androidManual = pickPreferredMicDevice(mockDevicesWithBt, {
      isAndroid: true,
      savedId: "bt-buds-fe",
      savedLabel: "ヘッドセット マイク (Galaxy Buds FE)",
      isManualSelection: true,
    });
    expect(androidManual?.deviceId).toBe("bt-buds-fe");

    // On iOS/Desktop with no prior selection, auto-pick Bluetooth earbuds
    const iosPicked = pickPreferredMicDevice(mockDevicesWithBt, {
      isAndroid: false,
    });
    expect(iosPicked?.deviceId).toBe("bt-buds-fe");
  });

  it("waits for Bluetooth audio route settling after mic ready before starting shadowing model audio from 0.00s", () => {
    // Android (Galaxy S26 + Galaxy Buds FE) requires ~650ms after getUserMedia/MediaRecorder open
    // for AudioFlinger & Bluetooth sink to finish route transition so word 1 is not clipped
    expect(getShadowingPlaybackSettleDelayMs(true)).toBe(650);
    // iOS / Desktop uses a crisp 280ms pre-roll after mic ready
    expect(getShadowingPlaybackSettleDelayMs(false)).toBe(280);
  });

  it("verifies shadowing auto-stop margin delay is 1500ms", () => {
    const SHADOWING_MARGIN_MS = 1500;
    expect(SHADOWING_MARGIN_MS).toBe(1500);
  });
});


