import type { ReactElement } from "react";

import { Icon } from "./Icon.tsx";

function verdict(correct: boolean, answered: boolean): string {
  if (correct) {
    return "Richtig · Correct";
  }
  return answered
    ? "Nicht ganz · Not quite"
    : "Nicht beantwortet · Not answered";
}

/**
 * Right, wrong or unanswered, with an icon.
 * @param props - Whether the answer was correct and whether one was given.
 * @returns The verdict line.
 */
function Verdict(
  props: Readonly<{ correct: boolean; answered: boolean }>,
): ReactElement {
  const { correct, answered } = props;
  return (
    <p
      className={`flex items-center gap-2 text-sm font-semibold ${correct ? "text-accent" : "text-rust"}`}
    >
      <Icon name={correct ? "check" : "cross"} />
      {verdict(correct, answered)}
    </p>
  );
}

export { Verdict };
