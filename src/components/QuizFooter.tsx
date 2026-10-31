import type { ReactElement } from "react";

import type { ActiveSession } from "#lib/schemas.ts";
import type { Quiz } from "#lib/useQuiz.ts";

import { ExamControls } from "./ExamControls.tsx";
import { ExamOverview } from "./ExamOverview.tsx";
import { PracticeControls } from "./PracticeControls.tsx";

/**
 * Controls below the question: navigation and overview in a mock exam,
 * check and next in practice.
 * @param props - Quiz controller and session.
 * @returns The footer.
 */
function QuizFooter(
  props: Readonly<{ quiz: Quiz; session: ActiveSession }>,
): ReactElement {
  const { quiz, session } = props;
  if (!quiz.exam) {
    return (
      <>
        <PracticeControls quiz={quiz} />
        <p className="mt-10 text-sm text-muted">
          Keys: 1–4 choose · Enter check / next · E English
        </p>
      </>
    );
  }
  return (
    <>
      <ExamControls
        quiz={quiz}
        isFirst={session.index === 0}
      />
      <ExamOverview
        session={session}
        onJump={quiz.handleJump}
      />
    </>
  );
}

export { QuizFooter };
