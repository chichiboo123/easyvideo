"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import type { CaptionColor } from "@/types";

const COLORS: { value: CaptionColor; label: string }[] = [
  { value: "#000000", label: "검정" },
  { value: "#FFFFFF", label: "흰색" },
  { value: "#FF4D4D", label: "빨강" },
  { value: "#3D8BFF", label: "파랑" },
  { value: "#FFD93D", label: "노랑" },
  { value: "#4CD964", label: "초록" },
];

export default function CaptionEditor() {
  const captions = useEditorStore((s) => s.captions);
  const addCaption = useEditorStore((s) => s.addCaption);
  const removeCaption = useEditorStore((s) => s.removeCaption);
  const updateCaption = useEditorStore((s) => s.updateCaption);

  const [text, setText] = useState("");
  const [color, setColor] = useState<CaptionColor>("#FFFFFF");
  const [open, setOpen] = useState(true);

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    addCaption(trimmed, color);
    setText("");
  }

  return (
    <section className="panel caption-panel" aria-labelledby="caption-heading">
      <button
        type="button"
        className="panel-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="caption-body"
      >
        <span id="caption-heading">💬 자막 넣기</span>
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div id="caption-body" className="panel-body">
          <label htmlFor="caption-input" className="visually-hidden">
            자막 내용
          </label>
          <input
            id="caption-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="여기에 글자를 적어요"
            className="big-input"
            aria-label="자막에 들어갈 글자"
            title="여기에 글자를 적어요"
          />

          <fieldset className="color-row">
            <legend className="visually-hidden">자막 색깔 고르기</legend>
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`color-dot${color === c.value ? " active" : ""}`}
                style={{ background: c.value }}
                onClick={() => setColor(c.value)}
                aria-label={`${c.label} 색`}
                aria-pressed={color === c.value}
                title={`${c.label} 색으로 자막을 만들어요`}
              />
            ))}
          </fieldset>

          <button
            type="button"
            className="big-btn btn-caption"
            onClick={handleAdd}
            aria-label="자막 추가하기"
            title="입력한 글자를 자막으로 추가해요"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 5v14m-7-7h14"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            자막 넣기
          </button>

          {captions.length > 0 && (
            <ul className="caption-list">
              {captions.map((c) => (
                <li key={c.id} className="caption-item">
                  <span
                    className="caption-preview"
                    style={{ color: c.color, background: c.color === "#FFFFFF" ? "#333" : "transparent" }}
                  >
                    {c.text}
                  </span>
                  <input
                    type="range"
                    min={20}
                    max={80}
                    value={c.fontSize}
                    onChange={(e) =>
                      updateCaption(c.id, { fontSize: Number(e.target.value) })
                    }
                    aria-label={`${c.text} 자막 크기`}
                    title="자막 크기를 조절해요"
                  />
                  <button
                    type="button"
                    className="mini-btn"
                    onClick={() => removeCaption(c.id)}
                    aria-label={`${c.text} 자막 삭제`}
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
