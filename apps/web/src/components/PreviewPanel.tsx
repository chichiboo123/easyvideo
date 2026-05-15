"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";

export default function PreviewPanel() {
  const videoClips = useEditorStore((s) => s.videoClips);
  const audioClip = useEditorStore((s) => s.audioClip);
  const captions = useEditorStore((s) => s.captions);
  const stickers = useEditorStore((s) => s.stickers);
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setPlaying = useEditorStore((s) => s.setPlaying);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [localTime, setLocalTime] = useState(0);

  const activeClip = videoClips[activeIndex];

  const elapsedBeforeActive = useMemo(
    () =>
      videoClips
        .slice(0, activeIndex)
        .reduce((sum, c) => sum + c.duration, 0),
    [videoClips, activeIndex],
  );

  useEffect(() => {
    if (activeIndex >= videoClips.length) setActiveIndex(0);
  }, [videoClips.length, activeIndex]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [isPlaying, activeIndex, setPlaying]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying && audioClip) a.play().catch(() => {});
    else a.pause();
  }, [isPlaying, audioClip]);

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;
    setLocalTime(v.currentTime);
    setCurrentTime(elapsedBeforeActive + v.currentTime);
  }

  function handleEnded() {
    if (activeIndex + 1 < videoClips.length) {
      setActiveIndex(activeIndex + 1);
    } else {
      setPlaying(false);
      setActiveIndex(0);
    }
  }

  const globalTime = elapsedBeforeActive + localTime;

  return (
    <div className="preview-panel" aria-label="미리보기">
      <div className="preview-stage">
        {activeClip ? (
          <video
            ref={videoRef}
            src={activeClip.url}
            className="preview-video"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            playsInline
            aria-label="현재 영상 미리보기"
          />
        ) : (
          <div className="preview-empty">영상을 추가하면 여기에서 볼 수 있어요</div>
        )}

        {captions
          .filter((c) => globalTime >= c.startTime && globalTime <= c.endTime)
          .map((c) => (
            <div
              key={c.id}
              className="overlay-caption"
              style={{
                color: c.color,
                fontSize: c.fontSize,
                left: `${c.x}%`,
                top: `${c.y}%`,
              }}
            >
              {c.text}
            </div>
          ))}

        {stickers
          .filter((s) => globalTime >= s.startTime && globalTime <= s.endTime)
          .map((s) => (
            <div
              key={s.id}
              className="overlay-sticker"
              style={{
                fontSize: s.size,
                left: `${s.x}%`,
                top: `${s.y}%`,
              }}
            >
              {s.emoji}
            </div>
          ))}
      </div>

      <div className="preview-controls">
        <button
          type="button"
          className="big-btn btn-play"
          onClick={() => setPlaying(!isPlaying)}
          disabled={videoClips.length === 0}
          aria-label={isPlaying ? "일시정지" : "재생"}
          title={isPlaying ? "잠깐 멈춰요" : "영상을 재생해요"}
        >
          {isPlaying ? "⏸ 멈춤" : "▶ 재생"}
        </button>
      </div>

      {audioClip && audioClip.url && (
        <audio ref={audioRef} src={audioClip.url} loop aria-hidden="true" />
      )}
    </div>
  );
}
