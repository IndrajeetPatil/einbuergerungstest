import type { ReactElement } from "react";

import { Icon } from "./Icon.tsx";

/**
 * Whether the official answer is still right today, with an icon.
 * @param props - Whether the answer key matches the latest facts.
 * @returns The chip.
 */
function KeyStatusChip(props: Readonly<{ upToDate: boolean }>): ReactElement {
  const { upToDate } = props;
  return (
    <span className={`chip ${upToDate ? "chip-accent" : "chip-rust"}`}>
      <Icon
        name={upToDate ? "check" : "cross"}
        size="sm"
      />
      {upToDate ? "Antwort aktuell · Up to date" : "Veraltet · Out of date"}
    </span>
  );
}

export { KeyStatusChip };
