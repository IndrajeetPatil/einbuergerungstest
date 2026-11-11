// Exporting, importing and resetting the progress kept in this browser.
import { useCallback, useState } from "react";

import { api } from "./api.ts";
import { describeError } from "./describeError.ts";

interface BackupActions {
  /** What the last action did, for a status line. */
  status: string | null;
  handleExport: () => void;
  handleImport: (file: File) => void;
  handleReset: () => void;
}

/** Indentation of the exported JSON, so the file is readable. */
const INDENT = 2;

interface Options {
  /** Called once progress was replaced, so the app can reload it. */
  onReplaced: () => void;
  onError: (message: string) => void;
}

function download(name: string, text: string): void {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

async function readJson(file: File): Promise<unknown> {
  try {
    const value: unknown = JSON.parse(await file.text());
    return value;
  } catch {
    throw new Error(`${file.name} is not a JSON backup file`);
  }
}

/**
 * Backup and reset actions for the dashboard.
 * @param options - What to do after progress was replaced, and on errors.
 * @returns The actions and their status line.
 */
function useBackup(options: Options): BackupActions {
  const { onReplaced, onError } = options;
  const [status, setStatus] = useState<string | null>(null);
  const run = useCallback(
    (action: () => Promise<string>, failure: string) => {
      void (async (): Promise<void> => {
        try {
          setStatus(await action());
        } catch (error) {
          setStatus(null);
          onError(`${failure}: ${describeError(error)}`);
        }
      })();
    },
    [onError],
  );
  return {
    status,
    handleExport: () => {
      run(async () => {
        const backup = await api.exportBackup();
        const day = backup.exportedAt.slice(0, "YYYY-MM-DD".length);
        download(
          `einbuergerungstest-${day}.json`,
          JSON.stringify(backup, null, INDENT),
        );
        return `Exported ${backup.progress.sessions.length} sessions.`;
      }, "Could not export your progress");
    },
    handleImport: (file) => {
      run(async () => {
        await api.importBackup(await readJson(file));
        onReplaced();
        return `Imported ${file.name}.`;
      }, "Could not import the backup");
    },
    handleReset: () => {
      run(async () => {
        await api.resetProgress();
        onReplaced();
        return "All sessions and answers were deleted.";
      }, "Could not reset your progress");
    },
  };
}

export { useBackup };
export type { BackupActions };
