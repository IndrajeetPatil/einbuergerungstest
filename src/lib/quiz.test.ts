import { describe, expect, it } from "vite-plus/test";
import catalogue from "../data/catalogue.json";
import {
  EXAM,
  daysUntil,
  drawExam,
  masteryOf,
  optionOrder,
  practiceQuestions,
  priority,
  shuffle,
  streak,
  weakest,
} from "./quiz.ts";
import { check, choose, createSession, goTo, RETRY_GAP } from "./session.ts";
import type { Catalogue, QuestionStat, SessionSummary } from "./types.ts";

const { questions } = catalogue as Catalogue;

/** Deterministic PRNG (mulberry32) so random tests are reproducible. */
function rng(seed = 1) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const stat = (recent: string, lastAt = "2026-10-30T10:00:00.000Z"): QuestionStat => ({
  attempts: recent.length,
  correct: recent.split("").filter((c) => c === "1").length,
  lastAt,
  recent,
});

describe("catalogue", () => {
  it("has the official 300 general and 16 × 10 state questions", () => {
    expect(questions.filter((q) => q.state === null)).toHaveLength(300);
    for (const s of (catalogue as Catalogue).states) {
      expect(questions.filter((q) => q.state === s.code)).toHaveLength(10);
    }
  });

  it("has four options, an answer and an explanation in both languages for every question", () => {
    for (const q of questions) {
      expect(q.de.o).toHaveLength(4);
      expect(q.en.o).toHaveLength(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(4);
      expect(q.de.q.length).toBeGreaterThan(5);
      expect(q.en.q.length).toBeGreaterThan(5);
      expect(q.explanation.en.length).toBeGreaterThan(20);
    }
  });

  it("only marks picture-label or numeric options as fixed-order", () => {
    for (const q of questions.filter((x) => x.keepOrder)) {
      expect(q.de.o.every((o) => /^(Bild \d|[\d.,\s%–-]+.*)$/.test(o))).toBe(true);
    }
  });
});

describe("shuffle", () => {
  it("is a permutation and does not mutate its input", () => {
    const input = [1, 2, 3, 4, 5, 6];
    const out = shuffle(input, rng(3));
    expect(out.toSorted((a, b) => a - b)).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("is roughly uniform over positions", () => {
    const counts = [0, 0, 0, 0];
    const r = rng(7);
    for (let i = 0; i < 8000; i++) counts[shuffle([0, 1, 2, 3], r).indexOf(0)]!++;
    for (const c of counts) expect(c).toBeGreaterThan(1800);
  });
});

describe("drawExam", () => {
  it("draws 30 distinct general questions followed by 3 for the state", () => {
    const exam = drawExam(questions, "BE", rng(11));
    expect(exam).toHaveLength(EXAM.total);
    expect(new Set(exam.map((q) => q.id)).size).toBe(EXAM.total);
    expect(exam.slice(0, 30).every((q) => q.state === null)).toBe(true);
    expect(exam.slice(30).every((q) => q.state === "BE")).toBe(true);
  });

  it("differs between draws", () => {
    const a = drawExam(questions, "BY", rng(1)).map((q) => q.id);
    const b = drawExam(questions, "BY", rng(2)).map((q) => q.id);
    expect(a).not.toEqual(b);
  });
});

describe("optionOrder", () => {
  it("keeps picture options in place and shuffles text options", () => {
    const picture = questions.find((q) => q.de.o[0] === "Bild 1")!;
    expect(optionOrder(picture, true, rng(5))).toEqual([0, 1, 2, 3]);
    const text = questions.find((q) => !q.keepOrder)!;
    const orders = new Set(
      Array.from({ length: 20 }, (_, i) => optionOrder(text, true, rng(i + 1)).join("")),
    );
    expect(orders.size).toBeGreaterThan(5);
    expect(optionOrder(text, false)).toEqual([0, 1, 2, 3]);
  });
});

describe("mastery and priority", () => {
  it("classifies by the most recent answers", () => {
    expect(masteryOf(undefined)).toBe("new");
    expect(masteryOf(stat("0111"))).toBe("missed");
    expect(masteryOf(stat("10"))).toBe("once");
    expect(masteryOf(stat("110"))).toBe("mastered");
  });

  it("puts missed above new above mastered", () => {
    const now = Date.parse("2026-10-31T10:00:00.000Z");
    expect(priority(stat("0"), now)).toBeGreaterThan(priority(undefined, now));
    expect(priority(undefined, now)).toBeGreaterThan(priority(stat("11"), now));
  });
});

describe("practiceQuestions", () => {
  it("returns only unseen questions for the 'new' focus", () => {
    const stats = { g1: stat("1"), g2: stat("0") };
    const picked = practiceQuestions(questions, "HH", "new", stats, 400, [], rng(1));
    expect(picked).toHaveLength(308);
    expect(picked.some((q) => q.id === "g1" || q.id === "g2")).toBe(false);
  });

  it("returns only shaky or missed questions for the 'mistakes' focus", () => {
    const stats = { g1: stat("1"), g2: stat("0"), g3: stat("11") };
    const ids = practiceQuestions(questions, "HH", "mistakes", stats, 10, [], rng(1)).map(
      (q) => q.id,
    );
    expect(ids.toSorted()).toEqual(["g1", "g2"]);
  });

  it("never includes other states' questions", () => {
    const picked = practiceQuestions(questions, "SN", "all", {}, 0, [], rng(1));
    expect(picked).toHaveLength(310);
    expect(picked.every((q) => q.state === null || q.state === "SN")).toBe(true);
  });

  it("caps review questions at half of a smart-mix session and fills with unseen ones", () => {
    const stats = Object.fromEntries(questions.slice(0, 40).map((q) => [q.id, stat("0")]));
    const picked = practiceQuestions(questions, "HH", "smart", stats, 20, [], rng(4));
    expect(picked).toHaveLength(20);
    expect(new Set(picked.map((q) => q.id)).size).toBe(20);
    expect(picked.filter((q) => q.id in stats)).toHaveLength(10);
  });

  it("always includes missed questions in the smart mix when there are few", () => {
    const stats = { g10: stat("0"), g20: stat("0"), g30: stat("0") };
    let hits = 0;
    const r = rng(9);
    for (let i = 0; i < 200; i++) {
      const ids = practiceQuestions(questions, "HH", "smart", stats, 20, [], r).map((q) => q.id);
      hits += ids.filter((id) => id in stats).length;
    }
    // Uniform sampling would include each only ~6.5% of the time; the review quota includes all.
    expect(hits / (200 * 3)).toBe(1);
  });
});

describe("weakest", () => {
  it("lists questions answered wrongly, most recent misses first", () => {
    const stats = { g1: stat("10"), g2: stat("0"), g3: stat("11") };
    expect(weakest(questions, "BE", stats, 5).map((w) => w.question.id)).toEqual(["g2", "g1"]);
  });
});

describe("practice session flow", () => {
  it("re-queues a missed question a few places later with fresh options", () => {
    const qs = questions.slice(0, 10);
    let s = createSession(1, "practice", "smart", "BE", qs, true, 0, rng(1));
    const q = qs[0]!;
    const wrong = [0, 1, 2, 3].find((i) => i !== q.answer)!;
    s = choose(s, wrong);
    s = check(s, q, true, 1000, rng(2));
    expect(s.items).toHaveLength(11);
    expect(s.items[1 + RETRY_GAP]).toMatchObject({ qid: q.id, retry: true, chosen: null });
    expect(s.items[0]!.timeMs).toBe(1000);
    // A missed retry is not queued again.
    s = goTo(s, 1 + RETRY_GAP, 2000);
    s = choose(s, wrong);
    s = check(s, q, true, 3000, rng(3));
    expect(s.items).toHaveLength(11);
  });

  it("does not change a checked answer", () => {
    const q = questions[0]!;
    let s = createSession(1, "practice", "smart", "BE", [q], false, 0);
    s = check(choose(s, q.answer), q, false, 10);
    expect(choose(s, (q.answer + 1) % 4).items[0]!.chosen).toBe(q.answer);
  });

  it("gives mock exams a 60-minute deadline", () => {
    const s = createSession(1, "exam", null, "BE", questions.slice(0, 3), true, 1_000);
    expect(s.deadline).toBe(1_000 + 60 * 60_000);
  });
});

describe("dates", () => {
  it("counts days to the exam in local time", () => {
    expect(daysUntil("2026-11-11", new Date(2026, 9, 31, 23, 30))).toBe(11);
    expect(daysUntil("2026-11-11", new Date(2026, 10, 11, 8, 0))).toBe(0);
  });

  it("counts a daily streak that may end yesterday", () => {
    const at = (d: number) =>
      ({ startedAt: new Date(2026, 9, d, 12).toISOString() }) as SessionSummary;
    const now = new Date(2026, 9, 31, 9);
    expect(streak([at(28), at(29), at(30)], now)).toBe(3);
    expect(streak([at(28), at(30), at(31)], now)).toBe(2);
    expect(streak([at(27)], now)).toBe(0);
  });
});
