"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore, generateId, defaultVideoClip, defaultCaption } from "@/store/editorStore";
import { saveFile } from "@/lib/storage";
import { toast } from "@/lib/notifications";
import { parseSrt, parseVtt, downloadSrt } from "@/lib/srt";

const ACCEPTED_VIDEO = ["video/mp4", "video/quicktime", "video/webm"];

const PRESET_BGM = [
  { id: "bgm-1", name: "Chill Beats", emoji: "🎧", duration: 120 },
  { id: "bgm-2", name: "Happy Sunshine", emoji: "☀️", duration: 90 },
  { id: "bgm-3", name: "Adventure Time", emoji: "🎸", duration: 180 },
  { id: "bgm-4", name: "Calm Piano", emoji: "🎹", duration: 150 },
  { id: "bgm-5", name: "Upbeat Pop", emoji: "🎵", duration: 100 },
];

const STICKERS = [
  "😀","😂","🥰","😎","🤩","🥳","😜","🤔","😱","😭",
  "🐶","🐱","🦄","🐼","🐸","🦊","🐯","🐙","🐹","🐵",
  "⭐","✨","💖","🌈","🌸","🌟","🎉","💫","💥","🔥",
  "🍕","🍔","🍦","🍩","🍓","🎂","🌮","🧁","🍿","🍭",
  "⚽","🏀","🎮","🎵","🎨","📚","🚀","🌍","🏆","🎁",
  "❤️","💛","💙","💚","🧡","💜","🖤","🤍","🤎","💕",
  "👍","👏","🙌","✌️","🤘","👌","🤝","🙏","💪","🤞",
];

const TEXT_PRESETS = [
  { label: "기본", patch: { color: "#FFFFFF", fontFamily: "Noto Sans KR", fontWeight: 700, strokeColor: "#000000", strokeWidth: 2 } },
  { label: "팝", patch: { color: "#FFD93D", fontFamily: "Black Han Sans", fontWeight: 700, strokeColor: "#000000", strokeWidth: 4, shadowBlur: 8 } },
  { label: "네온", patch: { color: "#3DF0FF", fontFamily: "Audiowide", strokeWidth: 0, shadowColor: "#3DF0FF", shadowBlur: 16, shadowOffsetX: 0, shadowOffsetY: 0 } },
  { label: "노란상자", patch: { color: "#000000", fontFamily: "Do Hyeon", backgroundColor: "#FFD93D", bgPadding: 10, bgBorderRadius: 8, strokeWidth: 0 } },
  { label: "유튜브", patch: { color: "#FFFFFF", fontFamily: "Roboto", fontWeight: 900, backgroundColor: "#000000", bgPadding: 6, bgBorderRadius: 4, strokeWidth: 0 } },
];

type Tab = "media" | "audio" | "text" | "sticker" | "image" | "markers";

