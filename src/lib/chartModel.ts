// Geometry of the score-over-time chart, kept pure so it can be unit-tested.
import { DAY_MS, parseLocalDate, startOfDay } from "./dates.ts";
import { EXAM, accuracy } from "./quiz.ts";
import type { SessionSummary } from "./schemas.ts";

const CHART = {
  height: 300,
  top: 18,
  right: 18,
  bottom: 34,
  left: 46,
  minInnerWidth: 100,
} as const;

const HALF_DAY_MS = 43_200_000;
const LEAD_DAYS = 6;
const DAILY_TICKS_UP_TO_DAYS = 18;
const WEEKLY_TICKS_UP_TO_DAYS = 45;
const WEEK = 7;
const FORTNIGHT = 14;
const NEAREST_X_WEIGHT = 4;

const PASS_SHARE = EXAM.passMark / EXAM.total;
const GRID_STEPS = 4;
const GRID_SHARES: readonly number[] = Array.from(
  { length: GRID_STEPS + 1 },
  (_unused, step) => step / GRID_STEPS,
);

interface ChartPoint {
  session: SessionSummary;
  time: number;
  share: number;
  x: number;
  y: number;
}

interface ChartModel {
  exams: ChartPoint[];
  practice: ChartPoint[];
  ticks: number[];
  tickStepDays: number;
  examX: number | null;
  y: (share: number) => number;
  x: (time: number) => number;
  innerWidth: number;
}

function tickStep(spanDays: number): number {
  if (spanDays <= DAILY_TICKS_UP_TO_DAYS) {
    return 1;
  }
  return spanDays <= WEEKLY_TICKS_UP_TO_DAYS ? WEEK : FORTNIGHT;
}

function ticksBetween(start: number, end: number, stepDays: number): number[] {
  const ticks: number[] = [];
  for (let tick = startOfDay(start); tick <= end; tick += stepDays * DAY_MS) {
    ticks.push(tick);
  }
  return ticks;
}

interface ChartInput {
  sessions: readonly SessionSummary[];
  examDate: string | null;
  width: number;
  now?: number;
}

/**
 * Lays out sessions on a time axis that runs from a week before the first
 * session to the exam date.
 * @param input - Sessions, exam date, chart width and the current time.
 * @returns Scales, points and ticks.
 */
function chartModel(input: ChartInput): ChartModel {
  const { sessions, examDate, width, now = Date.now() } = input;
  const examTime =
    examDate === null ? null : parseLocalDate(examDate).getTime();
  const today = startOfDay(now);
  const times = sessions.map((session) =>
    startOfDay(Date.parse(session.startedAt)),
  );
  const start = Math.min(today - LEAD_DAYS * DAY_MS, ...times);
  const end = Math.max(examTime ?? today, today) + DAY_MS;
  const innerWidth = Math.max(
    width - CHART.left - CHART.right,
    CHART.minInnerWidth,
  );
  const innerHeight = CHART.height - CHART.top - CHART.bottom;
  const xOf = (time: number): number =>
    CHART.left + ((time - start) / (end - start)) * innerWidth;
  const yOf = (share: number): number => CHART.top + (1 - share) * innerHeight;
  const toPoint = (session: SessionSummary): ChartPoint => {
    const time = Date.parse(session.startedAt);
    const share = accuracy(session);
    return { session, time, share, x: xOf(time), y: yOf(share) };
  };
  const stepDays = tickStep((end - start) / DAY_MS);
  return {
    exams: sessions
      .filter((session) => session.mode === "exam")
      .map((session) => toPoint(session)),
    practice: sessions
      .filter((session) => session.mode === "practice" && session.answered > 0)
      .map((session) => toPoint(session)),
    ticks: ticksBetween(start, end, stepDays),
    tickStepDays: stepDays,
    examX: examTime === null ? null : xOf(examTime + HALF_DAY_MS),
    y: yOf,
    x: xOf,
    innerWidth,
  };
}

/**
 * The point nearest to the pointer, favouring horizontal distance.
 * @param points - Candidate points.
 * @param px - Pointer x in chart coordinates.
 * @param py - Pointer y in chart coordinates.
 * @returns The nearest point, or null when there are none.
 */
function nearestPoint(
  points: readonly ChartPoint[],
  px: number,
  py: number,
): ChartPoint | null {
  let best: ChartPoint | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of points) {
    const distance =
      Math.abs(candidate.x - px) * NEAREST_X_WEIGHT +
      Math.abs(candidate.y - py);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best;
}

/**
 * The SVG path through the mock-exam points.
 * @param points - Points in time order.
 * @returns An SVG path string.
 */
function linePath(points: readonly ChartPoint[]): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join("");
}

/** Mark and label sizes of the chart, in px. */
const MARK = {
  line: 2,
  ring: 2,
  practiceRadius: 4,
  examRadius: 4.5,
  hoverRadius: 6.5,
  hoverStroke: 1.5,
  tickLength: 5,
  tickLabelOffset: 19,
  axisLabelGap: 10,
  labelGap: 6,
  passLabelDrop: 16,
  examLabelDrop: 10,
  endLabelGap: 9,
  tooltipWidth: 190,
  tooltipGap: 14,
  tooltipRise: 40,
  tooltipHeight: 96,
  wideChart: 760,
} as const;

export {
  CHART,
  PASS_SHARE,
  GRID_SHARES,
  chartModel,
  nearestPoint,
  linePath,
  MARK,
};
export type { ChartPoint, ChartModel };
