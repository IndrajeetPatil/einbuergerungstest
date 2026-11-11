import { describe, expect, test } from "vite-plus/test";

import { catalogue, questions } from "./catalogue.ts";
import {
  EXAM,
  accuracy,
  drawExam,
  optionOrder,
  passed,
  practiceQuestions,
  shuffle,
  weightedSample,
} from "./quiz.ts";
import { required, seeded, sessionOf, statOf } from "./testing.ts";

const SAMPLE_RUNS = 8000;
const picture = required(questions.find((entry) => entry.de.o[0] === "Bild 1"));
const text = required(questions.find((entry) => !entry.keepOrder));
const base = { questions, state: "HH", size: 10, rng: seeded(1) } as const;

function positionCounts(): number[] {
  const counts = [0, 0, 0, 0];
  const rng = seeded(7);
  for (let run = 0; run < SAMPLE_RUNS; run += 1) {
    const position = shuffle([0, 1, 2, 3], rng).indexOf(0);
    counts[position] = required(counts[position]) + 1;
  }
  return counts;
}

function ids(picked: readonly { id: string }[]): string[] {
  return picked.map((entry) => entry.id);
}

describe("bundled question catalogue", () => {
  test("has 300 general and 10 questions for each of the 16 states", () => {
    expect(questions.filter((entry) => entry.state === null)).toHaveLength(300);
    expect(
      catalogue.states.map(
        (state) =>
          questions.filter((entry) => entry.state === state.code).length,
      ),
    ).toStrictEqual(Array.from({ length: 16 }, () => 10));
  });

  test("only keeps picture-label or numeric options in fixed order", () => {
    const fixed = questions.filter((entry) => entry.keepOrder);
    expect(
      fixed.every((entry) =>
        entry.de.o.every((option) =>
          /^(?:Bild \d|[\d.,\s%–-]+.*)$/u.test(option),
        ),
      ),
    ).toBe(true);
  });
});

describe(shuffle, () => {
  test("returns a permutation and leaves its input untouched", () => {
    const input = [1, 2, 3, 4, 5, 6];
    const shuffled = shuffle(input, seeded(3));
    expect(shuffled.toSorted((left, right) => left - right)).toStrictEqual(
      input,
    );
    expect(input).toStrictEqual([1, 2, 3, 4, 5, 6]);
  });

  test("puts an item in each position about equally often", () => {
    expect(Math.min(...positionCounts())).toBeGreaterThan(1800);
  });
});

describe(weightedSample, () => {
  test("never picks more than asked or repeats an item", () => {
    const picked = weightedSample({
      items: [1, 2, 3, 4, 5],
      weight: () => 1,
      count: 3,
      rng: seeded(5),
    });
    expect(new Set(picked).size).toBe(3);
  });
});

describe(drawExam, () => {
  test("draws 30 distinct general questions, then 3 for the state", () => {
    const exam = drawExam(questions, "BE", seeded(11));
    expect(new Set(ids(exam)).size).toBe(EXAM.total);
    expect(
      exam.slice(0, EXAM.general).every((entry) => entry.state === null),
    ).toBe(true);
    expect(
      exam.slice(EXAM.general).every((entry) => entry.state === "BE"),
    ).toBe(true);
  });

  test("never asks the same wording twice", () => {
    for (let run = 1; run <= 200; run += 1) {
      const exam = drawExam(questions, "BE", seeded(run));
      expect(new Set(exam.map((entry) => entry.de.q)).size).toBe(EXAM.total);
    }
  });

  test("differs between draws", () => {
    const first = drawExam(questions, "BY", seeded(1));
    const second = drawExam(questions, "BY", seeded(2));
    expect(ids(first)).not.toStrictEqual(ids(second));
  });
});

describe(optionOrder, () => {
  test("keeps picture options in place", () => {
    expect(optionOrder(picture, true, seeded(5))).toStrictEqual([0, 1, 2, 3]);
  });

  test("shuffles text options only when asked", () => {
    const orders = new Set(
      Array.from({ length: 20 }, (_unused, run) =>
        optionOrder(text, true, seeded(run + 1)).join(""),
      ),
    );
    expect(orders.size).toBeGreaterThan(5);
    expect(optionOrder(text, false)).toStrictEqual([0, 1, 2, 3]);
  });
});

describe(practiceQuestions, () => {
  test("picks only unseen questions for the new focus", () => {
    const stats = { g1: statOf("1"), g2: statOf("0") };
    const picked = practiceQuestions({
      ...base,
      focus: "new",
      stats,
      size: 400,
    });
    expect(picked).toHaveLength(308);
    expect(ids(picked)).not.toStrictEqual(expect.arrayContaining(["g1"]));
  });

  test("picks only shaky or missed questions for the mistakes focus", () => {
    const stats = { g1: statOf("1"), g2: statOf("0"), g3: statOf("11") };
    const picked = practiceQuestions({ ...base, focus: "mistakes", stats });
    expect(ids(picked).toSorted()).toStrictEqual(["g1", "g2"]);
  });

  test("covers the whole pool for the all focus", () => {
    const picked = practiceQuestions({
      ...base,
      state: "SN",
      focus: "all",
      stats: {},
    });
    expect(picked).toHaveLength(310);
    expect(new Set(picked.map((entry) => entry.state))).toStrictEqual(
      new Set([null, "SN"]),
    );
  });

  test("picks the 10 state questions for the state focus", () => {
    const picked = practiceQuestions({ ...base, focus: "state", stats: {} });
    expect(picked.map((entry) => entry.state)).toStrictEqual(
      Array.from({ length: 10 }, () => "HH"),
    );
  });

  test("picks exactly the selected questions", () => {
    const picked = practiceQuestions({
      ...base,
      focus: "selected",
      stats: {},
      selected: ["g5", "HH2"],
    });
    expect(ids(picked).toSorted()).toStrictEqual(["HH2", "g5"]);
  });

  test("caps review questions at half a smart mix", () => {
    const stats = Object.fromEntries(
      questions.slice(0, 40).map((entry) => [entry.id, statOf("0")]),
    );
    const picked = practiceQuestions({
      ...base,
      focus: "smart",
      stats,
      size: 20,
    });
    expect(new Set(ids(picked)).size).toBe(20);
    expect(picked.filter((entry) => entry.id in stats)).toHaveLength(10);
  });

  test("always includes a few missed questions in a smart mix", () => {
    const stats = { g10: statOf("0"), g20: statOf("0"), g30: statOf("0") };
    const picked = practiceQuestions({
      ...base,
      focus: "smart",
      stats,
      size: 20,
    });
    expect(ids(picked)).toStrictEqual(
      expect.arrayContaining(["g10", "g20", "g30"]),
    );
  });
});

describe(accuracy, () => {
  test.each([
    { session: sessionOf({ correct: 11, answered: 20 }), expected: 1 / 3 },
    {
      session: sessionOf({ mode: "practice", correct: 10, answered: 20 }),
      expected: 0.5,
    },
    {
      session: sessionOf({ mode: "practice", correct: 0, answered: 0 }),
      expected: 0,
    },
  ])("is $expected for $session.mode", ({ session, expected }) => {
    expect(accuracy(session)).toBeCloseTo(expected);
  });
});

describe(passed, () => {
  test("passes from 17 correct answers", () => {
    expect([passed(16), passed(17)]).toStrictEqual([false, true]);
  });
});
