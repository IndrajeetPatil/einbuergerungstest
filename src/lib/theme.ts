// Light or dark colours: the reader's stored choice, else the system setting.
// The inline script in index.html applies the same rule before first paint,
// so keep its storage key and media query in step with these.
import { themeSchema } from "./schemas.ts";
import type { Theme } from "./schemas.ts";

const STORAGE_KEY = "lid.theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * The theme the reader chose, ignoring anything malformed.
 * @returns The stored theme, or null when none was chosen.
 */
function storedTheme(): Theme | null {
  const parsed = themeSchema.safeParse(localStorage.getItem(STORAGE_KEY));
  return parsed.success ? parsed.data : null;
}

/**
 * The theme the operating system asks for.
 * @returns Dark when the system prefers dark colours, else light.
 */
function systemTheme(): Theme {
  return globalThis.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/**
 * The theme to show: a stored choice wins over the system setting.
 * @returns The theme.
 */
function preferredTheme(): Theme {
  return storedTheme() ?? systemTheme();
}

/**
 * Remembers the reader's choice across reloads.
 * @param theme - The chosen theme.
 */
function saveTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * The other theme, for the toggle.
 * @param theme - The current theme.
 * @returns The opposite theme.
 */
function otherTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

export {
  DARK_QUERY,
  storedTheme,
  systemTheme,
  preferredTheme,
  saveTheme,
  otherTheme,
};
