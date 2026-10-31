import type { ReactElement } from "react";

import { passed } from "#lib/quiz.ts";

import { Icon } from "./Icon.tsx";

/**
 * Passed or not passed, with an icon.
 * @param props - Correct answers in a mock exam.
 * @returns The chip.
 */
function PassChip(props: Readonly<{ correct: number }>): ReactElement {
  const ok = passed(props.correct);
  return (
    <span className={`chip ${ok ? "chip-accent" : "chip-rust"}`}>
      <Icon
        name={ok ? "check" : "cross"}
        size="sm"
      />
      {ok ? "Bestanden · Passed" : "Nicht bestanden · Not passed"}
    </span>
  );
}

export { PassChip };
