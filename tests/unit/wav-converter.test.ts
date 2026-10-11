import { describe, it, expect } from "vitest";
import { encodePcmToWavBuffer, encodePcmToWav } from "@/lib/audio/wav-converter";

describe("wav-converter", () => {
  it("encodes Float32Array PCM samples to valid 16-bit mono WAV ArrayBuffer", () => {
    const sampleRate = 16000;
    // 0.5s of samples
    const samples = new Float32Array(8000);
    for (let i = 0; i < samples.length; i++) {
      samples[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5;
    }

    const arrayBuffer = encodePcmToWavBuffer(samples, sampleRate);
    expect(arrayBuffer).toBeDefined();
    expect(arrayBuffer.byteLength).toBe(44 + 8000 * 2);

    const buffer = Buffer.from(arrayBuffer);
    // Check RIFF header
    expect(buffer.slice(0, 4).toString()).toBe("RIFF");
    expect(buffer.readUInt32LE(4)).toBe(36 + 8000 * 2);
    expect(buffer.slice(8, 12).toString()).toBe("WAVE");
    expect(buffer.slice(12, 16).toString()).toBe("fmt ");
    expect(buffer.readUInt32LE(16)).toBe(16); // fmt chunk size
    expect(buffer.readUInt16LE(20)).toBe(1); // PCM format
    expect(buffer.readUInt16LE(22)).toBe(1); // Mono channel
    expect(buffer.readUInt32LE(24)).toBe(16000); // 16kHz sample rate
    expect(buffer.readUInt32LE(28)).toBe(32000); // 16000 * 2 byte rate
    expect(buffer.readUInt16LE(32)).toBe(2); // block align
    expect(buffer.readUInt16LE(34)).toBe(16); // 16 bits per sample
    expect(buffer.slice(36, 40).toString()).toBe("data");
    expect(buffer.readUInt32LE(40)).toBe(8000 * 2);

    // Also test encodePcmToWav creates a Blob with type audio/wav
    const wavBlob = encodePcmToWav(samples, sampleRate);
    expect(wavBlob).toBeDefined();
    expect(wavBlob.type).toBe("audio/wav");
  });
});
