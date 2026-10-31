import { describe, expect, test } from "vite-plus/test";

import { question } from "#lib/catalogue.ts";

import { ProgressStore } from "./db.ts";
import { ValidationError } from "./errors.ts";

const EXAM_START = {
  mode: "exam",
  focus: null,
  state: "BE",
  questionCount: 33,
} as const;
const PRACTICE_START = {
  mode: "practice",
  focus: "smart",
  state: "BE",
  questionCount: 2,
} as const;

function wrongOf(id: string): number {
  return (question(id).answer + 1) % 4;
}

function at(second: number): Date {
  return new Date(Date.UTC(2026, 9, 31, 10, 0, second));
}

function answer(
  questionId: string,
  chosen: number | null,
  extra: { position?: number; retry?: boolean } = {},
): Record<string, unknown> {
  return { questionId, position: 0, chosen, timeMs: 1, ...extra };
}

describe(ProgressStore, () => {
  test("starts without a state or exam date", () => {
    using store = new ProgressStore(":memory:");
    expect(store.getSettings()).toStrictEqual({
      state: null,
      examDate: null,
      showEnglish: true,
      shuffleOptions: true,
    });
  });

  test("validates and stores settings", () => {
    using store = new ProgressStore(":memory:");
    expect(
      store.updateSettings({ state: "BE", examDate: "2026-11-11" }),
    ).toMatchObject({ state: "BE", examDate: "2026-11-11" });
    expect(() => store.updateSettings({ state: "XX" })).toThrow(
      ValidationError,
    );
    expect(() => store.updateSettings({ examDate: "11.11.2026" })).toThrow(
      ValidationError,
    );
  });

  test("scores a submitted exam against the official key", () => {
    using store = new ProgressStore(":memory:");
    const id = store.startSession(EXAM_START);
    const summary = store.finishSession(id, {
      answers: [
        answer("g1", question("g1").answer),
        answer("g2", wrongOf("g2"), { position: 1 }),
        answer("BE1", null, { position: 2 }),
      ],
      durationMs: 600_000,
    });
    expect(summary).toMatchObject({
      correct: 1,
      answered: 2,
      questionCount: 33,
    });
    expect(store.stats()["BE1"]).toMatchObject({ attempts: 1, recent: "0" });
    expect(() => store.finishSession(id)).toThrow(/already finished/u);
  });

  test("keeps recent results newest first and leaves retries out of the score", () => {
    using store = new ProgressStore(":memory:");
    const id = store.startSession(PRACTICE_START);
    store.recordAnswer(id, answer("g5", wrongOf("g5")), at(1));
    store.recordAnswer(id, answer("g6", question("g6").answer), at(2));
    store.recordAnswer(
      id,
      answer("g5", question("g5").answer, { retry: true }),
      at(3),
    );
    expect(store.finishSession(id)).toMatchObject({ answered: 2, correct: 1 });
    expect(store.stats()["g5"]).toStrictEqual({
      attempts: 2,
      correct: 1,
      lastAt: at(3).toISOString(),
      recent: "10",
    });
  });

  test.each([
    { name: "an unknown question", input: answer("g999", 0) },
    { name: "an option outside 0–3", input: answer("g1", 4) },
    { name: "a malformed body", input: { questionId: 7 } },
  ])("rejects $name", ({ input }) => {
    using store = new ProgressStore(":memory:");
    const id = store.startSession(PRACTICE_START);
    expect(() => store.recordAnswer(id, input)).toThrow(ValidationError);
  });

  test("rejects unknown sessions and invalid session starts", () => {
    using store = new ProgressStore(":memory:");
    expect(() => store.recordAnswer(99, {})).toThrow(/unknown session/u);
    expect(() => store.startSession({ mode: "quiz" })).toThrow(ValidationError);
  });

  test("rolls back a batch with one bad answer", () => {
    using store = new ProgressStore(":memory:");
    const id = store.startSession(EXAM_START);
    expect(() =>
      store.finishSession(id, {
        answers: [answer("g1", 0), answer("nope", 0, { position: 1 })],
      }),
    ).toThrow(ValidationError);
    expect(store.dump()["answers"]).toStrictEqual([]);
  });

  test("deletes an empty abandoned session but closes one with answers", () => {
    using store = new ProgressStore(":memory:");
    store.discardSession(store.startSession(EXAM_START));
    expect(store.sessions()).toStrictEqual([]);
    const used = store.startSession(PRACTICE_START);
    store.recordAnswer(used, answer("g1", 0));
    store.discardSession(used);
    expect(store.sessions().map((session) => session.answered)).toStrictEqual([
      1,
    ]);
  });

  test("summarises settings, sessions and statistics together", () => {
    using store = new ProgressStore(":memory:");
    expect(Object.keys(store.summary())).toStrictEqual([
      "settings",
      "sessions",
      "stats",
    ]);
  });
});
