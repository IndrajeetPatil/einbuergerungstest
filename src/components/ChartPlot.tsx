import type { PointerEvent, ReactElement } from "react";

import { CHART, nearestPoint } from "#lib/chartModel.ts";
import type { ChartModel, ChartPoint } from "#lib/chartModel.ts";

import { ChartGrid } from "./ChartGrid.tsx";
import { ChartHover } from "./ChartHover.tsx";
import { ChartReferences } from "./ChartReferences.tsx";
import { ChartSeries } from "./ChartSeries.tsx";

function pointerTarget(
  event: PointerEvent<SVGRectElement>,
  points: readonly ChartPoint[],
): ChartPoint | null {
  const box = event.currentTarget.getBoundingClientRect();
  return nearestPoint(
    points,
    event.clientX - box.left + CHART.left,
    event.clientY - box.top + CHART.top,
  );
}

/**
 * The chart's SVG: grid, references, series, hover marks and pointer layer.
 * @param props - Model, width, hovered point and hover handler.
 * @returns The decorative SVG; the session table carries the values.
 */
function ChartPlot(
  props: Readonly<{
    model: ChartModel;
    width: number;
    hover: ChartPoint | null;
    onHover: (point: ChartPoint | null) => void;
  }>,
): ReactElement {
  const { model, width, hover, onHover } = props;
  const points = [...model.exams, ...model.practice];
  return (
    <svg
      width={width}
      height={CHART.height}
      aria-hidden="true"
      className="block overflow-visible"
    >
      <ChartGrid
        model={model}
        width={width}
      />
      <ChartReferences
        model={model}
        width={width}
      />
      <ChartSeries model={model} />
      {hover === null ? null : <ChartHover point={hover} />}
      <rect
        x={CHART.left}
        y={CHART.top}
        width={Math.max(width - CHART.left - CHART.right, 0)}
        height={CHART.height - CHART.top - CHART.bottom}
        fill="transparent"
        onPointerMove={(event) => {
          onHover(pointerTarget(event, points));
        }}
        onPointerLeave={() => {
          onHover(null);
        }}
      />
    </svg>
  );
}

export { ChartPlot };
