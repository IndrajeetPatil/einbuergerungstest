import { describe, expect, test } from "vite-plus/test";

import {
  label,
  optionText,
  question,
  questions,
  stateName,
} from "./catalogue.ts";
import { required } from "./testing.ts";

const general = required(questions.find((entry) => entry.state === null));
const berlin = required(questions.find((entry) => entry.state === "BE"));

describe(question, () => {
  test("finds a question by id and rejects unknown ids", () => {
    expect(question(general.id)).toBe(general);
    expect(() => question("nope")).toThrow(/unknown question/u);
  });
});

describe(label, () => {
  test("names general and state questions", () => {
    expect(label(general)).toBe(`Frage ${general.num}`);
    expect(label(berlin)).toBe(`Berlin ${berlin.num}`);
  });
});

describe(stateName, () => {
  test("names states in German and English, and nothing for null", () => {
    expect([
      stateName("BY"),
      stateName("BY", "en"),
      stateName(null),
    ]).toStrictEqual(["Bayern", "Bavaria", ""]);
  });
});

describe(optionText, () => {
  test("returns option text and an empty string out of range", () => {
    expect(optionText(general, general.answer, "de")).toBe(
      general.de.o[general.answer],
    );
    expect(optionText(general, 9, "en")).toBe("");
  });
});
