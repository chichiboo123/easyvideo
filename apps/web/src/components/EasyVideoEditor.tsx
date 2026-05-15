"use client";

import { useEffect, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import Toolbar from "./Toolbar";
import MediaPanel from "./MediaPanel";
import ProPreviewPanel from "./ProPreviewPanel";
import PropertiesPanel from "./PropertiesPanel";
import ProTimeline from "./ProTimeline";
import ExportModal from "./ExportModal";

export default function EasyVideoEditor() {
  const [showExport, setShowExport] = useState(false);

  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setPlaying = useEditorStore((s) => s.setPlaying);
  const splitClipAtPlayhead = useEditorStore((s) => s.splitClipAtPlayhead);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const selectedCaptionId = useEditorStore((s) => s.selectedCaptionId);
  const selectedStickerId = useEditorStore((s) => s.selectedStickerId);
  const removeVideoClip = useEditorStore((s) => s.removeVideoClip);
  const removeCaption = useEditorStore((s) => s.removeCaption);
  const removeSticker = useEditorStore((s) => s.removeSticker);
  const selectedImageId = useEditorStore((s) => s.selectedImageId);
  const removeImage = useEditorStore((s) => s.removeImage);
  const setTimelineZoom = useEditorStore((s) => s.setTimelineZoom);
  const timelineZoom = useEditorStore((s) => s.timelineZoom);

  // ── Global keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Skip when user is typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          setPlaying(!isPlaying);
          break;
        case "s":
        case "S":
          splitClipAtPlayhead();
          break;
        case "Delete":
        case "Backspace":
          if (selectedClipId) removeVideoClip(selectedClipId);
          if (selectedCaptionId) removeCaption(selectedCaptionId);
          if (selectedStickerId) removeSticker(selectedStickerId);
          if (selectedImageId) removeImage(selectedImageId);
          break;
        case "+":
        case "=":
          setTimelineZoom(timelineZoom + 20);
          break;
        case "-":
          setTimelineZoom(timelineZoom - 20);
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    isPlaying, setPlaying,
    splitClipAtPlayhead,
    selectedClipId, removeVideoClip,
    selectedCaptionId, removeCaption,
    selectedStickerId, removeSticker,
    selectedImageId, removeImage,
    timelineZoom, setTimelineZoom,
  ]);

  return (
    <>
      <div className="app">
        <Toolbar onExport={() => setShowExport(true)} />
        <MediaPanel />
        <ProPreviewPanel />
        <PropertiesPanel />
        <ProTimeline />
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </>
  );
}
