// Starting a mock exam or practice session in the progress store.
import { useCallback, useRef } from "react";

import { api } from "./api.ts";
import { describeError } from "./describeError.ts";
import type {
  ActiveSession,
  Focus,
  Question,
  StateCode,
  Summary,
} from "./schemas.ts";
import { createSession } from "./session.ts";

interface StartRequest {
  mode: "exam" | "practice";
  focus: Focus | null;
  pick: (state: StateCode, stats: Summary["stats"]) => Question[];
}

async function startSession(
  summary: Summary,
  request: StartRequest,
): Promise<ActiveSession | null> {
  const { state, shuffleOptions } = summary.settings;
  const picked = state === null ? [] : request.pick(state, summary.stats);
  if (state === null || picked.length === 0) {
    return null;
  }
  const { id } = await api.startSession({
    mode: request.mode,
    focus: request.focus,
    state,
    questionCount: picked.length,
  });
  return createSession({
    id,
    mode: request.mode,
    focus: request.focus,
    state,
    questions: picked,
    shuffleOptions,
  });
}

interface StarterOptions {
  summary: Summary | null;
  onStarted: (session: ActiveSession) => void;
  onError: (message: string) => void;
}

async function launch(
  summary: Summary | null,
  request: StartRequest,
): Promise<ActiveSession | null> {
  if (summary === null) {
    return null;
  }
  return startSession(summary, request);
}

/**
 * Starts sessions one at a time: a second click or Enter while the first
 * request is in flight does not open a second session.
 * @param options - Summary, success and error callbacks.
 * @returns The start action.
 */
function useStarter(
  options: StarterOptions,
): (request: StartRequest) => Promise<void> {
  const { summary, onStarted, onError } = options;
  const starting = useRef(false);
  return useCallback(
    async (request: StartRequest): Promise<void> => {
      if (starting.current) {
        return;
      }
      starting.current = true;
      try {
        const session = await launch(summary, request);
        if (session !== null) {
          onStarted(session);
        }
      } catch (error) {
        onError(`Could not start a session: ${describeError(error)}`);
      }
      starting.current = false;
    },
    [onError, onStarted, summary],
  );
}

export { useStarter };
export type { StartRequest };
