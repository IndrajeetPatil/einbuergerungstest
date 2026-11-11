// Changes to your progress, kept as one document of settings, sessions and
// answers. Every change is a pure function from one document to the next, so
// the IndexedDB layer applies it in a single transaction and a failed check
// changes nothing. Correctness is judged here against the official answer
// key; the caller only says which option was chosen.
import { z as zod } from "zod/mini";

import { questions } from "./catalogue.ts";
import { sessions, settingsOf } from "./progressViews.ts";
import {
  answerInputSchema,
  finishInputSchema,
  settingsPatchSchema,
  startSessionInputSchema,
} from "./schemas.ts";
import type {
  AnswerInput,
  Progress,
  SessionSummary,
  Settings,
  StoredAnswer,
  StoredSession,
} from "./schemas.ts";

/** Invalid input: an unknown question or session, or a malformed value. */
class ValidationError extends Error {
  public override readonly name = "ValidationError";
}

/** A changed document and what the change returns. */
interface Change<Result> {
  progress: Progress;
  result: Result;
}

/** A call on one session: its id, the untrusted input and the time. */
interface SessionCall {
  sessionId: number;
  input?: unknown;
  now?: Date;
}

const ANSWER_KEY = new Map(questions.map((entry) => [entry.id, entry.answer]));

const EMPTY_PROGRESS: Progress = {
  version: 1,
  settings: {},
  sessions: [],
  answers: [],
};

/**
 * Parses untrusted input, turning schema failures into validation errors.
 * @param schema - Expected shape.
 * @param value - Untrusted value.
 * @returns The parsed value.
 */
function parse<Schema extends zod.ZodMiniType>(
  schema: Schema,
  value: unknown,
): zod.infer<Schema> {
  const result = zod.safeParse(schema, value);
  if (!result.success) {
    throw new ValidationError(zod.prettifyError(result.error));
  }
  return result.data;
}

/**
 * Judges an answer against the official key.
 * @param questionId - Catalogue id.
 * @param chosen - Chosen option, or null when left blank.
 * @returns Whether the chosen option is correct.
 */
function judge(questionId: string, chosen: number | null): boolean {
  const answer = ANSWER_KEY.get(questionId);
  if (answer === undefined) {
    throw new ValidationError(`unknown question ${questionId}`);
  }
  return chosen === answer;
}

function roundOrNull(value: number | null | undefined): number | null {
  return value === null || value === undefined ? null : Math.round(value);
}

/**
 * The next free id, as SQLite's INTEGER PRIMARY KEY would choose it.
 * @param rows - Existing rows.
 * @returns One more than the highest id.
 */
function nextId(rows: readonly { id: number }[]): number {
  return Math.max(0, ...rows.map((row) => row.id)) + 1;
}

function updateSettings(progress: Progress, patch: unknown): Change<Settings> {
  const next = {
    ...progress,
    settings: { ...progress.settings, ...parse(settingsPatchSchema, patch) },
  };
  return { progress: next, result: settingsOf(next) };
}

function startSession(
  progress: Progress,
  input: unknown,
  now: Date = new Date(),
): Change<number> {
  const valid = parse(startSessionInputSchema, input);
  const session: StoredSession = {
    id: nextId(progress.sessions),
    mode: valid.mode,
    focus: valid.focus,
    state: valid.state,
    questionCount: valid.questionCount,
    startedAt: now.toISOString(),
    finishedAt: null,
    durationMs: null,
  };
  return {
    progress: { ...progress, sessions: [...progress.sessions, session] },
    result: session.id,
  };
}

function requireOpenSession(progress: Progress, id: number): void {
  const session = progress.sessions.find((entry) => entry.id === id);
  if (session === undefined) {
    throw new ValidationError("unknown session");
  }
  if (session.finishedAt !== null) {
    throw new ValidationError("session already finished");
  }
}

/**
 * Judges answers and appends them to the document.
 * @param progress - Current document.
 * @param sessionId - Session the answers belong to.
 * @param inputs - Validated answers, all given now.
 * @returns The document with the answers stored, and the stored answers.
 */
function withAnswers(
  progress: Progress,
  sessionId: number,
  inputs: { answers: readonly AnswerInput[]; now: Date },
): Change<StoredAnswer[]> {
  const first = nextId(progress.answers);
  const stored = inputs.answers.map((input, offset) => ({
    id: first + offset,
    sessionId,
    questionId: input.questionId,
    position: input.position,
    chosen: input.chosen,
    correct: judge(input.questionId, input.chosen),
    retry: input.retry === true,
    timeMs: roundOrNull(input.timeMs),
    answeredAt: inputs.now.toISOString(),
  }));
  return {
    progress: { ...progress, answers: [...progress.answers, ...stored] },
    result: stored,
  };
}

/**
 * Stores one practice answer and reports whether it was correct.
 * @param progress - Current document.
 * @param call - Open session, the answer (validated here) and its time.
 * @returns The new document, and whether the answer was correct.
 */
function recordAnswer(progress: Progress, call: SessionCall): Change<boolean> {
  requireOpenSession(progress, call.sessionId);
  const added = withAnswers(progress, call.sessionId, {
    answers: [parse(answerInputSchema, call.input)],
    now: call.now ?? new Date(),
  });
  return {
    progress: added.progress,
    result: added.result.every((answer) => answer.correct),
  };
}

function summaryOf(progress: Progress, id: number): SessionSummary {
  const found = sessions(progress).find((session) => session.id === id);
  if (found === undefined) {
    throw new Error(`session ${id} vanished after finishing`);
  }
  return found;
}

/**
 * Closes a session; mock exams submit all their answers here.
 * @param progress - Current document.
 * @param call - Open session, its answers and time spent (validated here),
 * and the time of closing.
 * @returns The new document and the finished session's summary.
 */
function finishSession(
  progress: Progress,
  call: SessionCall,
): Change<SessionSummary> {
  requireOpenSession(progress, call.sessionId);
  const valid = parse(finishInputSchema, call.input ?? {});
  const now = call.now ?? new Date();
  const added = withAnswers(progress, call.sessionId, {
    answers: valid.answers ?? [],
    now,
  });
  const next: Progress = {
    ...added.progress,
    sessions: progress.sessions.map((session) =>
      session.id === call.sessionId
        ? {
            ...session,
            finishedAt: now.toISOString(),
            durationMs: roundOrNull(valid.durationMs),
          }
        : session,
    ),
  };
  return { progress: next, result: summaryOf(next, call.sessionId) };
}

/**
 * Abandons a session: deleted when empty, otherwise closed as is.
 * @param progress - Current document.
 * @param id - Session to abandon.
 * @param now - Time of abandoning.
 * @returns The new document.
 */
function discardSession(
  progress: Progress,
  id: number,
  now: Date = new Date(),
): Progress {
  const isOpen = (session: StoredSession): boolean =>
    session.id === id && session.finishedAt === null;
  if (!progress.answers.some((answer) => answer.sessionId === id)) {
    return {
      ...progress,
      sessions: progress.sessions.filter((session) => !isOpen(session)),
    };
  }
  return {
    ...progress,
    sessions: progress.sessions.map((session) =>
      isOpen(session)
        ? {
            ...session,
            finishedAt: now.toISOString(),
            durationMs: now.getTime() - Date.parse(session.startedAt),
          }
        : session,
    ),
  };
}

export {
  EMPTY_PROGRESS,
  ValidationError,
  discardSession,
  finishSession,
  judge,
  parse,
  recordAnswer,
  startSession,
  updateSettings,
};
export type { Change, SessionCall };
