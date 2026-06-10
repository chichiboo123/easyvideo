"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type {
  Caption,
  Sticker,
  ImageOverlay,
  VideoClip,
  AudioClip,
  TransitionType,
  VideoEffectType,
  AspectRatio,
  ExportQuality,
} from "@/types";
import { resolveTransition, transitionXfadeName } from "@/lib/transitions";
import {
  renderCaptionOverlay,
  renderStickerOverlay,
  renderImageOverlay,
  probeVideoSize,
  type RenderedOverlay,
} from "@/lib/overlayRender";

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

// Hard-stop a running export. The wasm worker is killed, so the cached
// instance is discarded and the next export reloads FFmpeg from scratch.
export function cancelExport() {
  try { ffmpeg?.terminate(); } catch { /* already dead */ }
  ffmpeg = null;
  loadPromise = null;
}

interface ExportOptions {
  clips: VideoClip[];
  audios: AudioClip[];
  captions: Caption[];
  stickers: Sticker[];
  images?: ImageOverlay[];
  isAudioMuted?: boolean;
  transitionType?: TransitionType;
  transitionDuration?: number;
  videoEffect?: VideoEffectType;
  aspectRatio?: AspectRatio;
  quality?: ExportQuality;
  onProgress?: (ratio: number) => void;
}

function aspectRatioSize(ratio: AspectRatio, quality: ExportQuality): { w: number; h: number } | null {
  let h: number;
  switch (quality) {
    case "preview": h = 360; break;
    case "720p":    h = 720; break;
    case "1080p":   h = 1080; break;
    default:        return null;
  }
  switch (ratio) {
    case "16:9": return { w: Math.round(h * 16 / 9 / 2) * 2, h };
    case "9:16": return { w: Math.round(h * 9 / 16 / 2) * 2, h };
    case "1:1":  return { w: h, h };
    case "4:5":  return { w: Math.round(h * 4 / 5 / 2) * 2, h };
    default:     return null;
  }
}

function videoEffectFilter(effect: VideoEffectType): string | null {
  switch (effect) {
    case "vintage":  return "eq=saturation=0.8:contrast=1.15:brightness=0.03,curves=vintage";
    case "bright":   return "eq=brightness=0.08:saturation=1.12";
    case "bw":       return "hue=s=0";
    case "warm":     return "colorbalance=rs=0.1:gs=0.05:bs=-0.1";
    case "cool":     return "colorbalance=rs=-0.1:gs=0.0:bs=0.1";
    case "blur":     return "boxblur=3:1";
    case "vignette": return "vignette=PI/4";
    default: return null;
  }
}

