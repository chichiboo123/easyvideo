"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms}`;
}
function getAnimatedOpacity(currentTime: number, startTime: number, endTime: number, animationIn?: "none" | "fade", animationOut?: "none" | "fade", duration = 0.4) {
  let opacity = 1;
  if (animationIn === "fade") opacity = Math.min(opacity, Math.max(0, (currentTime - startTime) / duration));
  if (animationOut === "fade") opacity = Math.min(opacity, Math.max(0, (endTime - currentTime) / duration));
  return opacity;
}

export default function ProPreviewPanel() {
  const videoClips = useEditorStore((s) => s.videoClips);
  const audioClip = useEditorStore((s) => s.audioClip);
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(1);

  const clipOffsets = useMemo(() => {
    let t = 0;
    return videoClips.map((c) => { const off = t; t += c.duration; return off; });
  }, [videoClips]);

  const activeClip = videoClips[activeClipIndex];
  const total = totalDuration();

  // ── Seek request from timeline click ─────────────────────────────────────
  useEffect(() => {
    if (seekRequest === null || !videoRef.current) return;
    videoRef.current.currentTime = seekRequest;
    setSeekRequest(null);
  }, [seekRequest, setSeekRequest]);

  // ── Play / pause ──────────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [isPlaying, activeClipIndex, setPlaying]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !audioClip?.url) return;
    if (isPlaying) a.play().catch(() => {});
    else a.pause();
  }, [isPlaying, audioClip]);

  // ── Volume sync ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume;
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(clipOffsets[activeClipIndex] + v.currentTime);
  }

  function handleEnded() {
    const nextIdx = activeClipIndex + 1;
    if (nextIdx < videoClips.length) {
      setActiveClipIndex(nextIdx);
    } else {
      setPlaying(false);
      setActiveClipIndex(0);
      if (videoRef.current) videoRef.current.currentTime = 0;
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

  return (
    <section className="preview-panel" aria-label="미리보기">
      <div className="preview-stage">
        {activeClip ? (
          <video
            ref={videoRef}
            key={activeClip.url}
            src={activeClip.url}
            className="preview-video"
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
            <p>미디어 패널에서 영상을 추가하세요</p>
          </div>
        )}

        {/* Caption overlays */}
        {captions
          .filter((c) => currentTime >= c.startTime && currentTime <= c.endTime)
          .map((c) => (
            <div
              key={c.id}
              className="overlay-caption"
              style={{
                color: c.color, fontSize: c.fontSize, left: `${c.x}%`, top: `${c.y}%`,
                fontFamily: c.fontFamily,
                background: c.backgroundColor,
                padding: c.backgroundColor === "transparent" ? "0" : "2px 8px",
                borderRadius: c.backgroundColor === "transparent" ? 0 : 6,
                opacity: getAnimatedOpacity(currentTime, c.startTime, c.endTime, c.animationIn, c.animationOut, c.animationDuration),
              }}
              onMouseDown={(e) => {
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
              {c.text}
            </div>
          ))}

        {/* Sticker overlays */}
        {stickers
          .filter((s) => currentTime >= s.startTime && currentTime <= s.endTime)
          .map((s) => (
            <div
              key={s.id}
              className="overlay-sticker"
              style={{ fontSize: s.size, left: `${s.x}%`, top: `${s.y}%`, opacity: getAnimatedOpacity(currentTime, s.startTime, s.endTime, s.animationIn, s.animationOut, s.animationDuration) }}
              onMouseDown={(e) => {
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
        {images
          .filter((img) => currentTime >= img.startTime && currentTime <= img.endTime)
          .map((img) => (
            <img key={img.id} src={img.url} alt={img.name} className="overlay-image"
              style={{ width: `${img.width}%`, left: `${img.x}%`, top: `${img.y}%`, opacity: getAnimatedOpacity(currentTime, img.startTime, img.endTime, img.animationIn, img.animationOut, img.animationDuration) }}
              onMouseDown={(e) => {
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

      {/* Controls */}
      <div className="preview-controls">
        {/* Prev clip / seek back */}
        <button
          type="button"
          className="ctrl-btn"
          onClick={() => seekRelative(-5)}
          disabled={!activeClip}
          aria-label="5초 뒤로"
          title="5초 뒤로 (J)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          type="button"
          className="ctrl-btn play-btn"
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

        {/* Seek forward */}
        <button
          type="button"
          className="ctrl-btn"
          onClick={() => seekRelative(5)}
          disabled={!activeClip}
          aria-label="5초 앞으로"
          title="5초 앞으로 (L)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>

        {/* Time */}
        <div className="time-display" aria-label={`현재 시간 ${formatTime(currentTime)}`}>
          {formatTime(currentTime)} / {formatTime(total)}
        </div>

        {/* Volume */}
        <div className="volume-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--text-muted)", flexShrink: 0 }} aria-hidden="true">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.7-4.1v8.2A4.5 4.5 0 0016.5 12z"/>
          </svg>
          <input
            type="range"
            className="volume-slider"
            min={0} max={1} step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="볼륨"
            title="볼륨 조절"
          />
        </div>
      </div>

      {audioClip?.url && (
        <audio ref={audioRef} src={audioClip.url} loop aria-hidden="true" />
      )}
    </section>
  );
}
