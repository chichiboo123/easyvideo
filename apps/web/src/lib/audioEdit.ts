"use client";

// Web Audio helpers for the Audacity-style audio editor. Every edit produces a
// brand-new AudioBuffer (non-mutating) so the editor can keep a simple undo
// stack, and the result is encoded to a 16-bit PCM WAV Blob when applied back
// to the timeline.

let sharedCtx: AudioContext | null = null;
function ctx(): AudioContext {
  if (!sharedCtx) {
    const Ctor: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    sharedCtx = new Ctor();
  }
  return sharedCtx;
}

export async function decodeAudioFromUrl(url: string): Promise<AudioBuffer> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return ctx().decodeAudioData(buf.slice(0));
}

// Allocate an empty buffer that matches an existing one's channel/rate layout.
function makeBuffer(like: AudioBuffer, length: number): AudioBuffer {
  return ctx().createBuffer(like.numberOfChannels, Math.max(1, length), like.sampleRate);
}

function secToSample(buffer: AudioBuffer, sec: number): number {
  return Math.round(sec * buffer.sampleRate);
}

// Keep only [startSec, endSec] of the source.
export function sliceBuffer(buffer: AudioBuffer, startSec: number, endSec: number): AudioBuffer {
  const s = Math.max(0, Math.min(buffer.length, secToSample(buffer, startSec)));
  const e = Math.max(s, Math.min(buffer.length, secToSample(buffer, endSec)));
  const out = makeBuffer(buffer, e - s);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    out.getChannelData(ch).set(buffer.getChannelData(ch).subarray(s, e));
  }
  return out;
}

// Remove [startSec, endSec], stitching the remaining head and tail together.
export function deleteRange(buffer: AudioBuffer, startSec: number, endSec: number): AudioBuffer {
  const s = Math.max(0, Math.min(buffer.length, secToSample(buffer, startSec)));
  const e = Math.max(s, Math.min(buffer.length, secToSample(buffer, endSec)));
  const removed = e - s;
  const out = makeBuffer(buffer, buffer.length - removed);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const src = buffer.getChannelData(ch);
    const dst = out.getChannelData(ch);
    dst.set(src.subarray(0, s), 0);
    dst.set(src.subarray(e), s);
  }
  return out;
}

// Multiply the whole buffer (or a region) by a linear gain factor.
export function applyGain(buffer: AudioBuffer, gain: number, startSec?: number, endSec?: number): AudioBuffer {
  const s = startSec === undefined ? 0 : Math.max(0, secToSample(buffer, startSec));
  const e = endSec === undefined ? buffer.length : Math.min(buffer.length, secToSample(buffer, endSec));
  const out = makeBuffer(buffer, buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const src = buffer.getChannelData(ch);
    const dst = out.getChannelData(ch);
    for (let i = 0; i < src.length; i++) {
      dst[i] = i >= s && i < e ? clampSample(src[i] * gain) : src[i];
    }
  }
  return out;
}

// Scale so the loudest sample hits `targetPeak` (Audacity's "Normalize").
export function normalize(buffer: AudioBuffer, targetPeak = 0.98): AudioBuffer {
  let peak = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const d = buffer.getChannelData(ch);
    for (let i = 0; i < d.length; i++) {
      const v = Math.abs(d[i]);
      if (v > peak) peak = v;
    }
  }
  if (peak < 1e-6) return buffer;
  return applyGain(buffer, targetPeak / peak);
}

// Linear fade in or out across [startSec, endSec].
export function fadeRegion(buffer: AudioBuffer, startSec: number, endSec: number, type: "in" | "out"): AudioBuffer {
  const s = Math.max(0, secToSample(buffer, startSec));
  const e = Math.min(buffer.length, secToSample(buffer, endSec));
  const span = Math.max(1, e - s);
  const out = makeBuffer(buffer, buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const src = buffer.getChannelData(ch);
    const dst = out.getChannelData(ch);
    dst.set(src);
    for (let i = s; i < e; i++) {
      const p = (i - s) / span;              // 0..1 across the region
      const g = type === "in" ? p : 1 - p;
      dst[i] = src[i] * g;
    }
  }
  return out;
}

// Zero out [startSec, endSec] (Audacity's "Silence Audio").
export function silenceRange(buffer: AudioBuffer, startSec: number, endSec: number): AudioBuffer {
  const s = Math.max(0, secToSample(buffer, startSec));
  const e = Math.min(buffer.length, secToSample(buffer, endSec));
  const out = makeBuffer(buffer, buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const dst = out.getChannelData(ch);
    dst.set(buffer.getChannelData(ch));
    for (let i = s; i < e; i++) dst[i] = 0;
  }
  return out;
}

// Reverse the whole buffer (or a region).
export function reverseBuffer(buffer: AudioBuffer, startSec?: number, endSec?: number): AudioBuffer {
  const s = startSec === undefined ? 0 : Math.max(0, secToSample(buffer, startSec));
  const e = endSec === undefined ? buffer.length : Math.min(buffer.length, secToSample(buffer, endSec));
  const out = makeBuffer(buffer, buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const src = buffer.getChannelData(ch);
    const dst = out.getChannelData(ch);
    dst.set(src);
    for (let i = s; i < e; i++) dst[i] = src[e - 1 - (i - s)];
  }
  return out;
}

function clampSample(v: number): number {
  return v > 1 ? 1 : v < -1 ? -1 : v;
}

// Encode an AudioBuffer to a 16-bit PCM WAV Blob.
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numCh * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const bufferSize = 44 + dataSize;
  const ab = new ArrayBuffer(bufferSize);
  const view = new DataView(ab);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);            // PCM chunk size
  view.setUint16(20, 1, true);             // PCM format
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);            // bits per sample
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave channels.
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numCh; ch++) channels.push(buffer.getChannelData(ch));
  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = clampSample(channels[ch][i]);
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}
