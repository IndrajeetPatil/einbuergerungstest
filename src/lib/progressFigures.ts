// Headline figures of the dashboard's progress section.
import { streak } from "./dates.ts";
import { passed } from "./quiz.ts";
import type { SessionSummary } from "./schemas.ts";

const RECENT = 3;

interface ProgressFigures {
  latest: SessionSummary | undefined;
  averageRecent: string;
  best: string;
  passedOfTaken: string;
  streak: string;
}

/**
 * Computes the dashboard's progress figures.
 * @param sessions - Finished sessions, oldest first.
 * @param now - Current time.
 * @returns Display-ready figures.
 */
function progressFigures(
  sessions: readonly SessionSummary[],
  now: Date = new Date(),
): ProgressFigures {
  const exams = sessions.filter((session) => session.mode === "exam");
  const recent = exams.slice(-RECENT);
  const scores = exams.map((exam) => exam.correct);
  const average =
    recent.reduce((sum, exam) => sum + exam.correct, 0) / recent.length;
  return {
    latest: exams.at(-1),
    averageRecent: recent.length > 0 ? average.toFixed(1) : "–",
    best: scores.length > 0 ? String(Math.max(...scores)) : "–",
    passedOfTaken:
      exams.length > 0
        ? `${exams.filter((exam) => passed(exam.correct)).length}/${exams.length}`
        : "–",
    streak: String(streak(sessions, now)),
  };
}

export { progressFigures };
export type { ProgressFigures };
