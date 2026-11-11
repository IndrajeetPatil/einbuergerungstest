import type { ReactElement } from "react";

import type { CatalogueFilter } from "#lib/catalogueSearch.ts";
import { MASTERY_LABEL } from "#lib/mastery.ts";
import type { Mastery } from "#lib/mastery.ts";

const OPTIONS: readonly (Mastery | "all")[] = [
  "all",
  "mastered",
  "once",
  "missed",
  "new",
];

function isOption(value: string): value is Mastery | "all" {
  return OPTIONS.some((option) => option === value);
}

/**
 * Sticky search box and mastery filter.
 * @param props - Current filter, result count and change handler.
 * @returns The filter bar.
 */
function CatalogueFilters(
  props: Readonly<{
    filter: CatalogueFilter;
    shown: number;
    onChange: (filter: CatalogueFilter) => void;
  }>,
): ReactElement {
  const { filter, shown, onChange } = props;
  return (
    <div className="sticky top-0 z-10 mt-8 flex flex-wrap items-center gap-3 border-b border-line bg-bg py-3">
      <input
        type="search"
        className="input min-w-0 flex-1"
        placeholder="Suchen · Search (German, English or ID such as g107)"
        value={filter.query}
        onChange={(event) => {
          onChange({ ...filter, query: event.target.value });
        }}
        aria-label="Search questions"
      />
      <select
        className="select"
        value={filter.mastery}
        onChange={(event) => {
          const { value } = event.target;
          if (isOption(value)) {
            onChange({ ...filter, mastery: value });
          }
        }}
        aria-label="Filter by progress"
      >
        {OPTIONS.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option === "all" ? "All questions" : MASTERY_LABEL[option].en}
          </option>
        ))}
      </select>
      <span
        className="text-sm text-muted tabular-nums"
        aria-live="polite"
      >
        {shown} shown
      </span>
    </div>
  );
}

export { CatalogueFilters };
