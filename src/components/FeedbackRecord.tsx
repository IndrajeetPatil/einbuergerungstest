import type { ReactElement } from "react";

import type { QuestionStat } from "#lib/schemas.ts";

import { History } from "./History.tsx";

/**
 * Your earlier record on a question and whether it comes back this session.
 * @param props - Statistics before this session and the retry flag.
 * @returns The record line.
 */
function FeedbackRecord(
  props: Readonly<{ stat: QuestionStat | undefined; comesBack: boolean }>,
): ReactElement {
  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
      {props.stat === undefined ? null : (
        <History
          stat={props.stat}
          label="Before this session"
        />
      )}
      {props.comesBack ? (
        <span>This question comes back in a few questions.</span>
      ) : null}
    </p>
  );
}

export { FeedbackRecord };
