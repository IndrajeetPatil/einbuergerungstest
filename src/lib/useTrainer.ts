// Application state and every action the views can trigger, composed from
// the summary, view and session hooks.
import { useCallback, useRef, useState } from "react";

import { api } from "./api.ts";
import { questions } from "./catalogue.ts";
import { describeError } from "./describeError.ts";
import { drawExam, practiceQuestions } from "./quiz.ts";
import type {
  ActiveSession,
  Focus,
  SessionSummary,
  SettingsPatch,
  Summary,
} from "./schemas.ts";
import { load, save } from "./session.ts";
import { useStarter } from "./useStarter.ts";
import { useSummary } from "./useSummary.ts";
import { useView } from "./useView.ts";
import type { View } from "./useView.ts";

interface Trainer {
  summary: Summary | null;
  active: ActiveSession | null;
  view: View;
  error: string | null;
  setView: (view: View) => void;
  handleSessionChange: (session: ActiveSession | null) => void;
  latestSession: () => ActiveSession | null;
  handleDismissError: () => void;
  handleError: (message: string) => void;
  handleSettings: (patch: SettingsPatch) => void;
  handleToggleEnglish: () => void;
  handleStartExam: () => void;
  handleStartPractice: (focus: Focus, size: number, ids?: string[]) => void;
  handleDiscard: () => void;
  handleFinished: (summary: SessionSummary, session: ActiveSession) => void;
}

interface PersistedSession {
  active: ActiveSession | null;
  persist: (session: ActiveSession | null) => void;
  /** The last persisted session, current even before React re-renders. */
  latest: () => ActiveSession | null;
}

function usePersistedSession(): PersistedSession {
  const [active, setActive] = useState<ActiveSession | null>(load);
  const current = useRef(active);
  const persist = useCallback((session: ActiveSession | null) => {
    current.current = session;
    save(session);
    setActive(session);
  }, []);
  const latest = useCallback(() => current.current, []);
  return { active, persist, latest };
}

/**
 * All application state and actions.
 * @returns The trainer controller.
 */
function useTrainer(): Trainer {
  const {
    summary,
    error: errorText,
    setError,
    refresh,
    updateSettings,
  } = useSummary();
  const [view, setView] = useView();
  const {
    active,
    persist: persistActive,
    latest: latestActive,
  } = usePersistedSession();
  const settings = summary?.settings;

  const start = useStarter({
    summary,
    onStarted: (session) => {
      persistActive(session);
      setView({ name: "session" });
    },
    onError: setError,
  });

  const discard = useCallback(async (): Promise<void> => {
    if (active === null) {
      return;
    }
    persistActive(null);
    setView({ name: "dashboard" });
    try {
      await api.discard(active.id);
    } catch (error) {
      setError(`Could not discard the session: ${describeError(error)}`);
    }
    await refresh();
  }, [active, persistActive, refresh, setError, setView]);

  return {
    summary,
    active,
    view,
    error: errorText,
    setView,
    handleSessionChange: persistActive,
    latestSession: latestActive,
    handleDismissError: () => {
      setError(null);
    },
    handleError: setError,
    handleSettings: updateSettings,
    handleToggleEnglish: () => {
      updateSettings({ showEnglish: settings?.showEnglish !== true });
    },
    handleStartExam: () => {
      void start({
        mode: "exam",
        focus: null,
        pick: (state) => drawExam(questions, state),
      });
    },
    handleStartPractice: (focus, size, ids = []) => {
      void start({
        mode: "practice",
        focus,
        pick: (state, stats) =>
          practiceQuestions({
            questions,
            state,
            focus,
            stats,
            size,
            selected: ids,
          }),
      });
    },
    handleDiscard: () => {
      void discard();
    },
    handleFinished: (result, session) => {
      persistActive(null);
      setView({ name: "results", summary: result, session });
      void refresh();
    },
  };
}

export { useTrainer };
export type { Trainer };
