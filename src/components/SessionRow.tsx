import type { ReactElement } from "react";

import { dateTime, minutes, percent } from "#lib/format.ts";
import { FOCI } from "#lib/practiceFoci.ts";
import { accuracy, scoredOutOf } from "#lib/quiz.ts";
import type { SessionSummary } from "#lib/schemas.ts";

function typeLabel(session: SessionSummary): string {
  if (session.mode === "exam") {
    return "Mock exam";
  }
  const focus = FOCI.find((choice) => choice.value === session.focus);
  return focus === undefined ? "Practice" : `Practice · ${focus.label}`;
}

/**
 * One finished session in the history table.
 * @param props - The session.
 * @returns The table row.
 */
function SessionRow(
  props: Readonly<{ session: SessionSummary }>,
): ReactElement {
  const { session } = props;
  const exam = session.mode === "exam";
  return (
    <tr>
      <td className="py-2 pr-4">
        {dateTime.format(new Date(session.startedAt))}
      </td>
      <td className="py-2 pr-4">
        <span className={`chip ${exam ? "chip-accent" : "chip-slate"}`}>
          {typeLabel(session)}
        </span>
      </td>
      <td className="py-2 pr-4 text-right font-semibold">
        {session.correct}/{scoredOutOf(session)}
      </td>
      <td className="py-2 pr-4 text-right">{percent(accuracy(session))}</td>
      <td className="py-2 text-right text-muted">
        {minutes(session.durationMs)}
      </td>
    </tr>
  );
}

export { SessionRow };
