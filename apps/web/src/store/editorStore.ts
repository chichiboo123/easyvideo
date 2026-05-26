"use client";

import { create } from "zustand";
import type {
  AudioClip,
  Caption,
  EditorStep,
  Sticker,
  VideoClip,
  ImageOverlay,
  TransitionType,
  VideoEffectType,
  AspectRatio,
  Marker,
} from "@/types";

interface EditorState {
  historyPast: EditorSnapshot[];
  historyFuture: EditorSnapshot[];

  // clips
  videoClips: VideoClip[];
  audioClips: AudioClip[];       // multiple audio tracks (M1=bgm, M2=sfx, M3=voiceover)
  captions: Caption[];
  stickers: Sticker[];
  images: ImageOverlay[];
  markers: Marker[];

  // selection
  selectedClipId: string | null;
  selectedCaptionId: string | null;
  selectedStickerId: string | null;
  selectedImageId: string | null;
  selectedAudioId: string | null;

  // playback
  currentTime: number;
  isPlaying: boolean;
  activeClipIndex: number;
  seekRequest: number | null;
  volume: number;                // master playback volume (preview only)

  // timeline
  timelineZoom: number;
  selectedTool: "select" | "split";

  // ui state
  step: EditorStep;
  isVideoTrackLocked: boolean;
  isAudioMuted: boolean;
  transitionType: TransitionType;
  transitionDuration: number;
  videoEffect: VideoEffectType;
  aspectRatio: AspectRatio;
  snapEnabled: boolean;

  // ── actions ───────────────────────────────────────────────────────────────
  addVideoClip: (clip: VideoClip) => void;
  removeVideoClip: (id: string) => void;
  duplicateVideoClip: (id: string) => void;
  reorderVideoClips: (fromIndex: number, toIndex: number) => void;
  splitClipAtPlayhead: () => void;
  updateVideoClip: (id: string, patch: Partial<VideoClip>) => void;
  trimClipInPoint: (id: string, deltaSec: number) => void;
  trimClipOutPoint: (id: string, deltaSec: number) => void;

  // audio (multiple)
  addAudioClip: (clip: AudioClip) => void;
  setAudioClipLegacy: (clip: AudioClip | null) => void; // back-compat
  updateAudioClip: (id: string, patch: Partial<AudioClip>) => void;
  removeAudioClip: (id: string) => void;

  // captions
  addCaption: (caption?: Partial<Caption>) => void;
  addCaptionsBatch: (list: Array<Partial<Caption> & { text: string; startTime?: number; endTime?: number }>) => void;
  updateCaption: (id: string, patch: Partial<Caption>) => void;
  duplicateCaption: (id: string) => void;
  removeCaption: (id: string) => void;
  applyCaptionStyleToAll: (id: string) => void;

  // stickers
  addSticker: (emoji: string) => void;
  updateSticker: (id: string, patch: Partial<Sticker>) => void;
  duplicateSticker: (id: string) => void;
  removeSticker: (id: string) => void;

  // images
  addImage: (name: string, url: string) => void;
  updateImage: (id: string, patch: Partial<ImageOverlay>) => void;
  duplicateImage: (id: string) => void;
  removeImage: (id: string) => void;

  // markers
  addMarker: (label?: string) => void;
  updateMarker: (id: string, patch: Partial<Marker>) => void;
  removeMarker: (id: string) => void;

  // selection / playback
  selectClip: (id: string | null) => void;
  selectCaption: (id: string | null) => void;
  selectSticker: (id: string | null) => void;
  selectImage: (id: string | null) => void;
  selectAudio: (id: string | null) => void;
  clearSelection: () => void;
  setCurrentTime: (t: number) => void;
  setPlaying: (p: boolean) => void;
  setActiveClipIndex: (i: number) => void;
  setSeekRequest: (t: number | null) => void;
  setVolume: (v: number) => void;

  // timeline
  setTimelineZoom: (z: number) => void;
  setSelectedTool: (t: "select" | "split") => void;
  setSnapEnabled: (v: boolean) => void;

  setStep: (s: EditorStep) => void;
  setVideoTrackLocked: (v: boolean) => void;
  setAudioMuted: (v: boolean) => void;
  setTransitionType: (t: TransitionType) => void;
  setTransitionDuration: (d: number) => void;
  setVideoEffect: (e: VideoEffectType) => void;
  setAspectRatio: (a: AspectRatio) => void;

