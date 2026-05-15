"use client";

import { useEditorStore } from "@/store/editorStore";
import type { EditorStep } from "@/types";

const STEPS: { id: EditorStep; label: string; icon: string }[] = [
  { id: 1, label: "영상 넣기", icon: "①" },
  { id: 2, label: "꾸미기", icon: "②" },
  { id: 3, label: "저장하기", icon: "③" },
];

export default function StepBar() {
  const step = useEditorStore((s) => s.step);
  const setStep = useEditorStore((s) => s.setStep);

  return (
    <nav className="stepbar" aria-label="편집 단계">
      <ol>
        {STEPS.map((s) => {
          const done = step > s.id;
          const active = step === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setStep(s.id)}
                className={`step${active ? " active" : ""}${done ? " done" : ""}`}
                aria-current={active ? "step" : undefined}
                aria-label={`${s.icon} ${s.label} 단계`}
                title={`${s.label} 단계로 가요`}
              >
                <span className="step-icon" aria-hidden="true">{s.icon}</span>
                <span className="step-label">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
