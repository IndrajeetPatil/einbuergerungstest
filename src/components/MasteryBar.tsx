import { useMemo } from "react";
import type { ReactElement } from "react";

import { MASTERY_LABEL } from "#lib/mastery.ts";
import type { Mastery } from "#lib/mastery.ts";

const ORDER: readonly Mastery[] = ["mastered", "once", "missed", "new"];
const FILL: Readonly<Record<Mastery, string>> = {
  mastered: "bg-accent",
  once: "bg-slate",
  missed: "bg-rust",
  new: "bg-line",
};

/**
 * Catalogue coverage as a thin segmented bar with a legend.
 * @param props - Count per mastery state.
 * @returns The bar and legend.
 */
function MasteryBar(
  props: Readonly<{ counts: Readonly<Record<Mastery, number>> }>,
): ReactElement {
  const { counts } = props;
  const present = useMemo(
    () => ORDER.filter((key) => counts[key] > 0),
    [counts],
  );
  // Grid tracks proportional to the counts; the 2px gap separates segments.
  const style = useMemo(
    () => ({
      gridTemplateColumns: present.map((key) => `${counts[key]}fr`).join(" "),
    }),
    [counts, present],
  );
  return (
    <div className="mt-5">
      <div
        className="grid h-2 gap-[2px] overflow-hidden rounded-full"
        style={style}
        aria-hidden="true"
      >
        {present.map((key) => (
          <div
            key={key}
            className={FILL[key]}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {ORDER.map((key) => (
          <li
            key={key}
            className="inline-flex items-center gap-2"
          >
            <span
              className={`inline-block size-2.5 rounded-sm ${FILL[key]}`}
              aria-hidden="true"
            />
            <span className="font-semibold tabular-nums">{counts[key]}</span>
            <span className="text-muted">
              {MASTERY_LABEL[key].de} · {MASTERY_LABEL[key].en}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { MasteryBar };
