import { describe, expect, test } from "vite-plus/test";

import { daysUntil, streak } from "./dates.ts";
import { sessionOf } from "./testing.ts";

const NOW = new Date(2026, 9, 31, 9);

function on(day: number): ReturnType<typeof sessionOf> {
  return sessionOf({ startedAt: new Date(2026, 9, day, 12).toISOString() });
}

describe(daysUntil, () => {
  test("counts whole local days", () => {
    expect(daysUntil("2026-11-11", new Date(2026, 9, 31, 23, 30))).toBe(11);
    expect(daysUntil("2026-11-11", new Date(2026, 10, 11, 8, 0))).toBe(0);
  });
});

describe(streak, () => {
  test.each([
    { name: "ending yesterday", days: [28, 29, 30], expected: 3 },
    { name: "ending today", days: [28, 30, 31], expected: 2 },
    { name: "that is broken", days: [27], expected: 0 },
  ])("counts a streak $name", ({ days, expected }) => {
    expect(
      streak(
        days.map((day) => on(day)),
        NOW,
      ),
    ).toBe(expected);
  });
});
