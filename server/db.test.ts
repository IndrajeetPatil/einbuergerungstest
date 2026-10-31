import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import catalogue from "../src/data/catalogue.json" with { type: "json" };
import type { Catalogue } from "../src/lib/types.ts";
import { ProgressStore, ValidationError } from "./db.ts";

const q = (id: string) => (catalogue as Catalogue).questions.find((x) => x.id === id)!;
const wrongOf = (id: string) => (q(id).answer + 1) % 4;

describe("ProgressStore", () => {
  let store: ProgressStore;
  beforeEach(() => {
    store = new ProgressStore(":memory:");
  });
  afterEach(() => store.close());

  it("starts with default settings and validates updates", () => {
    expect(store.getSettings()).toMatchObject({ state: null, examDate: "2026-11-11" });
    expect(store.updateSettings({ state: "BE", showEnglish: false })).toMatchObject({
      state: "BE",
      showEnglish: false,
    });
    expect(() => store.updateSettings({ state: "XX" as never })).toThrow(ValidationError);
    expect(() => store.updateSettings({ examDate: "11.11.2026" })).toThrow(ValidationError);
  });

  it("scores a submitted exam against the official key, counting blanks as wrong", () => {
    const id = store.startSession({ mode: "exam", focus: null, state: "BE", questionCount: 33 });
    const summary = store.finishSession(
      id,
      [
        { questionId: "g1", position: 0, chosen: q("g1").answer, timeMs: 5000 },
        { questionId: "g2", position: 1, chosen: wrongOf("g2"), timeMs: 4000 },
        { questionId: "BE1", position: 2, chosen: null, timeMs: 0 },
      ],
      600_000,
    );
    expect(summary).toMatchObject({ mode: "exam", correct: 1, answered: 2, questionCount: 33 });
    expect(store.stats()["BE1"]).toMatchObject({ attempts: 1, correct: 0, recent: "0" });
    expect(() => store.finishSession(id)).toThrow(/already finished/);
  });

  it("tracks recent results newest first and excludes retries from the session score", () => {
    const id = store.startSession({
      mode: "practice",
      focus: "smart",
      state: "BE",
      questionCount: 2,
    });
    const t = (s: number) => new Date(Date.UTC(2026, 9, 31, 10, 0, s));
    expect(
      store.recordAnswer(
        id,
        { questionId: "g5", position: 0, chosen: wrongOf("g5"), timeMs: 1 },
        t(1),
      ),
    ).toBe(false);
    store.recordAnswer(
      id,
      { questionId: "g6", position: 1, chosen: q("g6").answer, timeMs: 1 },
      t(2),
    );
    store.recordAnswer(
      id,
      { questionId: "g5", position: 2, chosen: q("g5").answer, timeMs: 1, retry: true },
      t(3),
    );
    const summary = store.finishSession(id);
    expect(summary).toMatchObject({ answered: 2, correct: 1 });
    expect(store.stats()["g5"]).toMatchObject({ attempts: 2, correct: 1, recent: "10" });
  });

  it("rejects unknown questions and out-of-range options", () => {
    const id = store.startSession({
      mode: "practice",
      focus: "all",
      state: "BE",
      questionCount: 1,
    });
    expect(() =>
      store.recordAnswer(id, { questionId: "g999", position: 0, chosen: 0, timeMs: 1 }),
    ).toThrow(ValidationError);
    expect(() =>
      store.recordAnswer(id, { questionId: "g1", position: 0, chosen: 4, timeMs: 1 }),
    ).toThrow(ValidationError);
  });

  it("deletes an empty abandoned session but keeps one with answers", () => {
    const empty = store.startSession({ mode: "exam", focus: null, state: "BE", questionCount: 33 });
    store.discardSession(empty);
    const used = store.startSession({
      mode: "practice",
      focus: "new",
      state: "BE",
      questionCount: 5,
    });
    store.recordAnswer(used, { questionId: "g1", position: 0, chosen: 0, timeMs: 1 });
    store.discardSession(used);
    expect(store.sessions().map((s) => s.id)).toEqual([used]);
  });
});
