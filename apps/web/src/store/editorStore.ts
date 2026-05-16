"use client";

import { create } from "zustand";
import type {
  AudioClip,
  Caption,
  CaptionColor,
  EditorStep,
  Sticker,
  VideoClip,
  ImageOverlay,
  TransitionType,
  VideoEffectType,
} from "@/types";

interface EditorState {
  historyPast: EditorSnapshot[];
  historyFuture: EditorSnapshot[];
  // clips
  videoClips: VideoClip[];
  audioClip: AudioClip | null;
  captions: Caption[];
  stickers: Sticker[];
  images: ImageOverlay[];

  // selection
  selectedClipId: string | null;
  selectedCaptionId: string | null;
  selectedStickerId: string | null;
  selectedImageId: string | null;

  // playback
  currentTime: number;
  isPlaying: boolean;
  activeClipIndex: number;
  seekRequest: number | null;

  // timeline
  timelineZoom: number;    // px per second
  selectedTool: "select" | "split";

  // ui state
  step: EditorStep;
  isVideoTrackLocked: boolean;
  isAudioMuted: boolean;
  transitionType: TransitionType;
  transitionDuration: number;
  videoEffect: VideoEffectType;

  // clip actions
  addVideoClip: (clip: VideoClip) => void;
  removeVideoClip: (id: string) => void;
  reorderVideoClips: (fromIndex: number, toIndex: number) => void;
  splitClipAtPlayhead: () => void;
  updateVideoClipDuration: (id: string, duration: number) => void;

  // audio
  setAudioClip: (clip: AudioClip | null) => void;

  // captions
  addCaption: (text: string, color: CaptionColor) => void;
  updateCaption: (id: string, patch: Partial<Caption>) => void;
  removeCaption: (id: string) => void;

  // stickers
  addSticker: (emoji: string) => void;
  updateSticker: (id: string, patch: Partial<Sticker>) => void;
  removeSticker: (id: string) => void;

  // images
  addImage: (name: string, url: string) => void;
  updateImage: (id: string, patch: Partial<ImageOverlay>) => void;
  removeImage: (id: string) => void;

  // playback controls
  selectClip: (id: string | null) => void;
  selectCaption: (id: string | null) => void;
  selectSticker: (id: string | null) => void;
  selectImage: (id: string | null) => void;
  setCurrentTime: (t: number) => void;
  setPlaying: (p: boolean) => void;
  setActiveClipIndex: (i: number) => void;
  setSeekRequest: (t: number | null) => void;

  // timeline
  setTimelineZoom: (z: number) => void;
  setSelectedTool: (t: "select" | "split") => void;

  setStep: (s: EditorStep) => void;
  setVideoTrackLocked: (v: boolean) => void;
  setAudioMuted: (v: boolean) => void;
  setTransitionType: (t: TransitionType) => void;
  setTransitionDuration: (d: number) => void;
  setVideoEffect: (e: VideoEffectType) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // computed
  totalDuration: () => number;
  clipOffsets: () => number[];
}

interface EditorSnapshot {
  videoClips: VideoClip[];
  audioClip: AudioClip | null;
  captions: Caption[];
  stickers: Sticker[];
  images: ImageOverlay[];
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useEditorStore = create<EditorState>((set, get) => ({
  historyPast: [],
  historyFuture: [],
  videoClips: [],
  audioClip: null,
  captions: [],
  stickers: [],
  images: [],

  selectedClipId: null,
  selectedCaptionId: null,
  selectedStickerId: null,
  selectedImageId: null,

  currentTime: 0,
  isPlaying: false,
  activeClipIndex: 0,
  seekRequest: null,

  timelineZoom: 80,
  selectedTool: "select",

  step: 1,
  isVideoTrackLocked: false,
  isAudioMuted: false,
  transitionType: "none",
  transitionDuration: 0.4,
  videoEffect: "none",

  // ── clip actions ──────────────────────────────────────────────────────────

  addVideoClip: (clip) =>
    set((state) => {
      const snap = snapshotOf(state);
      return {
        historyPast: pushHistory(state.historyPast, snap),
        historyFuture: [],
        videoClips: [...state.videoClips, clip],
      };
    }),

  removeVideoClip: (id) =>
    set((state) => {
      const snap = snapshotOf(state);
      return {
        historyPast: pushHistory(state.historyPast, snap),
        historyFuture: [],
        videoClips: state.videoClips.filter((c) => c.id !== id),
        selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
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
        videoClips: next
      };
    }),

  splitClipAtPlayhead: () => {
    const { currentTime, videoClips, clipOffsets } = get();
    const offsets = clipOffsets();
    // find which clip the playhead is inside
    const idx = offsets.findIndex((off, i) => {
      const end = off + videoClips[i].duration;
      return currentTime >= off && currentTime < end;
    });
    if (idx === -1) return;
    const clip = videoClips[idx];
    const localSplit = currentTime - offsets[idx];
    if (localSplit <= 0.05 || localSplit >= clip.duration - 0.05) return;
    const first: VideoClip = { ...clip, id: uid(), duration: localSplit };
    const second: VideoClip = { ...clip, id: uid(), duration: clip.duration - localSplit };
    set((state) => {
      const next = [...state.videoClips];
      next.splice(idx, 1, first, second);
      return {
        historyPast: pushHistory(state.historyPast, snapshotOf(state)),
        historyFuture: [],
        videoClips: next
      };
    });
  },
  updateVideoClipDuration: (id, duration) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      videoClips: state.videoClips.map((c) => (c.id === id ? { ...c, duration } : c)),
    })),

