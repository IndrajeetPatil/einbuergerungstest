import type { ReactElement } from "react";

import { DashboardScreen } from "./DashboardScreen.tsx";
import { ResultsView } from "./ResultsView.tsx";
import type { ScreenProps } from "./screenProps.ts";

/**
 * Results of the session just finished.
 * @param props - Trainer and summary.
 * @returns The results view.
 */
function ResultsScreen(props: Readonly<ScreenProps>): ReactElement {
  const { trainer, summary } = props;
  const { view } = trainer;
  if (view.name !== "results") {
    return (
      <DashboardScreen
        trainer={trainer}
        summary={summary}
      />
    );
  }
  return (
    <ResultsView
      summary={view.summary}
      session={view.session}
      settings={summary.settings}
      stats={summary.stats}
      onPracticeMistakes={(ids) => {
        trainer.handleStartPractice("selected", ids.length, ids);
      }}
      onExam={trainer.handleStartExam}
      onDone={() => {
        trainer.setView({ name: "dashboard" });
      }}
    />
  );
}

export { ResultsScreen };
