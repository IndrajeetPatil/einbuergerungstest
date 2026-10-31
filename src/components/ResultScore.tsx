import type { ReactElement } from "react";

import { minutes, percent } from "#lib/format.ts";
import { EXAM } from "#lib/quiz.ts";
import type { SessionSummary } from "#lib/schemas.ts";

import { PassChip } from "./PassChip.tsx";

function note(summary: SessionSummary, total: number): string {
  const main =
    summary.mode === "exam"
      ? `${EXAM.passMark} correct answers needed to pass.`
      : `${percent(summary.correct / Math.max(total, 1))} correct on first try.`;
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
  const total = exam ? summary.questionCount : summary.answered;
  return (
    <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-4">
      <p className="text-[4rem] leading-none font-semibold">
        {summary.correct}
        <span className="text-2xl text-muted"> / {total}</span>
      </p>
      <div className="space-y-2 pb-1">
        {exam ? <PassChip correct={summary.correct} /> : null}
        <p className="text-sm text-muted">{note(summary, total)}</p>
      </div>
    </div>
  );
}

export { ResultScore };
