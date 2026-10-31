// Maintenance chores for the progress database.
// Usage: node server/cli.ts <backup|export|stats|reset> [--yes]
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import { DEFAULT_DB_PATH, ProgressStore } from "./db.ts";

const RECENT_EXAMS = 10;
const STAMP_END = 16;
const JSON_INDENT = 2;
const DATA = path.join(import.meta.dirname, "..", "data");
const stamp = new Date()
  .toISOString()
  .replaceAll(":", "")
  .replace(/\..+$/u, "");

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { yes: { type: "boolean", default: false } },
});

function withStore(work: (store: ProgressStore) => void): void {
  const store = new ProgressStore();
  try {
    work(store);
  } finally {
    store.close();
  }
}

function backup(): void {
  const target = path.join(DATA, "backups", `progress-${stamp}.sqlite`);
  withStore((store) => {
    store.backup(target);
  });
  console.log(`Backed up to ${target}`);
}

function exportJson(): void {
  const target = path.join(DATA, "exports", `progress-${stamp}.json`);
  mkdirSync(path.dirname(target), { recursive: true });
  withStore((store) => {
    writeFileSync(
      target,
      `${JSON.stringify(store.dump(), null, JSON_INDENT)}\n`,
    );
  });
  console.log(`Exported to ${target}`);
}

function stats(): void {
  withStore((store) => {
    const { sessions, stats: perQuestion } = store.summary();
    const exams = sessions.filter((session) => session.mode === "exam");
    console.log(`Sessions: ${sessions.length} (${exams.length} mock exams)`);
    for (const exam of exams.slice(-RECENT_EXAMS)) {
      const when = exam.startedAt.slice(0, STAMP_END).replace("T", " ");
      console.log(`  ${when}  ${exam.correct}/${exam.questionCount}`);
    }
    console.log(`Questions seen: ${Object.keys(perQuestion).length}`);
  });
}

function reset(): void {
  if (!values.yes) {
    console.error(
      "This deletes all recorded progress. Re-run with --yes (make reset-progress CONFIRM=yes).",
    );
    process.exitCode = 1;
    return;
  }
  if (existsSync(DEFAULT_DB_PATH)) {
    withStore((store) => {
      store.backup(
        path.join(DATA, "backups", `progress-before-reset-${stamp}.sqlite`),
      );
    });
  }
  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(DEFAULT_DB_PATH + suffix, { force: true });
  }
  console.log("Progress reset (a backup was kept in data/backups/).");
}

const COMMANDS: Readonly<Record<string, () => void>> = {
  backup,
  export: exportJson,
  stats,
  reset,
};

const command = COMMANDS[positionals[0] ?? ""];
if (command === undefined) {
  console.error(
    "Usage: node server/cli.ts <backup|export|stats|reset> [--yes]",
  );
  process.exitCode = 1;
} else {
  command();
}
