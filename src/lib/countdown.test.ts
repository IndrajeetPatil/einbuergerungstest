import { describe, expect, test } from "vite-plus/test";

import { countdownChip, countdownText } from "./countdown.ts";

const NOW = new Date(2026, 9, 31, 9);

describe(countdownText, () => {
  test.each([
    { date: "2026-11-11", expected: "11 days to go" },
    { date: "2026-11-01", expected: "Tomorrow — viel Erfolg!" },
    { date: "2026-10-31", expected: "Today — viel Erfolg!" },
    { date: "2026-10-01", expected: "The exam date has passed." },
  ])("says $expected for $date", ({ date, expected }) => {
    expect(countdownText(date, NOW)).toBe(expected);
  });
});

describe(countdownChip, () => {
  test.each([
    { date: null, expected: null },
    { date: "2026-10-01", expected: null },
    { date: "2026-10-31", expected: "Exam today" },
    { date: "2026-11-01", expected: "1 day to exam" },
    { date: "2026-11-11", expected: "11 days to exam" },
  ])("shows $expected for $date", ({ date, expected }) => {
    expect(countdownChip(date, NOW)).toBe(expected);
  });
});
