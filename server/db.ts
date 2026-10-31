import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import catalogue from "../src/data/catalogue.json" with { type: "json" };
import type {
  AnswerInput,
  Catalogue,
  QuestionStat,
  SessionSummary,
  Settings,
  StartSessionInput,
  StateCode,
  Summary,
} from "../src/lib/types.ts";

/** Override with `LID_DB=/path/to/file.sqlite` (used by end-to-end checks to keep real progress clean). */
export const DEFAULT_DB_PATH =
  process.env.LID_DB ?? join(import.meta.dirname, "..", "data", "progress.sqlite");

export const DEFAULT_SETTINGS: Settings = {
  state: null,
  examDate: "2026-11-11",
  showEnglish: true,
  shuffleOptions: true,
};

const QUESTIONS = new Map((catalogue as Catalogue).questions.map((q) => [q.id, q]));
const STATES = new Set((catalogue as Catalogue).states.map((s) => s.code));

/** Schema migrations, applied in order; `PRAGMA user_version` records how many have run. */
const MIGRATIONS = [
  `
  CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE sessions (
    id             INTEGER PRIMARY KEY,
    mode           TEXT    NOT NULL CHECK (mode IN ('exam', 'practice')),
    focus          TEXT,
    state          TEXT    NOT NULL,
    question_count INTEGER NOT NULL,
    started_at     TEXT    NOT NULL,
    finished_at    TEXT,
    duration_ms    INTEGER
  );
  CREATE TABLE answers (
    id          INTEGER PRIMARY KEY,
    session_id  INTEGER NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
    question_id TEXT    NOT NULL,
    position    INTEGER NOT NULL,
    chosen      INTEGER CHECK (chosen BETWEEN 0 AND 3),
    correct     INTEGER NOT NULL CHECK (correct IN (0, 1)),
    retry       INTEGER NOT NULL DEFAULT 0 CHECK (retry IN (0, 1)),
    time_ms     INTEGER,
    answered_at TEXT    NOT NULL
  );
  CREATE INDEX answers_by_question ON answers (question_id, answered_at);
  CREATE INDEX answers_by_session ON answers (session_id);
  `,
];

export class ValidationError extends Error {}

export class ProgressStore {
  readonly db: DatabaseSync;

