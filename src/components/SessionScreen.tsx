import type { ReactElement } from "react";

import { DashboardScreen } from "./DashboardScreen.tsx";
import { QuizView } from "./QuizView.tsx";
import type { ScreenProps } from "./screenProps.ts";

/**
 * The session in progress, or the dashboard when there is none.
 * @param props - Trainer and summary.
 * @returns The quiz view.
 */
function SessionScreen(props: Readonly<ScreenProps>): ReactElement {
  const { trainer, summary } = props;
  if (trainer.active === null) {
    return (
      <DashboardScreen
        trainer={trainer}
        summary={summary}
      />
    );
  }
  return (
    <QuizView
      session={trainer.active}
      latest={trainer.latestSession}
      onChange={trainer.handleSessionChange}
      settings={summary.settings}
      stats={summary.stats}
      onToggleEnglish={trainer.handleToggleEnglish}
      onFinished={trainer.handleFinished}
      onExit={trainer.handleDiscard}
      onError={trainer.handleError}
    />
  );
}

export { SessionScreen };
