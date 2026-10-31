import type { ReactElement } from "react";

import type { Question, QuestionStat } from "#lib/schemas.ts";

import { Explanation } from "./Explanation.tsx";
import { History } from "./History.tsx";

/**
 * Collapsed explanation and record of a catalogue question.
 * @param props - Question and its statistics.
 * @returns The disclosure.
 */
function CatalogueExplanation(
  props: Readonly<{ question: Question; stat: QuestionStat | undefined }>,
): ReactElement {
  const { question, stat } = props;
  return (
    <details className="mt-3">
      <summary className="inline-flex min-h-9 cursor-pointer items-center text-sm font-semibold text-accent">
        Warum · Why
      </summary>
      <Explanation question={question} />
      {stat === undefined ? null : (
        <p className="mt-2 text-sm text-muted">
          <History stat={stat} />
        </p>
      )}
    </details>
  );
}

export { CatalogueExplanation };
