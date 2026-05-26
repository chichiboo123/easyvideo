"use client";

import { useMemo, useRef } from "react";
import { useEditorStore } from "@/store/editorStore";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
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
  const markers = useEditorStore((s) => s.markers);
  const currentTime = useEditorStore((s) => s.currentTime);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const selectedCaptionId = useEditorStore((s) => s.selectedCaptionId);
  const selectedStickerId = useEditorStore((s) => s.selectedStickerId);
  const selectedImageId = useEditorStore((s) => s.selectedImageId);
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
  const selectAudio = useEditorStore((s) => s.selectAudio);
  const updateCaption = useEditorStore((s) => s.updateCaption);
  const updateImage = useEditorStore((s) => s.updateImage);
  const updateSticker = useEditorStore((s) => s.updateSticker);
  const trimClipInPoint = useEditorStore((s) => s.trimClipInPoint);
  const trimClipOutPoint = useEditorStore((s) => s.trimClipOutPoint);
  const splitClipAtPlayhead = useEditorStore((s) => s.splitClipAtPlayhead);
  const setTimelineZoom = useEditorStore((s) => s.setTimelineZoom);
  const setActiveClipIndex = useEditorStore((s) => s.setActiveClipIndex);
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime);
  const setSeekRequest = useEditorStore((s) => s.setSeekRequest);
  const setPlaying = useEditorStore((s) => s.setPlaying);
  const removeMarker = useEditorStore((s) => s.removeMarker);

  const bodyRef = useRef<HTMLDivElement>(null);
  const dragSrcIdx = useRef<number | null>(null);

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

  function applySnap(t: number): number {
    if (!snapEnabled) return t;
    const tolerance = SNAP_PX / pxPerSec;
    let best = t, bestDelta = tolerance;
    for (const target of snapTargets) {
      const d = Math.abs(target - t);
      if (d < bestDelta) { best = target; bestDelta = d; }
    }
    return best;
  }

  const interval = getRulerInterval(pxPerSec);
  const markCount = Math.ceil((contentW - TRACK_HEADER_W) / pxPerSec / interval) + 2;
  const rulerMarks = Array.from({ length: markCount }, (_, i) => i * interval);

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    const body = bodyRef.current;
    if (!body) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left - TRACK_HEADER_W + body.scrollLeft;
    if (x < 0) return;
    const t = Math.max(0, Math.min(total, x / pxPerSec));
    seekToGlobal(applySnap(t));
  }
  function seekByClientX(clientX: number, rect: DOMRect, scrollLeft: number) {
    const x = clientX - rect.left - TRACK_HEADER_W + scrollLeft;
    const t = Math.max(0, Math.min(total, x / pxPerSec));
    seekToGlobal(applySnap(t));
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

  const playheadX = TRACK_HEADER_W + currentTime * pxPerSec;

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
        <button type="button" className="tl-btn"
          onClick={splitClipAtPlayhead}
          disabled={videoClips.length === 0 || isVideoTrackLocked}
          aria-label="재생 위치에서 분할"
          title="현재 재생 위치에서 클립을 분할합니다 (S)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" d="M6 9a3 3 0 100-6 3 3 0 000 6zm12 12a3 3 0 100-6 3 3 0 000 6zM5.5 8.5l13 7"/>
          </svg>
          분할
        </button>

        <div className="toolbar-divider" style={{ margin: "0 2px" }} aria-hidden="true" />
        <select value={transitionType}
          onChange={(e) => setTransitionType(e.target.value as any)}
          className="prop-input" style={{ width: 100, height: 28 }}
          aria-label="전환 효과"
        >
          <option value="none">전환 없음</option>
          <option value="fade">페이드</option>
          <option value="dissolve">디졸브</option>
          <option value="slide-left">슬라이드</option>
          <option value="wipe-up">와이프 업</option>
        </select>
        {transitionType !== "none" && (
          <input type="range" min={0.2} max={2.0} step={0.1}
            value={transitionDuration}
            onChange={(e) => setTransitionDuration(Number(e.target.value))}
            aria-label="전환 길이"
            title={`전환 길이 ${transitionDuration.toFixed(1)}초`}
            style={{ width: 80 }}
          />
        )}
        <select value={videoEffect}
          onChange={(e) => setVideoEffect(e.target.value as any)}
          className="prop-input" style={{ width: 90, height: 28 }}
          aria-label="영상 효과"
        >
          <option value="none">효과 없음</option>
          <option value="vintage">빈티지</option>
          <option value="bright">화사하게</option>
          <option value="bw">흑백</option>
          <option value="warm">따뜻하게</option>
          <option value="cool">차갑게</option>
          <option value="blur">블러</option>
          <option value="vignette">비네트</option>
        </select>

        <button type="button"
          className={`tl-btn ${snapEnabled ? "active" : ""}`}
          onClick={() => setSnapEnabled(!snapEnabled)}
          aria-pressed={snapEnabled}
          title="스냅 (클립·재생헤드·마커에 자석)"
        >
          🧲 스냅
        </button>

        <div className="toolbar-divider" style={{ margin: "0 2px" }} aria-hidden="true" />

        <button type="button" className="tl-btn" onClick={() => setTimelineZoom(pxPerSec + 20)} aria-label="확대">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-3.5-3.5M11 8v6M8 11h6"/>
          </svg>
        </button>
        <input type="range" min={20} max={400} step={10}
          value={pxPerSec}
          onChange={(e) => setTimelineZoom(Number(e.target.value))}
          style={{ width: 80, accentColor: "var(--accent)" }}
          aria-label="타임라인 배율"
          title="타임라인 확대/축소"
        />
        <button type="button" className="tl-btn" onClick={() => setTimelineZoom(pxPerSec - 20)} aria-label="축소">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-3.5-3.5M8 11h6"/>
          </svg>
        </button>
        <span className="tl-zoom-label">{Math.round(pxPerSec / 80 * 100)}%</span>

        <div className="timeline-spacer" />
        <span className="tl-time-display" aria-label="현재 / 전체 시간">
          {formatTime(currentTime)} / {formatTime(total)}
        </span>
      </div>

      {/* Scrollable body */}
      <div className="timeline-body" ref={bodyRef}>
        <div className="timeline-content" style={{ width: contentW }}>

          {/* Ruler */}
          <div className="ruler" onClick={handleTrackClick}>
            <div className="ruler-left-pad" />
            <div className="ruler-marks" style={{ width: contentW - TRACK_HEADER_W }}>
              {rulerMarks.map((t) => (
                <div key={t} className="ruler-mark" style={{ left: t * pxPerSec }}>
                  <span className="ruler-mark-label">{formatTime(t)}</span>
                  <div className="ruler-mark-line" />
                </div>
              ))}
              {/* Markers */}
              {markers.map((m) => (
                <div key={m.id} className="ruler-marker" style={{ left: m.time * pxPerSec }}
                  title={`${m.label} (${formatTime(m.time)})`}
                  onClick={(e) => { e.stopPropagation(); setCurrentTime(m.time); setSeekRequest(m.time); }}
                  onDoubleClick={(e) => { e.stopPropagation(); removeMarker(m.id); }}
                >
                  <span className="ruler-marker-pin" style={{ background: m.color }} />
                  <span className="ruler-marker-label">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Playhead */}
          <div className="playhead" style={{ left: playheadX }}
            onMouseDown={(e) => {
              const body = bodyRef.current;
              if (!body) return;
              const rect = body.getBoundingClientRect();
              const onMove = (ev: MouseEvent) => seekByClientX(ev.clientX, rect, body.scrollLeft);
              const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              };
              onMove(e.nativeEvent);
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
            aria-hidden="true"
          >
            <div className="playhead-handle" />
          </div>

          {/* Video track V1 */}
          <div className="track-row" onClick={handleTrackClick} aria-label="비디오 트랙">
            <div className="track-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M10 8l6 4-6 4V8z"/>
              </svg>
              V1
            </div>
            <div className="track-body">
              {videoClips.map((clip) => {
                const idx = videoClips.findIndex((x) => x.id === clip.id);
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
                          const onMove = (ev: MouseEvent) => {
                            const delta = (ev.clientX - startX) / pxPerSec;
                            trimClipInPoint(clip.id, delta);
                          };
                          const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                          window.addEventListener("mousemove", onMove);
                          window.addEventListener("mouseup", onUp);
                        }} />
                        <span className="clip-edge-handle right" onMouseDown={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          const startX = e.clientX;
                          const onMove = (ev: MouseEvent) => {
                            const delta = (ev.clientX - startX) / pxPerSec;
                            trimClipOutPoint(clip.id, delta);
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
            </div>
          </div>

          {/* Audio tracks M1/M2/M3 */}
          {([1, 2, 3] as const).map((trackNum) => (
            <div key={`m${trackNum}`} className="track-row" onClick={handleTrackClick} aria-label={`오디오 트랙 M${trackNum}`}>
              <div className="track-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 3v10.55a4 4 0 10.97 2.6L13 6l6 1V4l-7-1z"/>
                </svg>
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
                      role="button"
                      tabIndex={0}
                      aria-label={`${a.name} 오디오`}
                      title={a.name}
                    >
                      <span className="clip-label">🎵 {a.name}</span>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M5 4v3h5.5v12h3V7H19V4z"/>
                </svg>
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
                      role="button" tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") selectCaption(cap.id); }}
                      aria-label={`자막: ${cap.text}`}
                      aria-pressed={selectedCaptionId === cap.id}
                      title={cap.text}
                    >
                      <span className="clip-label">{cap.text}</span>
                      <span className="clip-edge-handle left" onMouseDown={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const startX = e.clientX;
                        const startTime = cap.startTime;
                        const onMove = (ev: MouseEvent) => {
                          const proposed = startTime + (ev.clientX - startX) / pxPerSec;
                          const snapped = applySnap(proposed);
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
                          const snapped = applySnap(proposed);
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
              <div className="track-header">이미지</div>
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
                        const onMove = (ev: MouseEvent) => updateImage(img.id, { startTime: Math.max(0, Math.min(img.endTime - 0.1, start + (ev.clientX - startX) / pxPerSec)) });
                        const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                        window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
                      }} />
                      <span className="clip-edge-handle right" onMouseDown={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const startX = e.clientX; const end = img.endTime;
                        const onMove = (ev: MouseEvent) => updateImage(img.id, { endTime: Math.max(img.startTime + 0.1, end + (ev.clientX - startX) / pxPerSec) });
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
                <span style={{ fontSize: 16 }} aria-hidden="true">✦</span>
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
                        const onMove = (ev: MouseEvent) => updateSticker(st.id, { startTime: Math.max(0, Math.min(st.endTime - 0.1, start + (ev.clientX - startX) / pxPerSec)) });
                        const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                        window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
                      }} />
                      <span className="clip-edge-handle right" onMouseDown={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const startX = e.clientX; const end = st.endTime;
                        const onMove = (ev: MouseEvent) => updateSticker(st.id, { endTime: Math.max(st.startTime + 0.1, end + (ev.clientX - startX) / pxPerSec) });
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
