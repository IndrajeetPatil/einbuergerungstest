import { describe, expect, test } from "vite-plus/test";

import { questions } from "./catalogue.ts";
import { focusChoice, focusCounts } from "./practiceFoci.ts";
import { statOf } from "./testing.ts";

describe(focusCounts, () => {
  test("counts the questions available to each focus", () => {
    const stats = { g1: statOf("0"), g2: statOf("1"), g3: statOf("11") };
    expect(focusCounts(questions, "BE", stats)).toStrictEqual({
      smart: 310,
      new: 307,
      mistakes: 2,
      state: 10,
      all: 310,
    });
  });
});

describe(focusChoice, () => {
  test("finds a focus with its sizing", () => {
    expect([
      focusChoice("state").sized,
      focusChoice("smart").sized,
    ]).toStrictEqual([false, true]);
  });
});
