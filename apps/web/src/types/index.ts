export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "original";

export interface VideoClip {
  id: string;
  name: string;
  url: string;
  duration: number;        // current displayed duration on timeline
  sourceDuration?: number; // original source duration
  inPoint: number;         // start time within source (sec)
  outPoint: number;        // end time within source (sec)
  startTime: number;
  fileId?: string;

  // CapCut-style per-clip controls
  speed: number;           // 0.25 ~ 4
  volume: number;          // 0 ~ 2 (0 = mute)
  fadeIn: number;          // sec
  fadeOut: number;         // sec

  // Transform within the frame (CapCut "편집/크롭" style)
  zoom: number;            // 1 = fit, >1 = zoom in (crop)
  offsetX: number;         // -50 ~ 50 (% of frame, pan; only meaningful with zoom>1)
  offsetY: number;         // -50 ~ 50
  rotate: number;          // -180 ~ 180 deg
  flipH: boolean;          // mirror horizontally
  flipV: boolean;          // mirror vertically

  // Per-clip color adjustment (0~200, 100 = neutral)
  brightness: number;
  contrast: number;
  saturation: number;

  // Reverse playback (applied on export; preview shows a badge)
  reverse: boolean;

  // Transition between this clip and the NEXT one.
  // undefined/null = follow the global default transition.
  transitionAfter?: TransitionType | null;
}

export interface AudioClip {
  id: string;
  name: string;
  url: string;
  duration: number;
  isPreset?: boolean;
  track?: 1 | 2 | 3;       // M1=BGM, M2=SFX, M3=Voiceover
  startTime?: number;      // sec offset on timeline
  volume?: number;         // 0 ~ 2
  fadeIn?: number;
  fadeOut?: number;
}

export type CaptionAnimation =
  | "none" | "fade"
  | "slide-up" | "slide-down" | "slide-left" | "slide-right"
  | "zoom-in" | "zoom-out"
  | "bounce" | "pop" | "typewriter"
  | "shake" | "blink";

export type CaptionAlign = "left" | "center" | "right";

export interface Caption {
  id: string;
  text: string;
  startTime: number;
  endTime: number;

  // Position & rotation
  x: number;               // %
  y: number;               // %
  rotation: number;        // deg
  align: CaptionAlign;

  // Typography
  color: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;      // 100~900
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  letterSpacing: number;   // px
  lineHeight: number;      // factor (1.0 ~ 2.0)

  // Background bubble
  backgroundColor: string; // "transparent" or hex
  bgPadding: number;       // px
  bgBorderRadius: number;  // px

  // Stroke (outline)
  strokeColor: string;
  strokeWidth: number;     // px

  // Shadow
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;

  // Animation
  animationIn: CaptionAnimation;
  animationOut: CaptionAnimation;
  animationDuration: number;
}

export interface ImageOverlay {
  id: string;
  name: string;
  url: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
  startTime: number;
  endTime: number;
  animationIn: "none" | "fade" | "slide-up" | "slide-down" | "zoom-in";
  animationOut: "none" | "fade" | "zoom-out";
  animationDuration: number;
}

export interface Sticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  startTime: number;
  endTime: number;
  animationIn: "none" | "fade" | "bounce" | "zoom-in";
  animationOut: "none" | "fade" | "zoom-out";
  animationDuration: number;
}

export type ShapeKind = "rect" | "ellipse" | "triangle" | "line";

export interface Shape {
  id: string;
  kind: ShapeKind;
  x: number;               // center %, like other overlays
  y: number;
  width: number;           // % of frame width
  height: number;          // % of frame height
  rotation: number;        // deg
  fillColor: string;       // "transparent" or hex
  strokeColor: string;
  strokeWidth: number;     // px (720p reference)
  opacity: number;         // 0 ~ 1
  startTime: number;
  endTime: number;
  animationIn: "none" | "fade" | "slide-up" | "slide-down" | "zoom-in" | "pop";
  animationOut: "none" | "fade" | "zoom-out";
  animationDuration: number;
}

export interface Marker {
  id: string;
  time: number;
  label: string;
  color: string;
}

// Letterbox/pillarbox fill when the clip doesn't match the export aspect ratio.
// "black" | "blur" | any hex color string.
export type BackgroundFill = "black" | "blur" | string;

export type EditorStep = 1 | 2 | 3;

// All transitions are backed by FFmpeg's xfade filter so the preview and
// the exported file stay in sync. "none" is a hard cut.
export type TransitionType =
  | "none"
  | "fade" | "fadeblack" | "fadewhite" | "dissolve"
  | "slide-left" | "slide-right" | "slide-up" | "slide-down"
  | "wipe-left" | "wipe-right" | "wipe-up" | "wipe-down"
  | "circleopen" | "circleclose" | "radial"
  | "smoothleft" | "pixelize" | "zoomin";
export type VideoEffectType =
  | "none" | "vintage" | "bright" | "bw"
  | "warm" | "cool" | "blur" | "vignette";

export type ExportQuality = "preview" | "720p" | "1080p" | "original";
