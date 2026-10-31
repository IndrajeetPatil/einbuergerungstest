// Schema migrations, applied in order; `PRAGMA user_version` records how many
// have run. Never edit an applied migration — append a new one.
const MIGRATIONS: readonly string[] = [
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

export { MIGRATIONS };
