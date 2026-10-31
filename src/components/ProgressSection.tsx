import type { ReactElement } from "react";

import { progressFigures } from "#lib/progressFigures.ts";
import type { SessionSummary } from "#lib/schemas.ts";

import { LatestExam } from "./LatestExam.tsx";
import { ScoreChart } from "./ScoreChart.tsx";
import { StatTile } from "./StatTile.tsx";

/**
 * Headline figures and the score chart.
 * @param props - Finished sessions and the exam date.
 * @returns The progress section.
 */
function ProgressSection(
  props: Readonly<{
    sessions: readonly SessionSummary[];
    examDate: string | null;
  }>,
): ReactElement {
  const { sessions, examDate } = props;
  const figures = progressFigures(sessions);
  return (
    <section className="mt-16">
      <div className="rule-ticks" />
      <h2 className="mt-6 text-heading">Fortschritt · Progress</h2>
      <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-5">
        <LatestExam exam={figures.latest} />
        <StatTile
          label="Average, last 3"
          value={figures.averageRecent}
        />
        <StatTile
          label="Best"
          value={figures.best}
        />
        <StatTile
          label="Mock exams passed"
          value={figures.passedOfTaken}
        />
        <StatTile
          label="Day streak"
          value={figures.streak}
        />
      </dl>
      <div className="mt-10">
        <ScoreChart
          sessions={sessions}
          examDate={examDate}
        />
      </div>
    </section>
  );
}

export { ProgressSection };
