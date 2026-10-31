import type { ReactElement } from "react";

import { EXAM } from "#lib/quiz.ts";
import type { SessionSummary } from "#lib/schemas.ts";

import { PassChip } from "./PassChip.tsx";

/**
 * The hero figure: the latest mock-exam score.
 * @param props - The latest exam, if any.
 * @returns The definition-list entry.
 */
function LatestExam(
  props: Readonly<{ exam: SessionSummary | undefined }>,
): ReactElement {
  const { exam } = props;
  return (
    <div className="col-span-2 md:col-span-1">
      <dt className="text-sm text-muted">Latest mock exam</dt>
      <dd className="mt-1 text-5xl font-semibold">
        {exam?.correct ?? "–"}
        <span className="text-xl text-muted">/{EXAM.total}</span>
      </dd>
      {exam === undefined ? null : (
        <dd className="mt-1">
          <PassChip correct={exam.correct} />
        </dd>
      )}
    </div>
  );
}

export { LatestExam };
