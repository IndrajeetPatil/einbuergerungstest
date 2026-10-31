import { describe, expect, test } from "vite-plus/test";

import { CHART, chartModel, linePath, nearestPoint } from "./chartModel.ts";
import { required, sessionOf } from "./testing.ts";

const NOW = new Date(2026, 9, 31, 12).getTime();
const WIDTH = 800;
const sessions = [
  sessionOf({
    id: 1,
    startedAt: new Date(2026, 9, 29, 19).toISOString(),
    correct: 20,
  }),
  sessionOf({
    id: 2,
    mode: "practice",
    answered: 10,
    correct: 5,
    startedAt: new Date(2026, 9, 30, 9).toISOString(),
  }),
  sessionOf({
    id: 3,
    startedAt: new Date(2026, 9, 30, 19).toISOString(),
    correct: 33,
  }),
  sessionOf({ id: 4, mode: "practice", answered: 0, correct: 0 }),
];
const model = chartModel({
  sessions,
  examDate: "2026-11-11",
  width: WIDTH,
  now: NOW,
});
const [firstExam, lastExam] = model.exams;

describe(chartModel, () => {
  test("splits exams from answered practice sessions", () => {
    expect(model.exams.map((point) => point.session.id)).toStrictEqual([1, 3]);
    expect(model.practice.map((point) => point.session.id)).toStrictEqual([2]);
  });

  test("maps full marks to the top and the exam day inside the plot", () => {
    const examX = required(model.examX);
    expect(required(lastExam).y).toBe(CHART.top);
    expect(examX).toBeGreaterThan(required(lastExam).x);
    expect(examX).toBeLessThan(WIDTH - CHART.right);
  });

  test("uses daily ticks for short ranges and wider ones later", () => {
    const later = chartModel({
      sessions,
      examDate: "2027-03-01",
      width: WIDTH,
      now: NOW,
    });
    expect([model.tickStepDays, later.tickStepDays]).toStrictEqual([1, 14]);
  });

  test("has no exam marker without an exam date", () => {
    expect(
      chartModel({ sessions: [], examDate: null, width: WIDTH, now: NOW })
        .examX,
    ).toBeNull();
  });
});

describe(nearestPoint, () => {
  test("finds the closest point", () => {
    const target = required(firstExam);
    expect(nearestPoint(model.exams, target.x, target.y)).toBe(target);
  });

  test("finds nothing in an empty chart", () => {
    expect(nearestPoint([], 0, 0)).toBeNull();
  });
});

describe(linePath, () => {
  test("moves to the first point and draws lines to the rest", () => {
    expect(linePath(model.exams)).toMatch(/^M[\d.]+,[\d.]+L[\d.]+,[\d.]+$/u);
  });
});
