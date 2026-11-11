// Runtime schemas for every value that crosses a trust boundary: the bundled
// catalogue, progress-store inputs, IndexedDB records, backup files and
// localStorage. Types are inferred from them, so validation and typing cannot
// drift apart.
import { z as zod } from "zod/mini";

const OPTION_COUNT = 4;
const text = zod.string();
const nullableText = zod.nullable(text);
const atLeastZero = zod.minimum(0);
const atLeastOne = zod.minimum(1);
const count = zod.int().check(atLeastZero);
const duration = zod.number().check(atLeastZero);
const LAST_OPTION = OPTION_COUNT - 1;

const STATE_CODES = [
  "BW",
  "BY",
  "BE",
  "BB",
  "HB",
  "HH",
  "HE",
  "MV",
  "NI",
  "NW",
  "RP",
  "SL",
  "SN",
  "ST",
  "SH",
  "TH",
] as const;

const stateCodeSchema = zod.enum(STATE_CODES);
type StateCode = zod.infer<typeof stateCodeSchema>;

const optionIndexSchema = zod
  .int()
  .check(atLeastZero, zod.maximum(LAST_OPTION));

const localisedQuestionSchema = zod.object({
  q: zod.string(),
  o: zod.tuple([zod.string(), zod.string(), zod.string(), zod.string()]),
});

const questionSchema = zod.object({
  id: zod.string(),
  num: zod.int(),
  state: zod.nullable(stateCodeSchema),
  de: localisedQuestionSchema,
  en: localisedQuestionSchema,
  answer: optionIndexSchema,
  image: nullableText,
  credit: nullableText,
  explanation: zod.object({ en: text, de: nullableText }),
  keepOrder: zod.boolean(),
});
type Question = zod.infer<typeof questionSchema>;

const catalogueSchema = zod.object({
  source: zod.object({
    title: zod.string(),
    publisher: zod.string(),
    edition: zod.string(),
    url: zod.string(),
    sha256: zod.string(),
  }),
  states: zod.array(zod.object({ code: stateCodeSchema, de: text, en: text })),
  questions: zod.array(questionSchema),
});
type Catalogue = zod.infer<typeof catalogueSchema>;

const modeSchema = zod.enum(["exam", "practice"]);
type Mode = zod.infer<typeof modeSchema>;

const focusSchema = zod.enum([
  "smart",
  "new",
  "mistakes",
  "state",
  "all",
  "selected",
]);
type Focus = zod.infer<typeof focusSchema>;

const isoDateSchema = zod.iso.date();

const settingsSchema = zod.object({
  state: zod.nullable(stateCodeSchema),
  examDate: zod.nullable(isoDateSchema),
  showEnglish: zod.boolean(),
  shuffleOptions: zod.boolean(),
});
type Settings = zod.infer<typeof settingsSchema>;

const settingsPatchSchema = zod.partial(settingsSchema);
type SettingsPatch = zod.infer<typeof settingsPatchSchema>;

/** A session as stored; open sessions have no `finishedAt` yet. */
const storedSessionSchema = zod.object({
  id: zod.int(),
  mode: modeSchema,
  focus: zod.nullable(focusSchema),
  state: stateCodeSchema,
  questionCount: zod.int(),
  startedAt: zod.string(),
  finishedAt: nullableText,
  durationMs: zod.nullable(zod.int()),
});
type StoredSession = zod.infer<typeof storedSessionSchema>;

/** A finished session with its score. */
const sessionSummarySchema = zod.extend(storedSessionSchema, {
  finishedAt: text,
  /** First attempts only; retries inside a practice session do not count. */
  answered: zod.int(),
  correct: zod.int(),
});
type SessionSummary = zod.infer<typeof sessionSummarySchema>;

const questionStatSchema = zod.object({
  attempts: zod.int(),
  correct: zod.int(),
  lastAt: zod.string(),
  /** Most recent results first: `1` = correct, `0` = wrong (at most 5). */
  recent: zod.string().check(zod.regex(/^[01]*$/u)),
});
type QuestionStat = zod.infer<typeof questionStatSchema>;

