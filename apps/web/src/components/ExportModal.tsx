"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { exportVideo } from "@/lib/ffmpeg";
import type { ExportQuality } from "@/types";

interface ExportModalProps {
  onClose: () => void;
}

export default function ExportModal({ onClose }: ExportModalProps) {
  const videoClips = useEditorStore((s) => s.videoClips);
  const audioClips = useEditorStore((s) => s.audioClips);
  const captions = useEditorStore((s) => s.captions);
  const stickers = useEditorStore((s) => s.stickers);
  const isAudioMuted = useEditorStore((s) => s.isAudioMuted);
  const transitionType = useEditorStore((s) => s.transitionType);
  const transitionDuration = useEditorStore((s) => s.transitionDuration);
  const videoEffect = useEditorStore((s) => s.videoEffect);
  const aspectRatio = useEditorStore((s) => s.aspectRatio);

  const [quality, setQuality] = useState<ExportQuality>("720p");
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState("");
  const [error, setError] = useState("");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  async function handleExport() {
    setPhase("loading");
    setProgress(0);
    setLog("FFmpeg 초기화 중...");
    try {
      const blob = await exportVideo({
        clips: videoClips,
        audios: audioClips,
        captions, stickers,
        isAudioMuted,
        transitionType, transitionDuration,
        videoEffect, aspectRatio,
        quality,
        onProgress: (r) => {
          setProgress(Math.min(1, Math.max(0, r)));
          setLog(`처리 중: ${Math.round(r * 100)}%`);
        },
      });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "내보내기 실패");
      setPhase("error");
    }
  }

  function handleDownload() {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `easyvideo_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleClose() {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    onClose();
  }

  return (
    <div className="export-overlay" role="dialog" aria-modal="true" aria-label="영상 내보내기"
      onClick={(e) => { if (e.target === e.currentTarget && phase !== "loading") handleClose(); }}
    >
      <div className="export-modal">
        <h2>🎬 영상 내보내기</h2>

        {phase === "idle" && (
          <>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <p>클립 수: <strong style={{ color: "var(--text-primary)" }}>{videoClips.length}개</strong></p>
              <p>오디오: <strong style={{ color: "var(--text-primary)" }}>{audioClips.length}개</strong></p>
              <p>자막: <strong style={{ color: "var(--text-primary)" }}>{captions.length}개</strong></p>
              <p>스티커: <strong style={{ color: "var(--text-primary)" }}>{stickers.length}개</strong></p>
              <p>종횡비: <strong style={{ color: "var(--text-primary)" }}>{aspectRatio}</strong></p>
            </div>

            <div className="props-section-title-btn" style={{ pointerEvents: "none" }}>해상도</div>
            <div className="speed-grid">
              {([
                { v: "preview", label: "프리뷰 (360p, 가장 빠름)" },
                { v: "720p", label: "720p HD" },
                { v: "1080p", label: "1080p Full HD" },
                { v: "original", label: "원본 해상도" },
              ] as { v: ExportQuality; label: string }[]).map((opt) => (
                <button key={opt.v} type="button"
                  className={`speed-btn ${quality === opt.v ? "active" : ""}`}
                  onClick={() => setQuality(opt.v)}
                >{opt.label}</button>
              ))}
            </div>

            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
              FFmpeg.wasm이 브라우저에서 직접 처리합니다.<br/>
              영상 길이 및 해상도에 따라 수 분이 소요될 수 있어요.
            </p>
            <div className="export-action-row">
              <button type="button" className="btn-cancel" onClick={handleClose}>취소</button>
              <button type="button" className="btn-primary" onClick={handleExport}>내보내기 시작</button>
            </div>
          </>
        )}

        {phase === "loading" && (
          <>
            <div className="export-progress">
              <div className="export-progress-bar" style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="export-log">{log}</div>
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>창을 닫지 말고 잠시만 기다려 주세요.</p>
            <div className="export-action-row">
              <button type="button" className="btn-cancel" onClick={handleClose}>취소</button>
            </div>
          </>
        )}

        {phase === "done" && (
          <>
            <p style={{ color: "#4ade80", fontWeight: 700 }}>✓ 내보내기 완료!</p>
            {blobUrl && (
              <video src={blobUrl} controls style={{ width: "100%", maxHeight: 240, borderRadius: 6, background: "#000" }} />
            )}
            <div className="export-action-row">
              <button type="button" className="btn-cancel" onClick={handleClose}>닫기</button>
              <button type="button" className="btn-primary" onClick={handleDownload}>MP4 다운로드</button>
            </div>
          </>
        )}

        {phase === "error" && (
          <>
            <p style={{ color: "#f87171", fontWeight: 700 }}>⚠ {error}</p>
            <div className="export-action-row">
              <button type="button" className="btn-cancel" onClick={handleClose}>닫기</button>
              <button type="button" className="btn-primary" onClick={handleExport}>다시 시도</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
