import { OPTION_KEYS } from "../catalogue.ts";
import type { Question } from "../lib/types.ts";
import { CheckIcon, CrossIcon } from "./icons.tsx";

interface Props {
  question: Question;
  order: number[];
  chosen: number | null;
  /** Show which option is correct (practice feedback or exam review). */
  revealed: boolean;
  showEnglish: boolean;
  onChoose?: (option: number) => void;
  /** Heading level context: the question text is the page's main question. */
  headingId: string;
}

export function QuestionBlock({
  question,
  order,
  chosen,
  revealed,
  showEnglish,
  onChoose,
  headingId,
}: Props) {
  const name = `q-${question.id}-${headingId}`;
  const cols = showEnglish ? "md:grid-cols-2" : "";
  return (
    <div>
      <div className={`grid gap-x-10 gap-y-3 ${cols}`}>
        <div className="min-w-0">
          <p className="folio-mark mb-2" aria-hidden="true">
            Deutsch
          </p>
          <h2 id={headingId} lang="de" className="text-[1.45rem] leading-snug md:text-[1.6rem]">
            {question.de.q}
          </h2>
        </div>
        {showEnglish && (
          <div className="min-w-0 border-line md:border-l md:pl-10">
            <p className="folio-mark mb-2" aria-hidden="true">
              English
            </p>
            <p lang="en" className="text-lg leading-snug text-muted md:pt-1">
              {question.en.q}
            </p>
          </div>
        )}
      </div>

      {question.image && (
        <figure className="mt-6 rounded-md border border-line bg-white p-3">
          <img
            src={`/${question.image}`}
            alt={`Abbildung zu ${question.de.q}`}
            className="mx-auto max-h-[22rem] w-auto object-contain"
            decoding="async"
          />
          {question.credit && (
            <figcaption className="mt-2 text-xs text-muted">{question.credit}</figcaption>
          )}
        </figure>
      )}

      <div
        role="radiogroup"
        aria-labelledby={headingId}
        className="mt-6 divide-y divide-line overflow-hidden rounded-md border border-line bg-surface"
      >
        {order.map((option, pos) => {
          const isChosen = chosen === option;
          const isAnswer = option === question.answer;
          const state = !revealed
            ? isChosen
              ? "chosen"
              : "idle"
            : isAnswer
              ? "correct"
              : isChosen
                ? "wrong"
                : "dim";
          const tone = {
            idle: "hover:bg-bg-alt",
            chosen: "bg-accent/[0.07] before:bg-accent",
            correct: "bg-accent/[0.08] before:bg-accent",
            wrong: "bg-rust/[0.07] before:bg-rust",
            dim: "",
          }[state];
          const keyTone = {
            idle: "border-line text-muted",
            chosen: "border-accent bg-accent text-surface",
            correct: "border-accent bg-accent text-surface",
            wrong: "border-rust bg-rust text-surface",
            dim: "border-line text-muted",
          }[state];
          return (
            <label
              key={option}
              className={`relative grid cursor-pointer before:absolute before:inset-y-0 before:left-0 before:w-[3px] grid-cols-[2.25rem_1fr] items-start gap-x-3 px-4 py-3.5 transition-colors has-[:disabled]:cursor-default ${
                showEnglish ? "md:grid-cols-[2.25rem_1fr_1fr] md:gap-x-10" : ""
              } ${tone}`}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={isChosen}
                disabled={!onChoose}
                onChange={() => onChoose?.(option)}
                className="peer sr-only"
              />
              <span
                className={`mt-0.5 inline-flex size-7 items-center justify-center rounded-sm border text-xs font-semibold tabular-nums peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${keyTone}`}
                aria-hidden="true"
              >
                {state === "correct" ? (
                  <CheckIcon />
                ) : state === "wrong" ? (
                  <CrossIcon />
                ) : (
                  OPTION_KEYS[pos]
                )}
              </span>
              <span lang="de" className="min-w-0 font-medium">
                {question.de.o[option]}
                {state === "correct" && (
                  <span className="sr-only"> (richtige Antwort / correct answer)</span>
                )}
                {state === "wrong" && (
                  <span className="sr-only"> (Ihre Antwort, falsch / your answer, wrong)</span>
                )}
              </span>
              {showEnglish && (
                <span
                  lang="en"
                  className="col-start-2 min-w-0 text-[0.95rem] text-muted md:col-start-3 md:border-l md:border-line md:pl-10"
                >
                  {question.en.o[option]}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