  // history
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistorySnapshot: () => void;

  // project
  resetProject: () => void;
  hydrateFromJSON: (json: unknown) => void;

  // computed
  totalDuration: () => number;
  clipOffsets: () => number[];
}

interface EditorSnapshot {
  videoClips: VideoClip[];
  audioClips: AudioClip[];
  captions: Caption[];
  stickers: Sticker[];
  images: ImageOverlay[];
  markers: Marker[];
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function defaultCaption(partial: Partial<Caption> = {}): Caption {
  return {
    id: uid(),
    text: partial.text ?? "자막을 입력하세요",
    color: partial.color ?? "#FFFFFF",
    fontFamily: partial.fontFamily ?? "Black Han Sans",
    fontSize: partial.fontSize ?? 48,
    fontWeight: partial.fontWeight ?? 700,
    italic: partial.italic ?? false,
    underline: partial.underline ?? false,
    strikethrough: partial.strikethrough ?? false,
    align: partial.align ?? "center",
    letterSpacing: partial.letterSpacing ?? 0,
    lineHeight: partial.lineHeight ?? 1.2,
    x: partial.x ?? 50,
    y: partial.y ?? 85,
    rotation: partial.rotation ?? 0,
    startTime: partial.startTime ?? 0,
    endTime: partial.endTime ?? 3,
    backgroundColor: partial.backgroundColor ?? "transparent",
    bgPadding: partial.bgPadding ?? 6,
    bgBorderRadius: partial.bgBorderRadius ?? 8,
    strokeColor: partial.strokeColor ?? "#000000",
    strokeWidth: partial.strokeWidth ?? 2,
    shadowColor: partial.shadowColor ?? "rgba(0,0,0,0.7)",
    shadowBlur: partial.shadowBlur ?? 6,
    shadowOffsetX: partial.shadowOffsetX ?? 0,
    shadowOffsetY: partial.shadowOffsetY ?? 2,
    animationIn: partial.animationIn ?? "fade",
    animationOut: partial.animationOut ?? "fade",
    animationDuration: partial.animationDuration ?? 0.4,
  };
}

export function defaultVideoClip(partial: Partial<VideoClip> & { id?: string; name: string; url: string; duration: number }): VideoClip {
  return {
    id: partial.id ?? uid(),
    name: partial.name,
    url: partial.url,
    duration: partial.duration,
    sourceDuration: partial.sourceDuration ?? partial.duration,
    inPoint: partial.inPoint ?? 0,
    outPoint: partial.outPoint ?? partial.duration,
    startTime: partial.startTime ?? 0,
    fileId: partial.fileId,
    speed: partial.speed ?? 1,
    volume: partial.volume ?? 1,
    fadeIn: partial.fadeIn ?? 0,
    fadeOut: partial.fadeOut ?? 0,
  };
}

const EMPTY: EditorSnapshot = {
  videoClips: [], audioClips: [], captions: [], stickers: [], images: [], markers: [],
};

export const useEditorStore = create<EditorState>((set, get) => ({
  historyPast: [],
  historyFuture: [],
  videoClips: [],
  audioClips: [],
  captions: [],
  stickers: [],
  images: [],
  markers: [],

  selectedClipId: null,
  selectedCaptionId: null,
  selectedStickerId: null,
  selectedImageId: null,
  selectedAudioId: null,

  currentTime: 0,
  isPlaying: false,
  activeClipIndex: 0,
  seekRequest: null,
  volume: 1,

  timelineZoom: 80,
  selectedTool: "select",

  step: 1,
  isVideoTrackLocked: false,
  isAudioMuted: false,
  transitionType: "none",
  transitionDuration: 0.4,
  videoEffect: "none",
  aspectRatio: "16:9",
  snapEnabled: true,

  // ── video clips ───────────────────────────────────────────────────────────

  addVideoClip: (clip) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      videoClips: [...state.videoClips, clip],
    })),

