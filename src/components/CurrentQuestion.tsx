import type { ReactElement } from "react";

import type { ActiveSession, QuestionStat } from "#lib/schemas.ts";
import type { Quiz } from "#lib/useQuiz.ts";

import { Feedback } from "./Feedback.tsx";
import { QuestionBlock } from "./QuestionBlock.tsx";

// Each question starts at its top, with focus on it for keyboard and
// screen-reader users; the parent remounts this block per question.
function focusQuestion(element: HTMLDivElement | null): void {
  if (element !== null) {
    element.focus({ preventScroll: true });
    globalThis.scrollTo({ top: 0 });
  }
}

function comesBack(session: ActiveSession, quiz: Quiz): boolean {
  return (
    !quiz.item.retry &&
    session.items.some(
      (item, index) =>
        index > session.index && item.retry && item.qid === quiz.item.qid,
    )
  );
}

/**
 * The question being answered and, in practice, its feedback.
 * @param props - Quiz controller, session, statistics and language toggle.
 * @returns The question area.
 */
function CurrentQuestion(
  props: Readonly<{
    quiz: Quiz;
    session: ActiveSession;
    stat: QuestionStat | undefined;
    showEnglish: boolean;
  }>,
): ReactElement {
  const { quiz, session, showEnglish } = props;
  const revealed = !quiz.exam && quiz.item.checked;
  return (
    <>
      <div
        ref={focusQuestion}
        tabIndex={-1}
        className="mt-8 outline-none"
      >
        <QuestionBlock
          question={quiz.question}
          order={quiz.item.order}
          chosen={quiz.item.chosen}
          revealed={revealed}
          showEnglish={showEnglish}
          onChoose={quiz.item.checked ? undefined : quiz.handleChoose}
          headingId="current-question"
        />
      </div>
      {revealed ? (
        <Feedback
          question={quiz.question}
          chosen={quiz.item.chosen}
          stat={props.stat}
          comesBack={comesBack(session, quiz)}
          showEnglish={showEnglish}
        />
      ) : null}
    </>
  );
}

export { CurrentQuestion };
