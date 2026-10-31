/** Types shared by the browser app and the local API server. */

export type StateCode =
  | "BW"
  | "BY"
  | "BE"
  | "BB"
  | "HB"
  | "HH"
  | "HE"
  | "MV"
  | "NI"
  | "NW"
  | "RP"
  | "SL"
  | "SN"
  | "ST"
  | "SH"
  | "TH";

export interface LocalisedQuestion {
  q: string;
  o: [string, string, string, string];
}

export interface Question {
  /** `g1`..`g300` for general questions, `BE1`..`BE10` etc. for state questions. */
  id: string;
  num: number;
  state: StateCode | null;
  de: LocalisedQuestion;
  en: LocalisedQuestion;
  /** Index of the correct option in catalogue order. */
  answer: number;
  image: string | null;
  credit: string | null;
  explanation: { en: string; de: string | null };
  /** Options whose order carries meaning (picture labels, numbers) are never shuffled. */
  keepOrder: boolean;
}

export interface Catalogue {
  source: { title: string; publisher: string; edition: string; url: string; sha256: string };
  states: { code: StateCode; de: string; en: string }[];
  questions: Question[];
}

export type Mode = "exam" | "practice";
export type Focus = "smart" | "new" | "mistakes" | "state" | "all" | "selected";

export interface Settings {
  state: StateCode | null;
  examDate: string;
  showEnglish: boolean;
  shuffleOptions: boolean;
}

export interface SessionSummary {
  id: number;
  mode: Mode;
  focus: Focus | null;
  state: StateCode;
  questionCount: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number | null;
  /** First attempts only; retries inside a practice session do not count. */
  answered: number;
  correct: number;
}

export interface QuestionStat {
  attempts: number;
  correct: number;
  lastAt: string;
  /** Most recent results first, `1` = correct, `0` = wrong (at most 5). */
  recent: string;
}

export interface Summary {
  settings: Settings;
  sessions: SessionSummary[];
  stats: Record<string, QuestionStat>;
}

export interface AnswerInput {
  questionId: string;
  position: number;
  /** Catalogue option index, or null when an exam question was left unanswered. */
  chosen: number | null;
  timeMs: number | null;
  retry?: boolean;
}

export interface StartSessionInput {
  mode: Mode;
  focus: Focus | null;
  state: StateCode;
  questionCount: number;
}
