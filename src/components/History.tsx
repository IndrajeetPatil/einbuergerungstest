import type { ReactElement } from "react";

import type { QuestionStat } from "#lib/schemas.ts";

import { Icon } from "./Icon.tsx";

interface Mark {
  key: string;
  correct: boolean;
}

function marks(recent: string): Mark[] {
  // Oldest first, so the row reads left to right in time.
  return recent
    .split("")
    .toReversed()
    .map((result, index) => ({
      key: `${index}-${result}`,
      correct: result === "1",
    }));
}

/**
 * A question's answer record with ticks and crosses, oldest first.
 * @param props - Statistics and a label.
 * @returns The record line.
 */
function History(
  props: Readonly<{ stat: QuestionStat; label?: string }>,
): ReactElement {
  const { stat, label = "Your record" } = props;
  const recent = marks(stat.recent);
  return (
    <span className="inline-flex items-center gap-2">
      <span>
        {label}: {stat.correct}/{stat.attempts} correct
      </span>
      <span className="sr-only">
        Recent answers, oldest first:{" "}
        {recent.map((mark) => (mark.correct ? "right" : "wrong")).join(", ")}
      </span>
      <span
        className="inline-flex items-center gap-0.5"
        aria-hidden="true"
      >
        {recent.map((mark) => (
          <Icon
            key={mark.key}
            name={mark.correct ? "check" : "cross"}
            tone={mark.correct ? "accent" : "rust"}
            size="md"
          />
        ))}
      </span>
    </span>
  );
}

export { History };
