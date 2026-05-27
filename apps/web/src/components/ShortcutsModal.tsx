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

interface Credit { name: string; url: string; license: string; desc: string }
const CREDITS: Credit[] = [
  { name: "OpenCut", url: "https://github.com/OpenCut-app/OpenCut", license: "MIT",
    desc: "트랙·트림·트랜지션 구조를 참고했어요" },
  { name: "FFmpeg.wasm", url: "https://github.com/ffmpegwasm/ffmpeg.wasm", license: "MIT",
    desc: "브라우저에서 영상을 합치고 내보내요" },
  { name: "Next.js", url: "https://github.com/vercel/next.js", license: "MIT",
    desc: "앱 프레임워크" },
  { name: "Zustand", url: "https://github.com/pmndrs/zustand", license: "MIT",
    desc: "상태 관리 + 되돌리기" },
  { name: "Google Fonts", url: "https://fonts.google.com/", license: "OFL/Apache",
    desc: "자막용 102종 웹폰트" },
];

export default function ShortcutsModal({ onClose }: Props) {
  return (
    <div className="export-overlay" role="dialog" aria-modal="true" aria-label="도움말"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="export-modal help-modal">
        <h2>도움말</h2>

        <section className="help-section">
          <h3 className="help-section-title">⌨ 단축키</h3>
          <ul className="shortcut-list">
            {ROWS.map((r) => (
              <li key={r.key} className="shortcut-row">
                <kbd className="shortcut-key">{r.key}</kbd>
                <span className="shortcut-desc">{r.desc}</span>
              </li>
            ))}
          </ul>
          <p className="help-note">입력 칸에 글자를 쓰는 동안에는 단축키가 작동하지 않아요.</p>
        </section>

        <section className="help-section">
          <h3 className="help-section-title">💡 전환 효과 사용 안내</h3>
          <p className="help-note">
            전환 효과는 <strong>이어진 클립 사이</strong> — 앞 클립의 <em>끝</em>과 뒤 클립의 <em>시작</em>이
            만나는 지점에 적용됩니다. <strong>S 키</strong>로 클립을 분할하면 두 클립 사이에 자동으로 전환이 들어가요.
          </p>
        </section>

        <section className="help-section">
          <h3 className="help-section-title">🧩 참고한 오픈소스</h3>
          <ul className="credit-list">
            {CREDITS.map((c) => (
              <li key={c.name} className="credit-row">
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="credit-name">
                  {c.name}
                </a>
                <span className="credit-license">{c.license}</span>
                <span className="credit-desc">{c.desc}</span>
              </li>
            ))}
          </ul>
          <p className="help-note">
            모든 원작자에게 감사드립니다. 라이선스 전문은 저장소의 <code>LICENSE</code> 파일을 참고하세요.
          </p>
        </section>

        <div className="export-action-row">
          <button type="button" className="btn-primary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
