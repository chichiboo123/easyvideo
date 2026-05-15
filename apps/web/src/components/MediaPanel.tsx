"use client";

import { useCallback, useRef, useState } from "react";
import { useEditorStore, generateId } from "@/store/editorStore";
import { saveFile } from "@/lib/storage";
import type { CaptionColor } from "@/types";

const ACCEPTED_VIDEO = ["video/mp4", "video/quicktime", "video/webm"];

const PRESET_BGM = [
  { id: "bgm-1", name: "Chill Beats", emoji: "🎧", duration: 120 },
  { id: "bgm-2", name: "Happy Sunshine", emoji: "☀️", duration: 90 },
  { id: "bgm-3", name: "Adventure Time", emoji: "🎸", duration: 180 },
  { id: "bgm-4", name: "Calm Piano", emoji: "🎹", duration: 150 },
  { id: "bgm-5", name: "Upbeat Pop", emoji: "🎵", duration: 100 },
];

const CAPTION_COLORS: { value: CaptionColor; label: string }[] = [
  { value: "#FFFFFF", label: "흰색" },
  { value: "#000000", label: "검정" },
  { value: "#FF4D4D", label: "빨강" },
  { value: "#3D8BFF", label: "파랑" },
  { value: "#FFD93D", label: "노랑" },
  { value: "#4CD964", label: "초록" },
];

const STICKERS = [
  "😀","😂","🥰","😎","🤩","🥳","😜","🤔",
  "🐶","🐱","🦄","🐼","🐸","🦊","🐯","🐙",
  "⭐","✨","💖","🌈","🌸","🌟","🎉","💫",
  "🍕","🍔","🍦","🍩","🍓","🎂","🌮","🧁",
  "⚽","🏀","🎮","🎵","🎨","📚","🚀","🌍",
];

type Tab = "media" | "audio" | "text" | "sticker";

