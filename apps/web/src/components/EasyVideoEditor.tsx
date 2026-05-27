"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { useToastStore } from "@/lib/notifications";
import { localAutosave } from "@/lib/project";
import Toolbar from "./Toolbar";
import MediaPanel from "./MediaPanel";
import ProPreviewPanel from "./ProPreviewPanel";
import PropertiesPanel from "./PropertiesPanel";
import ProTimeline from "./ProTimeline";
import ExportModal from "./ExportModal";
import ShortcutsModal from "./ShortcutsModal";
import ToastContainer from "./ToastContainer";
import Footer from "./Footer";

export default function EasyVideoEditor() {
  const [showExport, setShowExport] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setPlaying = useEditorStore((s) => s.setPlaying);
  const splitClipAtPlayhead = useEditorStore((s) => s.splitClipAtPlayhead);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const selectedCaptionId = useEditorStore((s) => s.selectedCaptionId);
  const selectedStickerId = useEditorStore((s) => s.selectedStickerId);
  const selectedImageId = useEditorStore((s) => s.selectedImageId);
  const removeVideoClip = useEditorStore((s) => s.removeVideoClip);
  const removeCaption = useEditorStore((s) => s.removeCaption);
  const removeSticker = useEditorStore((s) => s.removeSticker);
  const removeImage = useEditorStore((s) => s.removeImage);
  const duplicateVideoClip = useEditorStore((s) => s.duplicateVideoClip);
  const duplicateCaption = useEditorStore((s) => s.duplicateCaption);
  const duplicateSticker = useEditorStore((s) => s.duplicateSticker);
  const duplicateImage = useEditorStore((s) => s.duplicateImage);
  const setTimelineZoom = useEditorStore((s) => s.setTimelineZoom);
  const timelineZoom = useEditorStore((s) => s.timelineZoom);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const isVideoTrackLocked = useEditorStore((s) => s.isVideoTrackLocked);
  const addMarker = useEditorStore((s) => s.addMarker);
  const currentTime = useEditorStore((s) => s.currentTime);
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime);
  const setSeekRequest = useEditorStore((s) => s.setSeekRequest);
  const setActiveClipIndex = useEditorStore((s) => s.setActiveClipIndex);
  const videoClips = useEditorStore((s) => s.videoClips);
  const totalDuration = useEditorStore((s) => s.totalDuration);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const lastAutosaveRef = useRef<number>(0);

  function seekToGlobal(t: number) {
    if (videoClips.length === 0) return;
    let elapsed = 0;
    for (let i = 0; i < videoClips.length; i++) {
      const end = elapsed + videoClips[i].duration;
      if (t < end || i === videoClips.length - 1) {
        setActiveClipIndex(i);
        setCurrentTime(t);
        setSeekRequest(t - elapsed);
        return;
      }
      elapsed = end;
    }
  }
  function seekRelative(delta: number) {
    const t = Math.max(0, Math.min(totalDuration(), currentTime + delta));
    seekToGlobal(t);
  }

  // ── Autosave (every 8s of state change) ────────────────────────────────────
  useEffect(() => {
    const unsub = useEditorStore.subscribe(() => {
      const now = Date.now();
      if (now - lastAutosaveRef.current > 8000) {
        lastAutosaveRef.current = now;
        localAutosave(useEditorStore.getState());
      }
    });
    return () => unsub();
  }, []);

  // ── Global keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      const isFormField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
      // Allow undo/redo and ? in form fields too.
      const isModifier = e.ctrlKey || e.metaKey;
      if (isFormField && !isModifier && e.key !== "?") return;

      switch (e.key) {
        case "z": case "Z":
          if (isModifier) {
            e.preventDefault();
            if (e.shiftKey) redo(); else undo();
          }
          break;
        case "y": case "Y":
          if (isModifier) { e.preventDefault(); redo(); }
          break;
        case "d": case "D":
          if (isModifier && !isFormField) {
            e.preventDefault();
            if (selectedClipId) duplicateVideoClip(selectedClipId);
            else if (selectedCaptionId) duplicateCaption(selectedCaptionId);
            else if (selectedStickerId) duplicateSticker(selectedStickerId);
            else if (selectedImageId) duplicateImage(selectedImageId);
          }
          break;
        case " ":
          if (!isFormField) { e.preventDefault(); setPlaying(!isPlaying); }
          break;
        case "j": case "J":
          if (!isFormField) { e.preventDefault(); seekRelative(-5); }
          break;
        case "k": case "K":
          if (!isFormField) { e.preventDefault(); setPlaying(!isPlaying); }
          break;
        case "l": case "L":
          if (!isFormField) { e.preventDefault(); seekRelative(5); }
          break;
        case "ArrowLeft":
          if (!isFormField) { e.preventDefault(); seekRelative(e.shiftKey ? -5 : -1); }
          break;
        case "ArrowRight":
          if (!isFormField) { e.preventDefault(); seekRelative(e.shiftKey ? 5 : 1); }
          break;
        case "s": case "S":
          if (!isFormField && !isModifier && !isVideoTrackLocked) {
            e.preventDefault(); splitClipAtPlayhead();
          }
          break;
        case "m": case "M":
          if (!isFormField && !isModifier) {
            e.preventDefault(); addMarker();
          }
          break;
        case "f": case "F":
          if (!isFormField && !isModifier) {
            e.preventDefault();
            if (document.fullscreenElement) document.exitFullscreen();
            else document.querySelector(".preview-stage")?.requestFullscreen?.();
          }
          break;
        case "Delete": case "Backspace":
          if (isFormField) return;
          if (selectedClipId && !isVideoTrackLocked) removeVideoClip(selectedClipId);
          if (selectedCaptionId) removeCaption(selectedCaptionId);
          if (selectedStickerId) removeSticker(selectedStickerId);
          if (selectedImageId) removeImage(selectedImageId);
          break;
        case "+": case "=":
          if (!isFormField) setTimelineZoom(timelineZoom + 20);
          break;
        case "-":
          if (!isFormField) setTimelineZoom(timelineZoom - 20);
          break;
        case "?":
          e.preventDefault();
          setShowShortcuts(true);
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    isPlaying, setPlaying, splitClipAtPlayhead,
    selectedClipId, removeVideoClip, duplicateVideoClip,
    selectedCaptionId, removeCaption, duplicateCaption,
    selectedStickerId, removeSticker, duplicateSticker,
    selectedImageId, removeImage, duplicateImage,
    timelineZoom, setTimelineZoom,
    undo, redo, isVideoTrackLocked,
    addMarker, currentTime, totalDuration,
  ]);

  return (
    <>
      <div className="app-shell">
        <div className="app">
          <Toolbar onExport={() => setShowExport(true)} onShowShortcuts={() => setShowShortcuts(true)} />
          <MediaPanel />
          <ProPreviewPanel />
          <PropertiesPanel />
          <ProTimeline />
        </div>
        <Footer />
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      <ToastContainer />
    </>
  );
}
