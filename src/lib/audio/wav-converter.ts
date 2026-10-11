/**
 * Client-side Audio to WAV Converter
 * Decodes any browser MediaRecorder format (WebM Opus, MP4 AAC, Ogg)
 * and resamples to 16kHz mono 16-bit PCM WAV.
 * 
 * Fully compatible with:
 * - Azure AI Speech Pronunciation Assessment REST API (requires 16kHz PCM WAV)
 * - OpenAI Whisper API
 * - iOS Safari & Android Chrome
 */

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Encodes Float32Array PCM samples to a 16-bit PCM WAV ArrayBuffer.
 */
export function encodePcmToWavBuffer(samples: Float32Array, sampleRate: number = 16000): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, "RIFF");
  // file length minus 8 bytes
  view.setUint32(4, 36 + samples.length * 2, true);
  // RIFF type
  writeString(view, 8, "WAVE");
  // format chunk identifier
  writeString(view, 12, "fmt ");
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // channel count (1 = mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * 2 for 16-bit mono)
  view.setUint32(28, sampleRate * 2, true);
  // block align (2 bytes)
  view.setUint16(32, 2, true);
  // bits per sample (16 bits)
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, "data");
  // data chunk length
  view.setUint32(40, samples.length * 2, true);

  // Write 16-bit PCM samples with clipping protection
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

/**
 * Encodes Float32Array PCM samples to a 16-bit PCM WAV Blob.
 */
export function encodePcmToWav(samples: Float32Array, sampleRate: number = 16000): Blob {
  const buffer = encodePcmToWavBuffer(samples, sampleRate);
  return new Blob([new Uint8Array(buffer)], { type: "audio/wav" });
}

/**
 * Converts any audio Blob (WebM, MP4, etc.) to 16kHz mono WAV Blob.
 */
export async function convertBlobToWav(audioBlob: Blob): Promise<Blob> {
  if (typeof window === "undefined") {
    return audioBlob;
  }

  const arrayBuffer = await audioBlob.arrayBuffer();

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    return audioBlob;
  }

  const tempCtx = new AudioContextClass();
  let decodedAudio: AudioBuffer;
  try {
    decodedAudio = await tempCtx.decodeAudioData(arrayBuffer);
  } finally {
    tempCtx.close().catch(() => {});
  }

  const targetSampleRate = 16000;
  const targetLength = Math.max(1, Math.ceil(decodedAudio.duration * targetSampleRate));

  // Downmix to mono and resample to 16kHz using OfflineAudioContext
  const OfflineContextClass =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;

  if (!OfflineContextClass) {
    return audioBlob;
  }

  const offlineCtx = new OfflineContextClass(1, targetLength, targetSampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = decodedAudio;
  source.connect(offlineCtx.destination);
  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  const channelData = renderedBuffer.getChannelData(0);

  return encodePcmToWav(channelData, targetSampleRate);
}
