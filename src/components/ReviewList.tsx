import type { ReactElement } from "react";

import { label } from "#lib/catalogue.ts";
import type { QuestionStat, Settings } from "#lib/schemas.ts";

import { Feedback } from "./Feedback.tsx";
import { QuestionBlock } from "./QuestionBlock.tsx";
import type { ReviewEntry } from "./reviewEntry.ts";

function allTime(stat: QuestionStat | undefined): string {
  return stat !== undefined && stat.attempts > 1
    ? `All-time on this question: ${stat.correct}/${stat.attempts} correct.`
    : "";
}

/**
 * Questions answered wrongly, each with its correction and explanation.
 * @param props - Entries to review, settings and statistics.
 * @returns The review section.
 */
function ReviewList(
  props: Readonly<{
    entries: readonly ReviewEntry[];
    settings: Settings;
    stats: Readonly<Record<string, QuestionStat>>;
  }>,
): ReactElement {
  const { entries, settings, stats } = props;
  return (
    <section className="mt-14">
      <div className="rule-ticks" />
      <h2 className="mt-6 text-heading">
        Zum Wiederholen · To review{" "}
        <span className="text-muted">({entries.length})</span>
      </h2>
      <p className="mt-2 max-w-prose text-muted">
        Read the German first, then check the English. Each explanation says why
        the answer is right, which makes it easier to recognise next time.
      </p>
      <ol className="mt-8 space-y-14">
        {entries.map(({ item, position, question }) => (
          <li key={position}>
            <p className="folio-mark mb-3">
              {position + 1} · {label(question)}
            </p>
            <QuestionBlock
              question={question}
              order={item.order}
              chosen={item.chosen}
              revealed
              showEnglish={settings.showEnglish}
              onChoose={undefined}
              headingId={`review-${position}`}
            />
            <Feedback
              question={question}
              chosen={item.chosen}
              showEnglish={settings.showEnglish}
            />
            <p className="mt-3 text-sm text-muted">
              {allTime(stats[question.id])}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export { ReviewList };
