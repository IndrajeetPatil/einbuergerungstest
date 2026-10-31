import { useEffect } from "react";
import type { ReactElement } from "react";

import { question as findQuestion } from "#lib/catalogue.ts";
import type {
  ActiveSession,
  QuestionStat,
  SessionSummary,
  Settings,
} from "#lib/schemas.ts";
import { useQuiz } from "#lib/useQuiz.ts";
import type { Quiz } from "#lib/useQuiz.ts";
import { useQuizKeys } from "#lib/useQuizKeys.ts";

import { CurrentQuestion } from "./CurrentQuestion.tsx";
import { QuizDialogs } from "./QuizDialogs.tsx";
import { QuizFooter } from "./QuizFooter.tsx";
import { QuizHeader } from "./QuizHeader.tsx";
import { QuizProgress } from "./QuizProgress.tsx";

interface Props {
  session: ActiveSession;
  latest: () => ActiveSession | null;
  onChange: (session: ActiveSession) => void;
  settings: Settings;
  stats: Readonly<Record<string, QuestionStat>>;
  onToggleEnglish: () => void;
  onFinished: (summary: SessionSummary, session: ActiveSession) => void;
  onExit: () => void;
  onError: (message: string) => void;
}

function progressCaption(session: ActiveSession, exam: boolean): string {
  const answered = session.items.filter((item) => item.chosen !== null).length;
  if (exam) {
    return `Frage ${session.index + 1} von ${session.items.length} · ${answered} answered`;
  }
  const checked = session.items.filter((item) => item.checked && !item.retry);
  const correct = checked.filter(
    (item) => item.chosen === findQuestion(item.qid).answer,
  ).length;
  const score =
    checked.length > 0 ? ` · ${correct} of ${checked.length} correct` : "";
  return `${session.index + 1} / ${session.items.length}${score}`;
}

function progressDone(session: ActiveSession, quiz: Quiz): number {
  if (quiz.exam) {
    return session.items.filter((item) => item.chosen !== null).length;
  }
  return session.index + (quiz.item.checked ? 1 : 0);
}

function useWarnBeforeUnload(): void {
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
    };
    globalThis.addEventListener("beforeunload", warn);
    return () => {
      globalThis.removeEventListener("beforeunload", warn);
    };
  }, []);
}

/**
 * Runs a mock exam or a practice session.
 * @param props - Session, settings, statistics and callbacks.
 * @returns The quiz view.
 */
function QuizView(props: Readonly<Props>): ReactElement {
  const { session, settings } = props;
  const quiz = useQuiz({
    ...props,
    latest: () => props.latest() ?? session,
    shuffleOptions: settings.shuffleOptions,
  });
  useQuizKeys(quiz, props.onToggleEnglish);
  useWarnBeforeUnload();
  return (
    <main className="mx-auto max-w-5xl px-5 pt-6 pb-24 md:px-8">
      <QuizHeader
        quiz={quiz}
        deadline={session.deadline}
        showEnglish={settings.showEnglish}
        onToggleEnglish={props.onToggleEnglish}
      />
      <QuizProgress
        done={progressDone(session, quiz)}
        total={session.items.length}
        caption={progressCaption(session, quiz.exam)}
      />
      <CurrentQuestion
        key={`${session.index}-${quiz.item.qid}`}
        quiz={quiz}
        session={session}
        stat={props.stats[quiz.question.id]}
        showEnglish={settings.showEnglish}
      />
      <QuizFooter
        quiz={quiz}
        session={session}
      />
      <QuizDialogs
        quiz={quiz}
        session={session}
      />
    </main>
  );
}

export { QuizView };
