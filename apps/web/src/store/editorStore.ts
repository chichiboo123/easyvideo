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
} from "@/types";

interface EditorState {
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

  // clip actions
  addVideoClip: (clip: VideoClip) => void;
  removeVideoClip: (id: string) => void;
  reorderVideoClips: (fromIndex: number, toIndex: number) => void;
  splitClipAtPlayhead: () => void;

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

  // computed
  totalDuration: () => number;
  clipOffsets: () => number[];
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useEditorStore = create<EditorState>((set, get) => ({
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

  // ── clip actions ──────────────────────────────────────────────────────────

  addVideoClip: (clip) =>
    set((state) => ({
      videoClips: [...state.videoClips, clip],
    })),

  removeVideoClip: (id) =>
    set((state) => ({
      videoClips: state.videoClips.filter((c) => c.id !== id),
      selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
    })),

  reorderVideoClips: (from, to) =>
    set((state) => {
      const next = [...state.videoClips];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { videoClips: next };
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
      return { videoClips: next };
    });
  },

  // ── audio ─────────────────────────────────────────────────────────────────

  setAudioClip: (clip) => set({ audioClip: clip }),

  // ── captions ──────────────────────────────────────────────────────────────

  addCaption: (text, color) =>
    set((state) => ({
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
      captions: state.captions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  removeCaption: (id) =>
    set((state) => ({
      captions: state.captions.filter((c) => c.id !== id),
      selectedCaptionId: state.selectedCaptionId === id ? null : state.selectedCaptionId,
    })),

  // ── stickers ──────────────────────────────────────────────────────────────

  addSticker: (emoji) =>
    set((state) => ({
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
      stickers: state.stickers.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),

  removeSticker: (id) =>
    set((state) => ({
      stickers: state.stickers.filter((s) => s.id !== id),
      selectedStickerId: state.selectedStickerId === id ? null : state.selectedStickerId,
    })),

  addImage: (name, url) =>
    set((state) => ({
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
      images: state.images.map((img) => (img.id === id ? { ...img, ...patch } : img)),
    })),

  removeImage: (id) =>
    set((state) => ({
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

export function generateId() {
  return uid();
}
