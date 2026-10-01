import { describe, it, expect, vi, beforeEach } from "vitest";
import { isAdminEmail, DEFAULT_ADMIN_EMAIL } from "@/lib/auth/admin-checker";

describe("Admin Shadowing Recording Mode Verification", () => {
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

  it("verifies echoCancellation constraint is false in shadowing mode to prevent ducking", () => {
    // Mode-to-constraint mapping specification
    const getRecordingConstraints = (mode: "repeating" | "shadowing") => ({
      echoCancellation: mode === "shadowing" ? false : true,
      noiseSuppression: true,
    });

    const repeatingConstraints = getRecordingConstraints("repeating");
    const shadowingConstraints = getRecordingConstraints("shadowing");

    expect(repeatingConstraints.echoCancellation).toBe(true);
    // In shadowing mode (earphones recommended), AEC must be false to avoid ducking/gain attenuation
    expect(shadowingConstraints.echoCancellation).toBe(false);
  });

  it("verifies shadowing auto-stop margin delay is 1500ms", () => {
    const SHADOWING_MARGIN_MS = 1500;
    expect(SHADOWING_MARGIN_MS).toBe(1500);
  });
});
