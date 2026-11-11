// Backup files (the whole progress document as JSON, to keep it safe or move
// it to another browser) and replacing all progress on import or reset.
import {
  ValidationError,
  discardSession,
  judge,
  nextSessionId,
  parse,
} from "./progress.ts";
import { backupSchema } from "./schemas.ts";
import type { Backup, Progress } from "./schemas.ts";

function toBackup(progress: Progress, now: Date = new Date()): Backup {
  return { app: "einbuergerungstest", exportedAt: now.toISOString(), progress };
}

function requireKnownSessions(progress: Progress): void {
  const ids = new Set(progress.sessions.map((session) => session.id));
  const orphan = progress.answers.find((answer) => !ids.has(answer.sessionId));
  if (orphan !== undefined) {
    throw new ValidationError(`answer ${orphan.id} has no session`);
  }
}

/**
 * Reads a backup file, judging every answer again against the official key
 * rather than trusting the file.
 * @param value - Parsed JSON of the file.
 * @returns The progress it holds.
 */
function fromBackup(value: unknown): Progress {
  // Parsing returns fresh objects, so they can be corrected in place.
  const { progress } = parse(backupSchema, value);
  requireKnownSessions(progress);
  for (const answer of progress.answers) {
    answer.correct = judge(answer.questionId, answer.chosen);
  }
  return progress;
}

/**
 * Replaces all progress (an import or a reset) without ever reusing a
 * session id, and closes the replacement's open sessions: their state lived
 * in another browser, so they can never be resumed here.
 * @param current - The document being replaced.
 * @param replacement - The new progress.
 * @param now - Time of the replacement.
 * @returns The new document.
 */
function replaceProgress(
  current: Progress,
  replacement: Progress,
  now: Date = new Date(),
): Progress {
  let next = replacement;
  for (const session of replacement.sessions) {
    if (session.finishedAt === null) {
      next = discardSession(next, session.id, now);
    }
  }
  return {
    ...next,
    nextSessionId: Math.max(nextSessionId(current), nextSessionId(replacement)),
  };
}

export { fromBackup, replaceProgress, toBackup };
