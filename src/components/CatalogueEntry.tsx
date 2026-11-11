import type { ReactElement } from "react";

import { label } from "#lib/catalogue.ts";
import { MASTERY_LABEL, masteryOf } from "#lib/mastery.ts";
import type { Mastery } from "#lib/mastery.ts";
import type { Question, QuestionStat } from "#lib/schemas.ts";

import { CatalogueExplanation } from "./CatalogueExplanation.tsx";
import { OptionList } from "./OptionList.tsx";
import { QuestionPicture } from "./QuestionPicture.tsx";

const CHIP: Readonly<Record<Mastery, string>> = {
  mastered: "chip-accent",
  once: "chip-slate",
  missed: "chip-rust",
  new: "",
};

/**
 * One catalogue question with its answer and an expandable explanation.
 * @param props - Question, statistics and language toggle.
 * @returns The list item.
 */
function CatalogueEntry(
  props: Readonly<{
    question: Question;
    stat: QuestionStat | undefined;
    showEnglish: boolean;
  }>,
): ReactElement {
  const { question, stat, showEnglish } = props;
  const mastery = masteryOf(stat);
  return (
    <li className="py-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="folio-mark">{label(question)}</span>
        <span className="folio-mark normal-case">ID {question.id}</span>
        <span className={`chip ${CHIP[mastery]}`}>
          {MASTERY_LABEL[mastery].en}
        </span>
      </div>
      <div
        className={`mt-2 grid gap-x-10 gap-y-2 ${showEnglish ? "md:grid-cols-2" : ""}`}
      >
        <div className="min-w-0">
          <p
            lang="de"
            className="font-semibold"
          >
            {question.de.q}
          </p>
          <OptionList
            options={question.de.o}
            answer={question.answer}
            lang="de"
            answerTone="text-accent"
          />
        </div>
        {showEnglish ? (
          <div className="min-w-0 text-muted md:border-l md:border-line md:pl-10">
            <p lang="en">{question.en.q}</p>
            <OptionList
              options={question.en.o}
              answer={question.answer}
              lang="en"
              answerTone="text-ink"
            />
          </div>
        ) : null}
      </div>
      {question.image === null ? null : (
        <QuestionPicture
          image={question.image}
          question={question.de.q}
          size="thumbnail"
        />
      )}
      <CatalogueExplanation
        question={question}
        stat={stat}
      />
    </li>
  );
}

export { CatalogueEntry };
