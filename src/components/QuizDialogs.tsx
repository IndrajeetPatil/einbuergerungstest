import type { ReactElement } from "react";

import type { ActiveSession } from "#lib/schemas.ts";
import type { Quiz } from "#lib/useQuiz.ts";

import { ConfirmDialog } from "./ConfirmDialog.tsx";

function submitText(session: ActiveSession): string {
  const total = session.items.length;
  const answered = session.items.filter((item) => item.chosen !== null).length;
  const flagged = session.items.filter((item) => item.flagged).length;
  const flags = flagged > 0 ? `, ${flagged} flagged for review` : "";
  const blanks =
    answered < total
      ? " Unanswered questions count as wrong — in the real test there is no penalty for guessing."
      : "";
  return `${answered} of ${total} questions answered${flags}.${blanks}`;
}

/**
 * The submit (mock exam) and end-session (practice) confirmations.
 * @param props - Quiz controller and session.
 * @returns Both dialogs; at most one is open.
 */
function QuizDialogs(
  props: Readonly<{ quiz: Quiz; session: ActiveSession }>,
): ReactElement {
  const { quiz, session } = props;
  const cancel = (): void => {
    quiz.setConfirm(null);
  };
  const anyChecked = session.items.some((item) => item.checked);
  return (
    <>
      <ConfirmDialog
        open={quiz.confirm === "submit"}
        title="Test abgeben? · Submit the test?"
        confirmLabel="Abgeben · Submit"
        onConfirm={quiz.handleFinish}
        onCancel={cancel}
      >
        <p>{submitText(session)}</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={quiz.confirm === "end"}
        title="Sitzung beenden? · End this session?"
        confirmLabel="End session"
        onConfirm={quiz.handleEnd}
        onCancel={cancel}
      >
        <p>
          {anyChecked
            ? "Your answers so far are saved and count towards your progress."
            : "You have not answered anything yet; nothing will be recorded."}
        </p>
      </ConfirmDialog>
    </>
  );
}

export { QuizDialogs };
