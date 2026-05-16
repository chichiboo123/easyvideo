"use client";

export function downloadProjectFile(state: {
  [key: string]: unknown;
  videoClips: unknown[];
  audioClip: unknown;
  captions: unknown[];
  stickers: unknown[];
  images: unknown[];
  transitionType: unknown;
  transitionDuration: unknown;
  videoEffect: unknown;
  isAudioMuted: boolean;
  isVideoTrackLocked: boolean;
  timelineZoom: number;
}) {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    project: {
      videoClips: state.videoClips,
      audioClip: state.audioClip,
      captions: state.captions,
      stickers: state.stickers,
      images: state.images,
      transitionType: state.transitionType,
      transitionDuration: state.transitionDuration,
      videoEffect: state.videoEffect,
      isAudioMuted: state.isAudioMuted,
      isVideoTrackLocked: state.isVideoTrackLocked,
      timelineZoom: state.timelineZoom,
    },
  };

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
