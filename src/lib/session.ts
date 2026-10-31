import { EXAM, optionOrder, type Rng } from "./quiz.ts";
import type { AnswerInput, Focus, Mode, Question, StateCode } from "./types.ts";

export interface Item {
  qid: string;
  /** Catalogue option indices in display order. */
  order: number[];
  /** Catalogue index of the chosen option. */
  chosen: number | null;
  flagged: boolean;
  /** Practice mode: the answer has been checked and feedback shown. */
  checked: boolean;
  /** Practice mode: a second chance at a question missed earlier in the session. */
  retry: boolean;
  timeMs: number;
}

export interface ActiveSession {
  id: number;
  mode: Mode;
  focus: Focus | null;
  state: StateCode;
  startedAt: number;
  /** Exam mode: wall-clock deadline (ms), so reloading the page does not reset the timer. */
  deadline: number | null;
  items: Item[];
  index: number;
  /** When the current question was shown (ms); used to time answers. */
  shownAt: number;
}

const KEY = "lid.activeSession.v1";
/** A missed question comes back this many questions later in the same practice session. */
export const RETRY_GAP = 4;

export function createSession(
  id: number,
  mode: Mode,
  focus: Focus | null,
  state: StateCode,
  questions: Question[],
  shuffleOptions: boolean,
  now = Date.now(),
  rng: Rng = Math.random,
): ActiveSession {
  return {
    id,
    mode,
    focus,
    state,
    startedAt: now,
    deadline: mode === "exam" ? now + EXAM.minutes * 60_000 : null,
    items: questions.map((q) => ({
      qid: q.id,
      order: optionOrder(q, shuffleOptions, rng),
      chosen: null,
      flagged: false,
      checked: false,
      retry: false,
      timeMs: 0,
    })),
    index: 0,
    shownAt: now,
  };
}

/** Adds the time spent on the current question and moves to `index`. */
export function goTo(s: ActiveSession, index: number, now = Date.now()): ActiveSession {
  const clamped = Math.max(0, Math.min(index, s.items.length - 1));
  const items = s.items.map((it, i) =>
    i === s.index ? { ...it, timeMs: it.timeMs + Math.max(0, now - s.shownAt) } : it,
  );
  return { ...s, items, index: clamped, shownAt: now };
}

export function choose(s: ActiveSession, chosen: number): ActiveSession {
  const current = s.items[s.index]!;
  if (current.checked) return s;
  return { ...s, items: s.items.map((it, i) => (i === s.index ? { ...it, chosen } : it)) };
}

export function toggleFlag(s: ActiveSession): ActiveSession {
  return {
    ...s,
    items: s.items.map((it, i) => (i === s.index ? { ...it, flagged: !it.flagged } : it)),
  };
}

/**
 * Practice mode: locks in the current answer. A first-time miss is queued again a few
 * questions later with freshly shuffled options, so the correction is rehearsed while fresh.
 */
export function check(
  s: ActiveSession,
  question: Question,
  shuffleOptions: boolean,
  now = Date.now(),
  rng: Rng = Math.random,
): ActiveSession {
  const current = s.items[s.index]!;
  if (current.checked || current.chosen === null) return s;
  const timeMs = current.timeMs + Math.max(0, now - s.shownAt);
  const items = s.items.map((it, i) => (i === s.index ? { ...it, checked: true, timeMs } : it));
  if (current.chosen !== question.answer && !current.retry) {
    const at = Math.min(s.index + 1 + RETRY_GAP, items.length);
    items.splice(at, 0, {
      qid: question.id,
      order: optionOrder(question, shuffleOptions, rng),
      chosen: null,
      flagged: false,
      checked: false,
      retry: true,
      timeMs: 0,
    });
  }
  return { ...s, items, shownAt: now };
}

export function toAnswer(it: Item, position: number): AnswerInput {
  return {
    questionId: it.qid,
    position,
    chosen: it.chosen,
    timeMs: it.timeMs,
    retry: it.retry,
  };
}

export function save(s: ActiveSession | null): void {
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
}

export function load(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActiveSession) : null;
  } catch {
    return null;
  }
}
