import { describe, expect, test } from "vite-plus/test";

import { question } from "./catalogue.ts";
import {
  EMPTY_PROGRESS,
  ValidationError,
  discardSession,
  finishSession,
  recordAnswer,
  startSession,
  updateSettings,
} from "./progress.ts";
import type { SessionCall } from "./progress.ts";
import { sessions, settingsOf, stats, summary } from "./progressViews.ts";
import type { Progress } from "./schemas.ts";

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

/**
 * A document with one open session.
 * @param input - How to start the session.
 * @returns The document and the session's id.
 */
function opened(input: unknown): { progress: Progress; id: number } {
  const { progress, result } = startSession(EMPTY_PROGRESS, input, at(0));
  return { progress, id: result };
}

/**
 * Records answers one after the other.
 * @param progress - Document to start from.
 * @param calls - The answers, in order.
 * @returns The document with every answer stored.
 */
function answered(progress: Progress, calls: readonly SessionCall[]): Progress {
  let next = progress;
  for (const call of calls) {
    next = recordAnswer(next, { now: at(1), ...call }).progress;
  }
  return next;
}

describe("progress", () => {
  test("starts without a state or exam date", () => {
    expect(settingsOf(EMPTY_PROGRESS)).toStrictEqual({
      state: null,
      examDate: null,
      showEnglish: true,
      shuffleOptions: true,
    });
  });

  test("validates and stores settings", () => {
    const { progress, result } = updateSettings(EMPTY_PROGRESS, {
      state: "BE",
      examDate: "2026-11-11",
    });
    expect(result).toMatchObject({ state: "BE", examDate: "2026-11-11" });
    expect(
      updateSettings(progress, { showEnglish: false }).result,
    ).toMatchObject({ state: "BE", showEnglish: false });
    expect(() => updateSettings(progress, { state: "XX" })).toThrow(
      ValidationError,
    );
    expect(() => updateSettings(progress, { examDate: "11.11.2026" })).toThrow(
      ValidationError,
    );
  });

  test("scores a submitted exam against the official key", () => {
    const { progress, id } = opened(EXAM_START);
    const finished = finishSession(progress, {
      sessionId: id,
      input: {
        answers: [
          answer("g1", question("g1").answer),
          answer("g2", wrongOf("g2"), { position: 1 }),
          answer("BE1", null, { position: 2 }),
        ],
        durationMs: 600_000.4,
      },
      now: at(9),
    });
    expect(finished.result).toMatchObject({
      correct: 1,
      answered: 2,
      questionCount: 33,
      durationMs: 600_000,
      finishedAt: at(9).toISOString(),
    });
    expect(stats(finished.progress)["BE1"]).toMatchObject({
      attempts: 1,
      recent: "0",
    });
    expect(() => finishSession(finished.progress, { sessionId: id })).toThrow(
      /already finished/u,
    );
  });

  test("keeps recent results newest first and leaves retries out of the score", () => {
    const { progress, id } = opened(PRACTICE_START);
    const next = answered(progress, [
      { sessionId: id, input: answer("g5", wrongOf("g5")), now: at(1) },
      { sessionId: id, input: answer("g6", question("g6").answer), now: at(2) },
      {
        sessionId: id,
        input: answer("g5", question("g5").answer, { retry: true }),
        now: at(3),
      },
    ]);
    expect(finishSession(next, { sessionId: id }).result).toMatchObject({
      answered: 2,
      correct: 1,
      durationMs: null,
    });
    expect(stats(next)["g5"]).toStrictEqual({
      attempts: 2,
      correct: 1,
      lastAt: at(3).toISOString(),
      recent: "10",
    });
  });

  test("keeps the five latest results, breaking ties by insertion order", () => {
    const { progress, id } = opened(PRACTICE_START);
    const right = question("g7").answer;
    const wrong = wrongOf("g7");
    const next = answered(
      progress,
      [right, right, wrong, wrong, right, wrong].map((chosen) => ({
        sessionId: id,
        input: answer("g7", chosen),
      })),
    );
    expect(stats(next)["g7"]).toMatchObject({ attempts: 6, recent: "01001" });
  });

  test("reports whether a practice answer was right", () => {
    const { progress, id } = opened(PRACTICE_START);
    const call = (chosen: number): boolean =>
      recordAnswer(progress, { sessionId: id, input: answer("g3", chosen) })
        .result;
    expect(call(question("g3").answer)).toBe(true);
    expect(call(wrongOf("g3"))).toBe(false);
  });

  test.each([
    { name: "an unknown question", input: answer("g999", 0) },
    { name: "an option outside 0–3", input: answer("g1", 4) },
    { name: "a malformed body", input: { questionId: 7 } },
  ])("rejects $name", ({ input }) => {
    const { progress, id } = opened(PRACTICE_START);
    expect(() => recordAnswer(progress, { sessionId: id, input })).toThrow(
      ValidationError,
    );
  });

  test("rejects unknown sessions and invalid session starts", () => {
    expect(() => recordAnswer(EMPTY_PROGRESS, { sessionId: 99 })).toThrow(
      /unknown session/u,
    );
    expect(() => startSession(EMPTY_PROGRESS, { mode: "quiz" })).toThrow(
      ValidationError,
    );
  });

  test("rejects a batch with one bad answer and changes nothing", () => {
    const { progress, id } = opened(EXAM_START);
    expect(() =>
      finishSession(progress, {
        sessionId: id,
        input: {
          answers: [answer("g1", 0), answer("nope", 0, { position: 1 })],
        },
      }),
    ).toThrow(ValidationError);
    expect(progress.answers).toStrictEqual([]);
    expect(progress.sessions[0]?.finishedAt).toBeNull();
  });

  test("deletes an empty abandoned session but closes one with answers", () => {
    const empty = opened(EXAM_START);
    expect(discardSession(empty.progress, empty.id).sessions).toStrictEqual([]);
    const { progress, id } = opened(PRACTICE_START);
    const used = discardSession(
      answered(progress, [{ sessionId: id, input: answer("g1", 0) }]),
      id,
      at(30),
    );
    expect(sessions(used)).toMatchObject([{ answered: 1, durationMs: 30_000 }]);
    expect(discardSession(used, id, at(60))).toStrictEqual(used);
  });

  test("numbers sessions and answers after the highest id", () => {
    const first = opened(PRACTICE_START);
    const second = startSession(first.progress, PRACTICE_START);
    expect(second.result).toBe(first.id + 1);
    const next = answered(second.progress, [
      { sessionId: first.id, input: answer("g1", 0) },
      { sessionId: second.result, input: answer("g2", 0) },
    ]);
    expect(next.answers.map((entry) => entry.id)).toStrictEqual([1, 2]);
  });

  test("lists finished sessions oldest first", () => {
    let progress = EMPTY_PROGRESS;
    for (const second of [20, 10]) {
      const started = startSession(progress, EXAM_START, at(second));
      ({ progress } = finishSession(started.progress, {
        sessionId: started.result,
      }));
    }
    expect(sessions(progress).map((session) => session.id)).toStrictEqual([
      2, 1,
    ]);
  });

  test("summarises settings, sessions and statistics together", () => {
    expect(Object.keys(summary(EMPTY_PROGRESS))).toStrictEqual([
      "settings",
      "sessions",
      "stats",
    ]);
  });
});
