import { describe, expect, test } from "vite-plus/test";

import { clock, minutes, percent } from "./format.ts";

describe("formatting", () => {
  test.each([
    [percent(0.876), "88%"],
    [minutes(null), "–"],
    [minutes(10_000), "1 min"],
    [minutes(1_500_000), "25 min"],
    [clock(3_599_000), "59:59"],
    [clock(-5), "00:00"],
  ])("formats %s", (actual, expected) => {
    expect(actual).toBe(expected);
  });
});
