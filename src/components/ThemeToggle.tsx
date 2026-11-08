import type { ReactElement } from "react";

import { useTheme } from "#lib/useTheme.ts";

import { Icon } from "./Icon.tsx";

/**
 * Switches between the light and dark colour themes.
 * @returns The icon-only toggle button, pressed while dark mode is on.
 */
function ThemeToggle(): ReactElement {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      className="btn btn-quiet size-9 min-h-9 p-0 aria-pressed:text-accent"
      onClick={toggle}
      aria-pressed={dark}
      aria-label="Dunkler Modus · Dark mode"
    >
      <Icon name="moon" />
    </button>
  );
}

export { ThemeToggle };
