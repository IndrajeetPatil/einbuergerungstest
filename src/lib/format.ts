// Formatting shared by the views.
const SECOND_MS = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTE_MS = SECOND_MS * SECONDS_PER_MINUTE;
const PERCENT = 100;
const CLOCK_DIGITS = 2;

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

const dateTime = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const longGermanDate = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const germanDate = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const englishDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Formats a share as a whole percentage.
 * @param share - A number between 0 and 1.
 * @returns For example `"88%"`.
 */
function percent(share: number): string {
  return `${Math.round(share * PERCENT)}%`;
}

/**
 * Formats a duration in whole minutes, at least one.
 * @param durationMs - Duration in milliseconds, if known.
 * @returns For example `"25 min"`, or an en dash.
 */
function minutes(durationMs: number | null): string {
  return durationMs === null
    ? "–"
    : `${Math.max(1, Math.round(durationMs / MINUTE_MS))} min`;
}

/**
 * Formats a countdown as `mm:ss`.
 * @param remainingMs - Time left in milliseconds.
 * @returns The clock text.
 */
function clock(remainingMs: number): string {
  const totalSeconds = Math.floor(Math.max(0, remainingMs) / SECOND_MS);
  const mins = String(Math.floor(totalSeconds / SECONDS_PER_MINUTE));
  const secs = String(totalSeconds % SECONDS_PER_MINUTE);
  return `${mins.padStart(CLOCK_DIGITS, "0")}:${secs.padStart(CLOCK_DIGITS, "0")}`;
}

export {
  shortDate,
  dateTime,
  longGermanDate,
  germanDate,
  englishDate,
  percent,
  minutes,
  clock,
};
