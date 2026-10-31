import type { ReactElement } from "react";

import { questions } from "#lib/catalogue.ts";
import { focusCounts } from "#lib/practiceFoci.ts";
import type { QuestionStat, StateCode } from "#lib/schemas.ts";

import type { DashboardActions } from "./dashboardActions.ts";
import { ExamCard } from "./ExamCard.tsx";
import { PracticeCard } from "./PracticeCard.tsx";
import { ResumeBanner } from "./ResumeBanner.tsx";

/**
 * Resume banner and the mock-exam and practice cards.
 * @param props - State, statistics, active-session flag and actions.
 * @returns The start section.
 */
function StartSection(
  props: Readonly<{
    state: StateCode;
    stats: Readonly<Record<string, QuestionStat>>;
    hasActive: boolean;
    actions: DashboardActions;
  }>,
): ReactElement {
  const { state, stats, hasActive, actions } = props;
  return (
    <>
      {hasActive ? (
        <ResumeBanner
          onResume={actions.handleResume}
          onDiscard={actions.handleDiscard}
        />
      ) : null}
      <section
        className="mt-10 grid gap-5 md:grid-cols-2"
        aria-label="Start"
      >
        <ExamCard
          state={state}
          disabled={hasActive}
          onStart={actions.handleStartExam}
        />
        <PracticeCard
          counts={focusCounts(questions, state, stats)}
          disabled={hasActive}
          onStart={actions.handleStartPractice}
        />
      </section>
    </>
  );
}

export { StartSection };
