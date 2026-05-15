"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";

const STICKERS = [
  "😀", "😂", "🥰", "😎", "🤩", "🥳",
  "🐶", "🐱", "🦄", "🐼", "🐸", "🦊",
  "⭐", "✨", "💖", "🌈", "🌸", "🌟",
  "🍕", "🍔", "🍦", "🍩", "🍓", "🎂",
  "⚽", "🎮", "🎵", "🎨", "📚", "🚀",
];

export default function StickerPicker() {
  const addSticker = useEditorStore((s) => s.addSticker);
  const stickers = useEditorStore((s) => s.stickers);
  const removeSticker = useEditorStore((s) => s.removeSticker);
  const [open, setOpen] = useState(true);

  return (
    <section className="panel sticker-panel" aria-labelledby="sticker-heading">
      <button
        type="button"
        className="panel-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="sticker-body"
      >
        <span id="sticker-heading">🌟 스티커 붙이기</span>
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div id="sticker-body" className="panel-body">
          <p className="hint">붙이고 싶은 스티커를 골라보세요.</p>
          <div className="sticker-grid" role="list">
            {STICKERS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="listitem"
                className="sticker-btn"
                onClick={() => addSticker(emoji)}
                aria-label={`${emoji} 스티커 추가`}
                title={`${emoji} 스티커를 영상에 붙여요`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {stickers.length > 0 && (
            <div className="placed-list">
              <h4>붙인 스티커</h4>
              <ul>
                {stickers.map((s) => (
                  <li key={s.id}>
                    <span aria-hidden="true">{s.emoji}</span>
                    <button
                      type="button"
                      className="mini-btn"
                      onClick={() => removeSticker(s.id)}
                      aria-label={`${s.emoji} 스티커 삭제`}
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
