// Backup files: the whole progress document as JSON, to keep it safe or move
// it to another browser.
import { ValidationError, judge, parse } from "./progress.ts";
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

export { fromBackup, toBackup };
