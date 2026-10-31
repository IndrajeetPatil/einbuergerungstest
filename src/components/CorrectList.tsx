import type { ReactElement } from "react";

import { CorrectRow } from "./CorrectRow.tsx";
import type { ReviewEntry } from "./reviewEntry.ts";

/**
 * Collapsed list of correctly answered questions.
 * @param props - Entries and the language toggle.
 * @returns The disclosure section.
 */
function CorrectList(
  props: Readonly<{
    entries: readonly ReviewEntry[];
    showEnglish: boolean;
  }>,
): ReactElement {
  const { entries, showEnglish } = props;
  return (
    <section className="mt-14 border-t border-line pt-6">
      <details>
        <summary className="flex min-h-11 cursor-pointer items-center font-serif text-heading font-semibold">
          Richtig beantwortet · Correct{" "}
          <span className="ml-2 text-muted">({entries.length})</span>
        </summary>
        <ul className="mt-4 divide-y divide-line">
          {entries.map(({ position, question }) => (
            <CorrectRow
              key={position}
              question={question}
              showEnglish={showEnglish}
            />
          ))}
        </ul>
      </details>
    </section>
  );
}

export { CorrectList };
