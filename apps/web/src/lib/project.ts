"use client";

import { useEditorStore } from "@/store/editorStore";

type ProjectState = ReturnType<typeof useEditorStore.getState>;

const AUTOSAVE_KEY = "easyvideo:autosave:v2";

export function serializeProject(state: ProjectState) {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    project: {
      videoClips: state.videoClips,
      audioClips: state.audioClips,
      captions: state.captions,
      stickers: state.stickers,
      images: state.images,
      shapes: state.shapes,
      markers: state.markers,
      transitionType: state.transitionType,
      transitionDuration: state.transitionDuration,
      videoEffect: state.videoEffect,
      aspectRatio: state.aspectRatio,
      backgroundFill: state.backgroundFill,
      isAudioMuted: state.isAudioMuted,
      isVideoTrackLocked: state.isVideoTrackLocked,
      timelineZoom: state.timelineZoom,
    },
  };
}

export function downloadProjectFile(state: ProjectState) {
  const payload = serializeProject(state);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `easyvideo_project_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function loadProjectFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try { resolve(JSON.parse(String(reader.result || "{}"))); }
      catch (e) { reject(e); }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// ── localStorage autosave ────────────────────────────────────────────────
// Note: blob URLs are not stable across reloads, so we only autosave when
// the user is actively editing. On restore, video/audio clip URLs may be
// missing (we don't persist binary). We still restore captions/markers/UI.

export function localAutosave(state: ProjectState) {
  try {
    // Skip persisting blob URLs (they won't survive a reload anyway).
    const payload = {
      ...serializeProject(state),
      // Drop URLs but keep names so the user knows what was there.
      project: {
        ...serializeProject(state).project,
        videoClips: state.videoClips.map((c) => ({ ...c, url: "" })),
        audioClips: state.audioClips.map((a) => ({ ...a, url: "" })),
        images: state.images.map((i) => ({ ...i, url: "" })),
      },
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
  } catch { /* quota or disabled */ }
}

export function readAutosave(): unknown | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearAutosave() {
  try { localStorage.removeItem(AUTOSAVE_KEY); } catch { /* */ }
}
