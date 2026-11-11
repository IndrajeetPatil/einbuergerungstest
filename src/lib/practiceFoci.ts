// The practice focus choices shown on the dashboard.
import { masteryOf, needsReview, poolFor } from "./mastery.ts";
import type { Stats } from "./mastery.ts";
import type { Focus, Question, StateCode } from "./schemas.ts";

interface FocusChoice {
  value: Exclude<Focus, "selected">;
  label: string;
  hint: string;
  /** Whether the session size applies; otherwise every match is used. */
  sized: boolean;
}

const FOCI: readonly FocusChoice[] = [
  {
    value: "smart",
    label: "Smart mix",
    hint: "Recommended. Up to half the session revisits questions you missed or got right only once; the rest are new ones, with mastered ones returning now and then.",
    sized: true,
  },
  {
    value: "new",
    label: "Not seen yet",
    hint: "Only questions you have never answered.",
    sized: true,
  },
  {
    value: "mistakes",
    label: "My mistakes",
    hint: "Questions you missed last time or have got right only once since.",
    sized: true,
  },
  {
    value: "state",
    label: "Bundesland",
    hint: "The 10 questions about your federal state.",
    sized: false,
  },
  {
    value: "all",
    label: "Whole catalogue",
    hint: "All 310 questions that can come up for you, in random order. Takes a while.",
    sized: false,
  },
];

const SESSION_SIZES = {
  short: 10,
  standard: 20,
  examLength: 33,
  long: 50,
} as const;
const SIZES: readonly number[] = Object.values(SESSION_SIZES);
const DEFAULT_SIZE = SESSION_SIZES.standard;

/**
 * The focus choice with the given value.
 * @param value - Focus value.
 * @returns Its label, hint and sizing.
 */
function focusChoice(value: FocusChoice["value"]): FocusChoice {
  const found = FOCI.find((choice) => choice.value === value);
  if (found === undefined) {
    throw new Error(`unknown focus ${value}`);
  }
  return found;
}

/**
 * How many questions each focus can draw from.
 * @param questions - The whole catalogue.
 * @param state - Federal state of main residence.
 * @param stats - Per-question statistics.
 * @returns Count per focus.
 */
function focusCounts(
  questions: readonly Question[],
  state: StateCode,
  stats: Stats,
): Record<FocusChoice["value"], number> {
  const pool = poolFor(questions, state);
  const count = (keep: (entry: Question) => boolean): number =>
    pool.filter((entry) => keep(entry)).length;
  return {
    smart: pool.length,
    new: count((entry) => masteryOf(stats[entry.id]) === "new"),
    mistakes: count((entry) => needsReview(stats[entry.id])),
    state: count((entry) => entry.state !== null),
    all: pool.length,
  };
}

export { DEFAULT_SIZE, FOCI, SIZES, focusChoice, focusCounts };
export type { FocusChoice };