  // ── audio ─────────────────────────────────────────────────────────────────

  setAudioClip: (clip) => set((state) => ({
    historyPast: pushHistory(state.historyPast, snapshotOf(state)),
    historyFuture: [],
    audioClip: clip
  })),

  // ── captions ──────────────────────────────────────────────────────────────

  addCaption: (text, color) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      captions: [
        ...state.captions,
        {
          id: uid(),
          text,
          color,
          fontSize: 36,
          x: 50,
          y: 80,
          startTime: get().currentTime,
          endTime: Math.min(get().currentTime + 3, get().totalDuration() || 5),
          fontFamily: "Noto Sans KR",
          backgroundColor: "transparent",
          animationIn: "fade",
          animationOut: "fade",
          animationDuration: 0.4,
        },
      ],
    })),

  updateCaption: (id, patch) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      captions: state.captions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  removeCaption: (id) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      captions: state.captions.filter((c) => c.id !== id),
      selectedCaptionId: state.selectedCaptionId === id ? null : state.selectedCaptionId,
    })),

  // ── stickers ──────────────────────────────────────────────────────────────

  addSticker: (emoji) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      stickers: [
        ...state.stickers,
        {
          id: uid(),
          emoji,
          x: 50,
          y: 50,
          size: 64,
          startTime: get().currentTime,
          endTime: Math.min(get().currentTime + 3, get().totalDuration() || 5),
          animationIn: "fade",
          animationOut: "fade",
          animationDuration: 0.4,
        },
      ],
    })),

  updateSticker: (id, patch) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      stickers: state.stickers.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),

  removeSticker: (id) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      stickers: state.stickers.filter((s) => s.id !== id),
      selectedStickerId: state.selectedStickerId === id ? null : state.selectedStickerId,
    })),

  addImage: (name, url) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      images: [
        ...state.images,
        {
          id: uid(),
          name,
          url,
          x: 50,
          y: 50,
          width: 25,
          startTime: get().currentTime,
          endTime: Math.min(get().currentTime + 3, get().totalDuration() || 5),
          animationIn: "fade",
          animationOut: "fade",
          animationDuration: 0.4,
        },
      ],
    })),

  updateImage: (id, patch) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      images: state.images.map((img) => (img.id === id ? { ...img, ...patch } : img)),
    })),

  removeImage: (id) =>
    set((state) => ({
      historyPast: pushHistory(state.historyPast, snapshotOf(state)),
      historyFuture: [],
      images: state.images.filter((img) => img.id !== id),
      selectedImageId: state.selectedImageId === id ? null : state.selectedImageId,
    })),

  // ── selection / playback ──────────────────────────────────────────────────

  selectClip: (id) =>
    set({ selectedClipId: id, selectedCaptionId: null, selectedStickerId: null, selectedImageId: null }),
  selectCaption: (id) =>
    set({ selectedCaptionId: id, selectedClipId: null, selectedStickerId: null, selectedImageId: null }),
  selectSticker: (id) =>
    set({ selectedStickerId: id, selectedClipId: null, selectedCaptionId: null, selectedImageId: null }),
  selectImage: (id) =>
    set({ selectedImageId: id, selectedClipId: null, selectedCaptionId: null, selectedStickerId: null }),

  setCurrentTime: (t) => set({ currentTime: t }),
  setPlaying: (p) => set({ isPlaying: p }),
  setActiveClipIndex: (i) => set({ activeClipIndex: i }),
  setSeekRequest: (t) => set({ seekRequest: t }),

  setTimelineZoom: (z) =>
    set({ timelineZoom: Math.min(200, Math.max(20, z)) }),

  setSelectedTool: (t) => set({ selectedTool: t }),
  setStep: (s) => set({ step: s }),
  setVideoTrackLocked: (v) => set({ isVideoTrackLocked: v }),
  setAudioMuted: (v) => set({ isAudioMuted: v }),
  setTransitionType: (t) => set({ transitionType: t }),
  setTransitionDuration: (d) => set({ transitionDuration: Math.max(0.2, Math.min(1.5, d)) }),
  setVideoEffect: (e) => set({ videoEffect: e }),

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

  // ── computed ──────────────────────────────────────────────────────────────

  totalDuration: () =>
    get().videoClips.reduce((sum, c) => sum + c.duration, 0),

  clipOffsets: () => {
    const clips = get().videoClips;
    const offsets: number[] = [];
    let t = 0;
    for (const c of clips) {
      offsets.push(t);
      t += c.duration;
    }
    return offsets;
  },
}));

function snapshotOf(state: Pick<EditorState, "videoClips" | "audioClip" | "captions" | "stickers" | "images">): EditorSnapshot {
  return {
    videoClips: structuredClone(state.videoClips),
    audioClip: structuredClone(state.audioClip),
    captions: structuredClone(state.captions),
    stickers: structuredClone(state.stickers),
    images: structuredClone(state.images),
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
