"use client";

import { useMemo, useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { TRANSITIONS, TRANSITION_GROUPS, transitionLabel, resolveTransition } from "@/lib/transitions";
import Waveform from "./Waveform";
import MIcon from "./MIcon";
import type { TransitionType } from "@/types";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatRulerTime(sec: number, interval: number) {
  if (interval >= 1) return formatTime(sec);
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(interval >= 0.5 ? 1 : 2).padStart(interval >= 0.5 ? 4 : 5, "0");
  return `${m}:${s}`;
}

function getRulerInterval(pxPerSec: number): number {
  if (pxPerSec >= 320) return 0.25;
  if (pxPerSec >= 160) return 0.5;
  if (pxPerSec >= 60) return 1;
  if (pxPerSec >= 30) return 2;
  if (pxPerSec >= 15) return 5;
  return 10;
}

const TRACK_HEADER_W = 80;
const MIN_CONTENT_W = 800;
const SNAP_PX = 8;

export default function ProTimeline() {
  const videoClips = useEditorStore((s) => s.videoClips);
  const audioClips = useEditorStore((s) => s.audioClips);
  const captions = useEditorStore((s) => s.captions);
  const stickers = useEditorStore((s) => s.stickers);
  const images = useEditorStore((s) => s.images);
  const shapes = useEditorStore((s) => s.shapes);
  const markers = useEditorStore((s) => s.markers);
  const currentTime = useEditorStore((s) => s.currentTime);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const selectedCaptionId = useEditorStore((s) => s.selectedCaptionId);
  const selectedStickerId = useEditorStore((s) => s.selectedStickerId);
  const selectedImageId = useEditorStore((s) => s.selectedImageId);
  const selectedShapeId = useEditorStore((s) => s.selectedShapeId);
  const selectedAudioId = useEditorStore((s) => s.selectedAudioId);
  const timelineZoom = useEditorStore((s) => s.timelineZoom);
  const totalDuration = useEditorStore((s) => s.totalDuration);
  const isVideoTrackLocked = useEditorStore((s) => s.isVideoTrackLocked);
  const transitionType = useEditorStore((s) => s.transitionType);
  const transitionDuration = useEditorStore((s) => s.transitionDuration);
  const setTransitionType = useEditorStore((s) => s.setTransitionType);
  const setTransitionDuration = useEditorStore((s) => s.setTransitionDuration);
  const videoEffect = useEditorStore((s) => s.videoEffect);
  const setVideoEffect = useEditorStore((s) => s.setVideoEffect);
  const snapEnabled = useEditorStore((s) => s.snapEnabled);
  const setSnapEnabled = useEditorStore((s) => s.setSnapEnabled);

  const selectClip = useEditorStore((s) => s.selectClip);
  const selectCaption = useEditorStore((s) => s.selectCaption);
  const selectSticker = useEditorStore((s) => s.selectSticker);
  const selectImage = useEditorStore((s) => s.selectImage);
  const selectShape = useEditorStore((s) => s.selectShape);
  const selectAudio = useEditorStore((s) => s.selectAudio);
  const updateCaption = useEditorStore((s) => s.updateCaption);
  const updateImage = useEditorStore((s) => s.updateImage);
  const updateShape = useEditorStore((s) => s.updateShape);
  const updateSticker = useEditorStore((s) => s.updateSticker);
  const updateVideoClip = useEditorStore((s) => s.updateVideoClip);
  const updateAudioClip = useEditorStore((s) => s.updateAudioClip);
  const splitClipAtPlayhead = useEditorStore((s) => s.splitClipAtPlayhead);
  const setTimelineZoom = useEditorStore((s) => s.setTimelineZoom);
  const setActiveClipIndex = useEditorStore((s) => s.setActiveClipIndex);
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime);
  const setSeekRequest = useEditorStore((s) => s.setSeekRequest);
  const setPlaying = useEditorStore((s) => s.setPlaying);
  const removeMarker = useEditorStore((s) => s.removeMarker);

  const bodyRef = useRef<HTMLDivElement>(null);
  const dragSrcIdx = useRef<number | null>(null);

  // Per-boundary transition picker (badge between clip i and i+1).
  const [openBoundary, setOpenBoundary] = useState<number | null>(null);

  const pxPerSec = timelineZoom;
  const total = totalDuration();
  const contentW = Math.max(total * pxPerSec + 400, MIN_CONTENT_W);

  const clipOffsets = useMemo(() => {
    let t = 0;
    return videoClips.map((c) => { const off = t; t += c.duration; return off; });
  }, [videoClips]);

  const snapTargets = useMemo(() => {
    const set: number[] = [];
    clipOffsets.forEach((o) => set.push(o));
    clipOffsets.forEach((o, i) => set.push(o + videoClips[i].duration));
    markers.forEach((m) => set.push(m.time));
    set.push(currentTime);
    return Array.from(new Set(set)).sort((a, b) => a - b);
  }, [clipOffsets, videoClips, markers, currentTime]);

  function applySnap(t: number, exclude?: number): number {
    if (!snapEnabled) return t;
    const tolerance = SNAP_PX / pxPerSec;
    let best = t, bestDelta = tolerance;
    for (const target of snapTargets) {
      if (exclude !== undefined && Math.abs(target - exclude) < 0.001) continue;
      const d = Math.abs(target - t);
      if (d < bestDelta) { best = target; bestDelta = d; }
    }
    return best;
  }

  const interval = getRulerInterval(pxPerSec);
  const markCount = Math.ceil((contentW - TRACK_HEADER_W) / pxPerSec / interval) + 2;
  const rulerMarks = Array.from({ length: markCount }, (_, i) => i * interval);

  // Convert a mouse position to timeline seconds (scroll-safe: always
  // measured against the scroll container, not the scrolled content).
  function clientXToTime(clientX: number): number | null {
    const body = bodyRef.current;
    if (!body) return null;
    const rect = body.getBoundingClientRect();
    const x = clientX - rect.left + body.scrollLeft - TRACK_HEADER_W;
    if (x < 0) return null;
    return Math.max(0, Math.min(total, x / pxPerSec));
  }

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest(".track-header, .ruler-left-pad")) return;
    const t = clientXToTime(e.clientX);
    if (t === null) return;
    seekToGlobal(applySnap(t));
  }

  // Pointer-based scrubbing — works for mouse, touch and pen. Used by both the
  // ruler and the playhead so the pink line can be dragged anywhere.
  function startScrub(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest(".track-header, .ruler-left-pad")) return;
    e.preventDefault();
    const seek = (clientX: number) => {
      const t = clientXToTime(clientX);
      if (t !== null) seekToGlobal(applySnap(t));
    };
    seek(e.clientX);
    const onMove = (ev: PointerEvent) => { ev.preventDefault(); seek(ev.clientX); };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  function seekToGlobal(t: number) {
    if (isPlaying) setPlaying(false);
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
    setCurrentTime(t);
  }

  // Clamp so the playhead never renders past the clips into empty space.
  const playheadX = TRACK_HEADER_W + Math.max(0, Math.min(total, currentTime)) * pxPerSec;

  // Group audios by track
  const audiosByTrack: Record<number, typeof audioClips> = { 1: [], 2: [], 3: [] };
  for (const a of audioClips) {
    const t = a.track ?? 1;
    audiosByTrack[t].push(a);
  }

  return (
    <section className="timeline" aria-label="타임라인">
      {/* Timeline toolbar */}
      <div className="timeline-toolbar">
        <button type="button" className="tl-btn tl-btn-primary"
          onClick={splitClipAtPlayhead}
          disabled={videoClips.length === 0 || isVideoTrackLocked}
          aria-label="재생 위치에서 분할"
          title="현재 위치에서 분할 (S)"
        >
          <MIcon name="content_cut" size={15} />
          분할
        </button>

        <span className="tl-divider" aria-hidden="true" />

        <select value={transitionType}
          onChange={(e) => setTransitionType(e.target.value as TransitionType)}
          className="tl-select"
          aria-label="기본 장면 전환 효과"
          title="모든 클립 사이에 적용되는 기본 전환입니다. 타임라인의 ◇ 배지를 클릭하면 구간별로 다르게 바꿀 수 있어요."
        >
          {TRANSITION_GROUPS.map((g) => (
            <optgroup key={g} label={g}>
              {TRANSITIONS.filter((t) => t.group === g).map((t) => (
                <option key={t.value} value={t.value}>전환: {t.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <select
          value={transitionDuration}
          onChange={(e) => setTransitionDuration(Number(e.target.value))}
          className="tl-select"
          style={{ maxWidth: 76 }}
          aria-label="전환 길이"
          title="전환 효과 길이 (초)"
        >
          {[0.2, 0.3, 0.4, 0.6, 0.8, 1.0, 1.5, 2.0].map((d) => (
            <option key={d} value={d}>{d.toFixed(1)}초</option>
          ))}
        </select>
        <select value={videoEffect}
          onChange={(e) => setVideoEffect(e.target.value as any)}
          className="tl-select"
          aria-label="영상 효과"
          title="영상 필터 효과"
        >
          <option value="none">효과 없음</option>
          <option value="vintage">효과: 빈티지</option>
          <option value="bright">효과: 화사</option>
          <option value="bw">효과: 흑백</option>
          <option value="warm">효과: 따뜻</option>
          <option value="cool">효과: 차가움</option>
          <option value="blur">효과: 블러</option>
          <option value="vignette">효과: 비네트</option>
        </select>

        <button type="button"
          className={`tl-icon-btn ${snapEnabled ? "on" : ""}`}
          onClick={() => setSnapEnabled(!snapEnabled)}
          aria-pressed={snapEnabled}
          title="스냅 (자석)"
        >
          <MIcon name="push_pin" size={16} fill={snapEnabled} />
        </button>

        <div className="timeline-spacer" />

        {/* Zoom + time on the right */}
        <button type="button" className="tl-icon-btn" onClick={() => setTimelineZoom(pxPerSec - 20)} aria-label="축소" title="축소 (-)">
          <MIcon name="zoom_out" size={17} />
        </button>
        <input type="range" min={20} max={400} step={10}
          value={pxPerSec}
          onChange={(e) => setTimelineZoom(Number(e.target.value))}
          className="tl-zoom-range"
          aria-label="타임라인 배율"
          title={`타임라인 ${Math.round(pxPerSec / 80 * 100)}%`}
        />
        <button type="button" className="tl-icon-btn" onClick={() => setTimelineZoom(pxPerSec + 20)} aria-label="확대" title="확대 (+)">
          <MIcon name="zoom_in" size={17} />
        </button>

        <span className="tl-divider" aria-hidden="true" />
        <span className="tl-time-display" aria-label="현재 / 전체 시간">
          {formatTime(currentTime)} / {formatTime(total)}
        </span>
      </div>

      {/* Scrollable body */}
      <div className="timeline-body" ref={bodyRef}>
        <div className="timeline-content" style={{ width: contentW }}>

          {/* Ruler */}
          <div className="ruler" onClick={handleTrackClick} onPointerDown={startScrub}>
            <div className="ruler-left-pad" />
            <div className="ruler-marks" style={{ width: contentW - TRACK_HEADER_W }}>
              {rulerMarks.map((t) => (
                <div key={t} className="ruler-mark" style={{ left: t * pxPerSec }}>
                  <span className="ruler-mark-label">{formatRulerTime(t, interval)}</span>
                  <div className="ruler-mark-line" />
                </div>
              ))}
              {/* Markers */}
              {markers.map((m) => (
                <div key={m.id} className="ruler-marker" style={{ left: m.time * pxPerSec }}
                  title={`${m.label} (${formatTime(m.time)})`}
                  onClick={(e) => { e.stopPropagation(); seekToGlobal(m.time); }}
                  onDoubleClick={(e) => { e.stopPropagation(); removeMarker(m.id); }}
                >
                  <span className="ruler-marker-pin" style={{ background: m.color }} />
                  <span className="ruler-marker-label">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Playhead — draggable anywhere along the line (mouse + touch) */}
          <div className="playhead" style={{ left: playheadX }}
            onPointerDown={startScrub}
            aria-hidden="true"
          >
            <div className="playhead-grab" />
            <div className="playhead-handle" />
          </div>

          {/* Video track V1 */}
          <div className="track-row" onClick={handleTrackClick} aria-label="비디오 트랙">
            <div className="track-header">
              <MIcon name="movie" size={15} />
              V1
            </div>
            <div className="track-body">
              {videoClips.map((clip, idx) => {
                const left = clipOffsets[idx] * pxPerSec;
                const width = Math.max(clip.duration * pxPerSec - 2, 20);
                return (
                  <div key={clip.id}
                    className={`clip-block clip-video ${selectedClipId === clip.id ? "selected" : ""}`}
                    style={{ left, width }}
                    onClick={(e) => { e.stopPropagation(); selectClip(clip.id); }}
                    draggable={!isVideoTrackLocked}
                    onDragStart={() => { if (!isVideoTrackLocked) dragSrcIdx.current = idx; }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      if (!isVideoTrackLocked && dragSrcIdx.current !== null && dragSrcIdx.current !== idx) {
                        useEditorStore.getState().reorderVideoClips(dragSrcIdx.current, idx);
                      }
                      dragSrcIdx.current = null;
                    }}
                    role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") selectClip(clip.id); }}
                    aria-label={`${clip.name} 비디오 클립, ${formatTime(clip.duration)}`}
                    aria-pressed={selectedClipId === clip.id}
                    title={`${clip.name} (${formatTime(clip.duration)}) — 양 끝을 드래그해 트림, 본체를 드래그해 순서 변경`}
                  >
                    <span className="clip-label">{clip.name}{clip.speed !== 1 ? ` · ${clip.speed}×` : ""}</span>
                    {!isVideoTrackLocked && (
                      <>
                        <span className="clip-edge-handle left" onMouseDown={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          const startX = e.clientX;
                          const origIn = clip.inPoint;
                          const onMove = (ev: MouseEvent) => {
                            const delta = (ev.clientX - startX) / pxPerSec;
                            const newIn = Math.max(0, Math.min(clip.outPoint - 0.2, origIn + delta));
                            updateVideoClip(clip.id, { inPoint: newIn, duration: clip.outPoint - newIn });
                          };
                          const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                          window.addEventListener("mousemove", onMove);
                          window.addEventListener("mouseup", onUp);
                        }} />
                        <span className="clip-edge-handle right" onMouseDown={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          const startX = e.clientX;
                          const origOut = clip.outPoint;
                          const maxOut = clip.sourceDuration ?? Number.POSITIVE_INFINITY;
                          const onMove = (ev: MouseEvent) => {
                            const delta = (ev.clientX - startX) / pxPerSec;
                            const newOut = Math.max(clip.inPoint + 0.2, Math.min(maxOut, origOut + delta));
                            updateVideoClip(clip.id, { outPoint: newOut, duration: newOut - clip.inPoint });
                          };
                          const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                          window.addEventListener("mousemove", onMove);
                          window.addEventListener("mouseup", onUp);
                        }} />
                      </>
                    )}
                  </div>
                );
              })}

              {/* Transition badges between adjacent clips (click to change per boundary) */}
              {videoClips.slice(0, -1).map((clip, idx) => {
                const boundary = (clipOffsets[idx] + clip.duration) * pxPerSec;
                const resolved = resolveTransition(clip.transitionAfter, transitionType);
                const isCut = resolved === "none";
                return (
                  <div key={`tr-${clip.id}`}>
                    <button type="button"
                      className={`transition-badge ${isCut ? "is-cut" : ""} ${clip.transitionAfter != null ? "is-custom" : ""}`}
                      style={{ left: boundary }}
                      onClick={(e) => { e.stopPropagation(); setOpenBoundary(openBoundary === idx ? null : idx); }}
                      title={`장면 전환: ${transitionLabel(resolved)}${clip.transitionAfter != null ? " (이 구간만)" : " (기본값)"} — 클릭해서 변경`}
                      aria-label={`${clip.name} 다음 장면 전환 ${transitionLabel(resolved)} 변경`}
                    >
                      {isCut ? (
                        <MIcon name="content_cut" size={11} />
                      ) : (
                        <MIcon name="sync_alt" size={12} />
                      )}
                    </button>
                    {openBoundary === idx && (
                      <>
                        <div className="transition-popover-backdrop" onClick={(e) => { e.stopPropagation(); setOpenBoundary(null); }} />
                        <div className="transition-popover" style={{ left: Math.max(0, boundary - 90) }} onClick={(e) => e.stopPropagation()}>
                          <div className="transition-popover-title">
                            {clip.name} → {videoClips[idx + 1]?.name}
                          </div>
                          <button type="button"
                            className={`transition-popover-item ${clip.transitionAfter == null ? "active" : ""}`}
                            onClick={() => { updateVideoClip(clip.id, { transitionAfter: null }); setOpenBoundary(null); }}
                          >
                            ★ 기본값 따르기 ({transitionLabel(transitionType)})
                          </button>
                          <div className="transition-popover-grid">
                            {TRANSITIONS.map((t) => (
                              <button key={t.value} type="button"
                                className={`transition-popover-item ${clip.transitionAfter === t.value ? "active" : ""}`}
                                onClick={() => { updateVideoClip(clip.id, { transitionAfter: t.value }); setOpenBoundary(null); }}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audio tracks M1/M2/M3 */}
          {([1, 2, 3] as const).map((trackNum) => (
            <div key={`m${trackNum}`} className="track-row" onClick={handleTrackClick} aria-label={`오디오 트랙 M${trackNum}`}>
              <div className="track-header">
                <MIcon name="music_note" size={15} />
                M{trackNum}
              </div>
              <div className="track-body">
                {(audiosByTrack[trackNum] ?? []).map((a) => {
                  const left = (a.startTime ?? 0) * pxPerSec;
                  const width = Math.max((a.duration || total || 10) * pxPerSec - 2, 40);
                  return (
                    <div key={a.id}
                      className={`clip-block clip-audio ${selectedAudioId === a.id ? "selected" : ""}`}
                      style={{ left, width }}
                      onClick={(e) => { e.stopPropagation(); selectAudio(a.id); }}
                      onMouseDown={(e) => {
                        // Drag horizontally to place the audio on the timeline.
                        if ((e.target as HTMLElement).closest(".clip-edge-handle")) return;
                        const startX = e.clientX;
                        const orig = a.startTime ?? 0;
                        let moved = false;
                        const onMove = (ev: MouseEvent) => {
                          const delta = (ev.clientX - startX) / pxPerSec;
                          if (Math.abs(ev.clientX - startX) > 3) moved = true;
                          if (!moved) return;
                          const next = applySnap(Math.max(0, orig + delta), orig);
                          updateAudioClip(a.id, { startTime: Math.max(0, next) });
                        };
                        const onUp = () => {
                          window.removeEventListener("mousemove", onMove);
                          window.removeEventListener("mouseup", onUp);
                        };
                        window.addEventListener("mousemove", onMove);
                        window.addEventListener("mouseup", onUp);
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${a.name} 오디오`}
                      title={`${a.name} — 드래그로 시작 위치 이동`}
                    >
                      {a.url && <Waveform url={a.url} width={width} height={32} />}
                      <span className="clip-label" style={{ position: "relative" }}>🎵 {a.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Text overlay track */}
          {captions.length > 0 && (
            <div className="track-row" onClick={handleTrackClick} aria-label="텍스트 트랙">
              <div className="track-header">
                <MIcon name="title" size={15} />
                텍스트
              </div>
              <div className="track-body">
                {captions.map((cap) => {
                  const left = cap.startTime * pxPerSec;
                  const width = Math.max((cap.endTime - cap.startTime) * pxPerSec - 2, 30);
                  return (
                    <div key={cap.id}
                      className={`clip-block clip-text ${selectedCaptionId === cap.id ? "selected" : ""}`}
                      style={{ left, width }}
                      onClick={(e) => { e.stopPropagation(); selectCaption(cap.id); }}
                      onMouseDown={(e) => {
                        // Drag the body to move the whole caption in time.
                        if ((e.target as HTMLElement).closest(".clip-edge-handle")) return;
                        const startX = e.clientX;
                        const origStart = cap.startTime;
                        const len = cap.endTime - cap.startTime;
                        let moved = false;
                        const onMove = (ev: MouseEvent) => {
                          const delta = (ev.clientX - startX) / pxPerSec;
                          if (Math.abs(ev.clientX - startX) > 3) moved = true;
                          if (!moved) return;
                          const next = Math.max(0, applySnap(origStart + delta, origStart));
                          updateCaption(cap.id, { startTime: next, endTime: next + len });
                        };
                        const onUp = () => {
                          window.removeEventListener("mousemove", onMove);
                          window.removeEventListener("mouseup", onUp);
                        };
                        window.addEventListener("mousemove", onMove);
                        window.addEventListener("mouseup", onUp);
                      }}
                      role="button" tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") selectCaption(cap.id); }}
                      aria-label={`자막: ${cap.text}`}
                      aria-pressed={selectedCaptionId === cap.id}
                      title={`${cap.text} — 본체 드래그로 이동, 양 끝 드래그로 길이 조절`}
                    >
                      <span className="clip-label">{cap.text}</span>
                      <span className="clip-edge-handle left" onMouseDown={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const startX = e.clientX;
                        const startTime = cap.startTime;
                        const onMove = (ev: MouseEvent) => {
                          const proposed = startTime + (ev.clientX - startX) / pxPerSec;
                          const snapped = applySnap(proposed, startTime);
                          const next = Math.max(0, Math.min(cap.endTime - 0.1, snapped));
                          updateCaption(cap.id, { startTime: next });
                        };
                        const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                        window.addEventListener("mousemove", onMove);
                        window.addEventListener("mouseup", onUp);
                      }} />
                      <span className="clip-edge-handle right" onMouseDown={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const startX = e.clientX;
                        const endTime = cap.endTime;
                        const onMove = (ev: MouseEvent) => {
                          const proposed = endTime + (ev.clientX - startX) / pxPerSec;
                          const snapped = applySnap(proposed, endTime);
                          const next = Math.max(cap.startTime + 0.1, snapped);
                          updateCaption(cap.id, { endTime: next });
                        };
                        const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                        window.addEventListener("mousemove", onMove);
                        window.addEventListener("mouseup", onUp);
                      }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Image overlay track */}
          {images.length > 0 && (
            <div className="track-row" onClick={handleTrackClick} aria-label="이미지 트랙">
              <div className="track-header"><MIcon name="image" size={15} />이미지</div>
              <div className="track-body">
                {images.map((img) => {
                  const left = img.startTime * pxPerSec;
                  const width = Math.max((img.endTime - img.startTime) * pxPerSec - 2, 30);
                  return (
                    <div key={img.id}
                      className={`clip-block clip-video ${selectedImageId === img.id ? "selected" : ""}`}
                      style={{ left, width }}
                      onClick={(e) => { e.stopPropagation(); selectImage(img.id); }}
                    >
                      <span className="clip-label">🖼 {img.name}</span>
                      <span className="clip-edge-handle left" onMouseDown={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const startX = e.clientX; const start = img.startTime;
                        const onMove = (ev: MouseEvent) => updateImage(img.id, { startTime: Math.max(0, Math.min(img.endTime - 0.1, applySnap(start + (ev.clientX - startX) / pxPerSec, start))) });
                        const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                        window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
                      }} />
                      <span className="clip-edge-handle right" onMouseDown={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const startX = e.clientX; const end = img.endTime;
                        const onMove = (ev: MouseEvent) => updateImage(img.id, { endTime: Math.max(img.startTime + 0.1, applySnap(end + (ev.clientX - startX) / pxPerSec, end)) });
                        const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                        window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
                      }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shape overlay track */}
          {shapes.length > 0 && (
            <div className="track-row" onClick={handleTrackClick} aria-label="도형 트랙">
              <div className="track-header">
                <MIcon name="category" size={15} />
                도형
              </div>
              <div className="track-body">
                {shapes.map((sh) => {
                  const left = sh.startTime * pxPerSec;
                  const width = Math.max((sh.endTime - sh.startTime) * pxPerSec - 2, 30);
                  const label = sh.kind === "rect" ? "사각형" : sh.kind === "ellipse" ? "원" : sh.kind === "triangle" ? "삼각형" : "선";
                  return (
                    <div key={sh.id}
                      className={`clip-block clip-shape ${selectedShapeId === sh.id ? "selected" : ""}`}
                      style={{ left, width }}
                      onClick={(e) => { e.stopPropagation(); selectShape(sh.id); }}
                      onMouseDown={(e) => {
                        if ((e.target as HTMLElement).closest(".clip-edge-handle")) return;
                        const startX = e.clientX;
                        const origStart = sh.startTime;
                        const len = sh.endTime - sh.startTime;
                        let moved = false;
                        const onMove = (ev: MouseEvent) => {
                          if (Math.abs(ev.clientX - startX) > 3) moved = true;
                          if (!moved) return;
                          const next = Math.max(0, applySnap(origStart + (ev.clientX - startX) / pxPerSec, origStart));
                          updateShape(sh.id, { startTime: next, endTime: next + len });
                        };
                        const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                        window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
                      }}
                      role="button" tabIndex={0}
                      aria-label={`도형: ${label}`}
                      title={`${label} — 본체 드래그로 이동, 양 끝 드래그로 길이 조절`}
                    >
                      <span className="clip-label">▭ {label}</span>
                      <span className="clip-edge-handle left" onMouseDown={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const startX = e.clientX; const start = sh.startTime;
                        const onMove = (ev: MouseEvent) => updateShape(sh.id, { startTime: Math.max(0, Math.min(sh.endTime - 0.1, applySnap(start + (ev.clientX - startX) / pxPerSec, start))) });
                        const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                        window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
                      }} />
                      <span className="clip-edge-handle right" onMouseDown={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const startX = e.clientX; const end = sh.endTime;
                        const onMove = (ev: MouseEvent) => updateShape(sh.id, { endTime: Math.max(sh.startTime + 0.1, applySnap(end + (ev.clientX - startX) / pxPerSec, end)) });
                        const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                        window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
                      }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sticker overlay track */}
          {stickers.length > 0 && (
            <div className="track-row" onClick={handleTrackClick} aria-label="스티커 트랙">
              <div className="track-header">
                <MIcon name="star" size={15} fill />
                스티커
              </div>
              <div className="track-body">
                {stickers.map((st) => {
                  const left = st.startTime * pxPerSec;
                  const width = Math.max((st.endTime - st.startTime) * pxPerSec - 2, 30);
                  return (
                    <div key={st.id}
                      className={`clip-block clip-sticker ${selectedStickerId === st.id ? "selected" : ""}`}
                      style={{ left, width }}
                      onClick={(e) => { e.stopPropagation(); selectSticker(st.id); }}
                      role="button" tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") selectSticker(st.id); }}
                      aria-label={`스티커: ${st.emoji}`}
                      title={`${st.emoji} 스티커`}
                    >
                      <span className="clip-label">{st.emoji}</span>
                      <span className="clip-edge-handle left" onMouseDown={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const startX = e.clientX; const start = st.startTime;
                        const onMove = (ev: MouseEvent) => updateSticker(st.id, { startTime: Math.max(0, Math.min(st.endTime - 0.1, applySnap(start + (ev.clientX - startX) / pxPerSec, start))) });
                        const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                        window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
                      }} />
                      <span className="clip-edge-handle right" onMouseDown={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const startX = e.clientX; const end = st.endTime;
                        const onMove = (ev: MouseEvent) => updateSticker(st.id, { endTime: Math.max(st.startTime + 0.1, applySnap(end + (ev.clientX - startX) / pxPerSec, end)) });
                        const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                        window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
                      }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
