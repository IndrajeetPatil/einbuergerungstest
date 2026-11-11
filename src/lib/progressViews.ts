// Read-only views of the progress document: settings with their defaults,
// finished sessions with their scores, and per-question statistics.
import type {
  Progress,
  QuestionStat,
  SessionSummary,
  Settings,
  StoredAnswer,
  StoredSession,
  Summary,
} from "./schemas.ts";
import { mergeSettings } from "./settings.ts";

/** How many of a question's latest results `recent` keeps. */
const RECENT = 5;

const DEFAULT_SETTINGS: Settings = {
  state: null,
  examDate: null,
  showEnglish: true,
  shuffleOptions: true,
};

type FinishedSession = StoredSession & { finishedAt: string };

function settingsOf(progress: Progress): Settings {
  return mergeSettings(DEFAULT_SETTINGS, progress.settings);
}

function isFinished(session: StoredSession): session is FinishedSession {
  return session.finishedAt !== null;
}

function scored(
  session: FinishedSession,
  answers: readonly StoredAnswer[],
): SessionSummary {
  // First attempts only; retries inside a practice session do not count.
  const first = answers.filter(
    (answer) => answer.sessionId === session.id && !answer.retry,
  );
  return {
    ...session,
    answered: first.filter((answer) => answer.chosen !== null).length,
    correct: first.filter((answer) => answer.correct).length,
  };
}

/**
 * Finished sessions with their scores, oldest first.
 * @param progress - Current document.
 * @returns One summary per finished session.
 */
function sessions(progress: Progress): SessionSummary[] {
  return progress.sessions
    .filter(isFinished)
    .toSorted((left, right) => left.startedAt.localeCompare(right.startedAt))
    .map((session) => scored(session, progress.answers));
}

function newestFirst(left: StoredAnswer, right: StoredAnswer): number {
  return right.answeredAt.localeCompare(left.answeredAt) || right.id - left.id;
}

function statOf(answers: readonly StoredAnswer[]): QuestionStat {
  const ordered = answers.toSorted(newestFirst);
  return {
    attempts: ordered.length,
    correct: ordered.filter((answer) => answer.correct).length,
    lastAt: ordered[0]?.answeredAt ?? "",
    recent: ordered
      .slice(0, RECENT)
      .map((answer) => (answer.correct ? "1" : "0"))
      .join(""),
  };
}

/**
 * Per-question results over every answer ever given.
 * @param progress - Current document.
 * @returns Statistics by question id.
 */
function stats(progress: Progress): Record<string, QuestionStat> {
  const byQuestion = Map.groupBy(
    progress.answers,
    (answer) => answer.questionId,
  );
  return Object.fromEntries(
    [...byQuestion].map(([id, answers]) => [id, statOf(answers)]),
  );
}

function summary(progress: Progress): Summary {
  return {
    settings: settingsOf(progress),
    sessions: sessions(progress),
    stats: stats(progress),
  };
}

export { sessions, settingsOf, stats, summary };
