import { describe, expect, test } from "vite-plus/test";

import { actionFor, ignoreKey, keyAction } from "./quizKeys.ts";

describe(keyAction, () => {
  test.each([
    ["1", false, { kind: "choose", position: 0 }],
    ["D", false, { kind: "choose", position: 3 }],
    ["Enter", false, { kind: "enter" }],
    ["e", true, { kind: "english" }],
    ["ArrowRight", true, { kind: "next" }],
    ["ArrowLeft", true, { kind: "previous" }],
    ["f", true, { kind: "flag" }],
  ] as const)("maps %s (exam: %s)", (key, exam, expected) => {
    expect(keyAction(key, exam)).toStrictEqual(expected);
  });

  test.each([
    ["ArrowRight", false],
    ["f", false],
    ["x", true],
  ] as const)("ignores %s (exam: %s)", (key, exam) => {
    expect(keyAction(key, exam)).toBeNull();
  });
});

describe(ignoreKey, () => {
  const plain = {
    key: "x",
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    target: null,
  };

  test("leaves modified keys to the browser", () => {
    expect(ignoreKey({ ...plain, ctrlKey: true })).toBe(true);
    expect(ignoreKey({ ...plain, metaKey: true })).toBe(true);
  });

  test("handles plain keys outside form fields", () => {
    expect(ignoreKey(plain)).toBe(false);
  });
});

describe(actionFor, () => {
  const plain = {
    key: "1",
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    target: null,
  };

  test("maps a plain key to its action", () => {
    expect(actionFor(plain, { exam: false, dialogOpen: false })).toStrictEqual({
      kind: "choose",
      position: 0,
    });
  });

  test("leaves keys alone while a dialog is open or a modifier is held", () => {
    expect(actionFor(plain, { exam: false, dialogOpen: true })).toBeNull();
    expect(
      actionFor({ ...plain, altKey: true }, { exam: false, dialogOpen: false }),
    ).toBeNull();
  });

  test("ignores keys without an action", () => {
    expect(
      actionFor({ ...plain, key: "z" }, { exam: true, dialogOpen: false }),
    ).toBeNull();
  });
});
