import type { ReactElement } from "react";

import type { StateCode, Summary } from "#lib/schemas.ts";

import { CoverageSection } from "./CoverageSection.tsx";
import type { DashboardActions } from "./dashboardActions.ts";
import { ProgressSection } from "./ProgressSection.tsx";
import { SessionHistory } from "./SessionHistory.tsx";
import { SettingsSection } from "./SettingsSection.tsx";
import { StartSection } from "./StartSection.tsx";
import { WeakSpots } from "./WeakSpots.tsx";

/**
 * Everything below the intro once a Bundesland is chosen.
 * @param props - Summary, state, active-session flag and actions.
 * @returns The dashboard sections.
 */
function DashboardOverview(
  props: Readonly<{
    summary: Summary;
    state: StateCode;
    hasActive: boolean;
    actions: DashboardActions;
  }>,
): ReactElement {
  const { summary, state, hasActive, actions } = props;
  const { settings, sessions, stats } = summary;
  return (
    <>
      <StartSection
        state={state}
        stats={stats}
        hasActive={hasActive}
        actions={actions}
      />
      <ProgressSection
        sessions={sessions}
        examDate={settings.examDate}
      />
      <CoverageSection
        state={state}
        stats={stats}
      />
      <WeakSpots
        state={state}
        stats={stats}
        disabled={hasActive}
        onPractise={actions.handlePractiseSelected}
      />
      {sessions.length > 0 ? <SessionHistory sessions={sessions} /> : null}
      <SettingsSection
        settings={settings}
        onChange={actions.handleSettings}
      />
    </>
  );
}

export { DashboardOverview };
