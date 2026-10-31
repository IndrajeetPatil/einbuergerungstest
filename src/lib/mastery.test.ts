import { describe, expect, test } from "vite-plus/test";

import { questions } from "./catalogue.ts";
import {
  masteryOf,
  needsReview,
  poolFor,
  priority,
  weakest,
} from "./mastery.ts";
import { statOf } from "./testing.ts";

const NOW = Date.parse("2026-10-31T10:00:00.000Z");
const LATER = NOW + 6 * 86_400_000;

describe(masteryOf, () => {
  test.each([
    { name: "never answered", stat: undefined, expected: "new" },
    { name: "wrong last time", stat: statOf("0111"), expected: "missed" },
    { name: "right once after a miss", stat: statOf("10"), expected: "once" },
    { name: "right twice in a row", stat: statOf("110"), expected: "mastered" },
  ])("is $expected when $name", ({ stat, expected }) => {
    expect(masteryOf(stat)).toBe(expected);
  });
});

describe(needsReview, () => {
  test("flags missed and once, not new or mastered", () => {
    expect(
      [undefined, statOf("0"), statOf("1"), statOf("11")].map((stat) =>
        needsReview(stat),
      ),
    ).toStrictEqual([false, true, true, false]);
  });
});

describe(priority, () => {
  test("ranks missed above new above mastered", () => {
    expect(priority(statOf("0"), NOW)).toBeGreaterThan(
      priority(undefined, NOW),
    );
    expect(priority(undefined, NOW)).toBeGreaterThan(
      priority(statOf("11"), NOW),
    );
  });

  test("lets shaky and mastered questions rise as days pass", () => {
    expect(priority(statOf("1"), LATER)).toBeGreaterThan(
      priority(statOf("1"), NOW),
    );
    expect(priority(statOf("11"), LATER)).toBeGreaterThan(
      priority(statOf("11"), NOW),
    );
  });
});

describe(weakest, () => {
  test("lists missed-last-time questions first", () => {
    const stats = { g1: statOf("10"), g2: statOf("0"), g3: statOf("11") };
    expect(
      weakest(poolFor(questions, "BE"), stats, 5).map(
        (spot) => spot.question.id,
      ),
    ).toStrictEqual(["g2", "g1"]);
  });
});
