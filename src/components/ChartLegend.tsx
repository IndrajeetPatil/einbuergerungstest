import type { ReactElement } from "react";

/**
 * Legend of the score chart: a line key for exams, a dot for practice.
 * @returns The legend row.
 */
function ChartLegend(): ReactElement {
  return (
    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
      <span className="inline-flex items-center gap-2">
        <span
          className="relative inline-block h-0.5 w-5 rounded-full bg-accent before:absolute before:top-1/2 before:left-1/2 before:size-2 before:-translate-1/2 before:rounded-full before:bg-accent"
          aria-hidden="true"
        />
        Mock exam score
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          className="inline-block size-2 rounded-full bg-slate"
          aria-hidden="true"
        />
        Practice session, first-try accuracy
      </span>
    </div>
  );
}

export { ChartLegend };
