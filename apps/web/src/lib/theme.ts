"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "easyvideo:theme";

/** Read the saved theme, if any. Safe to call on the server (returns null). */
function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

/** Apply the theme to <html> so the CSS token overrides take effect. */
function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

function storeTheme(theme: Theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private mode / storage disabled — ignore */
  }
}

/**
 * Inline snippet run in <head> before paint so the correct theme is applied
 * on first render (no dark → light flash). Defaults to the app's dark look
 * unless a light preference was saved.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");document.documentElement.dataset.theme=(t==="light"||t==="dark")?t:"dark";}catch(e){document.documentElement.dataset.theme="dark";}})();`;

/**
 * React hook for reading and toggling the UI theme. The value stays in sync
 * with what the pre-hydration script already put on <html>.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void; setTheme: (t: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>("dark");

  // On mount, adopt whatever <html data-theme> the init script decided.
  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || readStoredTheme() || "dark";
    setThemeState(current);
    applyTheme(current);
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    applyTheme(next);
    storeTheme(next);
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return { theme, toggleTheme, setTheme };
}
