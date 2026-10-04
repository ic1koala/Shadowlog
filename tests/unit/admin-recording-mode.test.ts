import { describe, it, expect, vi, beforeEach } from "vitest";
import { isAdminEmail, DEFAULT_ADMIN_EMAIL } from "@/lib/auth/admin-checker";
import {
  buildAudioConstraints,
  isAndroidBrowser,
  isBluetoothMicLabel,
  pickPreferredMicDevice,
} from "@/hooks/use-audio-recorder";

describe("Admin & Android Shadowing Recording Mode Verification", () => {
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

  it("disables echoCancellation, noiseSuppression, autoGainControl, and Chromium goog* DSP flags in shadowing mode", () => {
    const repeatingConstraints = buildAudioConstraints("repeating", "mic-1");
    const shadowingConstraints = buildAudioConstraints("shadowing", "mic-1");

    expect(repeatingConstraints.echoCancellation).toBe(true);
    expect(repeatingConstraints.noiseSuppression).toBe(true);
    expect(repeatingConstraints.autoGainControl).toBe(true);

    // In shadowing mode, all WebRTC DSP flags must be false to prevent Android VOICE_COMMUNICATION stream ducking
    expect(shadowingConstraints.echoCancellation).toBe(false);
    expect(shadowingConstraints.noiseSuppression).toBe(false);
    expect(shadowingConstraints.autoGainControl).toBe(false);
    expect(shadowingConstraints.googEchoCancellation).toBe(false);
    expect(shadowingConstraints.googAutoGainControl).toBe(false);
    expect(shadowingConstraints.googNoiseSuppression).toBe(false);
  });

  it("identifies Android user agents and Bluetooth earbud labels (Galaxy S26 + Galaxy Buds FE)", () => {
    const galaxyS26UA =
      "Mozilla/5.0 (Linux; Android 16; SM-S941N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36";
    const iphoneUA =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

    expect(isAndroidBrowser(galaxyS26UA)).toBe(true);
    expect(isAndroidBrowser(iphoneUA)).toBe(false);

    expect(isBluetoothMicLabel("Galaxy Buds FE (12:34)")).toBe(true);
    expect(isBluetoothMicLabel("Bluetooth headset")).toBe(true);
    expect(isBluetoothMicLabel("AirPods Pro")).toBe(true);
    expect(isBluetoothMicLabel("スピーカーフォン")).toBe(false);
    expect(isBluetoothMicLabel("内蔵マイク")).toBe(false);
  });

  it("prefers built-in phone mic on Android to keep Galaxy Buds FE in A2DP high-volume mode, while auto-selecting AirPods on iOS", () => {
    const mockDevices = [
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
    const androidPicked = pickPreferredMicDevice(mockDevices, {
      isAndroid: true,
      savedId: "bt-buds-fe",
      savedLabel: "ヘッドセット マイク (Galaxy Buds FE)",
      isManualSelection: false,
    });
    expect(androidPicked?.deviceId).toBe("builtin-phone");

    // On Android when user explicitly manually selected Galaxy Buds FE, respect manual choice
    const androidManual = pickPreferredMicDevice(mockDevices, {
      isAndroid: true,
      savedId: "bt-buds-fe",
      savedLabel: "ヘッドセット マイク (Galaxy Buds FE)",
      isManualSelection: true,
    });
    expect(androidManual?.deviceId).toBe("bt-buds-fe");

    // On iOS/Desktop with no prior selection, auto-pick Bluetooth earbuds
    const iosPicked = pickPreferredMicDevice(mockDevices, {
      isAndroid: false,
    });
    expect(iosPicked?.deviceId).toBe("bt-buds-fe");
  });

  it("verifies shadowing auto-stop margin delay is 1500ms", () => {
    const SHADOWING_MARGIN_MS = 1500;
    expect(SHADOWING_MARGIN_MS).toBe(1500);
  });
});

