"use client";

import { useEditorStore } from "@/store/editorStore";
import type { CaptionColor } from "@/types";

const SPEEDS = [0.5, 1, 1.5, 2];

const CAPTION_COLORS: { value: CaptionColor; label: string }[] = [
  { value: "#FFFFFF", label: "흰색" },
  { value: "#000000", label: "검정" },
  { value: "#FF4D4D", label: "빨강" },
  { value: "#3D8BFF", label: "파랑" },
  { value: "#FFD93D", label: "노랑" },
  { value: "#4CD964", label: "초록" },
];

function formatDur(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 100);
  return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

export default function PropertiesPanel() {
  const videoClips = useEditorStore((s) => s.videoClips);
  const captions = useEditorStore((s) => s.captions);
  const stickers = useEditorStore((s) => s.stickers);
  const audioClip = useEditorStore((s) => s.audioClip);
  const images = useEditorStore((s) => s.images);

  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const selectedCaptionId = useEditorStore((s) => s.selectedCaptionId);
  const selectedStickerId = useEditorStore((s) => s.selectedStickerId);
  const selectedImageId = useEditorStore((s) => s.selectedImageId);

  const removeVideoClip = useEditorStore((s) => s.removeVideoClip);
  const updateCaption = useEditorStore((s) => s.updateCaption);
  const removeCaption = useEditorStore((s) => s.removeCaption);
  const updateSticker = useEditorStore((s) => s.updateSticker);
  const removeSticker = useEditorStore((s) => s.removeSticker);
  const setAudioClip = useEditorStore((s) => s.setAudioClip);
  const updateImage = useEditorStore((s) => s.updateImage);
  const removeImage = useEditorStore((s) => s.removeImage);
  const clipOffsets = useEditorStore((s) => s.clipOffsets);

  const offsets = clipOffsets();
  const selectedClip = videoClips.find((c) => c.id === selectedClipId);
  const selectedCaption = captions.find((c) => c.id === selectedCaptionId);
  const selectedSticker = stickers.find((s) => s.id === selectedStickerId);
  const selectedImage = images.find((s) => s.id === selectedImageId);

  // ── Video clip properties ─────────────────────────────────────────────────
  if (selectedClip) {
    const clipIdx = videoClips.findIndex((c) => c.id === selectedClip.id);
    const offset = offsets[clipIdx] ?? 0;

    return (
      <aside className="props-panel" aria-label="클립 속성">
        <div className="props-header">비디오 클립</div>
        <div className="props-body">
          <div className="props-section">
            <div className="props-section-title">정보</div>
            <div className="prop-row">
              <span className="prop-label">이름</span>
              <span className="prop-value" style={{ fontSize: 11, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedClip.name}
              </span>
            </div>
            <div className="prop-row">
              <span className="prop-label">길이</span>
              <span className="prop-value">{formatDur(selectedClip.duration)}</span>
            </div>
            <div className="prop-row">
              <span className="prop-label">시작 위치</span>
              <span className="prop-value">{formatDur(offset)}</span>
            </div>
          </div>

          <div className="props-section">
            <div className="props-section-title">속도 (미리보기)</div>
            <div className="speed-grid">
              {SPEEDS.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  className={`speed-btn ${sp === 1 ? "active" : ""}`}
                  aria-label={`재생 속도 ${sp}배`}
                  title={`${sp}배속`}
                  disabled
                >
                  {sp}×
                </button>
              ))}
            </div>
            <p style={{ fontSize: 10, color: "var(--text-muted)" }}>속도 조절은 내보낼 때 적용됩니다</p>
          </div>

          <div className="props-section">
            <div className="props-section-title">구간</div>
            <div className="prop-row">
              <span className="prop-label">시작</span>
              <input type="number" className="prop-input" style={{ width: 70 }} min={0} step={0.1}
                value={selectedSticker.startTime.toFixed(1)}
                onChange={(e) => updateSticker(selectedSticker.id, { startTime: Number(e.target.value) })}
              />
            </div>
            <div className="prop-row">
              <span className="prop-label">끝</span>
              <input type="number" className="prop-input" style={{ width: 70 }} min={0} step={0.1}
                value={selectedSticker.endTime.toFixed(1)}
                onChange={(e) => updateSticker(selectedSticker.id, { endTime: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="props-section">
            <button
              type="button"
              className="btn-danger"
              onClick={() => removeVideoClip(selectedClip.id)}
              aria-label={`${selectedClip.name} 클립 삭제`}
            >
              클립 삭제
            </button>
          </div>
        </div>
      </aside>
    );
  }
  if (selectedImage) {
    return (
      <aside className="props-panel" aria-label="이미지 속성">
        <div className="props-header">이미지</div>
        <div className="props-body">
          <div className="props-section">
            <div className="props-section-title">이름</div>
            <div className="prop-value">{selectedImage.name}</div>
          </div>
          <div className="props-section">
            <div className="props-section-title">크기</div>
            <input type="range" className="prop-slider" min={5} max={100} value={selectedImage.width}
              onChange={(e) => updateImage(selectedImage.id, { width: Number(e.target.value) })} />
          </div>
          <div className="props-section">
            <div className="props-section-title">위치 X / Y</div>
            <input type="range" className="prop-slider" min={0} max={100} value={selectedImage.x}
              onChange={(e) => updateImage(selectedImage.id, { x: Number(e.target.value) })} />
            <input type="range" className="prop-slider" min={0} max={100} value={selectedImage.y}
              onChange={(e) => updateImage(selectedImage.id, { y: Number(e.target.value) })} />
          </div>
          <div className="props-section">
            <div className="props-section-title">구간</div>
            <div className="prop-row"><span className="prop-label">시작</span>
              <input type="number" className="prop-input" style={{ width: 70 }} min={0} step={0.1} value={selectedImage.startTime.toFixed(1)}
                onChange={(e) => updateImage(selectedImage.id, { startTime: Number(e.target.value) })} /></div>
            <div className="prop-row"><span className="prop-label">끝</span>
              <input type="number" className="prop-input" style={{ width: 70 }} min={0} step={0.1} value={selectedImage.endTime.toFixed(1)}
                onChange={(e) => updateImage(selectedImage.id, { endTime: Number(e.target.value) })} /></div>
          </div>
          <button type="button" className="btn-danger" onClick={() => removeImage(selectedImage.id)}>이미지 삭제</button>
        </div>
      </aside>
    );
  }

  // ── Caption properties ────────────────────────────────────────────────────
  if (selectedCaption) {
    return (
      <aside className="props-panel" aria-label="자막 속성">
        <div className="props-header">텍스트 자막</div>
        <div className="props-body">
          <div className="props-section">
            <div className="props-section-title">텍스트</div>
            <textarea
              className="prop-input"
              style={{ minHeight: 60, resize: "vertical" }}
              value={selectedCaption.text}
              onChange={(e) => updateCaption(selectedCaption.id, { text: e.target.value })}
              aria-label="자막 텍스트 수정"
            />
          </div>

          <div className="props-section">
            <div className="props-section-title">색상</div>
            <div className="color-swatch-row" role="radiogroup" aria-label="자막 색상">
              {CAPTION_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  className={`color-swatch ${selectedCaption.color === c.value ? "active" : ""}`}
                  style={{ background: c.value, width: 24, height: 24, outline: c.value === "#FFFFFF" ? "1px solid #555" : undefined }}
                  onClick={() => updateCaption(selectedCaption.id, { color: c.value })}
                  aria-checked={selectedCaption.color === c.value}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>

          <div className="props-section">
            <div className="props-section-title">
              <div className="label-row">
                <span>글자 크기</span>
                <span>{selectedCaption.fontSize}px</span>
              </div>
            </div>
            <input
              type="range"
              className="prop-slider"
              min={16} max={80}
              value={selectedCaption.fontSize}
              onChange={(e) => updateCaption(selectedCaption.id, { fontSize: Number(e.target.value) })}
              aria-label="글자 크기"
            />
          </div>

          <div className="props-section">
            <div className="props-section-title">위치 X / Y</div>
            <div className="prop-row">
              <span className="prop-label">X</span>
              <input
                type="range"
                className="prop-slider"
                min={0} max={100}
                value={selectedCaption.x}
                onChange={(e) => updateCaption(selectedCaption.id, { x: Number(e.target.value) })}
                aria-label="자막 X 위치"
                style={{ width: "100%" }}
              />
            </div>
            <div className="prop-row">
              <span className="prop-label">Y</span>
              <input
                type="range"
                className="prop-slider"
                min={0} max={100}
                value={selectedCaption.y}
                onChange={(e) => updateCaption(selectedCaption.id, { y: Number(e.target.value) })}
                aria-label="자막 Y 위치"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div className="props-section">
            <div className="props-section-title">구간</div>
            <div className="prop-row">
              <span className="prop-label">시작</span>
              <input
                type="number"
                className="prop-input"
                style={{ width: 70 }}
                min={0} step={0.1}
                value={selectedCaption.startTime.toFixed(1)}
                onChange={(e) => updateCaption(selectedCaption.id, { startTime: Number(e.target.value) })}
                aria-label="자막 시작 시간"
              />
            </div>
            <div className="prop-row">
              <span className="prop-label">끝</span>
              <input
                type="number"
                className="prop-input"
                style={{ width: 70 }}
                min={0} step={0.1}
                value={selectedCaption.endTime.toFixed(1)}
                onChange={(e) => updateCaption(selectedCaption.id, { endTime: Number(e.target.value) })}
                aria-label="자막 종료 시간"
              />
            </div>
          </div>

          <div className="props-section">
            <button
              type="button"
              className="btn-danger"
              onClick={() => removeCaption(selectedCaption.id)}
              aria-label="자막 삭제"
            >
              자막 삭제
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // ── Sticker properties ────────────────────────────────────────────────────
  if (selectedSticker) {
    return (
      <aside className="props-panel" aria-label="스티커 속성">
        <div className="props-header">스티커</div>
        <div className="props-body">
          <div className="props-section">
            <div className="props-section-title">이모지</div>
            <div style={{ fontSize: 48, textAlign: "center", padding: "8px 0" }}>{selectedSticker.emoji}</div>
          </div>

          <div className="props-section">
            <div className="props-section-title">
              <div className="label-row">
                <span>크기</span>
                <span>{selectedSticker.size}px</span>
              </div>
            </div>
            <input
              type="range"
              className="prop-slider"
              min={24} max={160}
              value={selectedSticker.size}
              onChange={(e) => updateSticker(selectedSticker.id, { size: Number(e.target.value) })}
              aria-label="스티커 크기"
            />
          </div>

          <div className="props-section">
            <div className="props-section-title">위치 X / Y</div>
            <div className="prop-row">
              <span className="prop-label">X</span>
              <input type="range" className="prop-slider" min={0} max={100}
                value={selectedSticker.x}
                onChange={(e) => updateSticker(selectedSticker.id, { x: Number(e.target.value) })}
                aria-label="스티커 X 위치" style={{ width: "100%" }} />
            </div>
            <div className="prop-row">
              <span className="prop-label">Y</span>
              <input type="range" className="prop-slider" min={0} max={100}
                value={selectedSticker.y}
                onChange={(e) => updateSticker(selectedSticker.id, { y: Number(e.target.value) })}
                aria-label="스티커 Y 위치" style={{ width: "100%" }} />
            </div>
          </div>

          <div className="props-section">
            <button
              type="button"
              className="btn-danger"
              onClick={() => removeSticker(selectedSticker.id)}
              aria-label="스티커 삭제"
            >
              스티커 삭제
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // ── Audio clip ─────────────────────────────────────────────────────────────
  if (audioClip) {
    return (
      <aside className="props-panel" aria-label="오디오 속성">
        <div className="props-header">배경음악</div>
        <div className="props-body">
          <div className="props-section">
            <div className="props-section-title">현재 음악</div>
            <div className="prop-row">
              <span className="prop-label">이름</span>
              <span className="prop-value" style={{ fontSize: 11 }}>{audioClip.name}</span>
            </div>
          </div>
          <div className="props-section">
            <button type="button" className="btn-danger" onClick={() => setAudioClip(null)} aria-label="배경음악 제거">
              음악 제거
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // ── Nothing selected ──────────────────────────────────────────────────────
  return (
    <aside className="props-panel" aria-label="속성 패널">
      <div className="props-header">속성</div>
      <div className="props-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 8v4m0 4h.01"/>
        </svg>
        <p>클립이나 자막을 선택하면<br />속성이 여기에 표시됩니다</p>
      </div>
    </aside>
  );
}
