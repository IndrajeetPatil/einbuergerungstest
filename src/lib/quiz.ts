import type { Focus, Question, QuestionStat, SessionSummary, StateCode } from "./types.ts";

/** Format of the official test: 30 general + 3 state questions, 60 minutes, 17 correct to pass. */
export const EXAM = { general: 30, state: 3, total: 33, passMark: 17, minutes: 60 } as const;

export type Rng = () => number;

/** Unbiased Fisher–Yates shuffle; returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Weighted sampling without replacement (Efraimidis–Spirakis): picks `k` items. */
export function weightedSample<T>(
  items: readonly T[],
  weight: (item: T) => number,
  k: number,
  rng: Rng = Math.random,
): T[] {
  return items
    .map((item) => ({ item, key: Math.pow(rng(), 1 / Math.max(weight(item), 1e-6)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, k)
    .map((x) => x.item);
}

export function poolFor(questions: readonly Question[], state: StateCode): Question[] {
  return questions.filter((q) => q.state === null || q.state === state);
}

/**
 * Draws a mock exam like the real paper: 30 random general questions followed by 3 random
 * questions about the chosen state, each block in random order.
 */
export function drawExam(questions: readonly Question[], state: StateCode, rng: Rng = Math.random) {
  const general = questions.filter((q) => q.state === null);
  const local = questions.filter((q) => q.state === state);
  return [
    ...shuffle(general, rng).slice(0, EXAM.general),
    ...shuffle(local, rng).slice(0, EXAM.state),
  ];
}

/** Display order of a question's options (catalogue indices). */
export function optionOrder(
  q: Question,
  shuffleOptions: boolean,
  rng: Rng = Math.random,
): number[] {
  const order = [0, 1, 2, 3];
  return shuffleOptions && !q.keepOrder ? shuffle(order, rng) : order;
}

export type Mastery = "new" | "missed" | "once" | "mastered";

export const MASTERY_LABEL: Record<Mastery, { en: string; de: string }> = {
  mastered: { en: "Mastered", de: "Sicher" },
  once: { en: "Correct once", de: "Einmal richtig" },
  missed: { en: "Missed last time", de: "Zuletzt falsch" },
  new: { en: "Not seen yet", de: "Noch nicht gesehen" },
};

/** Mastered = the two most recent answers were both correct. */
export function masteryOf(stat: QuestionStat | undefined): Mastery {
  if (!stat || stat.attempts === 0) return "new";
  if (stat.recent.startsWith("0")) return "missed";
  if (stat.recent.startsWith("11")) return "mastered";
  return "once";
}

const DAY = 86_400_000;
/** Share of a smart-mix session reserved for questions you missed or are unsure of. */
export const REVIEW_SHARE = 0.5;

/**
 * Priority for the "smart mix": questions you got wrong come back most, unseen questions next,
 * and mastered ones resurface slowly as time passes (a light spaced-repetition schedule).
 */
export function priority(stat: QuestionStat | undefined, now = Date.now()): number {
  const mastery = masteryOf(stat);
  if (mastery === "new") return 3;
  if (mastery === "missed") return 6;
  const days = Math.max(0, (now - Date.parse(stat!.lastAt)) / DAY);
  if (mastery === "once") return 2 + Math.min(days, 3) / 3;
  return 0.25 + Math.min(days, 6) / 4;
}

export function practiceQuestions(
  questions: readonly Question[],
  state: StateCode,
  focus: Focus,
  stats: Record<string, QuestionStat>,
  size: number,
  selected: readonly string[] = [],
  rng: Rng = Math.random,
): Question[] {
  const pool = poolFor(questions, state);
  switch (focus) {
    case "smart": {
      // Up to half the session reviews missed / shaky questions; the rest brings in unseen
      // questions and occasionally resurfaces mastered ones. Then the whole set is shuffled.
      const isReview = (q: Question) => {
        const m = masteryOf(stats[q.id]);
        return m === "missed" || m === "once";
      };
      const review = weightedSample(
        pool.filter(isReview),
        (q) => priority(stats[q.id]),
        Math.ceil(size * REVIEW_SHARE),
        rng,
      );
      const rest = weightedSample(
        pool.filter((q) => !isReview(q)),
        (q) => priority(stats[q.id]),
        size - review.length,
        rng,
      );
      return shuffle([...review, ...rest], rng);
    }
    case "new":
      return shuffle(
        pool.filter((q) => !stats[q.id]),
        rng,
      ).slice(0, size);
    case "mistakes":
      return shuffle(
        pool.filter((q) => {
          const m = masteryOf(stats[q.id]);
          return m === "missed" || m === "once";
        }),
        rng,
      ).slice(0, size);
    case "state":
      return shuffle(
        pool.filter((q) => q.state !== null),
        rng,
      ).slice(0, size);
    case "all":
      return shuffle(pool, rng);
    case "selected": {
      const ids = new Set(selected);
      return shuffle(
        pool.filter((q) => ids.has(q.id)),
        rng,
      );
    }
  }
}

export function passed(correct: number): boolean {
  return correct >= EXAM.passMark;
}

export function accuracy(
  s: Pick<SessionSummary, "correct" | "answered" | "questionCount" | "mode">,
) {
  const denominator = s.mode === "exam" ? s.questionCount : s.answered;
  return denominator === 0 ? 0 : s.correct / denominator;
}

/** Questions answered wrongly most often, then by most recent miss. */
export function weakest(
  questions: readonly Question[],
  state: StateCode,
  stats: Record<string, QuestionStat>,
  n: number,
): { question: Question; stat: QuestionStat }[] {
  return poolFor(questions, state)
    .flatMap((question) => {
      const stat = stats[question.id];
      return stat && stat.attempts > stat.correct ? [{ question, stat }] : [];
    })
    .sort((a, b) => {
      const ma = masteryOf(a.stat) === "missed" ? 1 : 0;
      const mb = masteryOf(b.stat) === "missed" ? 1 : 0;
      return (
        mb - ma ||
        b.stat.attempts - b.stat.correct - (a.stat.attempts - a.stat.correct) ||
        b.stat.lastAt.localeCompare(a.stat.lastAt)
      );
    })
    .slice(0, n);
}

/** Whole days from today until the exam date (local time); negative once it has passed. */
export function daysUntil(examDate: string, now = new Date()): number {
  const [y, m, d] = examDate.split("-").map(Number);
  const exam = new Date(y!, m! - 1, d!);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((exam.getTime() - today.getTime()) / DAY);
}

/** Consecutive days, ending today or yesterday, with at least one finished session. */
export function streak(sessions: readonly SessionSummary[], now = new Date()): number {
  const days = new Set(sessions.map((s) => localDay(new Date(s.startedAt))));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(localDay(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function localDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
