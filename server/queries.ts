// SQL statements of the progress store and schemas for the rows they return.
import { z as zod } from "zod/mini";

import { questionStatSchema } from "#lib/schemas.ts";

const versionRowSchema = zod.object({ user_version: zod.int() });
const countRowSchema = zod.object({ count: zod.int() });
const openRowSchema = zod.object({ finished_at: zod.nullable(zod.string()) });
const settingRowSchema = zod.object({ key: zod.string(), value: zod.string() });
const statRowSchema = zod.extend(questionStatSchema, { id: zod.string() });

const SQL = {
  settings: "SELECT key, value FROM settings",
  upsertSetting: `
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
  startSession: `
    INSERT INTO sessions (mode, focus, state, question_count, started_at)
    VALUES (?, ?, ?, ?, ?)`,
  sessionState: "SELECT finished_at FROM sessions WHERE id = ?",
  finishSession:
    "UPDATE sessions SET finished_at = ?, duration_ms = ? WHERE id = ?",
  countAnswers: "SELECT COUNT(*) AS count FROM answers WHERE session_id = ?",
  deleteOpenSession:
    "DELETE FROM sessions WHERE id = ? AND finished_at IS NULL",
  closeOpenSession: `
    UPDATE sessions SET finished_at = ?,
      duration_ms = CAST((julianday(?) - julianday(started_at)) * 86400000 AS INTEGER)
    WHERE id = ? AND finished_at IS NULL`,
  insertAnswer: `
    INSERT INTO answers
      (session_id, question_id, position, chosen, correct, retry, time_ms, answered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  sessions: `
    SELECT s.id, s.mode, s.focus, s.state, s.question_count AS questionCount,
           s.started_at AS startedAt, s.finished_at AS finishedAt,
           s.duration_ms AS durationMs,
           COUNT(a.id) FILTER (WHERE a.retry = 0 AND a.chosen IS NOT NULL) AS answered,
           COALESCE(SUM(a.correct) FILTER (WHERE a.retry = 0), 0) AS correct
    FROM sessions s LEFT JOIN answers a ON a.session_id = s.id
    WHERE s.finished_at IS NOT NULL
    GROUP BY s.id
    ORDER BY s.started_at`,
  // The last five results per question, newest first, as a string of 0s and 1s.
  stats: `
    WITH ranked AS (
      SELECT question_id, correct, answered_at,
             ROW_NUMBER() OVER (
               PARTITION BY question_id ORDER BY answered_at DESC, id DESC
             ) AS rn
      FROM answers
    )
    SELECT question_id AS id, COUNT(*) AS attempts, SUM(correct) AS correct,
           MAX(answered_at) AS lastAt,
           GROUP_CONCAT(CASE WHEN rn <= 5 THEN correct END, '' ORDER BY rn) AS recent
    FROM ranked
    GROUP BY question_id`,
  allSessions: "SELECT * FROM sessions ORDER BY id",
  allAnswers: "SELECT * FROM answers ORDER BY id",
  userVersion: "PRAGMA user_version",
  backup: "VACUUM INTO ?",
} as const;

export {
  SQL,
  countRowSchema,
  openRowSchema,
  settingRowSchema,
  statRowSchema,
  versionRowSchema,
};