  constructor(path: string = DEFAULT_DB_PATH) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;",
    );
    this.migrate();
  }

  private migrate(): void {
    const { user_version: version } = this.db.prepare("PRAGMA user_version").get() as {
      user_version: number;
    };
    for (let i = version; i < MIGRATIONS.length; i++) {
      this.db.exec("BEGIN");
      try {
        this.db.exec(MIGRATIONS[i]!);
        this.db.exec(`PRAGMA user_version = ${i + 1}`);
        this.db.exec("COMMIT");
      } catch (error) {
        this.db.exec("ROLLBACK");
        throw error;
      }
    }
  }

  close(): void {
    this.db.close();
  }

  getSettings(): Settings {
    const rows = this.db.prepare("SELECT key, value FROM settings").all() as {
      key: string;
      value: string;
    }[];
    const stored = Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value) as unknown]));
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  updateSettings(patch: Partial<Settings>): Settings {
    const clean: Partial<Settings> = {};
    if ("state" in patch) {
      if (patch.state !== null && !STATES.has(patch.state as StateCode)) {
        throw new ValidationError("unknown federal state");
      }
      clean.state = patch.state ?? null;
    }
    if ("examDate" in patch) {
      if (typeof patch.examDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(patch.examDate)) {
        throw new ValidationError("examDate must be YYYY-MM-DD");
      }
      clean.examDate = patch.examDate;
    }
    for (const key of ["showEnglish", "shuffleOptions"] as const) {
      if (key in patch) {
        if (typeof patch[key] !== "boolean") throw new ValidationError(`${key} must be a boolean`);
        clean[key] = patch[key];
      }
    }
    const upsert = this.db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
    );
    for (const [key, value] of Object.entries(clean)) upsert.run(key, JSON.stringify(value));
    return this.getSettings();
  }

  startSession(input: StartSessionInput, now = new Date()): number {
    if (input.mode !== "exam" && input.mode !== "practice") throw new ValidationError("bad mode");
    if (!STATES.has(input.state)) throw new ValidationError("unknown federal state");
    if (!Number.isInteger(input.questionCount) || input.questionCount < 1) {
      throw new ValidationError("questionCount must be a positive integer");
    }
    const result = this.db
      .prepare(
        "INSERT INTO sessions (mode, focus, state, question_count, started_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(input.mode, input.focus ?? null, input.state, input.questionCount, now.toISOString());
    return Number(result.lastInsertRowid);
  }

  private requireOpenSession(id: number): void {
    const row = this.db.prepare("SELECT finished_at FROM sessions WHERE id = ?").get(id) as
      | { finished_at: string | null }
      | undefined;
    if (!row) throw new ValidationError("unknown session");
    if (row.finished_at) throw new ValidationError("session already finished");
  }

  /** Stores one answer; correctness is judged here, against the official answer key. */
  recordAnswer(sessionId: number, input: AnswerInput, now = new Date()): boolean {
    this.requireOpenSession(sessionId);
    return this.insertAnswer(sessionId, input, now);
  }

  private insertAnswer(sessionId: number, input: AnswerInput, now: Date): boolean {
    const question = QUESTIONS.get(input.questionId);
    if (!question) throw new ValidationError(`unknown question ${String(input.questionId)}`);
    const chosen = input.chosen;
    if (chosen !== null && !(Number.isInteger(chosen) && chosen >= 0 && chosen <= 3)) {
      throw new ValidationError("chosen must be 0-3 or null");
    }
    const correct = chosen === question.answer;
    this.db
      .prepare(
        `INSERT INTO answers (session_id, question_id, position, chosen, correct, retry, time_ms, answered_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        sessionId,
        input.questionId,
        input.position,
        chosen,
        correct ? 1 : 0,
        input.retry ? 1 : 0,
        input.timeMs === null ? null : Math.max(0, Math.round(input.timeMs)),
        now.toISOString(),
      );
    return correct;
  }

  /** Closes a session, optionally storing a batch of answers (exam mode submits all at once). */
  finishSession(
    id: number,
    answers: AnswerInput[] = [],
    durationMs: number | null = null,
    now = new Date(),
  ): SessionSummary {
    this.requireOpenSession(id);
    this.db.exec("BEGIN");
    try {
      for (const answer of answers) this.insertAnswer(id, answer, now);
      this.db
        .prepare("UPDATE sessions SET finished_at = ?, duration_ms = ? WHERE id = ?")
        .run(now.toISOString(), durationMs === null ? null : Math.round(durationMs), id);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return this.sessions().find((s) => s.id === id)!;
  }

  /** Abandons an unfinished session; answers already given in practice are kept as evidence. */
  discardSession(id: number): void {
    this.db.exec("BEGIN");
    try {
      const { n } = this.db
        .prepare("SELECT COUNT(*) AS n FROM answers WHERE session_id = ?")
        .get(id) as { n: number };
      if (n === 0) {
        this.db.prepare("DELETE FROM sessions WHERE id = ? AND finished_at IS NULL").run(id);
      } else {
        this.db
          .prepare(
            `UPDATE sessions SET finished_at = ?,
               duration_ms = CAST((julianday(?) - julianday(started_at)) * 86400000 AS INTEGER)
             WHERE id = ? AND finished_at IS NULL`,
          )
          .run(new Date().toISOString(), new Date().toISOString(), id);
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  sessions(): SessionSummary[] {
    const rows = this.db
      .prepare(
        `SELECT s.id, s.mode, s.focus, s.state, s.question_count AS questionCount,
                s.started_at AS startedAt, s.finished_at AS finishedAt, s.duration_ms AS durationMs,
                COUNT(a.id) FILTER (WHERE a.retry = 0 AND a.chosen IS NOT NULL) AS answered,
                COALESCE(SUM(a.correct) FILTER (WHERE a.retry = 0), 0) AS correct
         FROM sessions s LEFT JOIN answers a ON a.session_id = s.id
         WHERE s.finished_at IS NOT NULL
         GROUP BY s.id
         ORDER BY s.started_at`,
      )
      .all() as unknown as SessionSummary[];
    return rows.map((r) => ({ ...r }));
  }

  stats(): Record<string, QuestionStat> {
    const rows = this.db
      .prepare(
        `WITH ranked AS (
           SELECT question_id, correct, answered_at,
                  ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY answered_at DESC, id DESC) AS rn
           FROM answers
         )
         SELECT question_id AS id, COUNT(*) AS attempts, SUM(correct) AS correct,
                MAX(answered_at) AS lastAt,
                GROUP_CONCAT(CASE WHEN rn <= 5 THEN correct END, '' ORDER BY rn) AS recent
         FROM ranked
         GROUP BY question_id`,
      )
      .all() as unknown as (QuestionStat & { id: string })[];
    return Object.fromEntries(rows.map(({ id, ...stat }) => [id, { ...stat }]));
  }

  summary(): Summary {
    return { settings: this.getSettings(), sessions: this.sessions(), stats: this.stats() };
  }

  /** Everything, for `make export`. */
  dump(): Record<string, unknown> {
    return {
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      sessions: this.db.prepare("SELECT * FROM sessions ORDER BY id").all(),
      answers: this.db.prepare("SELECT * FROM answers ORDER BY id").all(),
    };
  }

  backup(path: string): void {
    mkdirSync(dirname(path), { recursive: true });
    this.db.prepare("VACUUM INTO ?").run(path);
  }
}
