import type { ReactElement } from "react";

import { minutes, percent } from "#lib/format.ts";
import { EXAM, accuracy, scoredOutOf } from "#lib/quiz.ts";
import type { SessionSummary } from "#lib/schemas.ts";

import { PassChip } from "./PassChip.tsx";

function note(summary: SessionSummary): string {
  const main =
    summary.mode === "exam"
      ? `${EXAM.passMark} correct answers needed to pass.`
      : `${percent(accuracy(summary))} correct on first try.`;
  return `${main} Time: ${minutes(summary.durationMs)}.`;
}

/**
 * The headline score of a finished session.
 * @param props - The session summary.
 * @returns Score, pass or fail, and timing.
 */
function ResultScore(
  props: Readonly<{ summary: SessionSummary }>,
): ReactElement {
  const { summary } = props;
  const exam = summary.mode === "exam";
  return (
    <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-4">
      <p className="text-[4rem] leading-none font-semibold">
        {summary.correct}
        <span className="text-2xl text-muted"> / {scoredOutOf(summary)}</span>
      </p>
      <div className="space-y-2 pb-1">
        {exam ? <PassChip correct={summary.correct} /> : null}
        <p className="text-sm text-muted">{note(summary)}</p>
      </div>
    </div>
  );
}

export { ResultScore };
