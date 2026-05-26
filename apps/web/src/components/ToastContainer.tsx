"use client";

import { useToastStore } from "@/lib/notifications";

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="toast-stack" role="region" aria-label="알림" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} role="status">
          <span className="toast-msg">{t.message}</span>
          {t.action && (
            <button type="button" className="toast-action"
              onClick={() => { t.action!.run(); dismiss(t.id); }}
            >{t.action.label}</button>
          )}
          <button type="button" className="toast-close"
            onClick={() => dismiss(t.id)}
            aria-label="알림 닫기"
          >✕</button>
        </div>
      ))}
    </div>
  );
}
