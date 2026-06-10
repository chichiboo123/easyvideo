"use client";

import type { Caption, Sticker, ImageOverlay } from "@/types";

// Renders captions / stickers / image overlays into full-frame transparent
// PNGs with the browser's canvas, so the exported video keeps the exact
// fonts (Google Fonts incl. Korean), emoji, outlines, shadows and boxes
// that the preview shows — none of which FFmpeg drawtext can reproduce.

// Caption fontSize values are authored against a 720p-height reference.
const REF_HEIGHT = 720;

export interface RenderedOverlay {
  png: Uint8Array;
  startTime: number;
  endTime: number;
  fadeIn: number;   // alpha fade seconds (0 = hard in)
  fadeOut: number;
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { reject(new Error("PNG 인코딩 실패")); return; }
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, "image/png");
  });
}

async function ensureFontLoaded(weight: number, italic: boolean, sizePx: number, family: string) {
  try {
    await document.fonts.load(`${italic ? "italic " : ""}${weight} ${Math.ceil(sizePx)}px "${family}"`);
  } catch { /* font may be unavailable; canvas falls back */ }
}

export async function renderCaptionOverlay(c: Caption, w: number, h: number): Promise<RenderedOverlay> {
  const scale = h / REF_HEIGHT;
  const fontSize = c.fontSize * scale;
  await ensureFontLoaded(c.fontWeight, c.italic, fontSize, c.fontFamily);

  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.font = `${c.italic ? "italic " : ""}${c.fontWeight} ${fontSize}px "${c.fontFamily}", sans-serif`;
  // letterSpacing is supported in Chromium-based browsers; harmless elsewhere.
  try { (ctx as any).letterSpacing = `${c.letterSpacing * scale}px`; } catch { /* */ }
  ctx.textBaseline = "middle";

  const lines = c.text.split("\n");
  const lineH = fontSize * c.lineHeight;
  const lineWidths = lines.map((l) => ctx.measureText(l).width);
  const blockW = Math.max(...lineWidths, 1);
  const blockH = lineH * lines.length;

  ctx.translate((c.x / 100) * w, (c.y / 100) * h);
  ctx.rotate((c.rotation * Math.PI) / 180);

  // Background box (matches preview padding: half vertical, full horizontal)
  if (c.backgroundColor && c.backgroundColor !== "transparent") {
    const padX = c.bgPadding * scale;
    const padY = (c.bgPadding / 2) * scale;
    const bx = -blockW / 2 - padX;
    const by = -blockH / 2 - padY;
    const bw = blockW + padX * 2;
    const bh = blockH + padY * 2;
    const r = Math.min(c.bgBorderRadius * scale, bw / 2, bh / 2);
    ctx.fillStyle = c.backgroundColor;
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
    ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
    ctx.arcTo(bx, by + bh, bx, by, r);
    ctx.arcTo(bx, by, bx + bw, by, r);
    ctx.closePath();
    ctx.fill();
  }

  // Shadow applies to glyphs only (CSS text-shadow semantics).
  if (c.shadowBlur > 0) {
    ctx.shadowColor = c.shadowColor;
    ctx.shadowBlur = c.shadowBlur * scale;
    ctx.shadowOffsetX = c.shadowOffsetX * scale;
    ctx.shadowOffsetY = c.shadowOffsetY * scale;
  }

  lines.forEach((line, i) => {
    const y = -blockH / 2 + lineH * (i + 0.5);
    let x = 0;
    if (c.align === "left") { ctx.textAlign = "left"; x = -blockW / 2; }
    else if (c.align === "right") { ctx.textAlign = "right"; x = blockW / 2; }
    else { ctx.textAlign = "center"; x = 0; }

    if (c.strokeWidth > 0) {
      ctx.lineJoin = "round";
      ctx.strokeStyle = c.strokeColor;
      // CSS text-stroke extends strokeWidth outward; canvas stroke is centered.
      ctx.lineWidth = c.strokeWidth * 2 * scale;
      ctx.strokeText(line, x, y);
    }
    ctx.fillStyle = c.color;
    ctx.fillText(line, x, y);

    if (c.underline || c.strikethrough) {
      const lw = lineWidths[i];
      const lx = c.align === "left" ? -blockW / 2 : c.align === "right" ? blockW / 2 - lw : -lw / 2;
      ctx.fillStyle = c.color;
      if (c.underline) ctx.fillRect(lx, y + fontSize * 0.42, lw, Math.max(1.5, fontSize * 0.05));
      if (c.strikethrough) ctx.fillRect(lx, y - fontSize * 0.05, lw, Math.max(1.5, fontSize * 0.05));
    }
  });

  const fade = c.animationIn !== "none" || c.animationOut !== "none" ? c.animationDuration : 0;
  return {
    png: await canvasToPng(canvas),
    startTime: c.startTime,
    endTime: c.endTime,
    fadeIn: c.animationIn !== "none" ? fade : 0,
    fadeOut: c.animationOut !== "none" ? fade : 0,
  };
}

export async function renderStickerOverlay(s: Sticker, w: number, h: number): Promise<RenderedOverlay> {
  const scale = h / REF_HEIGHT;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${s.size * scale}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate((s.x / 100) * w, (s.y / 100) * h);
  ctx.rotate((s.rotation * Math.PI) / 180);
  ctx.fillText(s.emoji, 0, 0);

  return {
    png: await canvasToPng(canvas),
    startTime: s.startTime,
    endTime: s.endTime,
    fadeIn: s.animationIn !== "none" ? s.animationDuration : 0,
    fadeOut: s.animationOut !== "none" ? s.animationDuration : 0,
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지 로드 실패"));
    img.src = url;
  });
}

export async function renderImageOverlay(o: ImageOverlay, w: number, h: number): Promise<RenderedOverlay> {
  const img = await loadImage(o.url);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const drawW = (o.width / 100) * w;
  const drawH = drawW * (img.naturalHeight / Math.max(1, img.naturalWidth));
  ctx.translate((o.x / 100) * w, (o.y / 100) * h);
  ctx.rotate((o.rotation * Math.PI) / 180);
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

  return {
    png: await canvasToPng(canvas),
    startTime: o.startTime,
    endTime: o.endTime,
    fadeIn: o.animationIn !== "none" ? o.animationDuration : 0,
    fadeOut: o.animationOut !== "none" ? o.animationDuration : 0,
  };
}

// Probe a video's intrinsic dimensions (used for "original" export size).
export function probeVideoSize(url: string): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      if (v.videoWidth > 0) resolve({ w: v.videoWidth, h: v.videoHeight });
      else resolve(null);
    };
    v.onerror = () => resolve(null);
    v.src = url;
  });
}
