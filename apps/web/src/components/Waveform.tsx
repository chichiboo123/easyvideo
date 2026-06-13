"use client";

import { useEffect, useRef } from "react";
import { getPeaks } from "@/lib/waveform";

interface WaveformProps {
  url: string;
  width: number;
  height: number;
  color?: string;
}

// Lightweight canvas waveform for timeline audio clips. Peaks are decoded once
// per URL (cached) and stretched to the current clip width.
export default function Waveform({ url, width, height, color = "rgba(255,255,255,0.55)" }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peaksRef = useRef<number[] | null>(null);

  function draw() {
    const canvas = canvasRef.current;
    const peaks = peaksRef.current;
    if (!canvas || !peaks || peaks.length === 0) return;
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

  useEffect(() => { draw(); /* redraw on resize */ }, [width, height]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.85 }}
      aria-hidden="true"
    />
  );
}
