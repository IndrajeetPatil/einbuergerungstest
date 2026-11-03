import type { ReactElement } from "react";

import { label } from "#lib/catalogue.ts";
import type { CurrentAffair } from "#lib/currentAffairs.ts";

import { CurrentAffairAnswers } from "./CurrentAffairAnswers.tsx";
import { CurrentAffairNotes } from "./CurrentAffairNotes.tsx";
import { KeyStatusChip } from "./KeyStatusChip.tsx";

/**
 * One time-dependent question with its official answer and the latest facts.
 * @param props - The question with its fact, and the language toggle.
 * @returns The list item.
 */
function CurrentAffairEntry(
  props: Readonly<{ affair: CurrentAffair; showEnglish: boolean }>,
): ReactElement {
  const { affair, showEnglish } = props;
  const { question, fact, upToDate } = affair;
  return (
    <li className="py-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="folio-mark">{label(question)}</span>
        <KeyStatusChip upToDate={upToDate} />
      </div>
      <div
        className={`mt-2 grid gap-x-10 gap-y-1 ${showEnglish ? "md:grid-cols-2" : ""}`}
      >
        <p
          lang="de"
          className="font-semibold"
        >
          {question.de.q}
        </p>
        {showEnglish ? (
          <p
            lang="en"
            className="text-muted"
          >
            {question.en.q}
          </p>
        ) : null}
      </div>
      <CurrentAffairAnswers
        affair={affair}
        showEnglish={showEnglish}
      />
      <CurrentAffairNotes
        fact={fact}
        showEnglish={showEnglish}
      />
    </li>
  );
}

export { CurrentAffairEntry };
