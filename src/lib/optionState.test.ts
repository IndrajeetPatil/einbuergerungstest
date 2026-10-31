import { describe, expect, test } from "vite-plus/test";

import { optionState } from "./optionState.ts";

describe(optionState, () => {
  test.each([
    { revealed: false, chosen: false, answer: true, expected: "idle" },
    { revealed: false, chosen: true, answer: false, expected: "chosen" },
    { revealed: true, chosen: true, answer: true, expected: "correct" },
    { revealed: true, chosen: false, answer: true, expected: "correct" },
    { revealed: true, chosen: true, answer: false, expected: "wrong" },
    { revealed: true, chosen: false, answer: false, expected: "dim" },
  ])(
    "is $expected when revealed=$revealed, chosen=$chosen, answer=$answer",
    ({ revealed, chosen, answer, expected }) => {
      expect(optionState(revealed, chosen, answer)).toBe(expected);
    },
  );
});
