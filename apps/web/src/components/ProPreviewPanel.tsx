"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import type { Caption, CaptionAnimation } from "@/types";

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms}`;
}

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

interface AnimResult { opacity: number; transform: string; clipText?: string }

function getCaptionAnim(c: Caption, currentTime: number): AnimResult {
  let opacity = 1;
  let translateX = 0, translateY = 0, scale = 1;
  let clipText: string | undefined;
  const d = c.animationDuration;
  const inProg = clamp01((currentTime - c.startTime) / d);
  const outProg = clamp01((c.endTime - currentTime) / d);

  const applyAnim = (anim: CaptionAnimation, progress: number, isOut: boolean) => {
    // progress: 0 = animating (start), 1 = settled
    const p = isOut ? 1 - progress : progress; // for "out", normalize so 0 = settled, 1 = gone
    switch (anim) {
      case "none": break;
      case "fade": opacity = Math.min(opacity, progress); break;
      case "slide-up": opacity = Math.min(opacity, progress); translateY += (1 - progress) * 30; break;
      case "slide-down": opacity = Math.min(opacity, progress); translateY -= (1 - progress) * 30; break;
      case "slide-left": opacity = Math.min(opacity, progress); translateX += (1 - progress) * 40; break;
      case "slide-right": opacity = Math.min(opacity, progress); translateX -= (1 - progress) * 40; break;
      case "zoom-in": opacity = Math.min(opacity, progress); scale *= 0.5 + 0.5 * progress; break;
      case "zoom-out": opacity = Math.min(opacity, progress); scale *= 1.5 - 0.5 * progress; break;
      case "bounce": opacity = Math.min(opacity, progress); scale *= 1 + Math.sin(progress * Math.PI) * 0.2; break;
      case "pop": opacity = Math.min(opacity, progress); scale *= 0.3 + 0.7 * Math.min(1, progress * 1.4); break;
      case "typewriter": {
        const totalLen = c.text.length;
        const charsShown = Math.floor(totalLen * progress);
        clipText = c.text.slice(0, charsShown);
        break;
      }
    }
    if (anim === "typewriter" && isOut) clipText = undefined;
    if (anim !== "typewriter" && isOut && anim !== "none") {
      // For "out" we want fade out at end
      opacity = Math.min(opacity, progress);
    }
  };

  if (currentTime <= c.startTime + d) applyAnim(c.animationIn, inProg, false);
  if (currentTime >= c.endTime - d) applyAnim(c.animationOut, outProg, true);

  const transform = `translate(-50%,-50%) translate(${translateX}px,${translateY}px) scale(${scale}) rotate(${c.rotation}deg)`;
  return { opacity, transform, clipText };
}

function getSimpleAnim(currentTime: number, startTime: number, endTime: number, animIn?: string, animOut?: string, d = 0.4) {
  let opacity = 1;
  if (animIn === "fade") opacity = Math.min(opacity, clamp01((currentTime - startTime) / d));
  if (animOut === "fade") opacity = Math.min(opacity, clamp01((endTime - currentTime) / d));
  return opacity;
}

export default function ProPreviewPanel() {
  const videoClips = useEditorStore((s) => s.videoClips);
  const audioClips = useEditorStore((s) => s.audioClips);
  const captions = useEditorStore((s) => s.captions);
  const stickers = useEditorStore((s) => s.stickers);
  const images = useEditorStore((s) => s.images);
  const selectedCaptionId = useEditorStore((s) => s.selectedCaptionId);
  const selectedStickerId = useEditorStore((s) => s.selectedStickerId);
  const selectedImageId = useEditorStore((s) => s.selectedImageId);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const currentTime = useEditorStore((s) => s.currentTime);
  const activeClipIndex = useEditorStore((s) => s.activeClipIndex);
  const seekRequest = useEditorStore((s) => s.seekRequest);
  const volume = useEditorStore((s) => s.volume);
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const isAudioMuted = useEditorStore((s) => s.isAudioMuted);
  const setVolume = useEditorStore((s) => s.setVolume);
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime);
  const setPlaying = useEditorStore((s) => s.setPlaying);
  const setActiveClipIndex = useEditorStore((s) => s.setActiveClipIndex);
  const setSeekRequest = useEditorStore((s) => s.setSeekRequest);
  const selectCaption = useEditorStore((s) => s.selectCaption);
  const selectSticker = useEditorStore((s) => s.selectSticker);
  const selectImage = useEditorStore((s) => s.selectImage);
  const updateCaption = useEditorStore((s) => s.updateCaption);
  const updateSticker = useEditorStore((s) => s.updateSticker);
  const updateImage = useEditorStore((s) => s.updateImage);
  const totalDuration = useEditorStore((s) => s.totalDuration);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const stageRef = useRef<HTMLDivElement>(null);

  const clipOffsets = useMemo(() => {
    let t = 0;
    return videoClips.map((c) => { const off = t; t += c.duration; return off; });
  }, [videoClips]);

  const activeClip = videoClips[activeClipIndex];
  const total = totalDuration();

  // Aspect ratio CSS
  const aspectStyle = useMemo(() => {
    switch (aspectRatio) {
      case "16:9": return { aspectRatio: "16/9" } as const;
      case "9:16": return { aspectRatio: "9/16" } as const;
      case "1:1":  return { aspectRatio: "1/1" } as const;
      case "4:5":  return { aspectRatio: "4/5" } as const;
      default:     return {} as const;
    }
  }, [aspectRatio]);

  // Apply trim inPoint when activeClip changes
  useEffect(() => {
    if (videoRef.current && activeClip) {
      const start = activeClip.inPoint ?? 0;
      videoRef.current.currentTime = start;
      videoRef.current.playbackRate = activeClip.speed ?? 1;
    }
  }, [activeClipIndex, activeClip]);

  // Seek request from timeline
  useEffect(() => {
    if (seekRequest === null || !videoRef.current || !activeClip) return;
    // seekRequest is local time within active clip (0-based)
    videoRef.current.currentTime = (activeClip.inPoint ?? 0) + seekRequest;
    setSeekRequest(null);
  }, [seekRequest, setSeekRequest, activeClip]);

  // Play / pause main video
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [isPlaying, activeClipIndex, setPlaying]);

  // Multi-audio: play all in sync
  useEffect(() => {
    for (const a of audioClips) {
      const el = audioRefs.current[a.id];
      if (!el) continue;
      el.volume = (a.volume ?? 1) * (isAudioMuted ? 0 : 1);
      if (isPlaying) el.play().catch(() => {});
      else el.pause();
    }
  }, [isPlaying, audioClips, isAudioMuted]);

  // Master volume on main video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume * (activeClip?.volume ?? 1) * (isAudioMuted ? 0 : 1);
    }
  }, [volume, activeClip, isAudioMuted]);

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || !activeClip) return;
    const localTime = (v.currentTime - (activeClip.inPoint ?? 0)) / (activeClip.speed ?? 1);
    setCurrentTime(clipOffsets[activeClipIndex] + localTime);

    // Auto-advance when reaching outPoint
    if (v.currentTime >= (activeClip.outPoint ?? Number.POSITIVE_INFINITY)) {
      handleEnded();
    }
  }

  function handleEnded() {
    const nextIdx = activeClipIndex + 1;
    if (nextIdx < videoClips.length) {
      setActiveClipIndex(nextIdx);
    } else {
      setPlaying(false);
      setActiveClipIndex(0);
      if (videoRef.current && videoClips[0]) videoRef.current.currentTime = videoClips[0].inPoint ?? 0;
      setCurrentTime(0);
    }
  }

  function seekRelative(delta: number) {
    const newTime = Math.max(0, Math.min(total, currentTime + delta));
    seekToGlobal(newTime);
  }

  function seekToGlobal(t: number) {
    let elapsed = 0;
    for (let i = 0; i < videoClips.length; i++) {
      const end = elapsed + videoClips[i].duration;
      if (t < end || i === videoClips.length - 1) {
        setActiveClipIndex(i);
        setCurrentTime(t);
        setSeekRequest(t - elapsed);
        return;
      }
      elapsed = end;
    }
  }

  function toggleFullscreen() {
    const stage = stageRef.current;
    if (!stage) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else stage.requestFullscreen?.();
  }

  // CSS filter for the active video effect (so preview matches export)
  const videoEffect = useEditorStore((s) => s.videoEffect);
  const previewVideoFilter = useMemo(() => {
    switch (videoEffect) {
      case "vintage":  return "saturate(0.8) contrast(1.15) brightness(1.03) sepia(0.1)";
      case "bright":   return "brightness(1.08) saturate(1.12)";
      case "bw":       return "grayscale(1)";
      case "warm":     return "saturate(1.05) sepia(0.15)";
      case "cool":     return "saturate(1.05) hue-rotate(190deg)";
      case "blur":     return "blur(3px)";
      case "vignette": return "brightness(0.95) contrast(1.1)";
      default: return "none";
    }
  }, [videoEffect]);

  return (
    <section className="preview-panel" aria-label="미리보기">
      <div className="preview-stage" ref={stageRef}>
        <div className="preview-frame" style={aspectStyle}>
          {activeClip ? (
            <video
              ref={videoRef}
              key={activeClip.url}
              src={activeClip.url}
              className="preview-video"
              style={{ filter: previewVideoFilter }}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              playsInline
              aria-label="영상 미리보기"
            />
          ) : (
            <div className="preview-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M10 8l6 4-6 4V8z"/>
              </svg>
              <p>왼쪽 패널에서 영상을 추가하세요</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>드래그&드롭 또는 “파일 열기”</p>
            </div>
          )}

          {videoEffect === "vignette" && activeClip && (
            <div className="overlay-vignette" aria-hidden="true" />
          )}

          {/* Captions */}
          {captions
            .filter((c) => currentTime >= c.startTime && currentTime <= c.endTime)
            .map((c) => {
              const anim = getCaptionAnim(c, currentTime);
              const showText = anim.clipText ?? c.text;
              return (
                <div key={c.id}
                  className="overlay-caption"
                  style={{
                    color: c.color, fontSize: c.fontSize,
                    left: `${c.x}%`, top: `${c.y}%`,
                    fontFamily: c.fontFamily,
                    fontWeight: c.fontWeight,
                    fontStyle: c.italic ? "italic" : "normal",
                    textDecoration: [c.underline && "underline", c.strikethrough && "line-through"].filter(Boolean).join(" ") || "none",
                    textAlign: c.align,
                    letterSpacing: c.letterSpacing,
                    lineHeight: c.lineHeight,
                    background: c.backgroundColor === "transparent" ? "transparent" : c.backgroundColor,
                    padding: c.backgroundColor === "transparent" ? "0" : `${c.bgPadding / 2}px ${c.bgPadding}px`,
                    borderRadius: c.backgroundColor === "transparent" ? 0 : c.bgBorderRadius,
                    WebkitTextStroke: c.strokeWidth > 0 ? `${c.strokeWidth}px ${c.strokeColor}` : "0",
                    textShadow: c.shadowBlur > 0
                      ? `${c.shadowOffsetX}px ${c.shadowOffsetY}px ${c.shadowBlur}px ${c.shadowColor}`
                      : "none",
                    transform: anim.transform,
                    opacity: anim.opacity,
                    whiteSpace: "pre-wrap",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const el = e.currentTarget.parentElement;
                    if (!el) return;
                    const rect = el.getBoundingClientRect();
                    const onMove = (ev: MouseEvent) => {
                      updateCaption(c.id, {
                        x: Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100)),
                        y: Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100)),
                      });
                    };
                    const onUp = () => {
                      window.removeEventListener("mousemove", onMove);
                      window.removeEventListener("mouseup", onUp);
                    };
                    selectCaption(c.id);
                    window.addEventListener("mousemove", onMove);
                    window.addEventListener("mouseup", onUp);
                  }}
                  data-selected={selectedCaptionId === c.id}
                >
                  {showText}
                </div>
              );
            })}

          {/* Stickers */}
          {stickers
            .filter((s) => currentTime >= s.startTime && currentTime <= s.endTime)
            .map((s) => (
              <div key={s.id}
                className="overlay-sticker"
                style={{
                  fontSize: s.size,
                  left: `${s.x}%`, top: `${s.y}%`,
                  transform: `translate(-50%,-50%) rotate(${s.rotation}deg)`,
                  opacity: getSimpleAnim(currentTime, s.startTime, s.endTime, s.animationIn, s.animationOut, s.animationDuration),
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const el = e.currentTarget.parentElement;
                  if (!el) return;
                  const rect = el.getBoundingClientRect();
                  const onMove = (ev: MouseEvent) => {
                    updateSticker(s.id, {
                      x: Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100)),
                      y: Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100)),
                    });
                  };
                  const onUp = () => {
                    window.removeEventListener("mousemove", onMove);
                    window.removeEventListener("mouseup", onUp);
                  };
                  selectSticker(s.id);
                  window.addEventListener("mousemove", onMove);
                  window.addEventListener("mouseup", onUp);
                }}
                data-selected={selectedStickerId === s.id}
              >
                {s.emoji}
              </div>
            ))}

          {/* Images */}
          {images
            .filter((img) => currentTime >= img.startTime && currentTime <= img.endTime)
            .map((img) => (
              <img key={img.id} src={img.url} alt={img.name} className="overlay-image"
                style={{
                  width: `${img.width}%`,
                  left: `${img.x}%`, top: `${img.y}%`,
                  transform: `translate(-50%,-50%) rotate(${img.rotation}deg)`,
                  opacity: getSimpleAnim(currentTime, img.startTime, img.endTime, img.animationIn, img.animationOut, img.animationDuration),
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const stage = e.currentTarget.parentElement;
                  if (!stage) return;
                  const rect = stage.getBoundingClientRect();
                  const onMove = (ev: MouseEvent) => {
                    updateImage(img.id, {
                      x: Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100)),
                      y: Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100)),
                    });
                  };
                  const onUp = () => {
                    window.removeEventListener("mousemove", onMove);
                    window.removeEventListener("mouseup", onUp);
                  };
                  selectImage(img.id);
                  window.addEventListener("mousemove", onMove);
                  window.addEventListener("mouseup", onUp);
                }}
                data-selected={selectedImageId === img.id}
              />
            ))}
        </div>
      </div>

      {/* Controls */}
      <div className="preview-controls">
        <button type="button" className="ctrl-btn"
          onClick={() => seekRelative(-5)}
          disabled={!activeClip}
          aria-label="5초 뒤로"
          title="5초 뒤로 (J)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>
        <button type="button" className="ctrl-btn play-btn"
          onClick={() => setPlaying(!isPlaying)}
          disabled={!activeClip}
          aria-label={isPlaying ? "일시정지" : "재생"}
          title={isPlaying ? "일시정지 (Space)" : "재생 (Space)"}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
        <button type="button" className="ctrl-btn"
          onClick={() => seekRelative(5)}
          disabled={!activeClip}
          aria-label="5초 앞으로"
          title="5초 앞으로 (L)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>

        <div className="time-display" aria-label={`현재 시간 ${formatTime(currentTime)}`}>
          {formatTime(currentTime)} / {formatTime(total)}
        </div>

        <div className="volume-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--text-muted)", flexShrink: 0 }} aria-hidden="true">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.7-4.1v8.2A4.5 4.5 0 0016.5 12z"/>
          </svg>
          <input type="range" className="volume-slider"
            min={0} max={1} step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="볼륨"
            title="볼륨 조절"
          />
          <button type="button" className="ctrl-btn"
            onClick={toggleFullscreen}
            title="전체화면 (F)"
            aria-label="전체화면 토글"
            disabled={!activeClip}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 9V5h4M19 9V5h-4M5 15v4h4M19 15v4h-4"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Hidden audio elements for each clip */}
      {audioClips.filter((a) => a.url).map((a) => (
        <audio key={a.id} ref={(el) => { audioRefs.current[a.id] = el; }} src={a.url} loop aria-hidden="true" />
      ))}
    </section>
  );
}
