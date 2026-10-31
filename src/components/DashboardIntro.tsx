import type { ReactElement } from "react";

import { countdownText } from "#lib/countdown.ts";
import { parseLocalDate } from "#lib/dates.ts";
import { longGermanDate } from "#lib/format.ts";
import { EXAM } from "#lib/quiz.ts";

/**
 * Title, purpose and the exam date.
 * @param props - Exam date, if set.
 * @returns The opening section.
 */
function DashboardIntro(
  props: Readonly<{ examDate: string | null }>,
): ReactElement {
  const { examDate } = props;
  return (
    <section className="grid gap-x-12 gap-y-6 pt-10 md:grid-cols-[1.4fr_1fr] md:pt-14">
      <div className="min-w-0">
        <p className="field-mark">Einbürgerungstest</p>
        <h1 className="mt-2 text-title">Leben in Deutschland</h1>
        <p className="mt-4 max-w-prose text-lg text-muted">
          Practise the official BAMF catalogue side by side in German and
          English. The test: {EXAM.total} questions, {EXAM.minutes} minutes,{" "}
          {EXAM.passMark} correct to pass.
        </p>
      </div>
      <div className="min-w-0 self-end md:text-right">
        <p className="folio-mark">Prüfungstermin · Exam day</p>
        {examDate === null ? (
          <p className="mt-1 text-muted">
            Set your exam date in Einstellungen · Settings below.
          </p>
        ) : (
          <>
            <p className="mt-1 font-serif text-2xl font-semibold">
              {longGermanDate.format(parseLocalDate(examDate))}
            </p>
            <p className="mt-1 text-muted">{countdownText(examDate)}</p>
          </>
        )}
      </div>
    </section>
  );
}

export { DashboardIntro };
