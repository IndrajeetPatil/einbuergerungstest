// The colour theme: applied to <html>, remembered once chosen, and following
// the system setting until then.
import { useCallback, useEffect, useState } from "react";

import type { Theme } from "#lib/schemas.ts";
import {
  DARK_QUERY,
  otherTheme,
  preferredTheme,
  saveTheme,
  storedTheme,
  systemTheme,
} from "#lib/theme.ts";

/**
 * Switches the dark class and the browser's theme colour.
 * @param theme - The theme to show.
 */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  const paper = getComputedStyle(root).getPropertyValue("--color-bg").trim();
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", paper);
}

/**
 * The current theme with a toggle that remembers the choice.
 * @returns Whether dark mode is on, and the toggle.
 */
function useTheme(): { dark: boolean; toggle: () => void } {
  const [theme, setTheme] = useState(preferredTheme);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  useEffect(() => {
    const media = globalThis.matchMedia(DARK_QUERY);
    const follow = (): void => {
      if (storedTheme() === null) {
        setTheme(systemTheme());
      }
    };
    media.addEventListener("change", follow);
    return () => {
      media.removeEventListener("change", follow);
    };
  }, []);
  const toggle = useCallback(() => {
    const next = otherTheme(theme);
    saveTheme(next);
    setTheme(next);
  }, [theme]);
  return { dark: theme === "dark", toggle };
}

export { useTheme };
