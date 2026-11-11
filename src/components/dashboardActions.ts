import type { FocusChoice } from "#lib/practiceFoci.ts";
import type { SettingsPatch } from "#lib/schemas.ts";
import type { BackupActions } from "#lib/useBackup.ts";

/** Everything the dashboard can ask the app to do. */
interface DashboardActions {
  handleResume: () => void;
  handleDiscard: () => void;
  handleStartExam: () => void;
  handleStartPractice: (focus: FocusChoice["value"], size: number) => void;
  handlePractiseSelected: (ids: string[]) => void;
  handleSettings: (patch: SettingsPatch) => void;
  backup: BackupActions;
}

export type { DashboardActions };
