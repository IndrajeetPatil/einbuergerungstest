// Drawing questions for mock exams and practice sessions. Pure functions, so
// every rule is unit-tested with a seeded random number generator.
import { needsReview, poolFor, priority } from "./mastery.ts";
import type { Stats } from "./mastery.ts";
import type { Focus, Question, SessionSummary, StateCode } from "./schemas.ts";

type Rng = () => number;

interface PracticeOptions {
  questions: readonly Question[];
  state: StateCode;
  focus: Focus;
  stats: Stats;
  size: number;
  selected?: readonly string[];
  rng?: Rng;
}

interface Sample<Item> {
  items: readonly Item[];
  weight: (item: Item) => number;
  count: number;
  rng: Rng;
}

type Picker = (
  pool: readonly Question[],
  options: Required<PracticeOptions>,
) => Question[];

/** Format of the official test. */
const EXAM = {
  general: 30,
  state: 3,
  total: 33,
  passMark: 17,
  minutes: 60,
} as const;

/** Share of a smart-mix session reserved for missed or shaky questions. */
const REVIEW_SHARE = 0.5;
const MIN_WEIGHT = 1e-6;
const OPTION_COUNT = 4;
const OPTION_INDICES: readonly number[] = Array.from(
  { length: OPTION_COUNT },
  (_unused, index) => index,
);

function randomIndex(rng: Rng, length: number): number {
  return Math.floor(rng() * length);
}

/**
 * Unbiased shuffle: repeatedly draws uniformly from the items left, which is
 * equivalent to Fisher–Yates.
 * @param items - Items to shuffle; left untouched.
 * @param rng - Random number generator in [0, 1).
 * @returns A shuffled copy.
 */
function shuffle<Item>(items: readonly Item[], rng: Rng = Math.random): Item[] {
  const remaining = [...items];
  const out: Item[] = [];
  while (remaining.length > 0) {
    const index = randomIndex(rng, remaining.length);
    out.push(...remaining.splice(index, 1));
  }
  return out;
}

/**
 * Weighted sampling without replacement (Efraimidis–Spirakis).
 * @param sample - Candidates, their weights, how many to pick, randomness.
 * @returns The picked items, highest key first.
 */
function weightedSample<Item>(sample: Sample<Item>): Item[] {
  const keyed = sample.items.map((item) => {
    const weight = Math.max(sample.weight(item), MIN_WEIGHT);
    return { item, key: sample.rng() ** (1 / weight) };
  });
  return keyed
    .toSorted((left, right) => right.key - left.key)
    .slice(0, sample.count)
    .map((entry) => entry.item);
}

/**
 * Keeps the first question of each wording. The official catalogue words some
 * questions identically with different options (for example, twice
 * "Für wie viele Jahre wird der Bundestag in Deutschland gewählt?").
 * @param questions - Questions in draw order.
 * @returns The questions without repeated wordings.
 */
function distinctWordings(questions: readonly Question[]): Question[] {
  const seen = new Set<string>();
  return questions.filter((entry) => {
    const repeated = seen.has(entry.de.q);
    seen.add(entry.de.q);
    return !repeated;
  });
}

/**
 * Draws a mock exam like the real paper: 30 general questions followed by 3
 * about the state, each block in random order, with no wording asked twice.
 * @param questions - The whole catalogue.
 * @param state - Federal state of main residence.
 * @param rng - Random number generator in [0, 1).
 * @returns The 33 exam questions.
 */
function drawExam(
  questions: readonly Question[],
  state: StateCode,
  rng: Rng = Math.random,
): Question[] {
  const general = questions.filter((entry) => entry.state === null);
  const local = questions.filter((entry) => entry.state === state);
  return [
    ...distinctWordings(shuffle(general, rng)).slice(0, EXAM.general),
    ...distinctWordings(shuffle(local, rng)).slice(0, EXAM.state),
  ];
}

/**
 * Display order of a question's options, as catalogue indices.
 * @param entry - The question.
 * @param shuffleOptions - Whether shuffling is switched on.
 * @param rng - Random number generator in [0, 1).
 * @returns Option indices in display order.
 */
function optionOrder(
  entry: Question,
  shuffleOptions: boolean,
  rng: Rng = Math.random,
): number[] {
  return shuffleOptions && !entry.keepOrder
    ? shuffle(OPTION_INDICES, rng)
    : [...OPTION_INDICES];
}

function smartMix(
  pool: readonly Question[],
  { stats, size, rng }: Required<PracticeOptions>,
): Question[] {
  const weight = (entry: Question): number => priority(stats[entry.id]);
  const isReview = (entry: Question): boolean => needsReview(stats[entry.id]);
  const review = weightedSample({
    items: pool.filter((entry) => isReview(entry)),
    weight,
    count: Math.ceil(size * REVIEW_SHARE),
    rng,
  });
  const rest = weightedSample({
    items: pool.filter((entry) => !isReview(entry)),
    weight,
    count: size - review.length,
    rng,
  });
  return shuffle([...review, ...rest], rng);
}

function pickFiltered(
  pool: readonly Question[],
  { size, rng }: Required<PracticeOptions>,
  keep: (entry: Question) => boolean,
): Question[] {
  return shuffle(
    pool.filter((entry) => keep(entry)),
    rng,
  ).slice(0, size);
}

const PICKERS: Readonly<Record<Focus, Picker>> = {
  smart: smartMix,
  new: (pool, options) =>
    pickFiltered(
      pool,
      options,
      (entry) => options.stats[entry.id] === undefined,
    ),
  mistakes: (pool, options) =>
    pickFiltered(pool, options, (entry) =>
      needsReview(options.stats[entry.id]),
    ),
  state: (pool, options) =>
    pickFiltered(pool, options, (entry) => entry.state !== null),
  all: (pool, { rng }) => shuffle(pool, rng),
  selected: (pool, { selected, rng }) => {
    const ids = new Set(selected);
    return shuffle(
      pool.filter((entry) => ids.has(entry.id)),
      rng,
    );
  },
};

/**
 * Picks the questions of a practice session.
 * @param options - Catalogue, state, focus, statistics and size.
 * @returns The questions, in random order.
 */
function practiceQuestions(options: PracticeOptions): Question[] {
  const full: Required<PracticeOptions> = {
    selected: [],
    rng: Math.random,
    ...options,
  };
  return PICKERS[full.focus](poolFor(full.questions, full.state), full);
}

/**
 * Whether a mock-exam score passes.
 * @param correct - Correct answers.
 * @returns True from 17 correct answers.
 */
function passed(correct: number): boolean {
  return correct >= EXAM.passMark;
}

/**
 * Share of correct answers: out of 33 for exams, of answered for practice.
 * @param session - A finished session.
 * @returns A number between 0 and 1.
 */
function accuracy(
  session: Pick<
    SessionSummary,
    "correct" | "answered" | "questionCount" | "mode"
  >,
): number {
  const denominator =
    session.mode === "exam" ? session.questionCount : session.answered;
  return denominator === 0 ? 0 : session.correct / denominator;
}

export {
  EXAM,
  accuracy,
  drawExam,
  optionOrder,
  passed,
  practiceQuestions,
  shuffle,
  weightedSample,
};
export type { PracticeOptions, Rng };
