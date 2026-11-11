// The progress summary (settings, sessions, statistics) and the error banner.
import { useCallback, useEffect, useState } from "react";

import { api } from "./api.ts";
import { describeError } from "./describeError.ts";
import type { SettingsPatch, Summary } from "./schemas.ts";
import { mergeSettings } from "./settings.ts";

interface SummaryState {
  summary: Summary | null;
  error: string | null;
  setError: (message: string | null) => void;
  refresh: () => Promise<void>;
  updateSettings: (patch: SettingsPatch) => void;
}

function withSettings(
  summary: Summary | null,
  patch: SettingsPatch,
): Summary | null {
  return summary === null
    ? null
    : { ...summary, settings: mergeSettings(summary.settings, patch) };
}

/**
 * Loads the summary once and keeps settings in sync with the store.
 * @returns Summary, error and actions.
 */
function useSummary(): SummaryState {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      setSummary(await api.summary());
    } catch (error) {
      setMessage(`Could not open your saved progress: ${describeError(error)}`);
    }
  }, []);
  useEffect(() => {
    // Load once on mount; state updates happen after the request resolves.
    void (async (): Promise<void> => {
      await refresh();
    })();
  }, [refresh]);
  const updateSettings = useCallback((patch: SettingsPatch) => {
    // Show the change at once; the store's reply confirms it.
    setSummary((current) => withSettings(current, patch));
    void (async (): Promise<void> => {
      try {
        const settings = await api.updateSettings(patch);
        setSummary((current) => withSettings(current, settings));
      } catch (error) {
        setMessage(`Could not save settings: ${describeError(error)}`);
      }
    })();
  }, []);
  return {
    summary,
    error: message,
    setError: setMessage,
    refresh,
    updateSettings,
  };
}

export { useSummary };
export type { SummaryState };
