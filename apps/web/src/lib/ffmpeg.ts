"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type {
  Caption,
  Sticker,
  VideoClip,
  AudioClip,
  TransitionType,
  VideoEffectType,
  AspectRatio,
  ExportQuality,
} from "@/types";

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
  audios: AudioClip[];
  captions: Caption[];
  stickers: Sticker[];
  isAudioMuted?: boolean;
  transitionType?: TransitionType;
  transitionDuration?: number;
  videoEffect?: VideoEffectType;
  aspectRatio?: AspectRatio;
  quality?: ExportQuality;
  onProgress?: (ratio: number) => void;
}

function escapeDrawText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
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

  // ── 2. Trim + speed each clip into trimmed_i.mp4 ─────────────────────────
  const trimmedNames: string[] = [];
  for (let i = 0; i < clips.length; i++) {
    const c = clips[i];
    const out = `trim_${i}.mp4`;
    const trimArgs: string[] = ["-ss", c.inPoint.toString(), "-to", c.outPoint.toString(), "-i", inputNames[i]];
    const vf: string[] = [];
    if (c.speed !== 1) vf.push(`setpts=${(1 / c.speed).toFixed(4)}*PTS`);
    if (c.fadeIn > 0) vf.push(`fade=t=in:st=0:d=${c.fadeIn}`);
    if (c.fadeOut > 0) {
      const dur = (c.outPoint - c.inPoint) / c.speed;
      vf.push(`fade=t=out:st=${Math.max(0, dur - c.fadeOut).toFixed(3)}:d=${c.fadeOut}`);
    }
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
    if (c.fadeOut > 0) {
      const dur = (c.outPoint - c.inPoint) / c.speed;
      af.push(`afade=t=out:st=${Math.max(0, dur - c.fadeOut).toFixed(3)}:d=${c.fadeOut}`);
    }

    const args: string[] = [...trimArgs];
    if (vf.length > 0) { args.push("-vf", vf.join(",")); }
    if (af.length > 0) { args.push("-af", af.join(",")); }
    args.push("-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", out);
    await instance.exec(args);
    trimmedNames.push(out);
  }

  // ── 3. Concat / transition ───────────────────────────────────────────────
  if (transitionType !== "none" && clips.length > 1) {
    const filter = transitionType === "dissolve" ? "dissolve"
      : transitionType === "slide-left" ? "slideleft"
      : transitionType === "wipe-up" ? "wipeup"
      : "fade";
    const fc: string[] = [];
    let cumulative = (clips[0].outPoint - clips[0].inPoint) / clips[0].speed;
    fc.push(`[0:v]format=yuv420p,fps=30[v0]`);
    for (let i = 1; i < clips.length; i++) {
      fc.push(`[${i}:v]format=yuv420p,fps=30[v${i}]`);
    }
    let prev = `[v0]`;
    for (let i = 1; i < clips.length; i++) {
      const offset = Math.max(0, cumulative - transitionDuration);
      const right = `[v${i}]`;
      const out = `[x${i}]`;
      fc.push(`${prev}${right}xfade=transition=${filter}:duration=${transitionDuration}:offset=${offset}${out}`);
      cumulative += (clips[i].outPoint - clips[i].inPoint) / clips[i].speed - transitionDuration;
      prev = out;
    }
    // Audio: concat
    const audioMaps: string[] = [];
    for (let i = 0; i < clips.length; i++) audioMaps.push(`[${i}:a]`);
    fc.push(`${audioMaps.join("")}concat=n=${clips.length}:v=0:a=1[aout]`);
    const xfadeInputs = trimmedNames.flatMap((n) => ["-i", n]);
    await instance.exec([
      ...xfadeInputs,
      "-filter_complex", fc.join(";"),
      "-map", prev, "-map", "[aout]",
      "-pix_fmt", "yuv420p", "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac",
      "concat.mp4",
    ]);
  } else {
    const listBody = trimmedNames.map((n) => `file '${n}'`).join("\n");
    await instance.writeFile("list.txt", new TextEncoder().encode(listBody));
    await instance.exec(["-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "concat.mp4"]);
  }

  // ── 4. Build subtitle overlay (drawtext) for captions + stickers ─────────
  const filters: string[] = [];

  // Aspect-ratio scaling/padding.
  const size = aspectRatioSize(aspectRatio, quality);
  if (size) {
    filters.push(`scale=${size.w}:${size.h}:force_original_aspect_ratio=decrease`);
    filters.push(`pad=${size.w}:${size.h}:(ow-iw)/2:(oh-ih)/2:black`);
  }

  // Video effect.
  const effectFilter = videoEffectFilter(videoEffect);
  if (effectFilter) filters.push(effectFilter);

  // Captions.
  for (const c of captions) {
    const fontSize = c.fontSize;
    const x = `(w*${c.x / 100}-text_w/2)`;
    const y = `(h*${c.y / 100}-text_h/2)`;
    const between = `between(t,${c.startTime},${c.endTime})`;
    const stroke = c.strokeWidth > 0
      ? `:bordercolor=${cssToFFmpegColor(c.strokeColor)}:borderw=${c.strokeWidth}`
      : "";
    const bg = c.backgroundColor && c.backgroundColor !== "transparent"
      ? `:box=1:boxcolor=${cssToFFmpegColor(c.backgroundColor)}@0.6:boxborderw=${c.bgPadding}`
      : "";
    const shadow = c.shadowBlur > 0
      ? `:shadowcolor=${cssToFFmpegColor(c.shadowColor)}:shadowx=${c.shadowOffsetX}:shadowy=${c.shadowOffsetY}`
      : "";
    filters.push(
      `drawtext=text='${escapeDrawText(c.text)}':fontcolor=${cssToFFmpegColor(c.color)}:fontsize=${fontSize}${stroke}${bg}${shadow}:x=${x}:y=${y}:enable='${between}'`,
    );
  }
  // Stickers (emoji as drawtext).
  for (const s of stickers) {
    filters.push(
      `drawtext=text='${escapeDrawText(s.emoji)}':fontsize=${s.size}:x=(w*${s.x / 100}-text_w/2):y=(h*${s.y / 100}-text_h/2):enable='between(t,${s.startTime},${s.endTime})'`,
    );
  }

  // ── 5. Mix audio ─────────────────────────────────────────────────────────
  const args: string[] = ["-i", "concat.mp4"];
  const usableAudios = isAudioMuted ? [] : audios.filter((a) => a.url);
  for (let i = 0; i < usableAudios.length; i++) {
    await instance.writeFile(`a${i}.mp3`, await fetchFile(usableAudios[i].url));
    args.push("-i", `a${i}.mp3`);
  }

  const fc: string[] = [];
  if (filters.length > 0) {
    fc.push(`[0:v]${filters.join(",")}[vout]`);
  }
  let aoutLabel = "0:a";
  if (usableAudios.length > 0) {
    const inputs: string[] = ["[0:a]"];
    for (let i = 0; i < usableAudios.length; i++) {
      const a = usableAudios[i];
      const vol = (a.volume ?? 1);
      const af: string[] = [`volume=${vol.toFixed(3)}`];
      if (a.fadeIn) af.push(`afade=t=in:st=0:d=${a.fadeIn}`);
      if (a.fadeOut) af.push(`afade=t=out:st=${Math.max(0, a.duration - a.fadeOut).toFixed(3)}:d=${a.fadeOut}`);
      fc.push(`[${i + 1}:a]${af.join(",")}[a${i + 1}]`);
      inputs.push(`[a${i + 1}]`);
    }
    fc.push(`${inputs.join("")}amix=inputs=${inputs.length}:duration=longest:dropout_transition=0[aout]`);
    aoutLabel = "[aout]";
  }
  if (fc.length > 0) args.push("-filter_complex", fc.join(";"));
  args.push("-map", filters.length > 0 ? "[vout]" : "0:v");
  args.push("-map", aoutLabel);
  args.push("-shortest");
  args.push("-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", "out.mp4");

  await instance.exec(args);
  const data = await instance.readFile("out.mp4");
  const buffer = data as Uint8Array;
  const copy = new Uint8Array(buffer.byteLength);
  copy.set(buffer);
  return new Blob([copy], { type: "video/mp4" });
}

// Hex/CSS color → ffmpeg color string. ffmpeg accepts named or 0xRRGGBB or #RRGGBB.
function cssToFFmpegColor(c: string): string {
  if (!c) return "white";
  if (c === "transparent") return "0x00000000";
  if (c.startsWith("rgba")) {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const parts = m[1].split(",").map((x) => x.trim());
      const [r, g, b] = parts;
      const hex = (n: string) => Number(n).toString(16).padStart(2, "0");
      return `0x${hex(r)}${hex(g)}${hex(b)}`;
    }
  }
  return c.startsWith("#") ? c : c;
}
