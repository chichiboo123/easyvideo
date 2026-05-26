"use client";

import { useRef } from "react";
import { useEditorStore } from "@/store/editorStore";
import { downloadProjectFile, loadProjectFile } from "@/lib/project";
import { toast } from "@/lib/notifications";
import DropdownMenu, { type DropdownItem } from "./DropdownMenu";

interface ToolbarProps {
  onExport: () => void;
  onShowShortcuts: () => void;
}

/* SVG icon helpers (inline so we don't add deps) */
const Icon = {
  undo: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>,
  redo: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/></svg>,
  select: <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M5 2l14 10-6 1-3 7z"/></svg>,
  split: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 7l12 5M8 17L20 12"/></svg>,
  trash: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  lock: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg>,
  unlock: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></svg>,
  sound: <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M14 8a4.5 4.5 0 0 1 0 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  mute: <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16 9l5 5m0-5l-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  help: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7"/><circle cx="12" cy="17" r="0.8" fill="currentColor"/></svg>,
  menu: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>,
  chevron: <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>,
};

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
      removeVideoClip(id);
      toast({ message: "클립을 삭제했어요", type: "info",
        action: { label: "되돌리기", run: () => useEditorStore.getState().undo() } });
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
    } catch {
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

  const fileMenuItems: DropdownItem[] = [
    { label: "새 프로젝트", icon: "📄", onClick: handleNewProject },
    { label: "프로젝트 불러오기", icon: "📂", onClick: () => fileInputRef.current?.click() },
    { label: "프로젝트 저장", icon: "💾", onClick: () => { downloadProjectFile(useEditorStore.getState()); toast({ message: "프로젝트 JSON 저장", type: "success" }); } },
    { divider: true },
    { label: "단축키 도움말", icon: "⌨", shortcut: "?", onClick: onShowShortcuts },
  ];

  return (
    <header className="toolbar" role="banner">
      <div className="toolbar-logo">Easy<span>Video</span></div>

      {/* File menu */}
      <DropdownMenu
        ariaLabel="파일 메뉴"
        trigger={
          <span className="tb-icon-trigger" title="파일">
            {Icon.menu}
            <span className="tb-icon-trigger-caret">{Icon.chevron}</span>
          </span>
        }
        items={fileMenuItems}
      />
      <input ref={fileInputRef} type="file" accept="application/json,.json"
        style={{ display: "none" }}
        onChange={(e) => { if (e.target.files?.[0]) handleLoadProject(e.target.files[0]); e.target.value = ""; }}
      />

      <div className="tb-sep" aria-hidden="true" />

      {/* Undo/Redo */}
      <div className="tb-group">
        <button type="button" className="tb-icon-btn"
          onClick={undo} disabled={!canUndo}
          title="되돌리기 (Ctrl/⌘+Z)" aria-label="되돌리기"
        >{Icon.undo}</button>
        <button type="button" className="tb-icon-btn"
          onClick={redo} disabled={!canRedo}
          title="다시 실행 (Ctrl/⌘+Shift+Z)" aria-label="다시 실행"
        >{Icon.redo}</button>
      </div>

      <div className="tb-sep" aria-hidden="true" />

      {/* Tools */}
      <div className="tb-group">
        <button type="button"
          className={`tb-icon-btn ${selectedTool === "select" ? "active" : ""}`}
          onClick={() => setSelectedTool("select")}
          title="선택 (V)" aria-pressed={selectedTool === "select"}
        >{Icon.select}</button>
        <button type="button"
          className={`tb-icon-btn ${selectedTool === "split" ? "active" : ""}`}
          onClick={() => { setSelectedTool("split"); if (hasClips) splitClipAtPlayhead(); }}
          disabled={!hasClips || isVideoTrackLocked}
          title="분할 (S)" aria-label="분할"
        >{Icon.split}</button>
        <button type="button" className="tb-icon-btn"
          onClick={handleDelete} disabled={!hasSelection}
          title="삭제 (Delete)" aria-label="삭제"
        >{Icon.trash}</button>
      </div>

      <div className="tb-sep" aria-hidden="true" />

      {/* Aspect ratio */}
      <label className="tb-select-wrap" title="종횡비">
        <span className="visually-hidden">종횡비</span>
        <select value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value as any)}
          className="tb-select"
          aria-label="종횡비"
        >
          <option value="16:9">16:9</option>
          <option value="9:16">9:16</option>
          <option value="1:1">1:1</option>
          <option value="4:5">4:5</option>
          <option value="original">원본</option>
        </select>
      </label>

      {/* Lock / mute */}
      <div className="tb-group">
        <button type="button"
          className={`tb-icon-btn ${isVideoTrackLocked ? "on" : ""}`}
          onClick={() => setVideoTrackLocked(!isVideoTrackLocked)}
          title={isVideoTrackLocked ? "비디오 트랙 잠금 해제" : "비디오 트랙 잠금"}
          aria-pressed={isVideoTrackLocked}
        >{isVideoTrackLocked ? Icon.lock : Icon.unlock}</button>
        <button type="button"
          className={`tb-icon-btn ${isAudioMuted ? "on" : ""}`}
          onClick={() => setAudioMuted(!isAudioMuted)}
          title={isAudioMuted ? "음소거 해제" : "음소거"}
          aria-pressed={isAudioMuted}
        >{isAudioMuted ? Icon.mute : Icon.sound}</button>
      </div>

      <div className="toolbar-spacer" />

      <button type="button" className="tb-icon-btn"
        onClick={onShowShortcuts}
        title="단축키 도움말 (?)" aria-label="도움말"
      >{Icon.help}</button>

      <button type="button" className="btn-export"
        onClick={onExport} disabled={!hasClips}
        aria-label="영상 내보내기" title="MP4로 내보내기"
      >내보내기</button>
    </header>
  );
}
