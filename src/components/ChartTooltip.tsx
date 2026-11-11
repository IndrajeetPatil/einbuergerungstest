import { useMemo } from "react";
import type { CSSProperties, ReactElement } from "react";

import { CHART, MARK } from "#lib/chartModel.ts";
import type { ChartPoint } from "#lib/chartModel.ts";
import { dateTime, percent } from "#lib/format.ts";
import { scoredOutOf } from "#lib/quiz.ts";

function position(point: ChartPoint, width: number): CSSProperties {
  // Beside the point, never on top of it.
  const room = point.x + MARK.tooltipGap + MARK.tooltipWidth < width;
  return {
    left: room
      ? point.x + MARK.tooltipGap
      : Math.max(point.x - MARK.tooltipGap - MARK.tooltipWidth, 0),
    top: Math.min(
      Math.max(point.y - MARK.tooltipRise, 0),
      CHART.height - MARK.tooltipHeight,
    ),
  };
}

/**
 * Value-first tooltip for the hovered session.
 * @param props - Hovered point and chart width.
 * @returns The tooltip.
 */
function ChartTooltip(
  props: Readonly<{ point: ChartPoint; width: number }>,
): ReactElement {
  const { point, width } = props;
  const style = useMemo(() => position(point, width), [point, width]);
  const { session } = point;
  const exam = session.mode === "exam";
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-44 rounded-md border border-line bg-surface px-3 py-2 text-sm"
      style={style}
    >
      <p className="font-semibold tabular-nums">
        {session.correct}/{scoredOutOf(session)}{" "}
        <span className="font-normal text-muted">({percent(point.share)})</span>
      </p>
      <p className="flex items-center gap-2 text-muted">
        <span
          className={`inline-block h-0.5 w-3 rounded-full ${exam ? "bg-accent" : "bg-slate"}`}
        />
        {exam ? "Mock exam" : "Practice"}
      </p>
      <p className="text-xs text-muted">{dateTime.format(point.time)}</p>
    </div>
  );
}

export { ChartTooltip };