  removeVideoClip: (id) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      videoClips: state.videoClips.filter((c) => c.id !== id),
      selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
    })),

  duplicateVideoClip: (id) =>
    set((state) => {
      const idx = state.videoClips.findIndex((c) => c.id === id);
      if (idx === -1) return {};
      const orig = state.videoClips[idx];
      const copy: VideoClip = { ...orig, id: uid() };
      const next = [...state.videoClips];
      next.splice(idx + 1, 0, copy);
      return {
        historyPast: pushHistory(state.historyPast, snapshotOf(state)),
        historyFuture: [],
        videoClips: next,
      };
    }),

  reorderVideoClips: (from, to) =>
    set((state) => {
      const next = [...state.videoClips];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return {
        historyPast: pushHistory(state.historyPast, snapshotOf(state)),
        historyFuture: [],
        videoClips: next,
      };
    }),

  splitClipAtPlayhead: () => {
    const { currentTime, videoClips, clipOffsets } = get();
    const offsets = clipOffsets();
    const idx = offsets.findIndex((off, i) => {
      const end = off + videoClips[i].duration;
      return currentTime >= off && currentTime < end;
    });
    if (idx === -1) return;
    const clip = videoClips[idx];
    const localSplit = currentTime - offsets[idx];
    if (localSplit <= 0.05 || localSplit >= clip.duration - 0.05) return;

    // Source in/out: split at clip.inPoint + localSplit
    const sourceSplit = clip.inPoint + localSplit;
    const first: VideoClip = {
      ...clip,
      id: uid(),
      duration: localSplit,
      outPoint: sourceSplit,
    };
    const second: VideoClip = {
      ...clip,
      id: uid(),
      duration: clip.duration - localSplit,
      inPoint: sourceSplit,
    };
    set((state) => {
      const next = [...state.videoClips];
      next.splice(idx, 1, first, second);
      return {
        historyPast: pushHistory(state.historyPast, snapshotOf(state)),
        historyFuture: [],
        videoClips: next,
      };
    });
  },

  updateVideoClip: (id, patch) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      videoClips: state.videoClips.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  trimClipInPoint: (id, deltaSec) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      videoClips: state.videoClips.map((c) => {
        if (c.id !== id) return c;
        const maxIn = c.outPoint - 0.2;
        const newIn = Math.max(0, Math.min(maxIn, c.inPoint + deltaSec));
        const dur = Math.max(0.2, c.outPoint - newIn);
        return { ...c, inPoint: newIn, duration: dur };
      }),
    })),

  trimClipOutPoint: (id, deltaSec) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      videoClips: state.videoClips.map((c) => {
        if (c.id !== id) return c;
        const max = c.sourceDuration ?? Number.POSITIVE_INFINITY;
        const newOut = Math.max(c.inPoint + 0.2, Math.min(max, c.outPoint + deltaSec));
        const dur = Math.max(0.2, newOut - c.inPoint);
        return { ...c, outPoint: newOut, duration: dur };
      }),
    })),

  // ── audio ─────────────────────────────────────────────────────────────────

  addAudioClip: (clip) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      audioClips: [...state.audioClips, clip],
    })),

  setAudioClipLegacy: (clip) =>
    set((state) => {
      const next = clip ? [{ ...clip, track: 1 as const }] : [];
      // Keep non-track-1 audios (sfx/voiceover) intact.
      const keep = state.audioClips.filter((a) => a.track !== 1 && a.track !== undefined);
      return {
        historyPast: pushHistory(state.historyPast, snapshotOf(state)),
        historyFuture: [],
        audioClips: [...next, ...keep],
      };
    }),

  updateAudioClip: (id, patch) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      audioClips: state.audioClips.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })),

  removeAudioClip: (id) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      audioClips: state.audioClips.filter((a) => a.id !== id),
      selectedAudioId: state.selectedAudioId === id ? null : state.selectedAudioId,
    })),

  // ── captions ──────────────────────────────────────────────────────────────

  addCaption: (partial) =>
    set((state) => {
      const t = get().currentTime;
      const total = get().totalDuration();
      const cap = defaultCaption({
        startTime: t,
        endTime: Math.min(t + 3, total > 0 ? total : t + 3),
        ...partial,
      });
      return {
        historyPast: pushHistory(state.historyPast, snapshotOf(state)),
        historyFuture: [],
        captions: [...state.captions, cap],
        selectedCaptionId: cap.id,
        selectedClipId: null, selectedStickerId: null, selectedImageId: null, selectedAudioId: null,
      };
    }),

  addCaptionsBatch: (list) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      captions: [
        ...state.captions,
        ...list.map((p) => defaultCaption(p)),
      ],
    })),

  updateCaption: (id, patch) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      captions: state.captions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  duplicateCaption: (id) =>
    set((state) => {
      const cap = state.captions.find((c) => c.id === id);
      if (!cap) return {};
      const offset = Math.max(0.5, cap.endTime - cap.startTime);
      const copy: Caption = {
        ...cap,
        id: uid(),
        startTime: cap.endTime,
        endTime: cap.endTime + offset,
      };
      return {
        historyPast: pushHistory(state.historyPast, snapshotOf(state)),
        historyFuture: [],
        captions: [...state.captions, copy],
        selectedCaptionId: copy.id,
      };
    }),

  removeCaption: (id) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      captions: state.captions.filter((c) => c.id !== id),
      selectedCaptionId: state.selectedCaptionId === id ? null : state.selectedCaptionId,
    })),

  applyCaptionStyleToAll: (id) =>
    set((state) => {
      const src = state.captions.find((c) => c.id === id);
      if (!src) return {};
      const styleKeys: Array<keyof Caption> = [
        "color","fontFamily","fontSize","fontWeight","italic","underline","strikethrough",
        "align","letterSpacing","lineHeight","backgroundColor","bgPadding","bgBorderRadius",
        "strokeColor","strokeWidth","shadowColor","shadowBlur","shadowOffsetX","shadowOffsetY",
        "animationIn","animationOut","animationDuration","rotation",
      ];
      return {
        historyPast: pushHistory(state.historyPast, snapshotOf(state)),
        historyFuture: [],
        captions: state.captions.map((c) => {
          if (c.id === id) return c;
          const merged = { ...c };
          for (const k of styleKeys) (merged as any)[k] = (src as any)[k];
          return merged;
        }),
      };
    }),

  // ── stickers ──────────────────────────────────────────────────────────────

  addSticker: (emoji) =>
    set((state) => {
      const sticker: Sticker = {
        id: uid(),
        emoji,
        x: 50, y: 50, size: 64, rotation: 0,
        startTime: get().currentTime,
        endTime: Math.min(get().currentTime + 3, get().totalDuration() || 5),
        animationIn: "fade", animationOut: "fade",
        animationDuration: 0.4,
      };
      return {
        historyPast: pushHistory(state.historyPast, snapshotOf(state)),
        historyFuture: [],
        stickers: [...state.stickers, sticker],
        selectedStickerId: sticker.id,
        selectedClipId: null, selectedCaptionId: null, selectedImageId: null, selectedAudioId: null,
      };
    }),

  updateSticker: (id, patch) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      stickers: state.stickers.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),

  duplicateSticker: (id) =>
    set((state) => {
      const orig = state.stickers.find((s) => s.id === id);
      if (!orig) return {};
      const copy: Sticker = { ...orig, id: uid(), x: Math.min(100, orig.x + 6), y: Math.min(100, orig.y + 6) };
      return {
        historyPast: pushHistory(state.historyPast, snapshotOf(state)),
        historyFuture: [],
        stickers: [...state.stickers, copy],
        selectedStickerId: copy.id,
      };
    }),

  removeSticker: (id) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      stickers: state.stickers.filter((s) => s.id !== id),
      selectedStickerId: state.selectedStickerId === id ? null : state.selectedStickerId,
    })),

  // ── images ────────────────────────────────────────────────────────────────

  addImage: (name, url) =>
    set((state) => {
      const img: ImageOverlay = {
        id: uid(),
        name, url,
        x: 50, y: 50, width: 25, rotation: 0,
        startTime: get().currentTime,
        endTime: Math.min(get().currentTime + 3, get().totalDuration() || 5),
        animationIn: "fade", animationOut: "fade",
        animationDuration: 0.4,
      };
      return {
        historyPast: pushHistory(state.historyPast, snapshotOf(state)),
        historyFuture: [],
        images: [...state.images, img],
        selectedImageId: img.id,
        selectedClipId: null, selectedCaptionId: null, selectedStickerId: null, selectedAudioId: null,
      };
    }),

  updateImage: (id, patch) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      images: state.images.map((img) => (img.id === id ? { ...img, ...patch } : img)),
    })),

  duplicateImage: (id) =>
    set((state) => {
      const orig = state.images.find((i) => i.id === id);
      if (!orig) return {};
      const copy: ImageOverlay = { ...orig, id: uid(), x: Math.min(100, orig.x + 6), y: Math.min(100, orig.y + 6) };
      return {
        historyPast: pushHistory(state.historyPast, snapshotOf(state)),
        historyFuture: [],
        images: [...state.images, copy],
        selectedImageId: copy.id,
      };
    }),

  removeImage: (id) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      images: state.images.filter((img) => img.id !== id),
      selectedImageId: state.selectedImageId === id ? null : state.selectedImageId,
    })),

  // ── markers ───────────────────────────────────────────────────────────────

  addMarker: (label) =>
    set((state) => {
      const m: Marker = {
        id: uid(),
        time: get().currentTime,
        label: label ?? `M${state.markers.length + 1}`,
        color: "#fbbf24",
      };
      return {
        historyPast: pushHistory(state.historyPast, snapshotOf(state)),
        historyFuture: [],
        markers: [...state.markers, m].sort((a, b) => a.time - b.time),
      };
    }),

  updateMarker: (id, patch) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      markers: state.markers.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),

  removeMarker: (id) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      markers: state.markers.filter((m) => m.id !== id),
    })),

  // ── selection / playback ──────────────────────────────────────────────────

  selectClip: (id) =>
    set({ selectedClipId: id, selectedCaptionId: null, selectedStickerId: null, selectedImageId: null, selectedAudioId: null }),
  selectCaption: (id) =>
    set({ selectedCaptionId: id, selectedClipId: null, selectedStickerId: null, selectedImageId: null, selectedAudioId: null }),
  selectSticker: (id) =>
    set({ selectedStickerId: id, selectedClipId: null, selectedCaptionId: null, selectedImageId: null, selectedAudioId: null }),
  selectImage: (id) =>
    set({ selectedImageId: id, selectedClipId: null, selectedCaptionId: null, selectedStickerId: null, selectedAudioId: null }),
  selectAudio: (id) =>
    set({ selectedAudioId: id, selectedClipId: null, selectedCaptionId: null, selectedStickerId: null, selectedImageId: null }),
  clearSelection: () =>
    set({ selectedClipId: null, selectedCaptionId: null, selectedStickerId: null, selectedImageId: null, selectedAudioId: null }),

  setCurrentTime: (t) => set({ currentTime: t }),
  setPlaying: (p) => set({ isPlaying: p }),
  setActiveClipIndex: (i) => set({ activeClipIndex: i }),
  setSeekRequest: (t) => set({ seekRequest: t }),
  setVolume: (v) => set({ volume: Math.max(0, Math.min(2, v)) }),

  setTimelineZoom: (z) =>
    set({ timelineZoom: Math.min(400, Math.max(20, z)) }),

  setSelectedTool: (t) => set({ selectedTool: t }),
  setSnapEnabled: (v) => set({ snapEnabled: v }),

  setStep: (s) => set({ step: s }),
  setVideoTrackLocked: (v) => set({ isVideoTrackLocked: v }),
  setAudioMuted: (v) => set({ isAudioMuted: v }),
  setTransitionType: (t) => set({ transitionType: t }),
  setTransitionDuration: (d) => set({ transitionDuration: Math.max(0.2, Math.min(2.0, d)) }),
  setVideoEffect: (e) => set({ videoEffect: e }),
  setAspectRatio: (a) => set({ aspectRatio: a }),

  undo: () =>
    set((state) => {
      if (state.historyPast.length === 0) return {};
      const prev = state.historyPast[state.historyPast.length - 1];
      const current = snapshotOf(state);
      return {
        historyPast: state.historyPast.slice(0, -1),
        historyFuture: [current, ...state.historyFuture].slice(0, 100),
        ...prev,
      };
    }),
  redo: () =>
    set((state) => {
      if (state.historyFuture.length === 0) return {};
      const next = state.historyFuture[0];
      const current = snapshotOf(state);
      return {
        historyPast: pushHistory(state.historyPast, current),
        historyFuture: state.historyFuture.slice(1),
        ...next,
      };
    }),
  canUndo: () => get().historyPast.length > 0,
  canRedo: () => get().historyFuture.length > 0,
  pushHistorySnapshot: () =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
    })),

  resetProject: () =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      ...EMPTY,
      selectedClipId: null, selectedCaptionId: null, selectedStickerId: null, selectedImageId: null, selectedAudioId: null,
      currentTime: 0, isPlaying: false, activeClipIndex: 0, seekRequest: null,
    })),

  hydrateFromJSON: (json) => {
    if (!json || typeof json !== "object") return;
    const root = json as Record<string, unknown>;
    const project = (root.project ?? root) as Record<string, any>;
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      videoClips: Array.isArray(project.videoClips) ? project.videoClips.map(migrateVideoClip) : [],
      audioClips: Array.isArray(project.audioClips)
        ? project.audioClips
        : project.audioClip ? [project.audioClip] : [],
      captions: Array.isArray(project.captions) ? project.captions.map(migrateCaption) : [],
      stickers: Array.isArray(project.stickers) ? project.stickers.map(migrateSticker) : [],
      images: Array.isArray(project.images) ? project.images.map(migrateImage) : [],
      markers: Array.isArray(project.markers) ? project.markers : [],
      transitionType: project.transitionType ?? "none",
      transitionDuration: project.transitionDuration ?? 0.4,
      videoEffect: project.videoEffect ?? "none",
      aspectRatio: project.aspectRatio ?? "16:9",
      isAudioMuted: project.isAudioMuted ?? false,
      isVideoTrackLocked: project.isVideoTrackLocked ?? false,
      timelineZoom: project.timelineZoom ?? 80,
    }));
  },

  // ── computed ──────────────────────────────────────────────────────────────

  totalDuration: () => get().videoClips.reduce((sum, c) => sum + c.duration, 0),
  clipOffsets: () => {
    const clips = get().videoClips;
    const offsets: number[] = [];
    let t = 0;
    for (const c of clips) { offsets.push(t); t += c.duration; }
    return offsets;
  },
}));

