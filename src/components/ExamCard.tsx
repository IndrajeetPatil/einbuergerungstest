import type { ReactElement } from "react";

import { stateName } from "#lib/catalogue.ts";
import { EXAM } from "#lib/quiz.ts";
import type { StateCode } from "#lib/schemas.ts";

/**
 * Starts a mock exam.
 * @param props - State, whether a session is active, and the start handler.
 * @returns The card.
 */
function ExamCard(
  props: Readonly<{
    state: StateCode;
    disabled: boolean;
    onStart: () => void;
  }>,
): ReactElement {
  const { state, disabled, onStart } = props;
  return (
    <div className="flex min-w-0 flex-col rounded-md border border-line bg-surface p-6">
      <h2 className="text-heading">Prüfungssimulation</h2>
      <p className="folio-mark mt-1">Mock exam</p>
      <p className="mt-3 text-muted">
        {EXAM.general} random general questions plus {EXAM.state} about{" "}
        {stateName(state)}. {EXAM.minutes}-minute timer, no feedback until you
        submit — just like the real test. Do one a day to track your score.
      </p>
      <div className="mt-auto pt-6">
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={onStart}
          disabled={disabled}
        >
          Start mock exam
        </button>
      </div>
    </div>
  );
}

export { ExamCard };
