"use client";

import { useEffect, useRef } from "react";
import { getPeaks } from "@/lib/waveform";

interface WaveformProps {
  url: string;
  width: number;
  height: number;
  color?: string;
  // Optional trim window: when the clip only plays part of the source, pass the
  // full source length plus the visible slice so the drawn waveform matches the
  // trimmed clip instead of stretching the whole file across the block.
  sourceDuration?: number;
  trimStart?: number;
  clipDuration?: number;
}

// Lightweight canvas waveform for timeline audio clips. Peaks are decoded once
// per URL (cached) and stretched to the current clip width.
export default function Waveform({
  url, width, height, color = "rgba(255,255,255,0.55)",
  sourceDuration, trimStart, clipDuration,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peaksRef = useRef<number[] | null>(null);

  function draw() {
    const canvas = canvasRef.current;
    const all = peaksRef.current;
    if (!canvas || !all || all.length === 0) return;

    // Slice peaks to the trim window when we know the source length.
    let peaks = all;
    if (sourceDuration && sourceDuration > 0 && clipDuration && clipDuration > 0) {
      const from = Math.floor(((trimStart ?? 0) / sourceDuration) * all.length);
      const to = Math.ceil((((trimStart ?? 0) + clipDuration) / sourceDuration) * all.length);
      peaks = all.slice(Math.max(0, from), Math.min(all.length, Math.max(from + 1, to)));
    }

    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    const mid = h / 2;
    const step = w / peaks.length;
    const barW = Math.max(0.6, step * 0.7);
    for (let i = 0; i < peaks.length; i++) {
      const bh = Math.max(1, peaks[i] * (h - 2));
      ctx.fillRect(i * step, mid - bh / 2, barW, bh);
    }
  }

  useEffect(() => {
    let alive = true;
    getPeaks(url).then((peaks) => {
      if (!alive) return;
      peaksRef.current = peaks;
      draw();
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => { draw(); /* redraw on resize / trim change */ }, [width, height, sourceDuration, trimStart, clipDuration]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.85 }}
      aria-hidden="true"
    />
  );
}