function formatDur(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MediaPanel() {
  const [tab, setTab] = useState<Tab>("media");
  const [dragOver, setDragOver] = useState(false);
  const [captionText, setCaptionText] = useState("");
  const [captionColor, setCaptionColor] = useState<CaptionColor>("#FFFFFF");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const videoClips = useEditorStore((s) => s.videoClips);
  const audioClip = useEditorStore((s) => s.audioClip);
  const addVideoClip = useEditorStore((s) => s.addVideoClip);
  const setAudioClip = useEditorStore((s) => s.setAudioClip);
  const addCaption = useEditorStore((s) => s.addCaption);
  const addSticker = useEditorStore((s) => s.addSticker);

  // ── Video upload ──────────────────────────────────────────────────────────

  const handleVideoFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploadError(null);
      for (const file of Array.from(files)) {
        const ok = ACCEPTED_VIDEO.includes(file.type) || /\.(mp4|mov|webm)$/i.test(file.name);
        if (!ok) { setUploadError("mp4, mov, webm 파일만 지원합니다."); continue; }
        const { id, url } = await saveFile(file);
        const vid = document.createElement("video");
        vid.preload = "metadata";
        vid.src = url;
        await new Promise<void>((res) => {
          vid.onloadedmetadata = () => res();
          vid.onerror = () => res();
        });
        addVideoClip({
          id: generateId(),
          name: file.name.replace(/\.[^.]+$/, ""),
          url,
          duration: isFinite(vid.duration) ? vid.duration : 5,
          startTime: 0,
          fileId: id,
        });
      }
    },
    [addVideoClip],
  );

  // ── Audio upload ──────────────────────────────────────────────────────────

  function handleAudioFile(file: File) {
    const url = URL.createObjectURL(file);
    const a = new Audio(url);
    a.onloadedmetadata = () => {
      setAudioClip({
        id: `audio-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, ""),
        url,
        duration: a.duration,
      });
    };
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string }[] = [
    { id: "media", label: "미디어" },
    { id: "audio", label: "오디오" },
    { id: "text", label: "텍스트" },
    { id: "sticker", label: "스티커" },
  ];

  return (
    <aside className="media-panel" aria-label="미디어 패널">
      <div className="panel-tabs" role="tablist" aria-label="편집 도구">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            className={`panel-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
            aria-selected={tab === t.id}
            aria-controls={`tabpanel-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="panel-body" role="tabpanel" id={`tabpanel-${tab}`}>
        {/* ── 미디어 tab ── */}
        {tab === "media" && (
          <>
            <div
              className={`drop-zone ${dragOver ? "over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleVideoFiles(e.dataTransfer.files); }}
              aria-label="영상 드롭 영역"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto", display: "block", opacity: 0.4 }} aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M10 8l6 4-6 4V8z"/>
              </svg>
              <p>영상을 여기에 드래그하거나</p>
              <button
                type="button"
                className="btn-upload"
                onClick={() => inputRef.current?.click()}
                aria-label="영상 파일 선택"
                title="mp4, mov, webm 파일을 불러옵니다"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 5v14M5 12l7-7 7 7"/>
                </svg>
                파일 열기
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                multiple
                style={{ display: "none" }}
                onChange={(e) => e.target.files && handleVideoFiles(e.target.files)}
                aria-label="영상 파일 선택"
              />
            </div>
            {uploadError && <p style={{ color: "#f87171", fontSize: "11px", marginBottom: 8 }}>{uploadError}</p>}

            {videoClips.length > 0 && (
              <div className="media-grid">
                {videoClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="media-card"
                    title={`${clip.name} (${formatDur(clip.duration)})`}
                  >
                    <div className="media-thumb">🎬</div>
                    <div className="media-info">
                      <div className="media-name">{clip.name}</div>
                      <div className="media-dur">{formatDur(clip.duration)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── 오디오 tab ── */}
        {tab === "audio" && (
          <>
            <label className="btn-upload" style={{ marginBottom: 12 }} title="MP3, WAV 파일을 불러옵니다">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 5v14M5 12l7-7 7 7"/>
              </svg>
              오디오 파일 열기
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                style={{ display: "none" }}
                onChange={(e) => { if (e.target.files?.[0]) handleAudioFile(e.target.files[0]); }}
                aria-label="오디오 파일 선택"
              />
            </label>

            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              기본 제공 BGM
            </div>
            <div className="audio-preset-list">
              {PRESET_BGM.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`audio-preset ${audioClip?.id === b.id ? "selected" : ""}`}
                  onClick={() =>
                    setAudioClip(
                      audioClip?.id === b.id ? null : { id: b.id, name: b.name, url: "", duration: b.duration, isPreset: true }
                    )
                  }
                  aria-pressed={audioClip?.id === b.id}
                  title={`${b.name} - ${formatDur(b.duration)}`}
                >
                  <span className="audio-preset-icon">{b.emoji}</span>
                  <span>
                    <div className="audio-preset-name">{b.name}</div>
                    <div className="audio-preset-dur">{formatDur(b.duration)}</div>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── 텍스트 tab ── */}
        {tab === "text" && (
          <div className="text-editor">
            <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>자막 텍스트</label>
            <textarea
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              placeholder="자막을 입력하세요..."
              aria-label="자막 텍스트"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  if (captionText.trim()) { addCaption(captionText.trim(), captionColor); setCaptionText(""); }
                }
              }}
            />

            <div>
              <div className="label-row">
                <span>색상</span>
              </div>
              <div className="color-swatch-row" role="radiogroup" aria-label="자막 색상 선택">
                {CAPTION_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    className={`color-swatch ${captionColor === c.value ? "active" : ""}`}
                    style={{ background: c.value, outline: c.value === "#FFFFFF" ? "1px solid #555" : undefined }}
                    onClick={() => setCaptionColor(c.value)}
                    aria-checked={captionColor === c.value}
                    aria-label={c.label}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              className="btn-add-text"
              onClick={() => {
                if (captionText.trim()) { addCaption(captionText.trim(), captionColor); setCaptionText(""); }
              }}
              disabled={!captionText.trim()}
              aria-label="자막 추가"
              title="현재 재생 위치에 자막을 추가합니다"
            >
              자막 추가
            </button>

            <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
              Ctrl+Enter로도 추가할 수 있어요
            </p>
          </div>
        )}

        {/* ── 스티커 tab ── */}
        {tab === "sticker" && (
          <div className="sticker-grid" role="list" aria-label="스티커 선택">
            {STICKERS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="listitem"
                className="sticker-btn-pro"
                onClick={() => addSticker(emoji)}
                aria-label={`${emoji} 스티커 추가`}
                title={`${emoji} 스티커를 추가합니다`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
