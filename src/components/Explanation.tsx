import type { ReactElement } from "react";

import type { Question } from "#lib/schemas.ts";

/**
 * Why the correct answer is right, in English and, where available, German.
 * @param props - The question.
 * @returns The explanation block.
 */
function Explanation(props: Readonly<{ question: Question }>): ReactElement {
  const { explanation } = props.question;
  return (
    <div className="mt-4 max-w-prose space-y-2 text-[0.95rem]">
      <p className="folio-mark">Warum · Why</p>
      <p lang="en">{explanation.en}</p>
      {explanation.de === null ? null : (
        <p
          lang="de"
          className="text-muted"
        >
          {explanation.de}
        </p>
      )}
    </div>
  );
}

export { Explanation };
