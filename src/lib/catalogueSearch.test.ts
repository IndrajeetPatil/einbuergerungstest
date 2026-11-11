import { describe, expect, test } from "vite-plus/test";

import { questions } from "./catalogue.ts";
import { fold, searchCatalogue } from "./catalogueSearch.ts";
import { poolFor } from "./mastery.ts";
import { statOf } from "./testing.ts";

const pool = poolFor(questions, "BE");

function ids(query: string): string[] {
  return searchCatalogue(pool, {}, { query, mastery: "all" }).map(
    (entry) => entry.id,
  );
}

describe(fold, () => {
  test("ignores case, accents and ß", () => {
    expect(fold("Bürger Straße")).toBe("burger strasse");
  });
});

describe(searchCatalogue, () => {
  test("finds German and English text without accents", () => {
    const german = searchCatalogue(
      pool,
      {},
      { query: "Bundesprasident", mastery: "all" },
    );
    const english = searchCatalogue(
      pool,
      {},
      { query: "coat of arms", mastery: "all" },
    );
    expect(german.length).toBeGreaterThan(0);
    expect(english.some((entry) => entry.de.q.includes("Wappen"))).toBe(true);
  });

  test("finds a question by its exact id, in any case", () => {
    expect(ids("g1")).toStrictEqual(["g1"]);
    expect(ids(" G107 ")).toStrictEqual(["g107"]);
    expect(ids("be1")).toStrictEqual(["BE1"]);
    expect(ids("g10")).toStrictEqual(["g10"]);
    expect(ids("g3000")).toStrictEqual([]);
  });

  test("filters by mastery", () => {
    const stats = { g1: statOf("0") };
    expect(
      searchCatalogue(pool, stats, { query: "", mastery: "missed" }).map(
        (entry) => entry.id,
      ),
    ).toStrictEqual(["g1"]);
  });
});
