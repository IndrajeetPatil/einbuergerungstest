import type { ReactElement } from "react";

import { MARK, linePath } from "#lib/chartModel.ts";
import type { ChartModel } from "#lib/chartModel.ts";

/**
 * Practice dots, the mock-exam line and its end label.
 * @param props - Chart model.
 * @returns The SVG group.
 */
function ChartSeries(props: Readonly<{ model: ChartModel }>): ReactElement {
  const { model } = props;
  const last = model.exams.at(-1);
  return (
    <g>
      {model.practice.map((point) => (
        <circle
          key={point.session.id}
          cx={point.x}
          cy={point.y}
          r={MARK.practiceRadius}
          fill="var(--color-slate)"
          stroke="var(--color-surface)"
          strokeWidth={MARK.ring}
        />
      ))}
      <path
        d={linePath(model.exams)}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={MARK.line}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {model.exams.map((point) => (
        <circle
          key={point.session.id}
          cx={point.x}
          cy={point.y}
          r={MARK.examRadius}
          fill="var(--color-accent)"
          stroke="var(--color-surface)"
          strokeWidth={MARK.ring}
        />
      ))}
      {last === undefined ? null : (
        <text
          x={last.x + MARK.endLabelGap}
          y={last.y}
          dy="0.32em"
          className="fill-ink text-[12px] font-semibold tabular-nums"
        >
          {last.session.correct}/{last.session.questionCount}
        </text>
      )}
    </g>
  );
}

export { ChartSeries };
