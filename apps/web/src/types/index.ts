export interface VideoClip {
  id: string;
  name: string;
  url: string;
  duration: number;
  startTime: number;
  fileId?: string;
}

export interface AudioClip {
  id: string;
  name: string;
  url: string;
  duration: number;
  isPreset?: boolean;
}

export type CaptionColor =
  | "#000000"
  | "#FFFFFF"
  | "#FF4D4D"
  | "#3D8BFF"
  | "#FFD93D"
  | "#4CD964";

export interface Caption {
  id: string;
  text: string;
  color: CaptionColor;
  fontSize: number;
  x: number;
  y: number;
  startTime: number;
  endTime: number;
  fontFamily: string;
  backgroundColor: string;
  animationIn: "none" | "fade";
  animationOut: "none" | "fade";
  animationDuration: number;
}

export interface ImageOverlay {
  id: string;
  name: string;
  url: string;
  x: number;
  y: number;
  width: number;
  startTime: number;
  endTime: number;
  animationIn: "none" | "fade";
  animationOut: "none" | "fade";
  animationDuration: number;
}

export interface Sticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  startTime: number;
  endTime: number;
  animationIn: "none" | "fade";
  animationOut: "none" | "fade";
  animationDuration: number;
}

export type EditorStep = 1 | 2 | 3;
export type TransitionType = "none" | "fade";
export type VideoEffectType = "none" | "vintage" | "bright" | "bw";
