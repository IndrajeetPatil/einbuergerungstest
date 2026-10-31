import { label, question as getQuestion } from "../catalogue.ts";
import { EXAM, passed } from "../lib/quiz.ts";
import type { ActiveSession } from "../lib/session.ts";
import type { QuestionStat, SessionSummary, Settings } from "../lib/types.ts";
import { Feedback } from "./Feedback.tsx";
import { CheckIcon, CrossIcon } from "./icons.tsx";
import { QuestionBlock } from "./QuestionBlock.tsx";

interface Props {
  summary: SessionSummary;
  session: ActiveSession;
  settings: Settings;
  stats: Record<string, QuestionStat>;
  onPracticeMistakes: (ids: string[]) => void;
  onExam: () => void;
  onDone: () => void;
}

export function ResultsView({
  summary,
  session,
  settings,
  stats,
  onPracticeMistakes,
  onExam,
  onDone,
}: Props) {
  const exam = summary.mode === "exam";
  const items = session.items
    .map((it, position) => ({ it, position, q: getQuestion(it.qid) }))
    .filter(({ it }) => !it.retry && (exam || it.checked));
  const wrong = items.filter(({ it, q }) => it.chosen !== q.answer);
  const right = items.filter(({ it, q }) => it.chosen === q.answer);
  const total = exam ? summary.questionCount : summary.answered;
  const ok = exam && passed(summary.correct);
  const minutes = summary.durationMs ? Math.round(summary.durationMs / 60_000) : null;

  return (
    <main className="mx-auto max-w-5xl px-5 pt-10 pb-24 md:px-8">
      <p className="field-mark">{exam ? "Prüfungssimulation · Mock exam" : "Üben · Practice"}</p>
      <h1 className="mt-2 text-title">{exam ? "Ergebnis · Result" : "Sitzung beendet · Done"}</h1>

      <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-4">
        <p className="text-[4rem] leading-none font-semibold">
          {summary.correct}
          <span className="text-2xl text-muted"> / {total}</span>
        </p>
        <div className="space-y-2 pb-1">
          {exam && (
            <span className={`chip ${ok ? "chip-accent" : "chip-rust"}`}>
              {ok ? <CheckIcon width={12} height={12} /> : <CrossIcon width={12} height={12} />}
              {ok ? "Bestanden · Passed" : "Nicht bestanden · Not passed"}
            </span>
          )}
          <p className="text-sm text-muted">
            {exam
              ? `${EXAM.passMark} correct answers needed to pass.`
              : `${Math.round((summary.correct / Math.max(total, 1)) * 100)}% correct on first try.`}
            {minutes !== null && ` Time: ${minutes} min.`}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {wrong.length > 0 && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onPracticeMistakes(wrong.map(({ q }) => q.id))}
          >
            Practise these {wrong.length} again
          </button>
        )}
        <button type="button" className="btn" onClick={onExam}>
          New mock exam
        </button>
        <button type="button" className="btn btn-quiet" onClick={onDone}>
          Back to overview
        </button>
      </div>

      {wrong.length > 0 && (
        <section className="mt-14">
          <div className="rule-ticks" />
          <h2 className="mt-6 text-heading">
            Zum Wiederholen · To review <span className="text-muted">({wrong.length})</span>
          </h2>
          <p className="mt-2 max-w-prose text-muted">
            Read the German first, then check the English. Each explanation says why the answer is
            right, which makes it easier to recognise next time.
          </p>
          <ol className="mt-8 space-y-14">
            {wrong.map(({ it, position, q }) => (
              <li key={position}>
                <p className="folio-mark mb-3">
                  {position + 1} · {label(q)}
                </p>
                <QuestionBlock
                  question={q}
                  order={it.order}
                  chosen={it.chosen}
                  revealed
                  showEnglish={settings.showEnglish}
                  headingId={`review-${position}`}
                />
                <Feedback
                  question={q}
                  chosen={it.chosen}
                  stat={undefined}
                  showEnglish={settings.showEnglish}
                />
                {stats[q.id] && stats[q.id]!.attempts > 1 && (
                  <p className="mt-3 text-sm text-muted">
                    All-time on this question: {stats[q.id]!.correct}/{stats[q.id]!.attempts}{" "}
                    correct.
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {right.length > 0 && (
        <section className="mt-14 border-t border-line pt-6">
          <details>
            <summary className="flex min-h-11 cursor-pointer items-center text-heading font-serif font-semibold">
              Richtig beantwortet · Correct{" "}
              <span className="ml-2 text-muted">({right.length})</span>
            </summary>
            <ul className="mt-4 divide-y divide-line">
              {right.map(({ position, q }) => (
                <li key={position} className="grid gap-x-10 gap-y-1 py-3 md:grid-cols-2">
                  <div>
                    <p className="folio-mark">{label(q)}</p>
                    <p lang="de">{q.de.q}</p>
                    <p lang="de" className="mt-1 flex items-start gap-2 font-semibold text-accent">
                      <CheckIcon className="mt-1.5 shrink-0" /> {q.de.o[q.answer]}
                    </p>
                  </div>
                  {settings.showEnglish && (
                    <div lang="en" className="text-muted md:pt-5">
                      <p>{q.en.q}</p>
                      <p className="mt-1">{q.en.o[q.answer]}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
    </main>
  );
}
