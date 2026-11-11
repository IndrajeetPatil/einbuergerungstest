import { useMemo } from "react";
import type { ReactElement } from "react";

import { useBackup } from "#lib/useBackup.ts";

import type { DashboardActions } from "./dashboardActions.ts";
import { DashboardIntro } from "./DashboardIntro.tsx";
import { DashboardOverview } from "./DashboardOverview.tsx";
import type { ScreenProps } from "./screenProps.ts";
import { SourcesFooter } from "./SourcesFooter.tsx";
import { StatePrompt } from "./StatePrompt.tsx";

/**
 * The overview: start a session, see progress, adjust settings.
 * @param props - Trainer and summary.
 * @returns The dashboard.
 */
function DashboardScreen(props: Readonly<ScreenProps>): ReactElement {
  const { trainer, summary } = props;
  const { state, examDate } = summary.settings;
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
    <main className="mx-auto max-w-5xl px-5 pb-24 md:px-8">
      <DashboardIntro examDate={examDate} />
      {state === null ? (
        <StatePrompt
          onChange={(code) => {
            actions.handleSettings({ state: code });
          }}
        />
      ) : (
        <DashboardOverview
          summary={summary}
          state={state}
          hasActive={trainer.active !== null}
          actions={actions}
        />
      )}
      <SourcesFooter />
    </main>
  );
}

export { DashboardScreen };
