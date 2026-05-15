"use client";

import { create } from "zustand";
import type {
  AudioClip,
  Caption,
  CaptionColor,
  EditorStep,
  Sticker,
  VideoClip,
} from "@/types";

interface EditorState {
  videoClips: VideoClip[];
  audioClip: AudioClip | null;
  captions: Caption[];
  stickers: Sticker[];
  selectedClipId: string | null;
  currentTime: number;
  isPlaying: boolean;
  step: EditorStep;

  addVideoClip: (clip: VideoClip) => void;
  removeVideoClip: (id: string) => void;
  reorderVideoClips: (fromIndex: number, toIndex: number) => void;
  splitClip: (id: string, splitAt: number) => void;

  setAudioClip: (clip: AudioClip | null) => void;

  addCaption: (text: string, color: CaptionColor) => void;
  updateCaption: (id: string, patch: Partial<Caption>) => void;
  removeCaption: (id: string) => void;

  addSticker: (emoji: string) => void;
  updateSticker: (id: string, patch: Partial<Sticker>) => void;
  removeSticker: (id: string) => void;

  selectClip: (id: string | null) => void;
  setCurrentTime: (t: number) => void;
  setPlaying: (p: boolean) => void;
  setStep: (s: EditorStep) => void;

  totalDuration: () => number;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useEditorStore = create<EditorState>((set, get) => ({
  videoClips: [],
  audioClip: null,
  captions: [],
  stickers: [],
  selectedClipId: null,
  currentTime: 0,
  isPlaying: false,
  step: 1,

  addVideoClip: (clip) =>
    set((state) => ({
      videoClips: [...state.videoClips, clip],
      step: state.step === 1 ? 2 : state.step,
    })),

  removeVideoClip: (id) =>
    set((state) => ({
      videoClips: state.videoClips.filter((c) => c.id !== id),
      selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
    })),

  reorderVideoClips: (fromIndex, toIndex) =>
    set((state) => {
      const next = [...state.videoClips];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { videoClips: next };
    }),

  splitClip: (id, splitAt) =>
    set((state) => {
      const idx = state.videoClips.findIndex((c) => c.id === id);
      if (idx === -1) return state;
      const clip = state.videoClips[idx];
      const local = splitAt - clip.startTime;
      if (local <= 0.1 || local >= clip.duration - 0.1) return state;
      const first: VideoClip = {
        ...clip,
        id: uid(),
        duration: local,
      };
      const second: VideoClip = {
        ...clip,
        id: uid(),
        duration: clip.duration - local,
      };
      const next = [...state.videoClips];
      next.splice(idx, 1, first, second);
      return { videoClips: next };
    }),

  setAudioClip: (clip) => set({ audioClip: clip }),

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
          startTime: 0,
          endTime: get().totalDuration() || 5,
        },
      ],
    })),

  updateCaption: (id, patch) =>
    set((state) => ({
      captions: state.captions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  removeCaption: (id) =>
    set((state) => ({ captions: state.captions.filter((c) => c.id !== id) })),

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
          startTime: 0,
          endTime: get().totalDuration() || 5,
        },
      ],
    })),

  updateSticker: (id, patch) =>
    set((state) => ({
      stickers: state.stickers.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),

  removeSticker: (id) =>
    set((state) => ({ stickers: state.stickers.filter((s) => s.id !== id) })),

  selectClip: (id) => set({ selectedClipId: id }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setPlaying: (p) => set({ isPlaying: p }),
  setStep: (s) => set({ step: s }),

  totalDuration: () =>
    get().videoClips.reduce((sum, c) => sum + c.duration, 0),
}));

export function generateId() {
  return uid();
}