export async function exportVideo({
  clips,
  audios,
  captions,
  stickers,
  images = [],
  isAudioMuted = false,
  transitionType = "none",
  transitionDuration = 0.4,
  videoEffect = "none",
  aspectRatio = "16:9",
  quality = "720p",
  onProgress,
}: ExportOptions): Promise<Blob> {
  if (clips.length === 0) throw new Error("내보낼 영상이 없어요");

  const instance = await getFFmpeg(onProgress);

  // ── 1. Write input files ─────────────────────────────────────────────────
  const inputNames: string[] = [];
  for (let i = 0; i < clips.length; i++) {
    const name = `in_${i}.mp4`;
    await instance.writeFile(name, await fetchFile(clips[i].url));
    inputNames.push(name);
  }

  // ── 2. Trim + speed each clip into trim_i.mp4 ────────────────────────────
  const trimmedNames: string[] = [];
  const trimmedDur: number[] = [];
  for (let i = 0; i < clips.length; i++) {
    const c = clips[i];
    const out = `trim_${i}.mp4`;
    const trimArgs: string[] = ["-ss", c.inPoint.toString(), "-to", c.outPoint.toString(), "-i", inputNames[i]];
    const dur = (c.outPoint - c.inPoint) / c.speed;
    trimmedDur.push(dur);

    const vf: string[] = [];
    if (c.speed !== 1) vf.push(`setpts=${(1 / c.speed).toFixed(4)}*PTS`);
    if (c.fadeIn > 0) vf.push(`fade=t=in:st=0:d=${c.fadeIn}`);
    if (c.fadeOut > 0) vf.push(`fade=t=out:st=${Math.max(0, dur - c.fadeOut).toFixed(3)}:d=${c.fadeOut}`);

    const af: string[] = [];
    if (c.speed !== 1) {
      // atempo handles 0.5x ~ 2x; chain for extremes
      let s = c.speed;
      while (s > 2) { af.push("atempo=2.0"); s /= 2; }
      while (s < 0.5) { af.push("atempo=0.5"); s *= 2; }
      af.push(`atempo=${s.toFixed(4)}`);
    }
    if (c.volume !== 1) af.push(`volume=${c.volume.toFixed(3)}`);
    if (c.fadeIn > 0) af.push(`afade=t=in:st=0:d=${c.fadeIn}`);
    if (c.fadeOut > 0) af.push(`afade=t=out:st=${Math.max(0, dur - c.fadeOut).toFixed(3)}:d=${c.fadeOut}`);

    const args: string[] = [...trimArgs];
    if (vf.length > 0) { args.push("-vf", vf.join(",")); }
    if (af.length > 0) { args.push("-af", af.join(",")); }
    args.push("-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", out);
    await instance.exec(args);
    trimmedNames.push(out);
  }

  // ── 3. Concat with per-boundary transitions ──────────────────────────────
  // Each boundary uses the clip's own transition, falling back to the
  // project default. A "none" boundary becomes a near-instant 0.05s fade so
  // mixed chains (cut + transition) still work in a single xfade graph.
  const boundaries: TransitionType[] = [];
  for (let i = 0; i < clips.length - 1; i++) {
    boundaries.push(resolveTransition(clips[i].transitionAfter, transitionType));
  }
  const hasAnyTransition = boundaries.some((b) => b !== "none");

  if (hasAnyTransition && clips.length > 1) {
    const fc: string[] = [];
    for (let i = 0; i < clips.length; i++) {
      fc.push(`[${i}:v]format=yuv420p,fps=30[v${i}]`);
    }
    let prevV = "[v0]";
    let prevA = "[0:a]";
    let cumulative = trimmedDur[0];
    for (let i = 1; i < clips.length; i++) {
      const t = boundaries[i - 1];
      const rawD = t === "none" ? 0.05 : transitionDuration;
      // xfade duration may not exceed either side of the boundary.
      const d = Math.max(0.04, Math.min(rawD, trimmedDur[i - 1] * 0.5, trimmedDur[i] * 0.5));
      const offset = Math.max(0, cumulative - d);
      const outV = `[x${i}]`;
      fc.push(`${prevV}[v${i}]xfade=transition=${transitionXfadeName(t)}:duration=${d.toFixed(3)}:offset=${offset.toFixed(3)}${outV}`);
      // Keep audio in sync with the same crossfade length.
      const outA = `[ax${i}]`;
      fc.push(`${prevA}[${i}:a]acrossfade=d=${d.toFixed(3)}${outA}`);
      cumulative += trimmedDur[i] - d;
      prevV = outV;
      prevA = outA;
    }
    const xfadeInputs = trimmedNames.flatMap((n) => ["-i", n]);
    await instance.exec([
      ...xfadeInputs,
      "-filter_complex", fc.join(";"),
      "-map", prevV, "-map", prevA,
      "-pix_fmt", "yuv420p", "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac",
      "concat.mp4",
    ]);
  } else {
    const listBody = trimmedNames.map((n) => `file '${n}'`).join("\n");
    await instance.writeFile("list.txt", new TextEncoder().encode(listBody));
    await instance.exec(["-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "concat.mp4"]);
  }

  // ── 4. Render overlays (captions / stickers / images) to PNG ─────────────
  // Done in the browser so Korean fonts, emoji, outlines and shadows are
  // pixel-identical to the preview.
  const size = aspectRatioSize(aspectRatio, quality);
  let outW = size?.w ?? 0;
  let outH = size?.h ?? 0;
  if (!size) {
    const probed = await probeVideoSize(clips[0].url);
    outW = probed?.w ?? 1280;
    outH = probed?.h ?? 720;
  }

  const overlays: RenderedOverlay[] = [];
  for (const c of captions) overlays.push(await renderCaptionOverlay(c, outW, outH));
  for (const s of stickers) overlays.push(await renderStickerOverlay(s, outW, outH));
  for (const img of images) {
    try { overlays.push(await renderImageOverlay(img, outW, outH)); }
    catch { /* unloadable image — skip rather than fail the export */ }
  }

  // ── 5. Compose final video: scale → effect → overlays → audio mix ────────
  const args: string[] = ["-i", "concat.mp4"];

  for (let i = 0; i < overlays.length; i++) {
    const ov = overlays[i];
    const name = `ov_${i}.png`;
    await instance.writeFile(name, ov.png);
    const dur = Math.max(0.1, ov.endTime - ov.startTime);
    args.push("-loop", "1", "-t", dur.toFixed(3), "-i", name);
  }

  const usableAudios = isAudioMuted ? [] : audios.filter((a) => a.url);
  const audioInputOffset = 1 + overlays.length;
  for (let i = 0; i < usableAudios.length; i++) {
    await instance.writeFile(`a${i}.mp3`, await fetchFile(usableAudios[i].url));
    args.push("-i", `a${i}.mp3`);
  }

  const fc: string[] = [];

  // Base chain: aspect-ratio scaling + global effect.
  const baseFilters: string[] = [];
  if (size) {
    baseFilters.push(`scale=${size.w}:${size.h}:force_original_aspect_ratio=decrease`);
    baseFilters.push(`pad=${size.w}:${size.h}:(ow-iw)/2:(oh-ih)/2:black`);
  }
  const effectFilter = videoEffectFilter(videoEffect);
  if (effectFilter) baseFilters.push(effectFilter);

  let vLabel = "[0:v]";
  if (baseFilters.length > 0) {
    fc.push(`[0:v]${baseFilters.join(",")}[vbase]`);
    vLabel = "[vbase]";
  }

  // Overlay chain with alpha fade in/out per overlay.
  for (let i = 0; i < overlays.length; i++) {
    const ov = overlays[i];
    const inIdx = 1 + i;
    const dur = Math.max(0.1, ov.endTime - ov.startTime);
    const ovFilters: string[] = ["format=argb"];
    if (ov.fadeIn > 0) ovFilters.push(`fade=t=in:st=0:d=${Math.min(ov.fadeIn, dur / 2).toFixed(3)}:alpha=1`);
    if (ov.fadeOut > 0) {
      const d = Math.min(ov.fadeOut, dur / 2);
      ovFilters.push(`fade=t=out:st=${(dur - d).toFixed(3)}:d=${d.toFixed(3)}:alpha=1`);
    }
    ovFilters.push(`setpts=PTS-STARTPTS+${ov.startTime.toFixed(3)}/TB`);
    fc.push(`[${inIdx}:v]${ovFilters.join(",")}[ov${i}]`);
    const outLabel = `[vo${i}]`;
    fc.push(`${vLabel}[ov${i}]overlay=0:0:enable='between(t,${ov.startTime.toFixed(3)},${ov.endTime.toFixed(3)})'${outLabel}`);
    vLabel = outLabel;
  }

  // Audio mix: timeline offset (adelay) + per-track volume/fades.
  let aLabel = "0:a";
  if (usableAudios.length > 0) {
    const mixInputs: string[] = ["[0:a]"];
    for (let i = 0; i < usableAudios.length; i++) {
      const a = usableAudios[i];
      const af: string[] = [`volume=${(a.volume ?? 1).toFixed(3)}`];
      if (a.fadeIn) af.push(`afade=t=in:st=0:d=${a.fadeIn}`);
      if (a.fadeOut) af.push(`afade=t=out:st=${Math.max(0, a.duration - a.fadeOut).toFixed(3)}:d=${a.fadeOut}`);
      const delayMs = Math.round((a.startTime ?? 0) * 1000);
      if (delayMs > 0) af.push(`adelay=${delayMs}:all=1`);
      fc.push(`[${audioInputOffset + i}:a]${af.join(",")}[am${i}]`);
      mixInputs.push(`[am${i}]`);
    }
    fc.push(`${mixInputs.join("")}amix=inputs=${mixInputs.length}:duration=first:dropout_transition=0[aout]`);
    aLabel = "[aout]";
  }

  if (fc.length > 0) args.push("-filter_complex", fc.join(";"));
  args.push("-map", vLabel === "[0:v]" ? "0:v" : vLabel);
  args.push("-map", aLabel);
  args.push("-shortest");
  args.push("-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", "out.mp4");

  await instance.exec(args);
  const data = await instance.readFile("out.mp4");
  const buffer = data as Uint8Array;
  const copy = new Uint8Array(buffer.byteLength);
  copy.set(buffer);
  return new Blob([copy], { type: "video/mp4" });
}
