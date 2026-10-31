import type { ReactElement } from "react";

import type { Quiz } from "#lib/useQuiz.ts";

import { Icon } from "./Icon.tsx";

/**
 * End, check and next buttons of a practice session.
 * @param props - The quiz controller.
 * @returns The button row.
 */
function PracticeControls(props: Readonly<{ quiz: Quiz }>): ReactElement {
  const { quiz } = props;
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        className="btn btn-quiet"
        onClick={() => {
          quiz.setConfirm("end");
        }}
      >
        End session
      </button>
      {quiz.item.checked ? (
        <button
          type="button"
          className="btn btn-primary min-w-40"
          onClick={quiz.handleNext}
          disabled={quiz.busy}
        >
          {quiz.isLast ? "Ergebnis · Results" : "Weiter · Next"}
          <Icon name="right" />
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary min-w-40"
          disabled={quiz.item.chosen === null}
          onClick={quiz.handleCheck}
        >
          Prüfen · Check
        </button>
      )}
    </div>
  );
}

export { PracticeControls };
