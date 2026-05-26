"use client";

import { useRef } from "react";
import { useEditorStore } from "@/store/editorStore";
import { downloadProjectFile, loadProjectFile } from "@/lib/project";
import { toast } from "@/lib/notifications";

interface ToolbarProps {
  onExport: () => void;
  onShowShortcuts: () => void;
}

export default function Toolbar({ onExport, onShowShortcuts }: ToolbarProps) {
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
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);
  const resetProject = useEditorStore((s) => s.resetProject);
  const hydrateFromJSON = useEditorStore((s) => s.hydrateFromJSON);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasSelection = !!(selectedClipId || selectedCaptionId || selectedStickerId || selectedImageId);
  const hasClips = videoClips.length > 0;

  function handleDelete() {
    if (selectedClipId && !isVideoTrackLocked) {
      const id = selectedClipId;
      const clip = useEditorStore.getState().videoClips.find((c) => c.id === id);
      removeVideoClip(id);
      toast({
        message: `"${clip?.name ?? "클립"}" 삭제됨`,
        type: "info",
        action: { label: "되돌리기", run: () => useEditorStore.getState().undo() },
      });
    }
    if (selectedCaptionId) {
      removeCaption(selectedCaptionId);
      toast({ message: "자막을 삭제했어요", type: "info",
        action: { label: "되돌리기", run: () => useEditorStore.getState().undo() } });
    }
    if (selectedStickerId) {
      removeSticker(selectedStickerId);
      toast({ message: "스티커를 삭제했어요", type: "info",
        action: { label: "되돌리기", run: () => useEditorStore.getState().undo() } });
    }
    if (selectedImageId) {
      removeImage(selectedImageId);
      toast({ message: "이미지를 삭제했어요", type: "info",
        action: { label: "되돌리기", run: () => useEditorStore.getState().undo() } });
    }
  }

  async function handleLoadProject(file: File) {
    try {
      const json = await loadProjectFile(file);
      hydrateFromJSON(json);
      toast({ message: "프로젝트를 불러왔어요", type: "success" });
    } catch (e) {
      toast({ message: "프로젝트 파일을 읽을 수 없어요", type: "error" });
    }
  }

  function handleNewProject() {
    if (videoClips.length === 0) return;
    if (!confirm("현재 작업을 모두 비울까요? (되돌리기로 복구할 수 있어요)")) return;
    resetProject();
    toast({ message: "새 프로젝트를 시작합니다", type: "info",
      action: { label: "되돌리기", run: () => useEditorStore.getState().undo() } });
  }

  return (
    <header className="toolbar" role="banner">
      <div className="toolbar-logo" aria-label="EasyVideo 영상편집">
        Easy<span>Video</span>
      </div>

      <div className="toolbar-divider" aria-hidden="true" />
      <button type="button" className="toolbar-btn"
        onClick={handleNewProject}
        title="새 프로젝트"
        aria-label="새 프로젝트"
      >📄 새작업</button>
      <button type="button" className="toolbar-btn"
        onClick={() => fileInputRef.current?.click()}
        title="프로젝트 파일(JSON) 불러오기"
        aria-label="프로젝트 불러오기"
      >📂 불러오기</button>
      <input ref={fileInputRef} type="file" accept="application/json,.json"
        style={{ display: "none" }}
        onChange={(e) => { if (e.target.files?.[0]) handleLoadProject(e.target.files[0]); e.target.value = ""; }}
      />
      <button type="button" className="toolbar-btn"
        onClick={() => { downloadProjectFile(useEditorStore.getState()); toast({ message: "프로젝트 JSON을 저장했어요", type: "success" }); }}
        aria-label="프로젝트 파일 다운로드"
        title="프로젝트 파일(JSON) 다운로드"
      >💾 저장</button>

      <div className="toolbar-divider" aria-hidden="true" />
      <button type="button" className="toolbar-btn"
        onClick={undo} disabled={!canUndo}
        aria-label="되돌리기" title="되돌리기 (Ctrl/⌘ + Z)"
      >↶ 되돌리기</button>
      <button type="button" className="toolbar-btn"
        onClick={redo} disabled={!canRedo}
        aria-label="다시 실행" title="다시 실행 (Ctrl/⌘ + Shift + Z)"
      >↷ 다시실행</button>

      <div className="toolbar-divider" aria-hidden="true" />
      <button type="button"
        className={`toolbar-btn ${selectedTool === "select" ? "active" : ""}`}
        onClick={() => setSelectedTool("select")}
        aria-label="선택 도구" aria-pressed={selectedTool === "select"}
        title="클립 선택 (V)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M4 0l16 12-7 1-4 8z" />
        </svg>
        선택
      </button>
      <button type="button"
        className={`toolbar-btn ${selectedTool === "split" ? "active" : ""}`}
        onClick={() => { setSelectedTool("split"); if (hasClips) splitClipAtPlayhead(); }}
        disabled={!hasClips || isVideoTrackLocked}
        aria-label="클립 분할" title="재생 위치에서 클립 분할 (S)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" d="M6 9a3 3 0 100-6 3 3 0 000 6zm12 12a3 3 0 100-6 3 3 0 000 6zM5.5 8.5l13 7M6 9l12.5 6.5"/>
        </svg>
        분할
      </button>
      <button type="button" className="toolbar-btn"
        onClick={handleDelete} disabled={!hasSelection}
        aria-label="선택 항목 삭제" title="선택한 항목 삭제 (Delete)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
        </svg>
        삭제
      </button>

      <div className="toolbar-divider" aria-hidden="true" />
      <label className="toolbar-label" title="종횡비">
        <span className="visually-hidden">종횡비</span>
        <select value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value as any)}
          className="prop-input" style={{ height: 28, width: 110 }}
          aria-label="종횡비 선택"
        >
          <option value="16:9">16:9 가로</option>
          <option value="9:16">9:16 세로(쇼츠)</option>
          <option value="1:1">1:1 정사각</option>
          <option value="4:5">4:5 인스타</option>
          <option value="original">원본</option>
        </select>
      </label>

      <button type="button"
        className={`toolbar-btn ${isVideoTrackLocked ? "active" : ""}`}
        onClick={() => setVideoTrackLocked(!isVideoTrackLocked)}
        title="비디오 트랙 잠금" aria-pressed={isVideoTrackLocked}
      >{isVideoTrackLocked ? "🔒 잠금" : "🔓 잠금"}</button>
      <button type="button"
        className={`toolbar-btn ${isAudioMuted ? "active" : ""}`}
        onClick={() => setAudioMuted(!isAudioMuted)}
        title="오디오 음소거" aria-pressed={isAudioMuted}
      >{isAudioMuted ? "🔇 음소거" : "🔊 소리"}</button>

      <div className="toolbar-spacer" />

      <button type="button" className="toolbar-btn"
        onClick={onShowShortcuts}
        title="단축키 도움말 (?)"
        aria-label="단축키 도움말"
      >⌨ 도움말</button>

      <button type="button" className="btn-export"
        onClick={onExport} disabled={!hasClips}
        aria-label="영상 내보내기" title="MP4로 내보내기"
      >
        내보내기
      </button>
    </header>
  );
}
