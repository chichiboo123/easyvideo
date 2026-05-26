"use client";

interface Props { onClose: () => void }

const ROWS: Array<{ key: string; desc: string }> = [
  { key: "Space / K", desc: "재생 / 일시정지" },
  { key: "J", desc: "5초 뒤로" },
  { key: "L", desc: "5초 앞으로" },
  { key: "← / →", desc: "1초 뒤/앞 (Shift = 5초)" },
  { key: "S", desc: "현재 위치에서 클립 분할" },
  { key: "M", desc: "현재 위치에 마커 추가" },
  { key: "F", desc: "전체화면 전환" },
  { key: "Delete / Backspace", desc: "선택 항목 삭제" },
  { key: "Ctrl / ⌘ + Z", desc: "되돌리기" },
  { key: "Ctrl / ⌘ + Shift + Z", desc: "다시 실행" },
  { key: "Ctrl / ⌘ + Y", desc: "다시 실행" },
  { key: "Ctrl / ⌘ + D", desc: "선택 항목 복제" },
  { key: "+ / -", desc: "타임라인 확대 / 축소" },
  { key: "?", desc: "이 도움말 열기" },
];

export default function ShortcutsModal({ onClose }: Props) {
  return (
    <div className="export-overlay" role="dialog" aria-modal="true" aria-label="단축키 도움말"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="export-modal" style={{ width: 420 }}>
        <h2>⌨ 단축키 도움말</h2>
        <ul className="shortcut-list">
          {ROWS.map((r) => (
            <li key={r.key} className="shortcut-row">
              <kbd className="shortcut-key">{r.key}</kbd>
              <span className="shortcut-desc">{r.desc}</span>
            </li>
          ))}
        </ul>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
          입력 칸에 글자를 쓰는 동안에는 단축키가 작동하지 않아요.
        </p>
        <div className="export-action-row">
          <button type="button" className="btn-primary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
