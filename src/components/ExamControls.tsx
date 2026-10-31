import type { ReactElement } from "react";

import type { Quiz } from "#lib/useQuiz.ts";

import { Icon } from "./Icon.tsx";

/**
 * Back, flag, submit and next buttons of the mock exam.
 * @param props - The quiz controller and its first-question flag.
 * @returns The button row.
 */
function ExamControls(
  props: Readonly<{ quiz: Quiz; isFirst: boolean }>,
): ReactElement {
  const { quiz, isFirst } = props;
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn"
          disabled={isFirst}
          onClick={quiz.handlePrevious}
        >
          <Icon name="left" /> Zurück
        </button>
        <button
          type="button"
          className="btn"
          aria-pressed={quiz.item.flagged}
          onClick={quiz.handleFlag}
        >
          <Icon
            name="flag"
            tone={quiz.item.flagged ? "ochre" : "inherit"}
          />
          {quiz.item.flagged ? "Markiert · Flagged" : "Markieren · Flag"}
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn"
          onClick={() => {
            quiz.setConfirm("submit");
          }}
        >
          Abgeben · Submit
        </button>
        <button
          type="button"
          className="btn btn-primary min-w-40"
          onClick={quiz.handleNext}
          disabled={quiz.busy}
        >
          {quiz.isLast ? "Abgeben · Submit" : "Weiter · Next"}
          <Icon name="right" />
        </button>
      </div>
    </div>
  );
}

export { ExamControls };
