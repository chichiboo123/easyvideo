import type { Caption } from "@/types";

function pad(n: number, width = 2): string {
  return String(Math.floor(n)).padStart(width, "0");
}

export function secToSrtTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec - Math.floor(sec)) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

export function srtTimeToSec(t: string): number {
  // 00:00:01,500 or 00:00:01.500
  const m = t.replace(",", ".").match(/(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) return 0;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

export function exportSrt(captions: Caption[]): string {
  return captions
    .slice()
    .sort((a, b) => a.startTime - b.startTime)
    .map((c, i) => `${i + 1}\n${secToSrtTime(c.startTime)} --> ${secToSrtTime(c.endTime)}\n${c.text}\n`)
    .join("\n");
}

export function downloadSrt(captions: Caption[]) {
  const blob = new Blob([exportSrt(captions)], { type: "application/x-subrip;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `easyvideo_subtitles_${Date.now()}.srt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ParsedCue {
  startTime: number;
  endTime: number;
  text: string;
}

export function parseSrt(content: string): ParsedCue[] {
  const blocks = content.replace(/\r/g, "").split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  const cues: ParsedCue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const timeLine = lines.find((l) => l.includes("-->"));
    if (!timeLine) continue;
    const [a, b] = timeLine.split("-->").map((x) => x.trim());
    const start = srtTimeToSec(a);
    const end = srtTimeToSec(b);
    const textStart = lines.indexOf(timeLine) + 1;
    const text = lines.slice(textStart).join("\n").trim();
    if (text) cues.push({ startTime: start, endTime: end, text });
  }
  return cues;
}

export function parseVtt(content: string): ParsedCue[] {
  // Strip WEBVTT header, then reuse SRT parser (formats are very similar).
  const cleaned = content.replace(/^WEBVTT.*?\n/s, "").trim();
  return parseSrt(cleaned);
}