function formatDur(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MediaPanel() {
  const [tab, setTab] = useState<Tab>("media");
  const [dragOver, setDragOver] = useState(false);
  const [captionText, setCaptionText] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);

  const videoClips = useEditorStore((s) => s.videoClips);
  const audioClips = useEditorStore((s) => s.audioClips);
  const markers = useEditorStore((s) => s.markers);
  const captions = useEditorStore((s) => s.captions);
  const addVideoClip = useEditorStore((s) => s.addVideoClip);
  const addAudioClip = useEditorStore((s) => s.addAudioClip);
  const removeAudioClip = useEditorStore((s) => s.removeAudioClip);
  const addCaption = useEditorStore((s) => s.addCaption);
  const addCaptionsBatch = useEditorStore((s) => s.addCaptionsBatch);
  const addSticker = useEditorStore((s) => s.addSticker);
  const addImage = useEditorStore((s) => s.addImage);
  const addMarker = useEditorStore((s) => s.addMarker);
  const updateMarker = useEditorStore((s) => s.updateMarker);
  const removeMarker = useEditorStore((s) => s.removeMarker);
  const setSeekRequest = useEditorStore((s) => s.setSeekRequest);
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime);

  const bgmAudio = audioClips.find((a) => a.track === 1 || a.track === undefined);

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
        const duration = isFinite(vid.duration) ? vid.duration : 5;
        addVideoClip(defaultVideoClip({
          id: generateId(),
          name: file.name.replace(/\.[^.]+$/, ""),
          url, duration, sourceDuration: duration,
          inPoint: 0, outPoint: duration,
          startTime: 0, fileId: id,
        }));
      }
      toast({ message: `${Array.from(files).length}개 영상을 추가했어요`, type: "success" });
    },
    [addVideoClip],
  );

  // ── Audio upload ──────────────────────────────────────────────────────────
  function handleAudioFile(file: File, track: 1 | 2 | 3) {
    const url = URL.createObjectURL(file);
    const a = new Audio(url);
    a.onloadedmetadata = () => {
      addAudioClip({
        id: `audio-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, ""),
        url, duration: a.duration,
        track, volume: 1, fadeIn: 0, fadeOut: 0, startTime: 0,
      });
      toast({ message: `오디오를 M${track} 트랙에 추가했어요`, type: "success" });
    };
  }

  // ── Voice-over recording ──────────────────────────────────────────────────
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recordChunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) recordChunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(recordChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const a = new Audio(url);
        a.onloadedmetadata = () => {
          addAudioClip({
            id: `voiceover-${Date.now()}`,
            name: `보이스오버 ${new Date().toLocaleTimeString()}`,
            url,
            duration: isFinite(a.duration) ? a.duration : 5,
            track: 3,
            volume: 1, fadeIn: 0, fadeOut: 0, startTime: 0,
          });
          toast({ message: "녹음을 M3 트랙에 추가했어요", type: "success" });
        };
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      mediaRecorderRef.current = rec;
      setIsRecording(true);
    } catch (e) {
      toast({ message: "마이크 권한이 필요해요", type: "error" });
    }
  }
  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  // ── SRT/VTT import ────────────────────────────────────────────────────────
  function handleSrtFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const cues = file.name.toLowerCase().endsWith(".vtt") ? parseVtt(text) : parseSrt(text);
      if (cues.length === 0) {
        toast({ message: "자막 파일에서 큐를 찾지 못했어요", type: "warning" });
        return;
      }
      addCaptionsBatch(cues);
      toast({ message: `자막 ${cues.length}개를 가져왔어요`, type: "success" });
    };
    reader.readAsText(file);
  }

  // ── Cleanup recording on unmount ─────────────────────────────────────────
  useEffect(() => () => { mediaRecorderRef.current?.stop(); }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "media", label: "미디어" },
    { id: "audio", label: "오디오" },
    { id: "text", label: "텍스트" },
    { id: "sticker", label: "스티커" },
    { id: "image", label: "이미지" },
    { id: "markers", label: "마커" },
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
              <button type="button" className="btn-upload"
                onClick={() => inputRef.current?.click()}
                aria-label="영상 파일 선택"
                title="mp4, mov, webm 파일을 불러옵니다"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 5v14M5 12l7-7 7 7"/>
                </svg>
                파일 열기
              </button>
              <input ref={inputRef} type="file"
                accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                multiple style={{ display: "none" }}
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
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label className="btn-upload" title="MP3, WAV 파일을 BGM(M1)으로 추가">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 5v14M5 12l7-7 7 7"/>
                </svg>
                BGM 추가 (M1)
                <input ref={audioInputRef} type="file" accept="audio/*"
                  style={{ display: "none" }}
                  onChange={(e) => { if (e.target.files?.[0]) handleAudioFile(e.target.files[0], 1); e.target.value = ""; }}
                />
              </label>
              <label className="btn-upload" title="효과음을 M2 트랙에 추가">
                효과음 추가 (M2)
                <input type="file" accept="audio/*"
                  style={{ display: "none" }}
                  onChange={(e) => { if (e.target.files?.[0]) handleAudioFile(e.target.files[0], 2); e.target.value = ""; }}
                />
              </label>
              <button type="button"
                className={`btn-upload ${isRecording ? "btn-recording" : ""}`}
                onClick={() => isRecording ? stopRecording() : startRecording()}
                aria-pressed={isRecording}
              >
                {isRecording ? "● 녹음 중지" : "🎤 보이스 오버 녹음 (M3)"}
              </button>
            </div>

            <div style={{ fontSize: 11, color: "var(--text-muted)", margin: "16px 0 8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              기본 제공 BGM
            </div>
            <div className="audio-preset-list">
              {PRESET_BGM.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`audio-preset ${bgmAudio?.id === b.id ? "selected" : ""}`}
                  onClick={() => {
                    if (bgmAudio?.id === b.id) {
                      removeAudioClip(b.id);
                    } else {
                      addAudioClip({
                        id: b.id, name: b.name, url: "", duration: b.duration,
                        isPreset: true, track: 1, volume: 0.8, fadeIn: 0, fadeOut: 0, startTime: 0,
                      });
                    }
                  }}
                  aria-pressed={bgmAudio?.id === b.id}
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

            {audioClips.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: "var(--text-muted)", margin: "16px 0 6px", fontWeight: 700, textTransform: "uppercase" }}>
                  현재 오디오
                </div>
                <ul className="audio-list">
                  {audioClips.map((a) => (
                    <li key={a.id} className="audio-list-item">
                      <span>M{a.track ?? 1} · {a.name}</span>
                      <button type="button" className="tl-btn" onClick={() => removeAudioClip(a.id)}>삭제</button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}

        {/* ── 텍스트 tab ── */}
        {tab === "text" && (
          <div className="text-editor">
            <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>자막 텍스트</label>
            <textarea
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              placeholder="자막을 입력하세요... (여러 줄도 가능)"
              aria-label="자막 텍스트"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  if (captionText.trim()) { addCaption({ text: captionText.trim() }); setCaptionText(""); }
                }
              }}
              style={{ minHeight: 96 }}
            />

            <div className="label-row"><span>빠른 스타일</span></div>
            <div className="text-presets">
              {TEXT_PRESETS.map((p) => (
                <button key={p.label} type="button" className="text-preset"
                  onClick={() => {
                    addCaption({ text: captionText.trim() || "텍스트", ...(p.patch as any) });
                    setCaptionText("");
                  }}
                >{p.label}</button>
              ))}
            </div>

            <button
              type="button"
              className="btn-add-text"
              onClick={() => {
                if (captionText.trim()) { addCaption({ text: captionText.trim() }); setCaptionText(""); }
              }}
              disabled={!captionText.trim()}
              aria-label="자막 추가"
              title="현재 재생 위치에 자막을 추가합니다"
            >
              자막 추가
            </button>

            <div className="label-row" style={{ marginTop: 12 }}><span>자막 파일</span></div>
            <div style={{ display: "flex", gap: 6 }}>
              <label className="btn-upload" style={{ flex: 1, margin: 0 }} title="SRT/VTT 자막 파일 가져오기">
                SRT/VTT 가져오기
                <input ref={srtInputRef} type="file" accept=".srt,.vtt,text/plain"
                  style={{ display: "none" }}
                  onChange={(e) => { if (e.target.files?.[0]) handleSrtFile(e.target.files[0]); e.target.value = ""; }}
                />
              </label>
              <button type="button" className="btn-upload" style={{ flex: 1, margin: 0 }}
                onClick={() => {
                  if (captions.length === 0) { toast({ message: "내보낼 자막이 없어요", type: "warning" }); return; }
                  downloadSrt(captions);
                  toast({ message: "SRT 다운로드 시작", type: "success" });
                }}
              >SRT 내보내기</button>
            </div>

            <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 6 }}>
              Ctrl+Enter로도 추가할 수 있어요
            </p>
          </div>
        )}

        {/* ── 스티커 tab ── */}
        {tab === "sticker" && (
          <div className="sticker-grid" role="list" aria-label="스티커 선택">
            {STICKERS.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
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

        {/* ── 이미지 tab ── */}
        {tab === "image" && (
          <div>
            <button
              type="button"
              className="btn-upload"
              onClick={() => imageInputRef.current?.click()}
              aria-label="이미지 파일 선택"
              title="PNG/JPG 이미지를 오버레이로 추가합니다"
            >
              이미지 파일 열기
            </button>
            <input ref={imageInputRef} type="file" accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                addImage(file.name.replace(/\.[^.]+$/, ""), url);
                e.target.value = "";
              }}
              aria-label="이미지 파일"
            />
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.6 }}>
              미리보기에서 드래그로 위치 이동,<br/>속성 패널에서 크기·시간 조절.
            </p>
          </div>
        )}

        {/* ── 마커 tab ── */}
        {tab === "markers" && (
          <div>
            <button type="button" className="btn-upload" onClick={() => { addMarker(); toast({ message: "마커를 현재 위치에 추가했어요", type: "info" }); }}>
              현재 위치에 마커 추가 (M)
            </button>
            {markers.length === 0 ? (
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12, textAlign: "center" }}>
                재생 위치를 표시할 마커를 추가해 보세요
              </p>
            ) : (
              <ul className="marker-list">
                {markers.map((m) => (
                  <li key={m.id} className="marker-list-item">
                    <span className="marker-dot" style={{ background: m.color }} />
                    <button type="button" className="marker-time"
                      onClick={() => { setCurrentTime(m.time); setSeekRequest(m.time); }}
                      title="이 시간으로 이동"
                    >{formatDur(m.time)}</button>
                    <input className="prop-input" style={{ flex: 1, height: 26 }}
                      value={m.label}
                      onChange={(e) => updateMarker(m.id, { label: e.target.value })}
                      aria-label="마커 라벨"
                    />
                    <button type="button" className="tl-btn" onClick={() => removeMarker(m.id)} aria-label="마커 삭제">✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
