"use client";

import { useEditorStore } from "@/store/editorStore";
import type { CaptionColor } from "@/types";

const SPEEDS = [0.5, 1, 1.5, 2];
const CAPTION_FONTS = [
  "Noto Sans KR", "Nanum Gothic", "Do Hyeon", "Gowun Dodum", "Black Han Sans",
  "Roboto", "Montserrat", "Poppins", "Inter", "Oswald", "Lobster", "Playfair Display",
];
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
  const s = useEditorStore();
  const selectedClip = s.videoClips.find((c) => c.id === s.selectedClipId);
  const selectedCaption = s.captions.find((c) => c.id === s.selectedCaptionId);
  const selectedSticker = s.stickers.find((x) => x.id === s.selectedStickerId);
  const selectedImage = s.images.find((x) => x.id === s.selectedImageId);

  if (selectedClip) {
    const clipIdx = s.videoClips.findIndex((c) => c.id === selectedClip.id);
    const offset = s.clipOffsets()[clipIdx] ?? 0;
    return <aside className="props-panel"><div className="props-header">비디오 클립</div><div className="props-body">
      <div className="props-section"><div className="props-section-title">정보</div>
        <div className="prop-row"><span className="prop-label">이름</span><span className="prop-value">{selectedClip.name}</span></div>
        <div className="prop-row"><span className="prop-label">길이</span><span className="prop-value">{formatDur(selectedClip.duration)}</span></div>
        <div className="prop-row"><span className="prop-label">시작 위치</span><span className="prop-value">{formatDur(offset)}</span></div>
      </div>
      <div className="props-section"><div className="props-section-title">속도 (미리보기)</div><div className="speed-grid">{SPEEDS.map((sp)=><button key={sp} type="button" className={`speed-btn ${sp===1?"active":""}`} disabled>{sp}×</button>)}</div></div>
      <button type="button" className="btn-danger" onClick={() => s.removeVideoClip(selectedClip.id)}>클립 삭제</button>
    </div></aside>;
  }

  if (selectedCaption) {
    return <aside className="props-panel"><div className="props-header">텍스트 자막</div><div className="props-body">
      <div className="props-section"><div className="props-section-title">텍스트</div><textarea className="prop-input" style={{ minHeight: 64 }} value={selectedCaption.text} onChange={(e)=>s.updateCaption(selectedCaption.id,{ text:e.target.value })} /></div>
      <div className="props-section"><div className="props-section-title">폰트 / 색상 / 배경</div>
        <select className="prop-input" value={selectedCaption.fontFamily} onChange={(e)=>s.updateCaption(selectedCaption.id,{ fontFamily:e.target.value })}>{CAPTION_FONTS.map((f)=><option key={f} value={f}>{f}</option>)}</select>
        <div className="color-swatch-row" style={{ marginTop: 8 }}>{CAPTION_COLORS.map((c)=><button key={c.value} type="button" className={`color-swatch ${selectedCaption.color===c.value?"active":""}`} style={{ background:c.value, width:24,height:24 }} onClick={()=>s.updateCaption(selectedCaption.id,{ color:c.value })} />)}</div>
        <div className="prop-row" style={{ marginTop: 8 }}><span className="prop-label">배경색</span><input type="color" className="prop-input" style={{ width: 56, height: 28, padding: 2 }} value={selectedCaption.backgroundColor === "transparent" ? "#111111" : selectedCaption.backgroundColor} onChange={(e)=>s.updateCaption(selectedCaption.id,{ backgroundColor:e.target.value })} /><button type="button" className="tl-btn" onClick={()=>s.updateCaption(selectedCaption.id,{ backgroundColor:"transparent" })}>투명</button></div>
      </div>
      <div className="props-section"><div className="props-section-title">애니메이션</div>
        <div className="prop-row"><span className="prop-label">등장</span><select className="prop-input" value={selectedCaption.animationIn} onChange={(e)=>s.updateCaption(selectedCaption.id,{ animationIn:e.target.value as "none"|"fade" })}><option value="fade">페이드인</option><option value="none">없음</option></select></div>
        <div className="prop-row"><span className="prop-label">퇴장</span><select className="prop-input" value={selectedCaption.animationOut} onChange={(e)=>s.updateCaption(selectedCaption.id,{ animationOut:e.target.value as "none"|"fade" })}><option value="fade">페이드아웃</option><option value="none">없음</option></select></div>
      </div>
      <button type="button" className="btn-danger" onClick={() => s.removeCaption(selectedCaption.id)}>자막 삭제</button>
    </div></aside>;
  }

  if (selectedSticker) {
    return <aside className="props-panel"><div className="props-header">스티커</div><div className="props-body">
      <div className="props-section"><div className="props-section-title">크기/시간/애니메이션</div>
        <input type="range" className="prop-slider" min={24} max={160} value={selectedSticker.size} onChange={(e)=>s.updateSticker(selectedSticker.id,{ size:Number(e.target.value) })} />
        <div className="prop-row"><span className="prop-label">시작</span><input type="number" className="prop-input" style={{ width: 70 }} value={selectedSticker.startTime.toFixed(1)} onChange={(e)=>s.updateSticker(selectedSticker.id,{ startTime:Number(e.target.value) })} /></div>
        <div className="prop-row"><span className="prop-label">끝</span><input type="number" className="prop-input" style={{ width: 70 }} value={selectedSticker.endTime.toFixed(1)} onChange={(e)=>s.updateSticker(selectedSticker.id,{ endTime:Number(e.target.value) })} /></div>
      </div>
      <button type="button" className="btn-danger" onClick={() => s.removeSticker(selectedSticker.id)}>스티커 삭제</button>
    </div></aside>;
  }

  if (selectedImage) {
    return <aside className="props-panel"><div className="props-header">이미지</div><div className="props-body">
      <div className="props-section"><div className="props-section-title">크기/시간/애니메이션</div>
        <input type="range" className="prop-slider" min={5} max={100} value={selectedImage.width} onChange={(e)=>s.updateImage(selectedImage.id,{ width:Number(e.target.value) })} />
        <div className="prop-row"><span className="prop-label">시작</span><input type="number" className="prop-input" style={{ width: 70 }} value={selectedImage.startTime.toFixed(1)} onChange={(e)=>s.updateImage(selectedImage.id,{ startTime:Number(e.target.value) })} /></div>
        <div className="prop-row"><span className="prop-label">끝</span><input type="number" className="prop-input" style={{ width: 70 }} value={selectedImage.endTime.toFixed(1)} onChange={(e)=>s.updateImage(selectedImage.id,{ endTime:Number(e.target.value) })} /></div>
      </div>
      <button type="button" className="btn-danger" onClick={() => s.removeImage(selectedImage.id)}>이미지 삭제</button>
    </div></aside>;
  }

  return <aside className="props-panel"><div className="props-header">속성</div><div className="props-empty"><p>요소를 선택하면 이곳에서 상세 편집합니다.</p></div></aside>;
}
