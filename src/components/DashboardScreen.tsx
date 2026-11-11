import { useMemo } from "react";
import type { ReactElement } from "react";

import { useBackup } from "#lib/useBackup.ts";

import { Dashboard } from "./Dashboard.tsx";
import type { DashboardActions } from "./dashboardActions.ts";
import type { ScreenProps } from "./screenProps.ts";

/**
 * The dashboard wired to the trainer.
 * @param props - Trainer and summary.
 * @returns The dashboard.
 */
function DashboardScreen(props: Readonly<ScreenProps>): ReactElement {
  const { trainer, summary } = props;
  const backup = useBackup({
    onReplaced: trainer.handleProgressReplaced,
    onError: trainer.handleError,
  });
  const actions = useMemo<DashboardActions>(
    () => ({
      handleResume: () => {
        trainer.setView({ name: "session" });
      },
      handleDiscard: trainer.handleDiscard,
      handleStartExam: trainer.handleStartExam,
      handleStartPractice: trainer.handleStartPractice,
      handlePractiseSelected: (ids) => {
        trainer.handleStartPractice("selected", ids.length, ids);
      },
      handleSettings: trainer.handleSettings,
      backup,
    }),
    [trainer, backup],
  );
  return (
    <Dashboard
      summary={summary}
      hasActive={trainer.active !== null}
      actions={actions}
    />
  );
}

export { DashboardScreen };
