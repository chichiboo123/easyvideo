"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";

const PRESET_BGM = [
  { id: "bgm-1", name: "신나는 음악", url: "" },
  { id: "bgm-2", name: "조용한 음악", url: "" },
  { id: "bgm-3", name: "재미있는 음악", url: "" },
  { id: "bgm-4", name: "활기찬 음악", url: "" },
  { id: "bgm-5", name: "따뜻한 음악", url: "" },
];

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SimpleTimeline() {
  const videoClips = useEditorStore((s) => s.videoClips);
  const audioClip = useEditorStore((s) => s.audioClip);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const selectClip = useEditorStore((s) => s.selectClip);
  const removeVideoClip = useEditorStore((s) => s.removeVideoClip);
  const splitClip = useEditorStore((s) => s.splitClip);
  const reorderVideoClips = useEditorStore((s) => s.reorderVideoClips);
  const setAudioClip = useEditorStore((s) => s.setAudioClip);
  const currentTime = useEditorStore((s) => s.currentTime);

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function handleCut() {
    if (!selectedClipId) return;
    const clip = videoClips.find((c) => c.id === selectedClipId);
    if (!clip) return;
    const splitAt = clip.startTime + clip.duration / 2;
    splitClip(selectedClipId, splitAt);
  }

  function handleBgmUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => {
      setAudioClip({
        id: `audio-${Date.now()}`,
        name: file.name,
        url,
        duration: audio.duration,
      });
    });
  }

  return (
    <section className="timeline" aria-label="타임라인">
      <div className="timeline-toolbar">
        <button
          type="button"
          className="big-btn btn-cut"
          onClick={handleCut}
          disabled={!selectedClipId}
          aria-label="선택한 영상 자르기"
          title="선택한 영상 클립을 가운데에서 잘라요"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M9.64 7.64a3 3 0 11-1.41-1.41L12 10l9-9v2l-7.59 7.59L21 18v2l-9-9-3.36 3.36a3 3 0 11-1.41-1.41L10.59 12 9.64 11.05l-1.05 1.06A3 3 0 119.64 7.64zM6 8a1 1 0 100-2 1 1 0 000 2zm0 10a1 1 0 100-2 1 1 0 000 2z"
            />
          </svg>
          자르기
        </button>
        <div className="time-display" aria-label="현재 시간">
          ⏱ {formatTime(currentTime)}
        </div>
      </div>

      <div className="track-row">
        <span className="track-label">🎬 영상</span>
        <div className="track video-track">
          {videoClips.length === 0 && (
            <div className="track-empty">영상을 추가해 주세요</div>
          )}
          {videoClips.map((clip, idx) => (
            <button
              key={clip.id}
              type="button"
              className={`clip${selectedClipId === clip.id ? " selected" : ""}`}
              style={{ width: Math.max(80, clip.duration * 30) }}
              onClick={() => selectClip(clip.id)}
              draggable
              onDragStart={() => setDragIndex(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== idx) {
                  reorderVideoClips(dragIndex, idx);
                }
                setDragIndex(null);
              }}
              aria-label={`${clip.name} 영상 클립, 길이 ${formatTime(clip.duration)}`}
              title="끌어서 순서를 바꿀 수 있어요"
            >
              <span className="clip-name">{clip.name}</span>
              <span className="clip-dur">{formatTime(clip.duration)}</span>
              <span
                role="button"
                tabIndex={0}
                className="clip-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeVideoClip(clip.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    removeVideoClip(clip.id);
                  }
                }}
                aria-label={`${clip.name} 삭제`}
                title="이 클립을 삭제해요"
              >
                ✕
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="track-row">
        <span className="track-label">🎵 음악</span>
        <div className="track audio-track">
          {audioClip ? (
            <div className="clip audio-clip">
              <span className="clip-name">{audioClip.name}</span>
              <button
                type="button"
                className="clip-remove"
                onClick={() => setAudioClip(null)}
                aria-label="배경음악 제거"
                title="배경음악을 빼요"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="audio-controls">
              <label className="big-btn btn-audio" title="내 컴퓨터의 음악 파일을 골라요">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleBgmUpload}
                  style={{ display: "none" }}
                  aria-label="음악 파일 선택"
                />
                🎵 음악 불러오기
              </label>
              <select
                className="bgm-select"
                onChange={(e) => {
                  const preset = PRESET_BGM.find((b) => b.id === e.target.value);
                  if (preset) {
                    setAudioClip({
                      id: preset.id,
                      name: preset.name,
                      url: preset.url,
                      duration: 60,
                      isPreset: true,
                    });
                  }
                }}
                defaultValue=""
                aria-label="제공된 배경음악 선택"
                title="무료 배경음악 중에서 골라요"
              >
                <option value="" disabled>
                  무료 배경음악 고르기
                </option>
                {PRESET_BGM.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
