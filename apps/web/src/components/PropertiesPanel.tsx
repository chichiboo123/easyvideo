"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { FONTS, fontCategoryLabel, type FontSpec } from "@/lib/fonts";
import { CAPTION_PRESET_GROUPS } from "@/lib/captionPresets";
import { TRANSITIONS, TRANSITION_GROUPS, transitionLabel } from "@/lib/transitions";
import type { Caption, CaptionAnimation, TransitionType } from "@/types";

const CAPTION_SWATCHES = [
  "#FFFFFF","#000000","#FF4D4D","#FF8A3D","#FFD93D","#4CD964","#3D8BFF","#9B6DFF","#FF6BB6","#A78BFA",
];
const SHADOW_SWATCHES = ["rgba(0,0,0,0.7)","rgba(0,0,0,1)","rgba(0,0,0,0.3)","rgba(254,44,85,0.6)","rgba(61,139,255,0.6)"];

const ANIM_OPTIONS: { value: CaptionAnimation; label: string }[] = [
  { value: "none", label: "없음" },
  { value: "fade", label: "페이드" },
  { value: "slide-up", label: "아래→위 슬라이드" },
  { value: "slide-down", label: "위→아래 슬라이드" },
  { value: "slide-left", label: "오른쪽→왼쪽" },
  { value: "slide-right", label: "왼쪽→오른쪽" },
  { value: "zoom-in", label: "줌 인" },
  { value: "zoom-out", label: "줌 아웃" },
  { value: "bounce", label: "통통" },
  { value: "pop", label: "팝" },
  { value: "typewriter", label: "타자기" },
  { value: "shake", label: "흔들기" },
  { value: "blink", label: "깜빡임" },
];

const POSITIONS: { x: number; y: number; label: string }[] = [
  { x: 50, y: 10, label: "상단 중앙" },
  { x: 10, y: 10, label: "상단 좌측" },
  { x: 90, y: 10, label: "상단 우측" },
  { x: 50, y: 50, label: "정중앙" },
  { x: 50, y: 85, label: "하단 중앙" },
  { x: 10, y: 85, label: "하단 좌측" },
  { x: 90, y: 85, label: "하단 우측" },
];


function formatDur(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 100);
  return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

function PropsSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="props-section">
      <button
        type="button"
        className="props-section-title-btn"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="props-section-body">{children}</div>}
    </div>
  );
}

