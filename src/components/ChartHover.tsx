import type { ReactElement } from "react";

import { CHART, MARK } from "#lib/chartModel.ts";
import type { ChartPoint } from "#lib/chartModel.ts";

/**
 * Crosshair and ring on the hovered session.
 * @param props - Hovered point.
 * @returns The SVG group.
 */
function ChartHover(props: Readonly<{ point: ChartPoint }>): ReactElement {
  const { point } = props;
  return (
    <g pointerEvents="none">
      <line
        x1={point.x}
        x2={point.x}
        y1={CHART.top}
        y2={CHART.height - CHART.bottom}
        stroke="var(--color-muted)"
      />
      <circle
        cx={point.x}
        cy={point.y}
        r={MARK.hoverRadius}
        fill="none"
        stroke={
          point.session.mode === "exam"
            ? "var(--color-accent)"
            : "var(--color-slate)"
        }
        strokeWidth={MARK.hoverStroke}
      />
    </g>
  );
}

export { ChartHover };
