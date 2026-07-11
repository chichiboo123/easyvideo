"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { toast } from "@/lib/notifications";
import MIcon from "./MIcon";
import {
  decodeAudioFromUrl,
  audioBufferToWav,
  sliceBuffer,
  deleteRange,
  silenceRange,
  fadeRegion,
  applyGain,
  normalize,
  reverseBuffer,
} from "@/lib/audioEdit";

interface Props {
  audioId: string;
  onClose: () => void;
}

interface Selection { start: number; end: number }

function fmt(sec: number) {
  if (!isFinite(sec)) return "0:00.00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec % 1) * 100);
  return `${m}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

// Audacity-style waveform editor. Rendering + region selection is powered by
// wavesurfer.js (BSD-3); the actual DSP (trim/cut/fade/gain/normalize/reverse)
// runs on the Web Audio API in lib/audioEdit.ts. Applying re-encodes the edited
// buffer to a WAV blob and swaps it back into the timeline clip.
export default function AudioEditorModal({ audioId, onClose }: Props) {
  const audio = useEditorStore((s) => s.audioClips.find((a) => a.id === audioId));
  const updateAudioClip = useEditorStore((s) => s.updateAudioClip);

  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<any>(null);
  const regionsRef = useRef<any>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const historyRef = useRef<AudioBuffer[]>([]);
  const originalRef = useRef<AudioBuffer | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(80);
  const [historyLen, setHistoryLen] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ── Load wavesurfer + the clip's audio (respecting its current trim) ────────
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    (async () => {
      if (!audio?.url) { setError("오디오를 찾을 수 없어요"); setLoading(false); return; }
      try {
        const [{ default: WaveSurfer }, regionsMod] = await Promise.all([
          import("wavesurfer.js"),
          import("wavesurfer.js/dist/plugins/regions.esm.js"),
        ]);
        if (!alive) return;
        const RegionsPlugin = regionsMod.default;

        // Decode, then pre-apply the timeline trim so the editor shows exactly
        // what currently plays on the timeline.
        const full = await decodeAudioFromUrl(audio.url);
        if (!alive) return;
        const trimStart = audio.trimStart ?? 0;
        const trimEnd = trimStart + (audio.duration || full.duration);
        const startedTrimmed = trimStart > 0.001 || trimEnd < full.duration - 0.001;
        const buffer = startedTrimmed ? sliceBuffer(full, trimStart, trimEnd) : full;

        originalRef.current = buffer;
        bufferRef.current = buffer;

        const container = containerRef.current;
        if (!container) return;
        const regions = RegionsPlugin.create();
        regionsRef.current = regions;

        const ws = WaveSurfer.create({
          container,
          height: 140,
          waveColor: "#7c9cff",
          progressColor: "#3d6bff",
          cursorColor: "#ff5c8a",
          cursorWidth: 2,
          minPxPerSec: zoom,
          plugins: [regions],
        });
        wsRef.current = ws;

        ws.on("ready", () => {
          if (!alive) return;
          setReady(true);
          setLoading(false);
          setDuration(ws.getDuration());
        });
        ws.on("play", () => setPlaying(true));
        ws.on("pause", () => setPlaying(false));
        ws.on("finish", () => setPlaying(false));

        // Single drag-selectable region.
        regions.enableDragSelection({ color: "rgba(255, 92, 138, 0.18)" });
        const keepOne = (region: any) => {
          regions.getRegions().forEach((r: any) => { if (r !== region) r.remove(); });
          setSelection({ start: region.start, end: region.end });
        };
        regions.on("region-created", keepOne);
        regions.on("region-updated", (r: any) => setSelection({ start: r.start, end: r.end }));

        await loadBuffer(buffer);
      } catch (e) {
        if (alive) { setError("오디오 편집기를 불러오지 못했어요"); setLoading(false); }
      }
    })();

    return () => {
      alive = false;
      try { wsRef.current?.destroy(); } catch { /* already gone */ }
      wsRef.current = null;
      if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioId]);

  // Re-render the waveform from an AudioBuffer by encoding to WAV and loading it.
  const loadBuffer = useCallback(async (buffer: AudioBuffer) => {
    const ws = wsRef.current;
    if (!ws) return;
    const blob = audioBufferToWav(buffer);
    regionsRef.current?.clearRegions?.();
    setSelection(null);
    await ws.loadBlob(blob);
    setDuration(buffer.duration);
  }, []);

  // Apply an edit: snapshot the current buffer for undo, then swap in the result.
  const commit = useCallback(async (next: AudioBuffer) => {
    if (!bufferRef.current) return;
    setProcessing(true);
    historyRef.current.push(bufferRef.current);
    setHistoryLen(historyRef.current.length);
    bufferRef.current = next;
    await loadBuffer(next);
    setProcessing(false);
  }, [loadBuffer]);

  const buf = () => bufferRef.current;

  const requireSelection = (): Selection | null => {
    if (!selection || selection.end - selection.start < 0.01) {
      toast({ message: "먼저 파형에서 편집할 구간을 드래그해 선택하세요", type: "warning" });
      return null;
    }
    return selection;
  };

  // ── Edit operations ─────────────────────────────────────────────────────────
  const onTrimToSelection = async () => {
    const sel = requireSelection(); const b = buf(); if (!sel || !b) return;
    await commit(sliceBuffer(b, sel.start, sel.end));
    toast({ message: "선택 구간만 남겼어요", type: "success" });
  };
  const onDeleteSelection = async () => {
    const sel = requireSelection(); const b = buf(); if (!sel || !b) return;
    await commit(deleteRange(b, sel.start, sel.end));
    toast({ message: "선택 구간을 잘라냈어요", type: "success" });
  };
  const onSilence = async () => {
    const sel = requireSelection(); const b = buf(); if (!sel || !b) return;
    await commit(silenceRange(b, sel.start, sel.end));
    toast({ message: "선택 구간을 무음 처리했어요", type: "success" });
  };
  const onFade = async (type: "in" | "out") => {
    const b = buf(); if (!b) return;
    const region = selection && selection.end - selection.start > 0.01
      ? selection
      : type === "in"
        ? { start: 0, end: Math.min(3, b.duration) }
        : { start: Math.max(0, b.duration - 3), end: b.duration };
    await commit(fadeRegion(b, region.start, region.end, type));
    toast({ message: type === "in" ? "페이드 인을 적용했어요" : "페이드 아웃을 적용했어요", type: "success" });
  };
  const onGain = async (factor: number) => {
    const b = buf(); if (!b) return;
    const sel = selection && selection.end - selection.start > 0.01 ? selection : undefined;
    await commit(applyGain(b, factor, sel?.start, sel?.end));
    toast({ message: factor > 1 ? "볼륨을 키웠어요" : "볼륨을 줄였어요", type: "info" });
  };
  const onNormalize = async () => {
    const b = buf(); if (!b) return;
    await commit(normalize(b));
    toast({ message: "정규화(노멀라이즈)를 적용했어요", type: "success" });
  };
  const onReverse = async () => {
    const b = buf(); if (!b) return;
    const sel = selection && selection.end - selection.start > 0.01 ? selection : undefined;
    await commit(reverseBuffer(b, sel?.start, sel?.end));
    toast({ message: "거꾸로 뒤집었어요", type: "info" });
  };
  const onUndo = async () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    setHistoryLen(historyRef.current.length);
    bufferRef.current = prev;
    await loadBuffer(prev);
  };
  const onResetOriginal = async () => {
    const orig = originalRef.current;
    if (!orig || !bufferRef.current) return;
    historyRef.current.push(bufferRef.current);
    setHistoryLen(historyRef.current.length);
    bufferRef.current = orig;
    await loadBuffer(orig);
    toast({ message: "처음 상태로 되돌렸어요", type: "info" });
  };

  // ── Playback / zoom ─────────────────────────────────────────────────────────
  const onPlayPause = () => { wsRef.current?.playPause?.(); };
  const onPlaySelection = () => {
    const region = regionsRef.current?.getRegions?.()?.[0];
    if (region) region.play();
    else wsRef.current?.playPause?.();
  };
  useEffect(() => {
    if (ready) { try { wsRef.current?.zoom?.(zoom); } catch { /* not ready */ } }
  }, [zoom, ready]);

  // ── Apply back to the timeline ──────────────────────────────────────────────
  const onApply = () => {
    const b = bufferRef.current;
    if (!b || !audio) return;
    const blob = audioBufferToWav(b);
    const url = URL.createObjectURL(blob);
    updateAudioClip(audio.id, {
      url,
      duration: b.duration,
      sourceDuration: b.duration,
      trimStart: 0,
    });
    toast({ message: "편집한 음원을 적용했어요", type: "success" });
    onClose();
  };

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const busy = processing || !ready;

  return (
    <div className="export-overlay" role="dialog" aria-modal="true" aria-label="음원 편집기"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="export-modal audio-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="audio-editor-head">
          <h2 style={{ margin: 0 }}>🎧 음원 편집 · {audio?.name ?? ""}</h2>
          <button type="button" className="tl-icon-btn" onClick={onClose} aria-label="닫기" title="닫기 (Esc)">
            <MIcon name="close" size={18} />
          </button>
        </div>

        <p className="audio-editor-hint">
          파형을 <strong>드래그</strong>해서 편집할 구간을 선택하고, 아래 도구로 자르기·페이드·볼륨·정규화를 적용하세요.
          Audacity처럼 여러 번 편집한 뒤 <strong>적용</strong>을 누르면 타임라인 음원에 반영됩니다.
        </p>

        {error ? (
          <div className="audio-editor-error">{error}</div>
        ) : (
          <>
            <div className="audio-editor-wave-wrap">
              <div ref={containerRef} className="audio-editor-wave" aria-label="오디오 파형" />
              {loading && <div className="audio-editor-loading">파형을 불러오는 중…</div>}
            </div>

            <div className="audio-editor-transport">
              <button type="button" className="tl-btn" onClick={onPlayPause} disabled={busy}>
                <MIcon name={playing ? "pause" : "play_arrow"} size={16} fill /> {playing ? "일시정지" : "재생"}
              </button>
              <button type="button" className="tl-btn" onClick={onPlaySelection} disabled={busy || !selection}>
                <MIcon name="play_circle" size={16} /> 선택 구간 재생
              </button>
              <span className="audio-editor-readout">
                {selection
                  ? `선택: ${fmt(selection.start)} – ${fmt(selection.end)} (${fmt(selection.end - selection.start)})`
                  : `전체 길이 ${fmt(duration)}`}
              </span>
              <span className="timeline-spacer" />
              <MIcon name="zoom_out" size={16} />
              <input type="range" min={20} max={400} step={10} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="tl-zoom-range" aria-label="파형 확대" disabled={busy} />
              <MIcon name="zoom_in" size={16} />
            </div>

            <div className="audio-editor-tools">
              <div className="audio-tool-group">
                <span className="audio-tool-label">자르기</span>
                <button type="button" className="tl-btn" onClick={onTrimToSelection} disabled={busy}>선택만 남기기</button>
                <button type="button" className="tl-btn" onClick={onDeleteSelection} disabled={busy}>선택 삭제</button>
                <button type="button" className="tl-btn" onClick={onSilence} disabled={busy}>무음</button>
              </div>
              <div className="audio-tool-group">
                <span className="audio-tool-label">페이드</span>
                <button type="button" className="tl-btn" onClick={() => onFade("in")} disabled={busy}>페이드 인</button>
                <button type="button" className="tl-btn" onClick={() => onFade("out")} disabled={busy}>페이드 아웃</button>
              </div>
              <div className="audio-tool-group">
                <span className="audio-tool-label">볼륨</span>
                <button type="button" className="tl-btn" onClick={() => onGain(1.25)} disabled={busy}>키우기 +</button>
                <button type="button" className="tl-btn" onClick={() => onGain(0.8)} disabled={busy}>줄이기 −</button>
                <button type="button" className="tl-btn" onClick={onNormalize} disabled={busy}>정규화</button>
              </div>
              <div className="audio-tool-group">
                <span className="audio-tool-label">기타</span>
                <button type="button" className="tl-btn" onClick={onReverse} disabled={busy}>거꾸로</button>
                <button type="button" className="tl-btn" onClick={onUndo} disabled={busy || historyLen === 0}>실행취소</button>
                <button type="button" className="tl-btn" onClick={onResetOriginal} disabled={busy}>원본으로</button>
              </div>
            </div>

            <div className="export-action-row">
              <span className="audio-editor-credit">
                파형·구간 편집: <a href="https://github.com/katspaugh/wavesurfer.js" target="_blank" rel="noopener noreferrer">wavesurfer.js</a> (BSD-3) · 감사합니다 🙏
              </span>
              <span className="timeline-spacer" />
              <button type="button" className="btn-secondary-half" onClick={onClose}>취소</button>
              <button type="button" className="btn-primary" onClick={onApply} disabled={busy}>적용</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
