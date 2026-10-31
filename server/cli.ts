/**
 * Maintenance chores for the local progress database.
 * Usage: node server/cli.ts <backup|export|stats|reset> [--yes]
 */
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { DEFAULT_DB_PATH, ProgressStore } from "./db.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { yes: { type: "boolean", default: false } },
});
const command = positionals[0];
const DATA = join(import.meta.dirname, "..", "data");
const stamp = new Date().toISOString().replaceAll(":", "").replace(/\..+$/, "");

switch (command) {
  case "backup": {
    const store = new ProgressStore();
    const target = join(DATA, "backups", `progress-${stamp}.sqlite`);
    store.backup(target);
    store.close();
    console.log(`Backed up to ${target}`);
    break;
  }
  case "export": {
    const store = new ProgressStore();
    const target = join(DATA, "exports", `progress-${stamp}.json`);
    mkdirSync(join(DATA, "exports"), { recursive: true });
    writeFileSync(target, JSON.stringify(store.dump(), null, 2) + "\n");
    store.close();
    console.log(`Exported to ${target}`);
    break;
  }
  case "stats": {
    const store = new ProgressStore();
    const { sessions, stats } = store.summary();
    const exams = sessions.filter((s) => s.mode === "exam");
    const seen = Object.keys(stats).length;
    console.log(`Sessions: ${sessions.length} (${exams.length} exam simulations)`);
    for (const s of exams.slice(-10)) {
      console.log(
        `  ${s.startedAt.slice(0, 16).replace("T", " ")}  ${s.correct}/${s.questionCount}`,
      );
    }
    console.log(`Questions seen: ${seen}`);
    store.close();
    break;
  }
  case "reset": {
    if (!values.yes) {
      console.error(
        "This deletes all recorded progress. Re-run with --yes (make reset-progress CONFIRM=yes).",
      );
      process.exit(1);
    }
    if (existsSync(DEFAULT_DB_PATH)) {
      const store = new ProgressStore();
      store.backup(join(DATA, "backups", `progress-before-reset-${stamp}.sqlite`));
      store.close();
    }
    for (const suffix of ["", "-wal", "-shm"]) rmSync(DEFAULT_DB_PATH + suffix, { force: true });
    console.log("Progress reset (a backup was kept in data/backups/).");
    break;
  }
  default:
    console.error("Usage: node server/cli.ts <backup|export|stats|reset> [--yes]");
    process.exit(1);
}
