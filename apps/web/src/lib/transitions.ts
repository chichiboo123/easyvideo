import type { TransitionType } from "@/types";

// Catalog of scene transitions. Every entry maps 1:1 to an FFmpeg `xfade`
// transition name so what you pick is what gets exported.
export interface TransitionSpec {
  value: TransitionType;
  label: string;       // Korean UI label
  xfade: string;       // ffmpeg xfade transition name
  group: "기본" | "슬라이드" | "와이프" | "도형" | "특수";
}

export const TRANSITIONS: TransitionSpec[] = [
  { value: "none",        label: "없음 (컷)",     xfade: "fade",        group: "기본" },
  { value: "fade",        label: "페이드",        xfade: "fade",        group: "기본" },
  { value: "fadeblack",   label: "검정 페이드",   xfade: "fadeblack",   group: "기본" },
  { value: "fadewhite",   label: "흰색 페이드",   xfade: "fadewhite",   group: "기본" },
  { value: "dissolve",    label: "디졸브",        xfade: "dissolve",    group: "기본" },

  { value: "slide-left",  label: "슬라이드 ←",    xfade: "slideleft",   group: "슬라이드" },
  { value: "slide-right", label: "슬라이드 →",    xfade: "slideright",  group: "슬라이드" },
  { value: "slide-up",    label: "슬라이드 ↑",    xfade: "slideup",     group: "슬라이드" },
  { value: "slide-down",  label: "슬라이드 ↓",    xfade: "slidedown",   group: "슬라이드" },
  { value: "smoothleft",  label: "부드러운 밀기", xfade: "smoothleft",  group: "슬라이드" },

  { value: "wipe-left",   label: "와이프 ←",      xfade: "wipeleft",    group: "와이프" },
  { value: "wipe-right",  label: "와이프 →",      xfade: "wiperight",   group: "와이프" },
  { value: "wipe-up",     label: "와이프 ↑",      xfade: "wipeup",      group: "와이프" },
  { value: "wipe-down",   label: "와이프 ↓",      xfade: "wipedown",    group: "와이프" },

  { value: "circleopen",  label: "원형 열림",     xfade: "circleopen",  group: "도형" },
  { value: "circleclose", label: "원형 닫힘",     xfade: "circleclose", group: "도형" },
  { value: "radial",      label: "시계 와이프",   xfade: "radial",      group: "도형" },

  { value: "pixelize",    label: "픽셀화",        xfade: "pixelize",    group: "특수" },
  { value: "zoomin",      label: "줌 인",         xfade: "zoomin",      group: "특수" },
];

export function transitionLabel(t: TransitionType): string {
  return TRANSITIONS.find((x) => x.value === t)?.label ?? t;
}

export function transitionXfadeName(t: TransitionType): string {
  return TRANSITIONS.find((x) => x.value === t)?.xfade ?? "fade";
}

// Resolve the effective transition at the boundary AFTER clip `i`:
// per-clip override first, then the project-wide default.
export function resolveTransition(
  clipOverride: TransitionType | null | undefined,
  globalDefault: TransitionType,
): TransitionType {
  return clipOverride ?? globalDefault;
}

export const TRANSITION_GROUPS = ["기본", "슬라이드", "와이프", "도형", "특수"] as const;
