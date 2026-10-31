// How well each question is known, and which ones need work.
import { DAY_MS } from "./dates.ts";
import type { Question, QuestionStat, StateCode } from "./schemas.ts";

type Mastery = "new" | "missed" | "once" | "mastered";
type Stats = Readonly<Record<string, QuestionStat>>;

interface WeakSpot {
  question: Question;
  stat: QuestionStat;
}

const MASTERY_LABEL: Readonly<Record<Mastery, { en: string; de: string }>> = {
  mastered: { en: "Mastered", de: "Sicher" },
  once: { en: "Correct once", de: "Einmal richtig" },
  missed: { en: "Missed last time", de: "Zuletzt falsch" },
  new: { en: "Not seen yet", de: "Noch nicht gesehen" },
};

// Smart-mix priorities: missed questions come back most, unseen ones next,
// and mastered ones resurface slowly as days pass.
const PRIORITY = {
  missed: 6,
  new: 3,
  onceBase: 2,
  onceRampDays: 3,
  masteredBase: 0.25,
  masteredRampDays: 6,
  masteredRampDivisor: 4,
} as const;

/**
 * Mastery from the most recent answers: mastered after two correct in a row.
 * @param stat - Statistics of one question, if it was ever answered.
 * @returns The mastery state.
 */
function masteryOf(stat: QuestionStat | undefined): Mastery {
  if (stat === undefined || stat.attempts === 0) {
    return "new";
  }
  if (stat.recent.startsWith("0")) {
    return "missed";
  }
  return stat.recent.startsWith("11") ? "mastered" : "once";
}

/**
 * Whether a question needs review: missed last time or right only once.
 * @param stat - Statistics of the question, if any.
 * @returns True for missed and once.
 */
function needsReview(stat: QuestionStat | undefined): boolean {
  const mastery = masteryOf(stat);
  return mastery === "missed" || mastery === "once";
}

function rampedPriority(mastery: "once" | "mastered", days: number): number {
  if (mastery === "once") {
    return (
      PRIORITY.onceBase +
      Math.min(days, PRIORITY.onceRampDays) / PRIORITY.onceRampDays
    );
  }
  return (
    PRIORITY.masteredBase +
    Math.min(days, PRIORITY.masteredRampDays) / PRIORITY.masteredRampDivisor
  );
}

/**
 * Smart-mix priority of a question.
 * @param stat - Statistics of the question, if any.
 * @param now - Current time in ms.
 * @returns A positive weight.
 */
function priority(
  stat: QuestionStat | undefined,
  now: number = Date.now(),
): number {
  const mastery = masteryOf(stat);
  if (stat === undefined || mastery === "new") {
    return PRIORITY.new;
  }
  if (mastery === "missed") {
    return PRIORITY.missed;
  }
  const days = Math.max(0, (now - Date.parse(stat.lastAt)) / DAY_MS);
  return rampedPriority(mastery, days);
}

function misses(stat: QuestionStat): number {
  return stat.attempts - stat.correct;
}

function missedFirst(spot: WeakSpot): number {
  return masteryOf(spot.stat) === "missed" ? 1 : 0;
}

function byWeakness(left: WeakSpot, right: WeakSpot): number {
  return (
    missedFirst(right) - missedFirst(left) ||
    misses(right.stat) - misses(left.stat) ||
    right.stat.lastAt.localeCompare(left.stat.lastAt)
  );
}

/**
 * Questions answered wrongly: missed last time first, then by number of
 * misses, then most recent.
 * @param pool - Questions that can come up.
 * @param stats - Per-question statistics.
 * @param count - How many to return.
 * @returns The weakest questions with their statistics.
 */
function weakest(
  pool: readonly Question[],
  stats: Stats,
  count: number,
): WeakSpot[] {
  return pool
    .flatMap((entry) => {
      const stat = stats[entry.id];
      return stat !== undefined && misses(stat) > 0
        ? [{ question: entry, stat }]
        : [];
    })
    .toSorted(byWeakness)
    .slice(0, count);
}

/**
 * Questions that can come up for someone living in `state`.
 * @param questions - The whole catalogue.
 * @param state - Federal state of main residence.
 * @returns 300 general plus 10 state questions.
 */
function poolFor(questions: readonly Question[], state: StateCode): Question[] {
  return questions.filter(
    (entry) => entry.state === null || entry.state === state,
  );
}

export { MASTERY_LABEL, masteryOf, needsReview, poolFor, priority, weakest };
export type { Mastery, Stats, WeakSpot };
