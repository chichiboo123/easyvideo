"use client";

import { useEditorStore } from "@/store/editorStore";
import { downloadProjectFile } from "@/lib/project";

interface ToolbarProps {
  onExport: () => void;
}

export default function Toolbar({ onExport }: ToolbarProps) {
  const selectedTool = useEditorStore((s) => s.selectedTool);
  const setSelectedTool = useEditorStore((s) => s.setSelectedTool);
  const splitClipAtPlayhead = useEditorStore((s) => s.splitClipAtPlayhead);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const removeVideoClip = useEditorStore((s) => s.removeVideoClip);
  const removeCaption = useEditorStore((s) => s.removeCaption);
  const removeSticker = useEditorStore((s) => s.removeSticker);
  const selectedCaptionId = useEditorStore((s) => s.selectedCaptionId);
  const selectedStickerId = useEditorStore((s) => s.selectedStickerId);
  const selectedImageId = useEditorStore((s) => s.selectedImageId);
  const removeImage = useEditorStore((s) => s.removeImage);
  const videoClips = useEditorStore((s) => s.videoClips);
  const isVideoTrackLocked = useEditorStore((s) => s.isVideoTrackLocked);
  const isAudioMuted = useEditorStore((s) => s.isAudioMuted);
  const setVideoTrackLocked = useEditorStore((s) => s.setVideoTrackLocked);
  const setAudioMuted = useEditorStore((s) => s.setAudioMuted);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.canUndo());
  const canRedo = useEditorStore((s) => s.canRedo());

  const hasSelection = !!(selectedClipId || selectedCaptionId || selectedStickerId || selectedImageId);
  const hasClips = videoClips.length > 0;

  function handleDelete() {
    if (selectedClipId && !isVideoTrackLocked) removeVideoClip(selectedClipId);
    if (selectedCaptionId) removeCaption(selectedCaptionId);
    if (selectedStickerId) removeSticker(selectedStickerId);
    if (selectedImageId) removeImage(selectedImageId);
  }

  function handleSplit() {
    splitClipAtPlayhead();
  }

  return (
    <header className="toolbar" role="banner">
      {/* Logo */}
      <div className="toolbar-logo" aria-label="EasyVideo 영상편집">
        Easy<span>Video</span>
      </div>

      <div className="toolbar-divider" aria-hidden="true" />
      <button
        type="button"
        className="toolbar-btn"
        onClick={undo}
        disabled={!canUndo}
        aria-label="되돌리기"
        title="되돌리기 (Ctrl/⌘ + Z)"
      >
        ↶ 되돌리기
      </button>
      <button
        type="button"
        className="toolbar-btn"
        onClick={redo}
        disabled={!canRedo}
        aria-label="다시 실행"
        title="다시 실행 (Ctrl/⌘ + Shift + Z)"
      >
        ↷ 다시실행
      </button>
      <div className="toolbar-divider" aria-hidden="true" />

      {/* Tool: Select */}
      <button
        type="button"
        className={`toolbar-btn ${selectedTool === "select" ? "active" : ""}`}
        onClick={() => setSelectedTool("select")}
        aria-label="선택 도구"
        aria-pressed={selectedTool === "select"}
        title="클립 선택 (V)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M4 0l16 12-7 1-4 8z" />
        </svg>
        선택
      </button>

      {/* Tool: Split */}
      <button
        type="button"
        className={`toolbar-btn ${selectedTool === "split" ? "active" : ""}`}
        onClick={() => {
          setSelectedTool("split");
          if (hasClips) handleSplit();
        }}
        disabled={!hasClips || isVideoTrackLocked}
        aria-label="클립 분할"
        title="재생 위치에서 클립 분할 (S)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" d="M6 9a3 3 0 100-6 3 3 0 000 6zm12 12a3 3 0 100-6 3 3 0 000 6zM5.5 8.5l13 7M6 9l12.5 6.5"/>
        </svg>
        분할
      </button>

      {/* Delete */}
      <button
        type="button"
        className="toolbar-btn"
        onClick={handleDelete}
        disabled={!hasSelection}
        aria-label="선택 항목 삭제"
        title="선택한 클립 삭제 (Delete)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
        </svg>
        삭제
      </button>

      <div className="toolbar-divider" aria-hidden="true" />
      <button type="button" className={`toolbar-btn ${isVideoTrackLocked ? "active" : ""}`} onClick={() => setVideoTrackLocked(!isVideoTrackLocked)} title="비디오 트랙 잠금">
        {isVideoTrackLocked ? "🔒 트랙잠금" : "🔓 트랙열기"}
      </button>
      <button type="button" className={`toolbar-btn ${isAudioMuted ? "active" : ""}`} onClick={() => setAudioMuted(!isAudioMuted)} title="오디오 음소거">
        {isAudioMuted ? "🔇 음소거" : "🔊 소리켜기"}
      </button>
      <div className="toolbar-divider" aria-hidden="true" />

      <div className="toolbar-spacer" />
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => downloadProjectFile(useEditorStore.getState())}
        aria-label="프로젝트 파일 다운로드"
        title="프로젝트 파일(JSON) 다운로드"
      >
        💾 프로젝트
      </button>

      {/* Export */}
      <button
        type="button"
        className="btn-export"
        onClick={onExport}
        disabled={!hasClips}
        aria-label="영상 내보내기"
        title="MP4로 내보내기"
      >
        내보내기
      </button>
    </header>
  );
}
