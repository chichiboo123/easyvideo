"use client";

import { useEditorStore } from "@/store/editorStore";

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
  const videoClips = useEditorStore((s) => s.videoClips);

  const hasSelection = !!(selectedClipId || selectedCaptionId || selectedStickerId);
  const hasClips = videoClips.length > 0;

  function handleDelete() {
    if (selectedClipId) removeVideoClip(selectedClipId);
    if (selectedCaptionId) removeCaption(selectedCaptionId);
    if (selectedStickerId) removeSticker(selectedStickerId);
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
        disabled={!hasClips}
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

      <div className="toolbar-spacer" />

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
