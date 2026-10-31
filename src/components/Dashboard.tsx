import type { ReactElement } from "react";

import type { Summary } from "#lib/schemas.ts";

import type { DashboardActions } from "./dashboardActions.ts";
import { DashboardIntro } from "./DashboardIntro.tsx";
import { DashboardOverview } from "./DashboardOverview.tsx";
import { SourcesFooter } from "./SourcesFooter.tsx";
import { StatePrompt } from "./StatePrompt.tsx";

/**
 * The overview: start a session, see progress, adjust settings.
 * @param props - Summary, active-session flag and actions.
 * @returns The dashboard.
 */
function Dashboard(
  props: Readonly<{
    summary: Summary;
    hasActive: boolean;
    actions: DashboardActions;
  }>,
): ReactElement {
  const { summary, hasActive, actions } = props;
  const { state } = summary.settings;
  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 md:px-8">
      <DashboardIntro examDate={summary.settings.examDate} />
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
          hasActive={hasActive}
          actions={actions}
        />
      )}
      <SourcesFooter />
    </main>
  );
}

export { Dashboard };
