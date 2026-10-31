import type { ReactElement } from "react";

import type { SessionSummary } from "#lib/schemas.ts";

import { SessionRow } from "./SessionRow.tsx";

const SHOWN = 30;

/**
 * The latest sessions, newest first: the table view of the score chart.
 * @param props - Finished sessions, oldest first.
 * @returns The section.
 */
function SessionHistory(
  props: Readonly<{ sessions: readonly SessionSummary[] }>,
): ReactElement {
  return (
    <section className="mt-16">
      <h2 className="text-heading">Verlauf · Session history</h2>
      {/* Scrolls sideways on small screens, so it takes keyboard focus. */}
      <section
        className="mt-4 overflow-x-auto"
        aria-label="Session history table"
        tabIndex={0}
      >
        <table className="w-full min-w-[34rem] text-left text-sm tabular-nums">
          <thead className="text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-4 font-semibold">When</th>
              <th className="py-2 pr-4 font-semibold">Type</th>
              <th className="py-2 pr-4 text-right font-semibold">Score</th>
              <th className="py-2 pr-4 text-right font-semibold">Accuracy</th>
              <th className="py-2 text-right font-semibold">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {props.sessions
              .toReversed()
              .slice(0, SHOWN)
              .map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                />
              ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}

export { SessionHistory };
