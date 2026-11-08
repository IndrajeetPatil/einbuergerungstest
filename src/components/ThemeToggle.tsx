import type { ReactElement } from "react";

import { useTheme } from "#lib/useTheme.ts";

import { Icon } from "./Icon.tsx";

/**
 * Switches between the light and dark colour themes.
 * @returns The toggle button, pressed while dark mode is on.
 */
function ThemeToggle(): ReactElement {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      className="btn btn-quiet min-h-9 px-2 text-sm aria-pressed:text-accent"
      onClick={toggle}
      aria-pressed={dark}
    >
      <Icon name="moon" />
      Dunkel · Dark
    </button>
  );
}

export { ThemeToggle };
