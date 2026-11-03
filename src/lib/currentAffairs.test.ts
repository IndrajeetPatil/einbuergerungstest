import { describe, expect, test } from "vite-plus/test";

import { CHECKED, currentAffairs } from "./currentAffairs.ts";
import type { CurrentFact } from "./currentAffairs.ts";

const fact: CurrentFact = {
  id: "g72",
  option: 0,
  latest: { de: "Jemand anderes", en: "Someone else" },
  outlook: null,
  sources: [],
};

describe(currentAffairs, () => {
  test("lists general questions whose official key is still current", () => {
    const affairs = currentAffairs();
    expect(affairs.map((affair) => affair.question.id)).toStrictEqual([
      "g72",
      "g73",
      "g75",
      "g213",
      "g236",
    ]);
    expect(affairs.every((affair) => affair.upToDate)).toBe(true);
  });

  test("flags a fact that no longer matches the official key", () => {
    expect(currentAffairs([fact])).toStrictEqual([
      expect.objectContaining({ fact, upToDate: false }),
    ]);
  });

  test("rejects a fact about an unknown question", () => {
    expect(() => currentAffairs([{ ...fact, id: "nope" }])).toThrow(
      /unknown question/u,
    );
  });

  test("records a valid check date", () => {
    expect(CHECKED).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
  });
});