export default function PropertiesPanel() {
  const s = useEditorStore();
  const selectedClip = s.videoClips.find((c) => c.id === s.selectedClipId);
  const selectedCaption = s.captions.find((c) => c.id === s.selectedCaptionId);
  const selectedSticker = s.stickers.find((x) => x.id === s.selectedStickerId);
  const selectedImage = s.images.find((x) => x.id === s.selectedImageId);
  const selectedAudio = s.audioClips.find((a) => a.id === s.selectedAudioId);

  // ── Video clip ────────────────────────────────────────────────────────────
  if (selectedClip) {
    const clipIdx = s.videoClips.findIndex((c) => c.id === selectedClip.id);
    const offset = s.clipOffsets()[clipIdx] ?? 0;
    return (
      <aside className="props-panel" aria-label="비디오 클립 속성">
        <div className="props-header">비디오 클립</div>
        <div className="props-body">
          <PropsSection title="정보">
            <div className="prop-row"><span className="prop-label">이름</span><span className="prop-value">{selectedClip.name}</span></div>
            <div className="prop-row"><span className="prop-label">길이</span><span className="prop-value">{formatDur(selectedClip.duration)}</span></div>
            <div className="prop-row"><span className="prop-label">시작 위치</span><span className="prop-value">{formatDur(offset)}</span></div>
          </PropsSection>

          <PropsSection title="트림 (인/아웃)">
            <div className="prop-row">
              <span className="prop-label">인점</span>
              <input type="number" step={0.1} className="prop-input" style={{ width: 80 }}
                value={selectedClip.inPoint.toFixed(2)}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(selectedClip.outPoint - 0.1, Number(e.target.value)));
                  s.updateVideoClip(selectedClip.id, { inPoint: v, duration: selectedClip.outPoint - v });
                }}
                aria-label="인점(초)"
              />
            </div>
            <div className="prop-row">
              <span className="prop-label">아웃점</span>
              <input type="number" step={0.1} className="prop-input" style={{ width: 80 }}
                value={selectedClip.outPoint.toFixed(2)}
                onChange={(e) => {
                  const max = selectedClip.sourceDuration ?? Number.POSITIVE_INFINITY;
                  const v = Math.max(selectedClip.inPoint + 0.1, Math.min(max, Number(e.target.value)));
                  s.updateVideoClip(selectedClip.id, { outPoint: v, duration: v - selectedClip.inPoint });
                }}
                aria-label="아웃점(초)"
              />
            </div>
          </PropsSection>

          <PropsSection title="속도">
            <div className="speed-grid">
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4].map((sp) => (
                <button key={sp} type="button"
                  className={`speed-btn ${selectedClip.speed === sp ? "active" : ""}`}
                  onClick={() => s.updateVideoClip(selectedClip.id, { speed: sp })}
                >{sp}×</button>
              ))}
            </div>
            <input type="range" className="prop-slider" min={0.25} max={4} step={0.05}
              value={selectedClip.speed}
              onChange={(e) => s.updateVideoClip(selectedClip.id, { speed: Number(e.target.value) })}
              aria-label="속도 슬라이더"
            />
            <div className="prop-row"><span className="prop-label">속도</span><span className="prop-value">{selectedClip.speed.toFixed(2)}×</span></div>
          </PropsSection>

          <PropsSection title="볼륨 / 페이드">
            <div className="prop-row"><span className="prop-label">볼륨</span><span className="prop-value">{Math.round(selectedClip.volume * 100)}%</span></div>
            <input type="range" className="prop-slider" min={0} max={2} step={0.05}
              value={selectedClip.volume}
              onChange={(e) => s.updateVideoClip(selectedClip.id, { volume: Number(e.target.value) })}
              aria-label="클립 볼륨"
            />
            <div className="prop-row"><span className="prop-label">페이드 인</span>
              <input type="number" step={0.1} min={0} max={5} className="prop-input" style={{ width: 64 }}
                value={selectedClip.fadeIn}
                onChange={(e) => s.updateVideoClip(selectedClip.id, { fadeIn: Math.max(0, Number(e.target.value)) })}
              />
            </div>
            <div className="prop-row"><span className="prop-label">페이드 아웃</span>
              <input type="number" step={0.1} min={0} max={5} className="prop-input" style={{ width: 64 }}
                value={selectedClip.fadeOut}
                onChange={(e) => s.updateVideoClip(selectedClip.id, { fadeOut: Math.max(0, Number(e.target.value)) })}
              />
            </div>
          </PropsSection>

          {clipIdx < s.videoClips.length - 1 && (
            <PropsSection title="다음 클립과의 전환">
              <select className="prop-input"
                value={selectedClip.transitionAfter ?? "__default__"}
                onChange={(e) => {
                  const v = e.target.value;
                  s.updateVideoClip(selectedClip.id, {
                    transitionAfter: v === "__default__" ? null : (v as TransitionType),
                  });
                }}
                aria-label="다음 클립과의 장면 전환"
              >
                <option value="__default__">기본값 따르기 ({transitionLabel(s.transitionType)})</option>
                {TRANSITION_GROUPS.map((g) => (
                  <optgroup key={g} label={g}>
                    {TRANSITIONS.filter((t) => t.group === g).map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                이 클립이 끝나고 <strong>{s.videoClips[clipIdx + 1]?.name}</strong>(으)로
                넘어갈 때의 전환 효과예요.
              </p>
            </PropsSection>
          )}

          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="btn-secondary-half" onClick={() => s.duplicateVideoClip(selectedClip.id)}>복제</button>
            <button type="button" className="btn-danger-half" onClick={() => s.removeVideoClip(selectedClip.id)}>삭제</button>
          </div>
        </div>
      </aside>
    );
  }

  // ── Caption ───────────────────────────────────────────────────────────────
  if (selectedCaption) {
    const c = selectedCaption;
    const update = (patch: Partial<Caption>) => s.updateCaption(c.id, patch);

    // group fonts by category
    const groupedFonts = FONTS.reduce<Record<string, FontSpec[]>>((acc, f) => {
      (acc[f.category] ||= []).push(f); return acc;
    }, {});
    const categoryOrder: FontSpec["category"][] = ["kr-sans","kr-serif","kr-handwriting","display","sans","serif","handwriting","mono"];

    return (
      <aside className="props-panel" aria-label="자막 속성">
        <div className="props-header">텍스트 자막</div>
        <div className="props-body">

          <PropsSection title="텍스트">
            <textarea
              className="prop-input"
              style={{ minHeight: 70, fontFamily: c.fontFamily }}
              value={c.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="자막 입력"
              aria-label="자막 텍스트"
            />
            <div className="prop-preview" style={{
              background: "#0a0a0a",
              padding: 12, borderRadius: 6, textAlign: c.align as any,
              fontFamily: c.fontFamily, fontWeight: c.fontWeight,
              fontStyle: c.italic ? "italic" : "normal",
              textDecoration: [c.underline && "underline", c.strikethrough && "line-through"].filter(Boolean).join(" ") || "none",
              color: c.color,
              fontSize: Math.min(28, c.fontSize / 2),
              letterSpacing: c.letterSpacing,
              lineHeight: c.lineHeight,
              WebkitTextStroke: c.strokeWidth > 0 ? `${c.strokeWidth / 2}px ${c.strokeColor}` : "0",
              textShadow: c.shadowBlur > 0
                ? `${c.shadowOffsetX}px ${c.shadowOffsetY}px ${c.shadowBlur}px ${c.shadowColor}`
                : "none",
            }}>
              <span style={{
                background: c.backgroundColor !== "transparent" ? c.backgroundColor : "transparent",
                padding: c.backgroundColor !== "transparent" ? `${c.bgPadding / 2}px ${c.bgPadding}px` : "0",
                borderRadius: c.bgBorderRadius / 2,
              }}>{c.text || "미리보기"}</span>
            </div>
          </PropsSection>

          <PropsSection title="용도별 프리셋">
            <div className="preset-groups">
              {CAPTION_PRESET_GROUPS.map((g) => (
                <div key={g.group} className="preset-group">
                  <div className="preset-group-title">{g.emoji} {g.group}</div>
                  <div className="text-presets">
                    {g.presets.map((p) => {
                      // Keep the caption's own text/timing; apply only the look.
                      const { x: _x, y: _y, ...styleOnly } = p.patch;
                      return (
                        <button key={p.name} type="button" className="text-preset"
                          style={{ fontFamily: p.patch.fontFamily }}
                          onClick={() => update(styleOnly)}
                          title={`${p.name} 스타일 적용`}
                        >{p.name}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </PropsSection>

          <PropsSection title="폰트">
            <select className="prop-input" value={c.fontFamily} onChange={(e) => update({ fontFamily: e.target.value })} aria-label="폰트 선택">
              {categoryOrder.map((cat) => (
                <optgroup key={cat} label={fontCategoryLabel(cat)}>
                  {(groupedFonts[cat] ?? []).map((f) => (
                    <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>{f.family}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="prop-row">
              <span className="prop-label">크기 {c.fontSize}px</span>
              <input type="range" className="prop-slider" min={12} max={140} step={1}
                value={c.fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                aria-label="자막 크기"
              />
            </div>
            <div className="prop-row">
              <span className="prop-label">굵기</span>
              <select className="prop-input" style={{ width: 90 }} value={c.fontWeight} onChange={(e) => update({ fontWeight: Number(e.target.value) })}>
                {[300, 400, 500, 600, 700, 800, 900].map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="prop-row">
              <button type="button" className={`tl-btn ${c.italic ? "active" : ""}`} onClick={() => update({ italic: !c.italic })} aria-pressed={c.italic} title="기울임">I</button>
              <button type="button" className={`tl-btn ${c.underline ? "active" : ""}`} onClick={() => update({ underline: !c.underline })} aria-pressed={c.underline} title="밑줄">U</button>
              <button type="button" className={`tl-btn ${c.strikethrough ? "active" : ""}`} onClick={() => update({ strikethrough: !c.strikethrough })} aria-pressed={c.strikethrough} title="취소선">S</button>
              <div style={{ width: 8 }} />
              {(["left", "center", "right"] as const).map((al) => (
                <button key={al} type="button"
                  className={`tl-btn ${c.align === al ? "active" : ""}`}
                  onClick={() => update({ align: al })}
                  title={`정렬: ${al}`}
                  aria-pressed={c.align === al}
                >{al === "left" ? "≡←" : al === "center" ? "≡" : "→≡"}</button>
              ))}
            </div>
            <div className="prop-row">
              <span className="prop-label">자간 {c.letterSpacing}px</span>
              <input type="range" className="prop-slider" min={-2} max={10} step={0.5}
                value={c.letterSpacing}
                onChange={(e) => update({ letterSpacing: Number(e.target.value) })}
              />
            </div>
            <div className="prop-row">
              <span className="prop-label">줄 간격 {c.lineHeight.toFixed(1)}</span>
              <input type="range" className="prop-slider" min={0.8} max={2.5} step={0.1}
                value={c.lineHeight}
                onChange={(e) => update({ lineHeight: Number(e.target.value) })}
              />
            </div>
          </PropsSection>

          <PropsSection title="색상 / 외곽선 / 그림자">
            <div className="label-row" style={{ marginBottom: 4 }}><span>글자색</span></div>
            <div className="color-swatch-row">
              {CAPTION_SWATCHES.map((sw) => (
                <button key={sw} type="button"
                  className={`color-swatch ${c.color === sw ? "active" : ""}`}
                  style={{ background: sw, outline: sw === "#FFFFFF" ? "1px solid #555" : undefined }}
                  onClick={() => update({ color: sw })}
                  aria-label={sw}
                />
              ))}
              <input type="color" className="prop-input" style={{ width: 30, height: 28, padding: 2 }}
                value={c.color.startsWith("#") ? c.color : "#FFFFFF"}
                onChange={(e) => update({ color: e.target.value })}
                aria-label="커스텀 글자색"
              />
            </div>

            <div className="label-row" style={{ marginTop: 8 }}><span>외곽선</span></div>
            <div className="prop-row">
              <input type="color" style={{ width: 36, height: 28, padding: 0, border: "none", background: "transparent" }}
                value={c.strokeColor.startsWith("#") ? c.strokeColor : "#000000"}
                onChange={(e) => update({ strokeColor: e.target.value })}
                aria-label="외곽선 색"
              />
              <input type="range" className="prop-slider" min={0} max={12} step={0.5}
                value={c.strokeWidth}
                onChange={(e) => update({ strokeWidth: Number(e.target.value) })}
                aria-label="외곽선 굵기"
              />
              <span className="prop-value">{c.strokeWidth}px</span>
            </div>

            <div className="label-row" style={{ marginTop: 8 }}><span>그림자</span></div>
            <div className="color-swatch-row">
              {SHADOW_SWATCHES.map((sw) => (
                <button key={sw} type="button"
                  className={`color-swatch ${c.shadowColor === sw ? "active" : ""}`}
                  style={{ background: sw, width: 22, height: 22 }}
                  onClick={() => update({ shadowColor: sw })}
                  aria-label="그림자 색상"
                />
              ))}
            </div>
            <div className="prop-row">
              <span className="prop-label">번짐 {c.shadowBlur}px</span>
              <input type="range" className="prop-slider" min={0} max={24} step={1}
                value={c.shadowBlur}
                onChange={(e) => update({ shadowBlur: Number(e.target.value) })}
              />
            </div>
            <div className="prop-row">
              <span className="prop-label">오프셋 X</span>
              <input type="number" step={1} className="prop-input" style={{ width: 60 }}
                value={c.shadowOffsetX} onChange={(e) => update({ shadowOffsetX: Number(e.target.value) })} />
              <span className="prop-label">Y</span>
              <input type="number" step={1} className="prop-input" style={{ width: 60 }}
                value={c.shadowOffsetY} onChange={(e) => update({ shadowOffsetY: Number(e.target.value) })} />
            </div>
          </PropsSection>

          <PropsSection title="배경 박스" defaultOpen={false}>
            <div className="prop-row">
              <input type="color" style={{ width: 36, height: 28, padding: 0, border: "none", background: "transparent" }}
                value={c.backgroundColor === "transparent" ? "#000000" : c.backgroundColor}
                onChange={(e) => update({ backgroundColor: e.target.value })}
                aria-label="배경색"
              />
              <button type="button" className="tl-btn" onClick={() => update({ backgroundColor: "transparent" })} aria-pressed={c.backgroundColor === "transparent"}>투명</button>
            </div>
            <div className="prop-row">
              <span className="prop-label">여백 {c.bgPadding}px</span>
              <input type="range" className="prop-slider" min={0} max={30} step={1}
                value={c.bgPadding} onChange={(e) => update({ bgPadding: Number(e.target.value) })} />
            </div>
            <div className="prop-row">
              <span className="prop-label">둥근 모서리 {c.bgBorderRadius}px</span>
              <input type="range" className="prop-slider" min={0} max={30} step={1}
                value={c.bgBorderRadius} onChange={(e) => update({ bgBorderRadius: Number(e.target.value) })} />
            </div>
          </PropsSection>

          <PropsSection title="위치 / 회전" defaultOpen={false}>
            <div className="pos-grid">
              {POSITIONS.map((p) => (
                <button key={p.label} type="button" className="pos-btn" title={p.label}
                  onClick={() => update({ x: p.x, y: p.y })}
                  style={{ background: c.x === p.x && c.y === p.y ? "var(--accent-soft)" : undefined, color: c.x === p.x && c.y === p.y ? "var(--accent)" : undefined }}
                  aria-label={p.label}
                >●</button>
              ))}
            </div>
            <div className="prop-row">
              <span className="prop-label">X {c.x.toFixed(0)}%</span>
              <input type="range" className="prop-slider" min={0} max={100} step={1}
                value={c.x} onChange={(e) => update({ x: Number(e.target.value) })} />
            </div>
            <div className="prop-row">
              <span className="prop-label">Y {c.y.toFixed(0)}%</span>
              <input type="range" className="prop-slider" min={0} max={100} step={1}
                value={c.y} onChange={(e) => update({ y: Number(e.target.value) })} />
            </div>
            <div className="prop-row">
              <span className="prop-label">회전 {c.rotation}°</span>
              <input type="range" className="prop-slider" min={-180} max={180} step={1}
                value={c.rotation} onChange={(e) => update({ rotation: Number(e.target.value) })} />
            </div>
          </PropsSection>

          <PropsSection title="타이밍 / 애니메이션" defaultOpen={false}>
            <div className="prop-row">
              <span className="prop-label">시작</span>
              <input type="number" step={0.1} className="prop-input" style={{ width: 70 }}
                value={c.startTime.toFixed(1)}
                onChange={(e) => update({ startTime: Math.max(0, Math.min(c.endTime - 0.1, Number(e.target.value))) })} />
              <span className="prop-label">끝</span>
              <input type="number" step={0.1} className="prop-input" style={{ width: 70 }}
                value={c.endTime.toFixed(1)}
                onChange={(e) => update({ endTime: Math.max(c.startTime + 0.1, Number(e.target.value)) })} />
            </div>
            <div className="prop-row">
              <span className="prop-label">등장</span>
              <select className="prop-input" value={c.animationIn} onChange={(e) => update({ animationIn: e.target.value as CaptionAnimation })}>
                {ANIM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="prop-row">
              <span className="prop-label">퇴장</span>
              <select className="prop-input" value={c.animationOut} onChange={(e) => update({ animationOut: e.target.value as CaptionAnimation })}>
                {ANIM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="prop-row">
              <span className="prop-label">길이 {c.animationDuration.toFixed(1)}s</span>
              <input type="range" className="prop-slider" min={0.1} max={2} step={0.1}
                value={c.animationDuration} onChange={(e) => update({ animationDuration: Number(e.target.value) })} />
            </div>
          </PropsSection>

          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="btn-secondary-half" onClick={() => s.duplicateCaption(c.id)} title="자막 복제">복제</button>
            <button type="button" className="btn-secondary-half" onClick={() => s.applyCaptionStyleToAll(c.id)} title="모든 자막에 같은 스타일 적용">전체 적용</button>
            <button type="button" className="btn-danger-half" onClick={() => s.removeCaption(c.id)}>삭제</button>
          </div>
        </div>
      </aside>
    );
  }

  // ── Sticker ───────────────────────────────────────────────────────────────
  if (selectedSticker) {
    return (
      <aside className="props-panel" aria-label="스티커 속성">
        <div className="props-header">스티커</div>
        <div className="props-body">
          <PropsSection title="크기 / 회전">
            <input type="range" className="prop-slider" min={24} max={200} value={selectedSticker.size}
              onChange={(e) => s.updateSticker(selectedSticker.id, { size: Number(e.target.value) })} />
            <div className="prop-row">
              <span className="prop-label">회전 {selectedSticker.rotation}°</span>
              <input type="range" className="prop-slider" min={-180} max={180}
                value={selectedSticker.rotation}
                onChange={(e) => s.updateSticker(selectedSticker.id, { rotation: Number(e.target.value) })} />
            </div>
          </PropsSection>
          <PropsSection title="타이밍">
            <div className="prop-row">
              <span className="prop-label">시작</span>
              <input type="number" step={0.1} className="prop-input" style={{ width: 70 }}
                value={selectedSticker.startTime.toFixed(1)}
                onChange={(e) => s.updateSticker(selectedSticker.id, { startTime: Number(e.target.value) })} />
              <span className="prop-label">끝</span>
              <input type="number" step={0.1} className="prop-input" style={{ width: 70 }}
                value={selectedSticker.endTime.toFixed(1)}
                onChange={(e) => s.updateSticker(selectedSticker.id, { endTime: Number(e.target.value) })} />
            </div>
          </PropsSection>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="btn-secondary-half" onClick={() => s.duplicateSticker(selectedSticker.id)}>복제</button>
            <button type="button" className="btn-danger-half" onClick={() => s.removeSticker(selectedSticker.id)}>삭제</button>
          </div>
        </div>
      </aside>
    );
  }

  // ── Image overlay ─────────────────────────────────────────────────────────
  if (selectedImage) {
    return (
      <aside className="props-panel" aria-label="이미지 속성">
        <div className="props-header">이미지</div>
        <div className="props-body">
          <PropsSection title="크기 / 회전">
            <input type="range" className="prop-slider" min={5} max={100} value={selectedImage.width}
              onChange={(e) => s.updateImage(selectedImage.id, { width: Number(e.target.value) })} />
            <div className="prop-row">
              <span className="prop-label">회전 {selectedImage.rotation}°</span>
              <input type="range" className="prop-slider" min={-180} max={180}
                value={selectedImage.rotation}
                onChange={(e) => s.updateImage(selectedImage.id, { rotation: Number(e.target.value) })} />
            </div>
          </PropsSection>
          <PropsSection title="타이밍">
            <div className="prop-row">
              <span className="prop-label">시작</span>
              <input type="number" step={0.1} className="prop-input" style={{ width: 70 }}
                value={selectedImage.startTime.toFixed(1)}
                onChange={(e) => s.updateImage(selectedImage.id, { startTime: Number(e.target.value) })} />
              <span className="prop-label">끝</span>
              <input type="number" step={0.1} className="prop-input" style={{ width: 70 }}
                value={selectedImage.endTime.toFixed(1)}
                onChange={(e) => s.updateImage(selectedImage.id, { endTime: Number(e.target.value) })} />
            </div>
          </PropsSection>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="btn-secondary-half" onClick={() => s.duplicateImage(selectedImage.id)}>복제</button>
            <button type="button" className="btn-danger-half" onClick={() => s.removeImage(selectedImage.id)}>삭제</button>
          </div>
        </div>
      </aside>
    );
  }

  // ── Audio ─────────────────────────────────────────────────────────────────
  if (selectedAudio) {
    const a = selectedAudio;
    return (
      <aside className="props-panel" aria-label="오디오 속성">
        <div className="props-header">오디오 트랙</div>
        <div className="props-body">
          <PropsSection title="정보">
            <div className="prop-row"><span className="prop-label">이름</span><span className="prop-value">{a.name}</span></div>
            <div className="prop-row"><span className="prop-label">트랙</span><span className="prop-value">M{a.track ?? 1}</span></div>
          </PropsSection>
          <PropsSection title="볼륨 / 페이드">
            <div className="prop-row"><span className="prop-label">볼륨</span><span className="prop-value">{Math.round((a.volume ?? 1) * 100)}%</span></div>
            <input type="range" className="prop-slider" min={0} max={2} step={0.05}
              value={a.volume ?? 1}
              onChange={(e) => s.updateAudioClip(a.id, { volume: Number(e.target.value) })}
              aria-label="오디오 볼륨"
            />
            <div className="prop-row"><span className="prop-label">페이드 인</span>
              <input type="number" step={0.1} min={0} max={10} className="prop-input" style={{ width: 64 }}
                value={a.fadeIn ?? 0}
                onChange={(e) => s.updateAudioClip(a.id, { fadeIn: Math.max(0, Number(e.target.value)) })} />
            </div>
            <div className="prop-row"><span className="prop-label">페이드 아웃</span>
              <input type="number" step={0.1} min={0} max={10} className="prop-input" style={{ width: 64 }}
                value={a.fadeOut ?? 0}
                onChange={(e) => s.updateAudioClip(a.id, { fadeOut: Math.max(0, Number(e.target.value)) })} />
            </div>
          </PropsSection>
          <button type="button" className="btn-danger" onClick={() => s.removeAudioClip(a.id)}>오디오 삭제</button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="props-panel empty" aria-label="속성">
      <div className="props-empty-vertical" aria-hidden="true">속성</div>
      <span className="visually-hidden">요소를 선택하면 속성 편집 패널이 나타납니다.</span>
    </aside>
  );
}
