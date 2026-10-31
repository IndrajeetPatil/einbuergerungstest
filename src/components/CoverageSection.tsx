import type { ReactElement } from "react";

import { questions, stateName } from "#lib/catalogue.ts";
import { masteryOf, poolFor } from "#lib/mastery.ts";
import type { Mastery } from "#lib/mastery.ts";
import type { QuestionStat, StateCode } from "#lib/schemas.ts";

import { MasteryBar } from "./MasteryBar.tsx";

function countMastery(
  state: StateCode,
  stats: Readonly<Record<string, QuestionStat>>,
): Record<Mastery, number> {
  const counts: Record<Mastery, number> = {
    mastered: 0,
    once: 0,
    missed: 0,
    new: 0,
  };
  for (const entry of poolFor(questions, state)) {
    counts[masteryOf(stats[entry.id])] += 1;
  }
  return counts;
}

/**
 * How much of the catalogue is mastered, partly known or unseen.
 * @param props - State and per-question statistics.
 * @returns The coverage section.
 */
function CoverageSection(
  props: Readonly<{
    state: StateCode;
    stats: Readonly<Record<string, QuestionStat>>;
  }>,
): ReactElement {
  const { state, stats } = props;
  return (
    <section className="mt-16">
      <h2 className="text-heading">Fragenkatalog · Catalogue coverage</h2>
      <p className="mt-2 text-muted">
        {poolFor(questions, state).length} questions can come up for you: 300
        general and 10 about {stateName(state)}. A question counts as mastered
        after two correct answers in a row.
      </p>
      <MasteryBar counts={countMastery(state, stats)} />
    </section>
  );
}

export { CoverageSection };
