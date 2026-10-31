import type { ReactElement } from "react";

import type { Question } from "#lib/schemas.ts";

/**
 * The question in German and, optionally, English.
 * @param props - Question, language toggle and heading id.
 * @returns The bilingual heading.
 */
function QuestionHeading(
  props: Readonly<{
    question: Question;
    showEnglish: boolean;
    headingId: string;
  }>,
): ReactElement {
  const { question, showEnglish, headingId } = props;
  return (
    <div
      className={`grid gap-x-10 gap-y-3 ${showEnglish ? "md:grid-cols-2" : ""}`}
    >
      <div className="min-w-0">
        <p
          className="folio-mark mb-2"
          aria-hidden="true"
        >
          Deutsch
        </p>
        <h2
          id={headingId}
          lang="de"
          className="text-[1.45rem] leading-snug md:text-[1.6rem]"
        >
          {question.de.q}
        </h2>
      </div>
      {showEnglish ? (
        <div className="min-w-0 border-line md:border-l md:pl-10">
          <p
            className="folio-mark mb-2"
            aria-hidden="true"
          >
            English
          </p>
          <p
            lang="en"
            className="text-lg leading-snug text-muted md:pt-1"
          >
            {question.en.q}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export { QuestionHeading };
