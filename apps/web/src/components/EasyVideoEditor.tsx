"use client";

import { useEditorStore } from "@/store/editorStore";
import StepBar from "./StepBar";
import VideoDropZone from "./VideoDropZone";
import PreviewPanel from "./PreviewPanel";
import SimpleTimeline from "./SimpleTimeline";
import CaptionEditor from "./CaptionEditor";
import StickerPicker from "./StickerPicker";
import ExportButton from "./ExportButton";
import MascotHelper from "./MascotHelper";

export default function EasyVideoEditor() {
  const videoClips = useEditorStore((s) => s.videoClips);

  return (
    <div className="editor">
      <header className="topbar">
        <h1 className="brand">
          <span aria-hidden="true">🎬</span> 영상편집 걱정마
        </h1>
        <p className="brand-sub">초등학생을 위한 쉬운 영상 편집기 (Easy Video)</p>
      </header>

      <StepBar />

      <main className="editor-main">
        {videoClips.length === 0 ? (
          <VideoDropZone />
        ) : (
          <div className="editor-layout">
            <div className="left-pane">
              <PreviewPanel />
              <SimpleTimeline />
            </div>
            <aside className="right-pane">
              <VideoDropZone />
              <CaptionEditor />
              <StickerPicker />
              <ExportButton />
            </aside>
          </div>
        )}
      </main>

      <MascotHelper />
    </div>
  );
}
