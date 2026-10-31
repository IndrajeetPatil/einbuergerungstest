// The current view, following the URL hash outside sessions.
import { useEffect, useState } from "react";

import type { ActiveSession, SessionSummary } from "./schemas.ts";

type View =
  | { name: "dashboard" }
  | { name: "catalogue" }
  | { name: "session" }
  | { name: "results"; summary: SessionSummary; session: ActiveSession };

function viewFromHash(): View {
  return globalThis.location.hash === "#katalog"
    ? { name: "catalogue" }
    : { name: "dashboard" };
}

/**
 * Tracks the view, switching between dashboard and catalogue on hash changes.
 * @returns The view and its setter.
 */
function useView(): [View, (view: View) => void] {
  const [view, setView] = useState<View>(viewFromHash);
  useEffect(() => {
    const onHash = (): void => {
      // A running session keeps the screen until it is paused.
      setView((current) =>
        current.name === "session" ? current : viewFromHash(),
      );
    };
    globalThis.addEventListener("hashchange", onHash);
    return () => {
      globalThis.removeEventListener("hashchange", onHash);
    };
  }, []);
  return [view, setView];
}

export { useView };
export type { View };
