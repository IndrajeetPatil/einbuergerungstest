import { describe, expect, test } from "vite-plus/test";

import { describeError } from "./describeError.ts";

describe(describeError, () => {
  test("uses an error's message and stringifies anything else", () => {
    expect([describeError(new Error("boom")), describeError(42)]).toStrictEqual(
      ["boom", "42"],
    );
  });
});
