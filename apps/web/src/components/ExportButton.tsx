"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { exportVideo } from "@/lib/ffmpeg";

export default function ExportButton() {
  const videoClips = useEditorStore((s) => s.videoClips);
  const audioClip = useEditorStore((s) => s.audioClip);
  const captions = useEditorStore((s) => s.captions);
  const stickers = useEditorStore((s) => s.stickers);
  const setStep = useEditorStore((s) => s.setStep);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    if (videoClips.length === 0) {
      setError("먼저 영상을 추가해 주세요.");
      return;
    }
    setError(null);
    setBusy(true);
    setProgress(0);
    setStep(3);
    try {
      const blob = await exportVideo({
        clips: videoClips,
        audio: audioClip,
        captions,
        stickers,
        onProgress: (r) => setProgress(Math.min(1, Math.max(0, r))),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `내영상_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "내보내기에 실패했어요";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="export-area">
      <button
        type="button"
        className="big-btn btn-save"
        onClick={handleExport}
        disabled={busy || videoClips.length === 0}
        aria-label="영상 저장하기"
        title="만든 영상을 내 컴퓨터에 저장해요"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M5 3h11l5 5v13a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1zm2 2v5h8V5H7zm0 14h10v-7H7v7z"
          />
        </svg>
        {busy ? `저장 중... ${Math.round(progress * 100)}%` : "저장하기"}
      </button>
      {busy && (
        <div className="progress" role="progressbar" aria-valuenow={Math.round(progress * 100)}>
          <div className="progress-bar" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