const summarySchema = zod.object({
  settings: settingsSchema,
  sessions: zod.array(sessionSummarySchema),
  stats: zod.record(zod.string(), questionStatSchema),
});
type Summary = zod.infer<typeof summarySchema>;

const answerInputSchema = zod.object({
  questionId: zod.string(),
  position: count,
  /** Catalogue option index, or null when an exam question was left blank. */
  chosen: zod.nullable(optionIndexSchema),
  timeMs: zod.nullable(duration),
  retry: zod.optional(zod.boolean()),
});
type AnswerInput = zod.infer<typeof answerInputSchema>;

const startSessionInputSchema = zod.object({
  mode: modeSchema,
  focus: zod.nullable(focusSchema),
  state: stateCodeSchema,
  questionCount: zod.int().check(atLeastOne),
});
type StartSessionInput = zod.infer<typeof startSessionInputSchema>;

const finishInputSchema = zod.object({
  answers: zod.optional(zod.array(answerInputSchema)),
  durationMs: zod.optional(duration),
});

/** One answer as stored, judged against the official key when saved. */
const storedAnswerSchema = zod.object({
  id: zod.int(),
  sessionId: zod.int(),
  questionId: zod.string(),
  position: count,
  chosen: zod.nullable(optionIndexSchema),
  correct: zod.boolean(),
  retry: zod.boolean(),
  timeMs: zod.nullable(zod.int()),
  answeredAt: zod.string(),
});
type StoredAnswer = zod.infer<typeof storedAnswerSchema>;

/** Everything the browser keeps about your progress, as one document. */
const progressSchema = zod.object({
  version: zod.literal(1),
  settings: settingsPatchSchema,
  sessions: zod.array(storedSessionSchema),
  answers: zod.array(storedAnswerSchema),
  /**
   * The next session id. Ids are never reused, even after a reset or import,
   * so a session still open in another tab cannot write into a newer one.
   * Older documents lack it and count from their highest id.
   */
  nextSessionId: zod.optional(zod.int().check(atLeastOne)),
});
type Progress = zod.infer<typeof progressSchema>;

/** An exported backup file. */
const backupSchema = zod.object({
  app: zod.literal("einbuergerungstest"),
  exportedAt: zod.string(),
  progress: progressSchema,
});
type Backup = zod.infer<typeof backupSchema>;

const itemSchema = zod.object({
  qid: zod.string(),
  /** Catalogue option indices in display order. */
  order: zod.array(optionIndexSchema),
  /** Catalogue index of the chosen option. */
  chosen: zod.nullable(optionIndexSchema),
  flagged: zod.boolean(),
  /** Practice: the answer has been checked and feedback shown. */
  checked: zod.boolean(),
  /** Practice: a second chance at a question missed earlier. */
  retry: zod.boolean(),
  timeMs: zod.number(),
});
type Item = zod.infer<typeof itemSchema>;

const activeSessionSchema = zod.object({
  id: zod.int(),
  mode: modeSchema,
  focus: zod.nullable(focusSchema),
  state: stateCodeSchema,
  startedAt: zod.number(),
  /** Exam: wall-clock deadline (ms), so reloading does not reset the timer. */
  deadline: zod.nullable(zod.number()),
  items: zod.array(itemSchema),
  index: zod.int(),
  /** When the current question was shown (ms); used to time answers. */
  shownAt: zod.number(),
});
type ActiveSession = zod.infer<typeof activeSessionSchema>;

const themeSchema = zod.enum(["light", "dark"]);
type Theme = zod.infer<typeof themeSchema>;

export {
  stateCodeSchema,
  catalogueSchema,
  isoDateSchema,
  settingsPatchSchema,
  answerInputSchema,
  startSessionInputSchema,
  finishInputSchema,
  progressSchema,
  backupSchema,
  activeSessionSchema,
  themeSchema,
};
export type {
  StateCode,
  Question,
  Catalogue,
  Mode,
  Focus,
  Settings,
  SettingsPatch,
  SessionSummary,
  QuestionStat,
  Summary,
  AnswerInput,
  StartSessionInput,
  StoredSession,
  StoredAnswer,
  Progress,
  Backup,
  Item,
  ActiveSession,
  Theme,
};
