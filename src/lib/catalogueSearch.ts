// Searching and filtering the catalogue view.
import { label } from "./catalogue.ts";
import { masteryOf } from "./mastery.ts";
import type { Mastery, Stats } from "./mastery.ts";
import type { Question } from "./schemas.ts";

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
    [
      entry.de.q,
      entry.en.q,
      ...entry.de.o,
      ...entry.en.o,
      label(entry),
      entry.id,
    ].join(" "),
  );
}

function matches(entry: Question, needle: string, byId: boolean): boolean {
  return byId ? fold(entry.id) === needle : haystack(entry).includes(needle);
}

interface CatalogueFilter {
  query: string;
  mastery: Mastery | "all";
}

/**
 * Questions matching a search and a mastery filter. A query that is exactly a
 * question id, such as `g107` in a backup file, finds that question alone.
 * @param pool - Questions to search.
 * @param stats - Per-question statistics.
 * @param filter - Query text and mastery filter.
 * @returns The matching questions, in catalogue order.
 */
function searchCatalogue(
  pool: readonly Question[],
  stats: Stats,
  filter: CatalogueFilter,
): Question[] {
  const needle = fold(filter.query.trim());
  const byId = pool.some((entry) => fold(entry.id) === needle);
  return pool.filter(
    (entry) =>
      (filter.mastery === "all" ||
        masteryOf(stats[entry.id]) === filter.mastery) &&
      matches(entry, needle, byId),
  );
}

export { fold, searchCatalogue };
export type { CatalogueFilter };
