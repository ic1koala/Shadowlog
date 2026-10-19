import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  playWordAudio,
  preloadWordAudio,
  stopAllSpeech,
  initSpeechVoices,
  getActiveUtterance,
} from "@/lib/audio/word-speaker";

describe("Word Speaker Utility (FB-065)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    stopAllSpeech();
  });

  it("safely handles initSpeechVoices without throwing", () => {
    expect(() => initSpeechVoices()).not.toThrow();
  });

  it("preloads word audio without errors", () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response());
    expect(() =>
      preloadWordAudio(["Hello,", "world!", "don't", "a", ""])
    ).not.toThrow();
    // Words longer than 1 character should trigger prefetch
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("handles playWordAudio for empty or whitespace string by ignoring", async () => {
    const onStart = vi.fn();
    await playWordAudio("   ", { onStart });
    expect(onStart).not.toHaveBeenCalled();
    expect(getActiveUtterance()).toBeNull();
  });

  it("stops previous speech and cleans up on stopAllSpeech", () => {
    stopAllSpeech();
    expect(getActiveUtterance()).toBeNull();
  });
});
