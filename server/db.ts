// The progress store: one SQLite file through Node's built-in node:sqlite.
// Correctness is judged here against the official answer key, and every row
// read back is validated against the shared schemas.
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { z as zod } from "zod/mini";

import {
  answerInputSchema,
  sessionSummarySchema,
  settingsPatchSchema,
  startSessionInputSchema,
} from "#lib/schemas.ts";
import type {
  AnswerInput,
  QuestionStat,
  SessionSummary,
  Settings,
  Summary,
} from "#lib/schemas.ts";
import { mergeSettings } from "#lib/settings.ts";

import { ValidationError } from "./errors.ts";
import { MIGRATIONS } from "./migrations.ts";
import {
  SQL,
  countRowSchema,
  openRowSchema,
  settingRowSchema,
  statRowSchema,
  versionRowSchema,
} from "./queries.ts";
import { judge, parse, roundOrNull } from "./validation.ts";

interface FinishInput {
  answers?: unknown;
  durationMs?: number | null;
}

/** Override with `LID_DB=/path/file.sqlite`; tests and checks use a throwaway. */
const DEFAULT_DB_PATH =
  process.env["LID_DB"] ??
  path.join(import.meta.dirname, "..", "data", "progress.sqlite");

const DEFAULT_SETTINGS: Settings = {
  state: null,
  examDate: null,
  showEnglish: true,
  shuffleOptions: true,
};

/** Progress persisted in SQLite. */
class ProgressStore {
  public readonly db: DatabaseSync;

  public constructor(file: string = DEFAULT_DB_PATH) {
    if (file !== ":memory:") {
      mkdirSync(path.dirname(file), { recursive: true });
    }
    this.db = new DatabaseSync(file);
    this.db.exec(
      "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;",
    );
    this.migrate();
  }

  public [Symbol.dispose](): void {
    this.close();
  }

  public close(): void {
    this.db.close();
  }

  public getSettings(): Settings {
    const rows = zod.parse(
      zod.array(settingRowSchema),
      this.db.prepare(SQL.settings).all(),
    );
    const stored: unknown = Object.fromEntries(
      rows.map((row) => [row.key, JSON.parse(row.value)]),
    );
    const known = zod.safeParse(settingsPatchSchema, stored);
    return mergeSettings(DEFAULT_SETTINGS, known.success ? known.data : {});
  }

  public updateSettings(patch: unknown): Settings {
    const upsert = this.db.prepare(SQL.upsertSetting);
    for (const [key, value] of Object.entries(
      parse(settingsPatchSchema, patch),
    )) {
      upsert.run(key, JSON.stringify(value));
    }
    return this.getSettings();
  }

  public startSession(input: unknown, now: Date = new Date()): number {
    const valid = parse(startSessionInputSchema, input);
    const result = this.db
      .prepare(SQL.startSession)
      .run(
        valid.mode,
        valid.focus,
        valid.state,
        valid.questionCount,
        now.toISOString(),
      );
    return Number(result.lastInsertRowid);
  }

  /**
   * Stores one practice answer and reports whether it was correct.
   * @param sessionId - Open session.
   * @param input - The answer; validated here.
   * @param now - Time of the answer.
   * @returns Whether the chosen option is the official answer.
   */
  public recordAnswer(
    sessionId: number,
    input: unknown,
    now: Date = new Date(),
  ): boolean {
    this.requireOpenSession(sessionId);
    return this.insertAnswer(sessionId, parse(answerInputSchema, input), now);
  }

  /**
   * Closes a session; mock exams submit all their answers here.
   * @param id - Open session.
   * @param input - Answers to store with it (validated here) and time spent.
   * @param now - Time of closing.
   * @returns The finished session's summary.
   */
  public finishSession(
    id: number,
    input: FinishInput = {},
    now: Date = new Date(),
  ): SessionSummary {
    this.requireOpenSession(id);
    const answers = parse(zod.array(answerInputSchema), input.answers ?? []);
    this.transaction(() => {
      for (const answer of answers) {
        this.insertAnswer(id, answer, now);
      }
      this.db
        .prepare(SQL.finishSession)
        .run(now.toISOString(), roundOrNull(input.durationMs), id);
    });
    const summary = this.sessions().find((session) => session.id === id);
    if (summary === undefined) {
      throw new Error(`session ${id} vanished after finishing`);
    }
    return summary;
  }

  /**
   * Abandons a session: deleted when empty, otherwise closed as is.
   * @param id - Session to abandon.
   * @param now - Time of abandoning.
   */
  public discardSession(id: number, now: Date = new Date()): void {
    this.transaction(() => {
      const { count } = zod.parse(
        countRowSchema,
        this.db.prepare(SQL.countAnswers).get(id),
      );
      if (count === 0) {
        this.db.prepare(SQL.deleteOpenSession).run(id);
        return;
      }
      const stamp = now.toISOString();
      this.db.prepare(SQL.closeOpenSession).run(stamp, stamp, id);
    });
  }

  public sessions(): SessionSummary[] {
    return zod.parse(
      zod.array(sessionSummarySchema),
      this.db.prepare(SQL.sessions).all(),
    );
  }

  public stats(): Record<string, QuestionStat> {
    const rows = zod.parse(
      zod.array(statRowSchema),
      this.db.prepare(SQL.stats).all(),
    );
    return Object.fromEntries(rows.map(({ id, ...stat }) => [id, stat]));
  }

  public summary(): Summary {
    return {
      settings: this.getSettings(),
      sessions: this.sessions(),
      stats: this.stats(),
    };
  }

  /**
   * Everything, for `make export`.
   * @returns Settings, sessions and answers.
   */
  public dump(): Record<string, unknown> {
    return {
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      sessions: this.db.prepare(SQL.allSessions).all(),
      answers: this.db.prepare(SQL.allAnswers).all(),
    };
  }

  public backup(file: string): void {
    mkdirSync(path.dirname(file), { recursive: true });
    this.db.prepare(SQL.backup).run(file);
  }

  private migrate(): void {
    const { user_version: version } = zod.parse(
      versionRowSchema,
      this.db.prepare(SQL.userVersion).get(),
    );
    for (const [index, sql] of MIGRATIONS.entries()) {
      if (index >= version) {
        this.transaction(() => {
          this.db.exec(sql);
          this.db.exec(`PRAGMA user_version = ${index + 1}`);
        });
      }
    }
  }

  private transaction(work: () => void): void {
    this.db.exec("BEGIN");
    try {
      work();
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  private requireOpenSession(id: number): void {
    const row = this.db.prepare(SQL.sessionState).get(id);
    if (row === undefined) {
      throw new ValidationError("unknown session");
    }
    if (zod.parse(openRowSchema, row).finished_at !== null) {
      throw new ValidationError("session already finished");
    }
  }

  private insertAnswer(
    sessionId: number,
    input: AnswerInput,
    now: Date,
  ): boolean {
    const correct = judge(input);
    this.db
      .prepare(SQL.insertAnswer)
      .run(
        sessionId,
        input.questionId,
        input.position,
        input.chosen,
        correct ? 1 : 0,
        input.retry === true ? 1 : 0,
        roundOrNull(input.timeMs),
        now.toISOString(),
      );
    return correct;
  }
}

export { DEFAULT_DB_PATH, ProgressStore };
export type { FinishInput };
