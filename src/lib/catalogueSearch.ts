// Searching and filtering the catalogue view.
import { label } from "./catalogue.ts";
import { masteryOf } from "./mastery.ts";
import type { Mastery } from "./mastery.ts";
import type { Question, QuestionStat } from "./schemas.ts";

/**
 * Lower-cases and strips accents so "Burger" finds "Bürger".
 * @param text - Any text.
 * @returns The folded text.
 */
function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .replaceAll("ß", "ss");
}

function haystack(entry: Question): string {
  return fold(
    [entry.de.q, entry.en.q, ...entry.de.o, ...entry.en.o, label(entry)].join(
      " ",
    ),
  );
}

interface CatalogueFilter {
  query: string;
  mastery: Mastery | "all";
}

/**
 * Questions matching a search and a mastery filter.
 * @param pool - Questions to search.
 * @param stats - Per-question statistics.
 * @param filter - Query text and mastery filter.
 * @returns The matching questions, in catalogue order.
 */
function searchCatalogue(
  pool: readonly Question[],
  stats: Readonly<Record<string, QuestionStat>>,
  filter: CatalogueFilter,
): Question[] {
  const needle = fold(filter.query.trim());
  return pool.filter(
    (entry) =>
      (filter.mastery === "all" ||
        masteryOf(stats[entry.id]) === filter.mastery) &&
      haystack(entry).includes(needle),
  );
}

export { fold, searchCatalogue };
export type { CatalogueFilter };
