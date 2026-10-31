import { useMemo, useState } from "react";
import type { ReactElement } from "react";

import { chartModel } from "#lib/chartModel.ts";
import type { ChartPoint } from "#lib/chartModel.ts";
import type { SessionSummary } from "#lib/schemas.ts";
import { useElementWidth } from "#lib/useElementWidth.ts";

import { ChartLegend } from "./ChartLegend.tsx";
import { ChartPlot } from "./ChartPlot.tsx";
import { ChartTooltip } from "./ChartTooltip.tsx";

/**
 * Score over time on one percent axis: mock-exam scores as a line, practice
 * accuracy as dots, with the pass mark and the exam date.
 * @param props - Finished sessions and the exam date.
 * @returns The chart with legend and hover tooltip.
 */
function ScoreChart(
  props: Readonly<{
    sessions: readonly SessionSummary[];
    examDate: string | null;
  }>,
): ReactElement {
  const { sessions, examDate } = props;
  const [wrapper, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<ChartPoint | null>(null);
  const model = useMemo(
    () => chartModel({ sessions, examDate, width }),
    [examDate, sessions, width],
  );
  return (
    <div
      ref={wrapper}
      className="relative"
    >
      <p className="sr-only">
        Scores over time: {model.exams.length} mock exams and{" "}
        {model.practice.length} practice sessions. Details are in the session
        table below.
      </p>
      <ChartPlot
        model={model}
        width={width}
        hover={hover}
        onHover={setHover}
      />
      {hover === null ? null : (
        <ChartTooltip
          point={hover}
          width={width}
        />
      )}
      <ChartLegend />
      {sessions.length === 0 ? (
        <p className="absolute inset-x-0 top-24 text-center text-muted">
          Your scores will appear here after the first session.
        </p>
      ) : null}
    </div>
  );
}

export { ScoreChart };
