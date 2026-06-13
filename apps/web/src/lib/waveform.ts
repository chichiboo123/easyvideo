"use client";

// Decode an audio (or video) URL into a small array of normalised 0..1 peaks
// for drawing waveforms on the timeline. Results are cached per URL+bucket
// count so each clip is only decoded once.

const cache = new Map<string, Promise<number[]>>();

function decodePeaks(url: string, buckets: number): Promise<number[]> {
  return (async () => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const Ctx: typeof AudioContext =
      (window.AudioContext || (window as any).webkitAudioContext);
    const ctx = new Ctx();
    try {
      const audio = await ctx.decodeAudioData(buf.slice(0));
      const data = audio.getChannelData(0);
      const block = Math.max(1, Math.floor(data.length / buckets));
      const peaks: number[] = [];
      let max = 0.0001;
      for (let i = 0; i < buckets; i++) {
        let peak = 0;
        const start = i * block;
        for (let j = 0; j < block; j++) {
          const v = Math.abs(data[start + j] || 0);
          if (v > peak) peak = v;
        }
        peaks.push(peak);
        if (peak > max) max = peak;
      }
      return peaks.map((p) => p / max);
    } finally {
      ctx.close().catch(() => {});
    }
  })();
}

export function getPeaks(url: string, buckets = 320): Promise<number[]> {
  const key = `${url}|${buckets}`;
  let p = cache.get(key);
  if (!p) {
    p = decodePeaks(url, buckets).catch(() => []);
    cache.set(key, p);
  }
  return p;
}
