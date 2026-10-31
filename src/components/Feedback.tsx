import type { Question, QuestionStat } from "../lib/types.ts";
import { CheckIcon, CrossIcon } from "./icons.tsx";

interface Props {
  question: Question;
  chosen: number | null;
  stat?: QuestionStat;
  /** Practice: the question was queued again later in this session. */
  comesBack?: boolean;
  showEnglish: boolean;
}

/** What to learn from an answer: the correct option in both languages, why, and your record. */
export function Feedback({ question, chosen, stat, comesBack, showEnglish }: Props) {
  const correct = chosen === question.answer;
  const a = question.answer;
  return (
    <section
      aria-live="polite"
      className={`mt-6 border-l-2 pl-5 ${correct ? "border-accent" : "border-rust"}`}
    >
      <p
        className={`flex items-center gap-2 text-sm font-semibold ${correct ? "text-accent" : "text-rust"}`}
      >
        {correct ? <CheckIcon /> : <CrossIcon />}
        {correct
          ? "Richtig · Correct"
          : chosen === null
            ? "Nicht beantwortet · Not answered"
            : "Nicht ganz · Not quite"}
      </p>

      {!correct && (
        <div className="mt-3">
          <p className="folio-mark">Richtige Antwort · Correct answer</p>
          <div className={`mt-1 grid gap-x-10 gap-y-1 ${showEnglish ? "md:grid-cols-2" : ""}`}>
            <p lang="de" className="font-semibold">
              {question.de.o[a]}
            </p>
            {showEnglish && (
              <p lang="en" className="text-muted">
                {question.en.o[a]}
              </p>
            )}
          </div>
          {chosen !== null && (
            <>
              <p className="folio-mark mt-3">Ihre Antwort · Your answer</p>
              <div className={`mt-1 grid gap-x-10 gap-y-1 ${showEnglish ? "md:grid-cols-2" : ""}`}>
                <p lang="de" className="line-through decoration-rust/50">
                  {question.de.o[chosen]}
                </p>
                {showEnglish && (
                  <p lang="en" className="text-muted">
                    {question.en.o[chosen]}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-4 max-w-prose space-y-2 text-[0.95rem]">
        <p className="folio-mark">Warum · Why</p>
        <p lang="en">{question.explanation.en}</p>
        {question.explanation.de && (
          <p lang="de" className="text-muted">
            {question.explanation.de}
          </p>
        )}
      </div>

      {(stat || comesBack) && (
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          {stat && <History stat={stat} label="Before this session" />}
          {comesBack && <span>This question comes back in a few questions.</span>}
        </p>
      )}
    </section>
  );
}

export function History({ stat, label = "Your record" }: { stat: QuestionStat; label?: string }) {
  const marks = stat.recent.split("").toReversed();
  return (
    <span className="inline-flex items-center gap-2">
      <span>
        {label}: {stat.correct}/{stat.attempts} correct
      </span>
      <span className="inline-flex items-center gap-0.5" aria-label="recent answers, oldest first">
        {marks.map((m, i) =>
          m === "1" ? (
            <CheckIcon key={i} className="text-accent" width={14} height={14} />
          ) : (
            <CrossIcon key={i} className="text-rust" width={14} height={14} />
          ),
        )}
      </span>
    </span>
  );
}
