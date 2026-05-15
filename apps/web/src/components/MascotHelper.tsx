"use client";

import { useEditorStore } from "@/store/editorStore";

export default function MascotHelper() {
  const videoClips = useEditorStore((s) => s.videoClips);
  const step = useEditorStore((s) => s.step);

  let message = "여기에 영상을 끌어다 놓아봐요! 🎬";
  if (videoClips.length > 0 && step !== 3) {
    message = "잘 하고 있어요! 자르고 싶은 곳을 골라봐요 ✂";
  }
  if (step === 3) {
    message = "완성됐어요! 저장 버튼을 눌러봐요 💾";
  }

  return (
    <div className="mascot" aria-live="polite">
      <div className="mascot-bubble" role="status">
        {message}
      </div>
      <div className="mascot-character" aria-hidden="true">
        <svg viewBox="0 0 100 100" width="80" height="80">
          <circle cx="50" cy="50" r="42" fill="#FFD93D" stroke="#F4B400" strokeWidth="3" />
          <circle cx="37" cy="45" r="5" fill="#222" />
          <circle cx="63" cy="45" r="5" fill="#222" />
          <path
            d="M35 62 Q50 75 65 62"
            stroke="#222"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="25" cy="60" r="4" fill="#FF9AA2" opacity="0.7" />
          <circle cx="75" cy="60" r="4" fill="#FF9AA2" opacity="0.7" />
        </svg>
      </div>
    </div>
  );
}
