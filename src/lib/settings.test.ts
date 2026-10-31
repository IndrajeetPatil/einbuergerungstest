import { describe, expect, test } from "vite-plus/test";

import { mergeSettings } from "./settings.ts";

describe(mergeSettings, () => {
  const base = {
    state: "BE",
    examDate: "2026-11-11",
    showEnglish: true,
    shuffleOptions: true,
  } as const;

  test("changes only the fields the patch sets, including clearing to null", () => {
    expect(
      mergeSettings(base, { examDate: null, showEnglish: false }),
    ).toStrictEqual({
      state: "BE",
      examDate: null,
      showEnglish: false,
      shuffleOptions: true,
    });
    expect(mergeSettings(base, {})).toStrictEqual(base);
  });
});
