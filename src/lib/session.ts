// State of the session in progress: option order, answers, flags, timing and
// the practice retry queue. Pure transitions, persisted to localStorage.
import { EXAM, optionOrder } from "./quiz.ts";
import type { Rng } from "./quiz.ts";
import { activeSessionSchema } from "./schemas.ts";
import type {
  ActiveSession,
  AnswerInput,
  Focus,
  Item,
  Mode,
  Question,
  StateCode,
} from "./schemas.ts";

const STORAGE_KEY = "lid.activeSession.v1";
const MINUTE_MS = 60_000;

/** A missed question comes back this many questions later in practice. */
const RETRY_GAP = 4;

interface ItemSource {
  entry: Question;
  shuffleOptions: boolean;
  rng: Rng;
  retry: boolean;
}

function newItem({ entry, shuffleOptions, rng, retry }: ItemSource): Item {
  return {
    qid: entry.id,
    order: optionOrder(entry, shuffleOptions, rng),
    chosen: null,
    flagged: false,
    checked: false,
    retry,
    timeMs: 0,
  };
}

function updateCurrent(
  session: ActiveSession,
  update: (item: Item) => Item,
): ActiveSession {
  return {
    ...session,
    items: session.items.map((item, index) =>
      index === session.index ? update(item) : item,
    ),
  };
}

/**
 * Adds the time since the current question was shown to it and restarts the
 * clock.
 * @param session - The session.
 * @param now - Current time in ms.
 * @returns The updated session.
 */
function timed(session: ActiveSession, now: number): ActiveSession {
  const spent = Math.max(0, now - session.shownAt);
  return {
    ...updateCurrent(session, (item) => ({
      ...item,
      timeMs: item.timeMs + spent,
    })),
    shownAt: now,
  };
}

interface NewSession {
  id: number;
  mode: Mode;
  focus: Focus | null;
  state: StateCode;
  questions: readonly Question[];
  shuffleOptions: boolean;
  now?: number;
  rng?: Rng;
}

/**
 * Starts a session; mock exams get a 60-minute wall-clock deadline.
 * @param options - Server id, mode, focus, state, questions and settings.
 * @returns The new session at its first question.
 */
function createSession(options: NewSession): ActiveSession {
  const { now = Date.now(), rng = Math.random } = options;
  return {
    id: options.id,
    mode: options.mode,
    focus: options.focus,
    state: options.state,
    startedAt: now,
    deadline: options.mode === "exam" ? now + EXAM.minutes * MINUTE_MS : null,
    items: options.questions.map((entry) =>
      newItem({
        entry,
        shuffleOptions: options.shuffleOptions,
        rng,
        retry: false,
      }),
    ),
    index: 0,
    shownAt: now,
  };
}

/**
 * Adds the time spent on the current question and moves to another one.
 * @param session - The session.
 * @param index - Target position; clamped to the session.
 * @param now - Current time in ms.
 * @returns The updated session.
 */
function goTo(
  session: ActiveSession,
  index: number,
  now: number = Date.now(),
): ActiveSession {
  const clamped = Math.max(0, Math.min(index, session.items.length - 1));
  return { ...timed(session, now), index: clamped };
}

/**
 * Chooses an option for the current question unless it is already checked.
 * @param session - The session.
 * @param chosen - Catalogue index of the option.
 * @returns The updated session.
 */
function choose(session: ActiveSession, chosen: number): ActiveSession {
  return updateCurrent(session, (item) =>
    item.checked ? item : { ...item, chosen },
  );
}

/**
 * Flags or unflags the current question.
 * @param session - The session.
 * @returns The updated session.
 */
function toggleFlag(session: ActiveSession): ActiveSession {
  return updateCurrent(session, (item) => ({
    ...item,
    flagged: !item.flagged,
  }));
}

interface CheckOptions {
  question: Question;
  shuffleOptions: boolean;
  now?: number;
  rng?: Rng;
}

function withRetry(
  session: ActiveSession,
  options: CheckOptions,
  rng: Rng,
): Item[] {
  const items = [...session.items];
  const at = Math.min(session.index + 1 + RETRY_GAP, items.length);
  items.splice(
    at,
    0,
    newItem({
      entry: options.question,
      shuffleOptions: options.shuffleOptions,
      rng,
      retry: true,
    }),
  );
  return items;
}

function checkable(item: Item | undefined): item is Item & { chosen: number } {
  return item !== undefined && !item.checked && item.chosen !== null;
}

function isFirstMiss(item: Item, question: Question): boolean {
  return item.chosen !== question.answer && !item.retry;
}

/**
 * Practice: locks in the current answer. A first-time miss is queued again a
 * few questions later with freshly shuffled options.
 * @param session - The session.
 * @param options - The current question, settings, time and randomness.
 * @returns The updated session.
 */
function check(session: ActiveSession, options: CheckOptions): ActiveSession {
  const { now = Date.now(), rng = Math.random } = options;
  const current = session.items[session.index];
  if (!checkable(current)) {
    return session;
  }
  const checked = updateCurrent(timed(session, now), (item) => ({
    ...item,
    checked: true,
  }));
  return isFirstMiss(current, options.question)
    ? { ...checked, items: withRetry(checked, options, rng) }
    : checked;
}

type NextStep = "advance" | "confirm" | "finish";

/**
 * What "next" does: move on, ask to submit a mock exam, or finish practice.
 * @param session - The session.
 * @returns The step to take.
 */
function nextStep(session: ActiveSession): NextStep {
  if (session.index < session.items.length - 1) {
    return "advance";
  }
  return session.mode === "exam" ? "confirm" : "finish";
}

/**
 * Ends a practice session early: saves it when something was answered,
 * otherwise just leaves.
 * @param session - The session.
 * @param actions - Saving and leaving.
 * @param actions.finish - Saves the session.
 * @param actions.exit - Leaves without saving.
 */
function endSession(
  session: ActiveSession,
  actions: { finish: () => void; exit: () => void },
): void {
  const answered = session.items.some((item) => item.checked && !item.retry);
  (answered ? actions.finish : actions.exit)();
}

/**
 * Converts an item into the API's answer shape.
 * @param item - A session item.
 * @param position - Its position in the session.
 * @returns The answer to send.
 */
function toAnswer(item: Item, position: number): AnswerInput {
  return {
    questionId: item.qid,
    position,
    chosen: item.chosen,
    timeMs: item.timeMs,
    retry: item.retry,
  };
}

/**
 * Persists the session in progress, or clears it.
 * @param session - The session, or null to clear.
 */
function save(session: ActiveSession | null): void {
  if (session === null) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
}

/**
 * Restores the session in progress, ignoring anything malformed.
 * @returns The saved session, or null.
 */
function load(): ActiveSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  try {
    const parsed = activeSessionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export {
  RETRY_GAP,
  createSession,
  goTo,
  choose,
  toggleFlag,
  check,
  toAnswer,
  save,
  load,
  endSession,
  nextStep,
};
export type { NextStep, NewSession, CheckOptions };
