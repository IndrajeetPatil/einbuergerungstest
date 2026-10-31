import type { ReactElement } from "react";

import { CHART, GRID_SHARES, MARK } from "#lib/chartModel.ts";
import type { ChartModel } from "#lib/chartModel.ts";
import { percent, shortDate } from "#lib/format.ts";

const DAY_MS = 86_400_000;
const ALTERNATE = 2;

function showTickLabel(model: ChartModel, tick: number): boolean {
  const first = model.ticks[0] ?? tick;
  return (
    model.tickStepDays > 1 ||
    model.innerWidth > MARK.wideChart ||
    Math.round((tick - first) / DAY_MS) % ALTERNATE === 0
  );
}

/**
 * Recessive percent gridlines and date ticks.
 * @param props - Chart model and width.
 * @returns The SVG group.
 */
function ChartGrid(
  props: Readonly<{ model: ChartModel; width: number }>,
): ReactElement {
  const { model, width } = props;
  const baseline = CHART.height - CHART.bottom;
  return (
    <g>
      {GRID_SHARES.map((share) => (
        <g key={share}>
          <line
            x1={CHART.left}
            x2={width - CHART.right}
            y1={model.y(share)}
            y2={model.y(share)}
            stroke="var(--color-line)"
          />
          <text
            x={CHART.left - MARK.axisLabelGap}
            y={model.y(share)}
            dy="0.32em"
            textAnchor="end"
            className="fill-muted text-[11px] tabular-nums"
          >
            {percent(share)}
          </text>
        </g>
      ))}
      {model.ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={model.x(tick)}
            x2={model.x(tick)}
            y1={baseline}
            y2={baseline + MARK.tickLength}
            stroke="var(--color-muted)"
          />
          {showTickLabel(model, tick) ? (
            <text
              x={model.x(tick)}
              y={baseline + MARK.tickLabelOffset}
              textAnchor="middle"
              className="fill-muted text-[11px] tabular-nums"
            >
              {shortDate.format(tick)}
            </text>
          ) : null}
        </g>
      ))}
    </g>
  );
}

export { ChartGrid };
