import type { ReactElement } from "react";

import { label } from "#lib/catalogue.ts";
import type { Quiz } from "#lib/useQuiz.ts";

import { EnglishToggle } from "./EnglishToggle.tsx";
import { Timer } from "./Timer.tsx";

const MODE_LABEL = {
  exam: "Prüfungssimulation · Mock exam",
  practice: "Üben · Practice",
} as const;

/**
 * Mode, question label, timer and the English toggle.
 * @param props - Quiz, deadline, language state and toggle.
 * @returns The header row.
 */
function QuizHeader(
  props: Readonly<{
    quiz: Quiz;
    deadline: number | null;
    showEnglish: boolean;
    onToggleEnglish: () => void;
  }>,
): ReactElement {
  const { quiz, deadline } = props;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="field-mark font-sans">
          {MODE_LABEL[quiz.exam ? "exam" : "practice"]}
        </h1>
        <span className="folio-mark">
          {label(quiz.question)}
          {quiz.item.retry ? " · Wiederholung · Second try" : ""}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {deadline === null ? null : (
          <Timer
            deadline={deadline}
            onExpire={quiz.handleFinish}
          />
        )}
        <EnglishToggle
          showEnglish={props.showEnglish}
          onToggle={props.onToggleEnglish}
        />
      </div>
    </div>
  );
}

export { QuizHeader };
