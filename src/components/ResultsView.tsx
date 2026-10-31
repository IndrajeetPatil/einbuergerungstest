import { useMemo } from "react";
import type { ReactElement } from "react";

import { question as findQuestion } from "#lib/catalogue.ts";
import type {
  ActiveSession,
  QuestionStat,
  SessionSummary,
  Settings,
} from "#lib/schemas.ts";

import { CorrectList } from "./CorrectList.tsx";
import { ResultScore } from "./ResultScore.tsx";
import type { ReviewEntry } from "./reviewEntry.ts";
import { ReviewList } from "./ReviewList.tsx";

interface Props {
  summary: SessionSummary;
  session: ActiveSession;
  settings: Settings;
  stats: Readonly<Record<string, QuestionStat>>;
  onPracticeMistakes: (ids: string[]) => void;
  onExam: () => void;
  onDone: () => void;
}

function firstTries(session: ActiveSession): ReviewEntry[] {
  const exam = session.mode === "exam";
  return session.items
    .map((item, position) => ({
      item,
      position,
      question: findQuestion(item.qid),
    }))
    .filter(({ item }) => !item.retry && (exam || item.checked));
}

const TITLES = {
  exam: { mark: "Prüfungssimulation · Mock exam", title: "Ergebnis · Result" },
  practice: { mark: "Üben · Practice", title: "Sitzung beendet · Done" },
} as const;

function isRight({ item, question }: ReviewEntry): boolean {
  return item.chosen === question.answer;
}

function partition(entries: readonly ReviewEntry[]): {
  wrong: ReviewEntry[];
  right: ReviewEntry[];
} {
  return {
    wrong: entries.filter((entry) => !isRight(entry)),
    right: entries.filter((entry) => isRight(entry)),
  };
}

/**
 * Score and review of a finished session.
 * @param props - Summary, session, settings and actions.
 * @returns The results view.
 */
function ResultsView(props: Readonly<Props>): ReactElement {
  const { summary, settings } = props;
  const { wrong, right } = useMemo(
    () => partition(firstTries(props.session)),
    [props.session],
  );
  const titles = TITLES[summary.mode];
  return (
    <main className="mx-auto max-w-5xl px-5 pt-10 pb-24 md:px-8">
      <p className="field-mark">{titles.mark}</p>
      <h1 className="mt-2 text-title">{titles.title}</h1>
      <ResultScore summary={summary} />
      <div className="mt-8 flex flex-wrap gap-3">
        {wrong.length > 0 ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              props.onPracticeMistakes(
                wrong.map(({ question }) => question.id),
              );
            }}
          >
            Practise these {wrong.length} again
          </button>
        ) : null}
        <button
          type="button"
          className="btn"
          onClick={props.onExam}
        >
          New mock exam
        </button>
        <button
          type="button"
          className="btn btn-quiet"
          onClick={props.onDone}
        >
          Back to overview
        </button>
      </div>
      {wrong.length > 0 ? (
        <ReviewList
          entries={wrong}
          settings={settings}
          stats={props.stats}
        />
      ) : null}
      {right.length > 0 ? (
        <CorrectList
          entries={right}
          showEnglish={settings.showEnglish}
        />
      ) : null}
    </main>
  );
}

export { ResultsView };
