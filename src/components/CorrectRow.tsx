import type { ReactElement } from "react";

import { label } from "#lib/catalogue.ts";
import type { Question } from "#lib/schemas.ts";

import { Icon } from "./Icon.tsx";

/**
 * A correctly answered question with its answer, German and English.
 * @param props - Question and language toggle.
 * @returns The list item.
 */
function CorrectRow(
  props: Readonly<{ question: Question; showEnglish: boolean }>,
): ReactElement {
  const { question, showEnglish } = props;
  return (
    <li className="grid gap-x-10 gap-y-1 py-3 md:grid-cols-2">
      <div>
        <p className="folio-mark">{label(question)}</p>
        <p lang="de">{question.de.q}</p>
        <p
          lang="de"
          className="mt-1 flex items-start gap-2 font-semibold text-accent"
        >
          <Icon name="check" />
          {question.de.o[question.answer]}
        </p>
      </div>
      {showEnglish ? (
        <div
          lang="en"
          className="text-muted md:pt-5"
        >
          <p>{question.en.q}</p>
          <p className="mt-1">{question.en.o[question.answer]}</p>
        </div>
      ) : null}
    </li>
  );
}

export { CorrectRow };