// Legacy convenience: first M1 / unmarked audio (BGM).
export function selectBgmAudio(s: { audioClips: AudioClip[] }): AudioClip | null {
  return s.audioClips.find((a) => a.track === 1 || a.track === undefined) ?? null;
}

// Compatibility helpers when loading older JSON / partial objects.
function migrateVideoClip(v: any): VideoClip {
  return defaultVideoClip({
    id: v.id, name: v.name, url: v.url,
    duration: v.duration ?? 5,
    sourceDuration: v.sourceDuration ?? v.duration,
    inPoint: v.inPoint ?? 0,
    outPoint: v.outPoint ?? v.duration ?? 5,
    startTime: v.startTime ?? 0,
    fileId: v.fileId,
    speed: v.speed ?? 1,
    volume: v.volume ?? 1,
    fadeIn: v.fadeIn ?? 0,
    fadeOut: v.fadeOut ?? 0,
  });
}
function migrateCaption(c: any): Caption {
  return defaultCaption(c);
}
function migrateSticker(s: any): Sticker {
  return {
    id: s.id ?? uid(),
    emoji: s.emoji,
    x: s.x ?? 50, y: s.y ?? 50, size: s.size ?? 64, rotation: s.rotation ?? 0,
    startTime: s.startTime ?? 0, endTime: s.endTime ?? 3,
    animationIn: s.animationIn ?? "fade", animationOut: s.animationOut ?? "fade",
    animationDuration: s.animationDuration ?? 0.4,
  };
}
function migrateImage(i: any): ImageOverlay {
  return {
    id: i.id ?? uid(),
    name: i.name, url: i.url,
    x: i.x ?? 50, y: i.y ?? 50, width: i.width ?? 25, rotation: i.rotation ?? 0,
    startTime: i.startTime ?? 0, endTime: i.endTime ?? 3,
    animationIn: i.animationIn ?? "fade", animationOut: i.animationOut ?? "fade",
    animationDuration: i.animationDuration ?? 0.4,
  };
}

function snapshotOf(state: Pick<EditorState, "videoClips" | "audioClips" | "captions" | "stickers" | "images" | "markers">): EditorSnapshot {
  return {
    videoClips: structuredClone(state.videoClips),
    audioClips: structuredClone(state.audioClips),
    captions: structuredClone(state.captions),
    stickers: structuredClone(state.stickers),
    images: structuredClone(state.images),
    markers: structuredClone(state.markers),
  };
}

function pushHistory(past: EditorSnapshot[], snapshot: EditorSnapshot) {
  const next = [...past, snapshot];
  if (next.length > 100) return next.slice(next.length - 100);
  return next;
}

export function generateId() {
  return uid();
}
