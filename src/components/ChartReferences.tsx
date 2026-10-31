import type { ReactElement } from "react";

import { CHART, MARK, PASS_SHARE } from "#lib/chartModel.ts";
import type { ChartModel } from "#lib/chartModel.ts";
import { EXAM } from "#lib/quiz.ts";

/**
 * The pass-mark line and the exam-day marker.
 * @param props - Chart model and width.
 * @returns The SVG group.
 */
function ChartReferences(
  props: Readonly<{ model: ChartModel; width: number }>,
): ReactElement {
  const { model, width } = props;
  const passY = model.y(PASS_SHARE);
  const labelX = (model.examX ?? width - CHART.right) - MARK.labelGap;
  return (
    <g>
      <line
        x1={CHART.left}
        x2={width - CHART.right}
        y1={passY}
        y2={passY}
        stroke="var(--color-muted)"
      />
      <text
        x={labelX}
        y={passY + MARK.passLabelDrop}
        textAnchor="end"
        className="fill-muted text-[11px] font-semibold tracking-wide uppercase"
      >
        Pass mark {EXAM.passMark}/{EXAM.total}
      </text>
      {model.examX === null ? null : (
        <g>
          <line
            x1={model.examX}
            x2={model.examX}
            y1={CHART.top}
            y2={CHART.height - CHART.bottom}
            stroke="var(--color-accent)"
          />
          <text
            x={labelX}
            y={CHART.top + MARK.examLabelDrop}
            textAnchor="end"
            className="fill-accent text-[11px] font-semibold tracking-wide uppercase"
          >
            Prüfung · Exam
          </text>
        </g>
      )}
    </g>
  );
}

export { ChartReferences };
