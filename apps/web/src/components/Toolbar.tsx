"use client";

import { useRef } from "react";
import { useEditorStore } from "@/store/editorStore";
import { downloadProjectFile, loadProjectFile } from "@/lib/project";
import { toast } from "@/lib/notifications";
import { useTheme } from "@/lib/theme";
import DropdownMenu, { type DropdownItem } from "./DropdownMenu";
import MIcon from "./MIcon";

interface ToolbarProps {
  onExport: () => void;
  onShowShortcuts: () => void;
}

/* Google Material Symbols */
const Icon = {
  undo: <MIcon name="undo" size={18} />,
  redo: <MIcon name="redo" size={18} />,
  select: <MIcon name="arrow_selector_tool" size={18} fill />,
  split: <MIcon name="content_cut" size={18} />,
  trash: <MIcon name="delete" size={18} />,
  lock: <MIcon name="lock" size={17} fill />,
  unlock: <MIcon name="lock_open" size={17} />,
  sound: <MIcon name="volume_up" size={18} fill />,
  mute: <MIcon name="volume_off" size={18} fill />,
  help: <MIcon name="help" size={18} />,
  menu: <MIcon name="menu" size={18} />,
  chevron: <MIcon name="expand_more" size={14} />,
  lightMode: <MIcon name="light_mode" size={18} fill />,
  darkMode: <MIcon name="dark_mode" size={18} fill />,
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
  const backgroundFill = useEditorStore((s) => s.backgroundFill);
  const setBackgroundFill = useEditorStore((s) => s.setBackgroundFill);
  const resetProject = useEditorStore((s) => s.resetProject);
  const hydrateFromJSON = useEditorStore((s) => s.hydrateFromJSON);

  const { theme, toggleTheme } = useTheme();

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
    { label: "도움말", icon: "⌨", shortcut: "?", onClick: onShowShortcuts },
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

      {/* Background fill for letterbox bars */}
      <label className="tb-select-wrap" title="여백(레터박스) 배경 채우기">
        <span className="visually-hidden">배경 채우기</span>
        <select
          className="tb-select"
          aria-label="배경 채우기"
          value={backgroundFill === "black" ? "black" : backgroundFill === "blur" ? "blur" : "color"}
          onChange={(e) => {
            const v = e.target.value;
            setBackgroundFill(v === "black" ? "black" : v === "blur" ? "blur" : "#202840");
          }}
        >
          <option value="black">배경: 검정</option>
          <option value="blur">배경: 블러</option>
          <option value="color">배경: 색상</option>
        </select>
      </label>
      {backgroundFill !== "black" && backgroundFill !== "blur" && (
        <input type="color" className="tb-color-input"
          value={backgroundFill.startsWith("#") ? backgroundFill : "#202840"}
          onChange={(e) => setBackgroundFill(e.target.value)}
          aria-label="배경 색상" title="배경 색상 선택" />
      )}

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
        onClick={toggleTheme}
        title={theme === "dark" ? "라이트 모드로 전환 (밝게)" : "다크 모드로 전환 (어둡게)"}
        aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
        aria-pressed={theme === "light"}
      >{theme === "dark" ? Icon.lightMode : Icon.darkMode}</button>

      <button type="button" className="tb-icon-btn"
        onClick={onShowShortcuts}
        title="도움말 — 단축키 · 전환 효과 · 오픈소스 (?)" aria-label="도움말"
      >{Icon.help}</button>

      <button type="button" className="btn-export"
        onClick={onExport} disabled={!hasClips}
        aria-label="영상 내보내기" title="MP4로 내보내기"
      >내보내기</button>
    </header>
  );
}
