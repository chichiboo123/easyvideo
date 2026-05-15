"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { Caption, Sticker, VideoClip, AudioClip } from "@/types";

let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

export async function getFFmpeg(
  onProgress?: (ratio: number) => void,
  onLog?: (msg: string) => void,
): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const instance = new FFmpeg();
    if (onLog) instance.on("log", ({ message }) => onLog(message));
    if (onProgress) instance.on("progress", ({ progress }) => onProgress(progress));
    await instance.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpeg = instance;
    return instance;
  })();

  return loadPromise;
}

interface ExportOptions {
  clips: VideoClip[];
  audio: AudioClip | null;
  captions: Caption[];
  stickers: Sticker[];
  onProgress?: (ratio: number) => void;
}

function escapeDrawText(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'");
}

export async function exportVideo({
  clips,
  audio,
  captions,
  stickers,
  onProgress,
}: ExportOptions): Promise<Blob> {
  if (clips.length === 0) throw new Error("내보낼 영상이 없어요");

  const instance = await getFFmpeg(onProgress);

  // Write inputs.
  const inputNames: string[] = [];
  for (let i = 0; i < clips.length; i++) {
    const name = `in_${i}.mp4`;
    await instance.writeFile(name, await fetchFile(clips[i].url));
    inputNames.push(name);
  }

  // Concat list file.
  const listBody = inputNames.map((n) => `file '${n}'`).join("\n");
  await instance.writeFile("list.txt", new TextEncoder().encode(listBody));

  // First: concat into a single intermediate file.
  await instance.exec([
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    "list.txt",
    "-c",
    "copy",
    "concat.mp4",
  ]);

  // Build drawtext filters for captions and emoji stickers (treated as text).
  const filters: string[] = [];
  for (const c of captions) {
    filters.push(
      `drawtext=text='${escapeDrawText(c.text)}':fontcolor=${c.color}:fontsize=${c.fontSize}:x=(w*${c.x / 100}-text_w/2):y=(h*${c.y / 100}-text_h/2):enable='between(t,${c.startTime},${c.endTime})'`,
    );
  }
  for (const s of stickers) {
    filters.push(
      `drawtext=text='${escapeDrawText(s.emoji)}':fontsize=${s.size}:x=(w*${s.x / 100}-text_w/2):y=(h*${s.y / 100}-text_h/2):enable='between(t,${s.startTime},${s.endTime})'`,
    );
  }

  const args: string[] = ["-i", "concat.mp4"];
  if (audio) {
    await instance.writeFile("audio.mp3", await fetchFile(audio.url));
    args.push("-i", "audio.mp3");
  }

  if (filters.length > 0) {
    args.push("-vf", filters.join(","));
  }

  if (audio) {
    args.push("-map", "0:v:0", "-map", "1:a:0", "-shortest");
  }

  args.push("-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p");
  if (audio) args.push("-c:a", "aac");
  args.push("out.mp4");

  await instance.exec(args);
  const data = await instance.readFile("out.mp4");
  const buffer = data as Uint8Array;
  // Copy into a fresh ArrayBuffer so the Blob owns its bytes.
  const copy = new Uint8Array(buffer.byteLength);
  copy.set(buffer);
  return new Blob([copy], { type: "video/mp4" });
}
