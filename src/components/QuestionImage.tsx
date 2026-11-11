import type { ReactElement } from "react";

import type { Question } from "#lib/schemas.ts";

import { QuestionPicture } from "./QuestionPicture.tsx";

/**
 * The picture of a picture question, with its credit.
 * @param props - The question.
 * @returns The figure, or nothing for text-only questions.
 */
function QuestionImage(
  props: Readonly<{ question: Question }>,
): ReactElement | null {
  const { question } = props;
  if (question.image === null) {
    return null;
  }
  return (
    <figure className="mt-6">
      {/* The white mat stays white in dark mode, so the credit sits below it,
          on the page colours. */}
      <div className="rounded-md border border-line bg-white p-3">
        <QuestionPicture
          image={question.image}
          question={question.de.q}
          size="full"
        />
      </div>
      {question.credit === null ? null : (
        <figcaption className="mt-2 text-xs text-muted">
          {question.credit}
        </figcaption>
      )}
    </figure>
  );
}

export { QuestionImage };
