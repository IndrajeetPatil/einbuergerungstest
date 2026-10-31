// Calendar arithmetic in local time.
import type { SessionSummary } from "./schemas.ts";

const DAY_MS = 86_400_000;
const DATE_DIGITS = 2;

/**
 * Local calendar day as `YYYY-MM-DD`.
 * @param date - Any moment.
 * @returns The local date.
 */
function localDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(DATE_DIGITS, "0");
  const day = String(date.getDate()).padStart(DATE_DIGITS, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Parses `YYYY-MM-DD` as local midnight.
 * @param isoDate - The date.
 * @returns Local midnight of that date.
 */
function parseLocalDate(isoDate: string): Date {
  const [year = 0, month = 1, day = 1] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Local midnight of the day containing a moment.
 * @param time - Any moment in ms.
 * @returns Local midnight in ms.
 */
function startOfDay(time: number): number {
  const date = new Date(time);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

/**
 * Whole days from today until the exam date (local time).
 * @param examDate - Exam date as `YYYY-MM-DD`.
 * @param now - Current time.
 * @returns Days to go; negative once the date has passed.
 */
function daysUntil(examDate: string, now: Date = new Date()): number {
  return Math.round(
    (parseLocalDate(examDate).getTime() - startOfDay(now.getTime())) / DAY_MS,
  );
}

/**
 * Consecutive days, ending today or yesterday, with a finished session.
 * @param sessions - Finished sessions.
 * @param now - Current time.
 * @returns The streak length in days.
 */
function streak(
  sessions: readonly SessionSummary[],
  now: Date = new Date(),
): number {
  const days = new Set(
    sessions.map((session) => localDay(new Date(session.startedAt))),
  );
  const cursor = new Date(startOfDay(now.getTime()));
  if (!days.has(localDay(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let count = 0;
  while (days.has(localDay(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export { DAY_MS, daysUntil, parseLocalDate, startOfDay, streak };
