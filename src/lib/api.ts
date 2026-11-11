// The progress API the app talks to. Every call reads or changes the progress
// document in this browser's IndexedDB.
import { fromBackup, replaceProgress, toBackup } from "./backup.ts";
import {
  EMPTY_PROGRESS,
  discardSession,
  finishSession,
  recordAnswer,
  startSession,
  updateSettings,
} from "./progress.ts";
import { changeProgress, readProgress } from "./progressDb.ts";
import { summary } from "./progressViews.ts";
import type {
  AnswerInput,
  Backup,
  Progress,
  SessionSummary,
  Settings,
  SettingsPatch,
  StartSessionInput,
  Summary,
} from "./schemas.ts";

/**
 * Replaces the progress document in one transaction.
 * @param change - Pure transformation of the current document.
 */
async function rewrite(
  change: (progress: Progress) => Progress,
): Promise<void> {
  await changeProgress((progress) => ({
    progress: change(progress),
    result: null,
  }));
}

const api = {
  summary: async (): Promise<Summary> => readProgress(summary),
  updateSettings: async (patch: SettingsPatch): Promise<Settings> =>
    changeProgress((progress) => updateSettings(progress, patch)),
  startSession: async (input: StartSessionInput): Promise<{ id: number }> => {
    const id = await changeProgress((progress) =>
      startSession(progress, input),
    );
    return { id };
  },
  answer: async (
    id: number,
    input: AnswerInput,
  ): Promise<{ correct: boolean }> => {
    const correct = await changeProgress((progress) =>
      recordAnswer(progress, { sessionId: id, input }),
    );
    return { correct };
  },
  finish: async (
    id: number,
    answers: AnswerInput[],
    durationMs: number,
  ): Promise<SessionSummary> =>
    changeProgress((progress) =>
      finishSession(progress, {
        sessionId: id,
        input: { answers, durationMs },
      }),
    ),
  discard: async (id: number): Promise<void> =>
    rewrite((progress) => discardSession(progress, id)),
  exportBackup: async (): Promise<Backup> =>
    readProgress((progress) => toBackup(progress)),
  // Replaces all progress with a backup's, validated before anything is
  // written.
  importBackup: async (value: unknown): Promise<void> => {
    const imported = fromBackup(value);
    await rewrite((progress) => replaceProgress(progress, imported));
  },
  // Deletes every session and answer, keeping the settings.
  resetProgress: async (): Promise<void> =>
    rewrite((progress) =>
      replaceProgress(progress, {
        ...EMPTY_PROGRESS,
        settings: progress.settings,
      }),
    ),
};

export { api };
