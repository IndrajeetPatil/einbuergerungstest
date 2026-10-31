import { useDeferredValue, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { questions, stateName } from "#lib/catalogue.ts";
import { searchCatalogue } from "#lib/catalogueSearch.ts";
import type { CatalogueFilter } from "#lib/catalogueSearch.ts";
import { poolFor } from "#lib/mastery.ts";
import type { QuestionStat, Settings, StateCode } from "#lib/schemas.ts";

import { CatalogueEntry } from "./CatalogueEntry.tsx";
import { CatalogueFilters } from "./CatalogueFilters.tsx";

/**
 * Read-through of every question that can come up, with answers and
 * explanations.
 * @param props - State, settings and statistics.
 * @returns The catalogue view.
 */
function CatalogueView(
  props: Readonly<{
    state: StateCode;
    settings: Settings;
    stats: Readonly<Record<string, QuestionStat>>;
  }>,
): ReactElement {
  const { state, settings, stats } = props;
  const [filter, setFilter] = useState<CatalogueFilter>({
    query: "",
    mastery: "all",
  });
  const deferred = useDeferredValue(filter);
  const pool = useMemo(() => poolFor(questions, state), [state]);
  const shown = useMemo(
    () => searchCatalogue(pool, stats, deferred),
    [deferred, pool, stats],
  );
  return (
    <main className="mx-auto max-w-5xl px-5 pt-10 pb-24 md:px-8">
      <h1 className="text-title">Fragenkatalog</h1>
      <p className="mt-3 max-w-prose text-lg text-muted">
        All {pool.length} questions that can come up for you (300 general, 10
        for {stateName(state)}), with the correct answer and an explanation.
        Reading is no substitute for answering — use it to look things up.
      </p>
      <CatalogueFilters
        filter={filter}
        shown={shown.length}
        onChange={setFilter}
      />
      <ol className="divide-y divide-line">
        {shown.map((entry) => (
          <CatalogueEntry
            key={entry.id}
            question={entry}
            stat={stats[entry.id]}
            showEnglish={settings.showEnglish}
          />
        ))}
      </ol>
    </main>
  );
}

export { CatalogueView };
