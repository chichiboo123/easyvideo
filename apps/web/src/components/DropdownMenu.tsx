"use client";

import { useEffect, useRef, useState } from "react";

interface MenuItem {
  label: string;
  icon?: string;
  shortcut?: string;
  onClick: () => void;
  divider?: false;
}
interface DividerItem { divider: true }
export type DropdownItem = MenuItem | DividerItem;

interface Props {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  ariaLabel?: string;
}

export default function DropdownMenu({ trigger, items, align = "left", ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="dropdown-wrap" ref={wrapRef}>
      <button
        type="button"
        className="dropdown-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {trigger}
      </button>
      {open && (
        <div className={`dropdown-menu dropdown-${align}`} role="menu">
          {items.map((it, i) =>
            "divider" in it ? (
              <div key={`d${i}`} className="dropdown-divider" role="separator" />
            ) : (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                className="dropdown-item"
                onClick={() => { it.onClick(); setOpen(false); }}
              >
                {it.icon && <span className="dropdown-icon" aria-hidden="true">{it.icon}</span>}
                <span className="dropdown-label">{it.label}</span>
                {it.shortcut && <span className="dropdown-shortcut">{it.shortcut}</span>}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
