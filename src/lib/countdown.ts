// Wording of the countdown to exam day.
import { daysUntil } from "./dates.ts";

/**
 * Countdown sentence for the dashboard.
 * @param examDate - Exam date as `YYYY-MM-DD`.
 * @param now - Current time.
 * @returns For example "11 days to go".
 */
function countdownText(examDate: string, now: Date = new Date()): string {
  const days = daysUntil(examDate, now);
  const special: Readonly<Record<string, string>> = {
    "0": "Today — viel Erfolg!",
    "1": "Tomorrow — viel Erfolg!",
  };
  if (days < 0) {
    return "The exam date has passed.";
  }
  return special[String(days)] ?? `${days} days to go`;
}

function chipFor(days: number): string | null {
  const special: Readonly<Record<string, string>> = {
    "0": "Exam today",
    "1": "1 day to exam",
  };
  return days < 0 ? null : (special[String(days)] ?? `${days} days to exam`);
}

/**
 * Short countdown for the masthead chip, or null without an upcoming exam.
 * @param examDate - Exam date as `YYYY-MM-DD`, if set.
 * @param now - Current time.
 * @returns For example "11 days to exam".
 */
function countdownChip(
  examDate: string | null,
  now: Date = new Date(),
): string | null {
  return examDate === null ? null : chipFor(daysUntil(examDate, now));
}

export { countdownChip, countdownText };
