import type { ReactElement } from "react";

import { ErrorBanner } from "#components/ErrorBanner.tsx";
import { Masthead } from "#components/Masthead.tsx";
import { Screen } from "#components/Screen.tsx";
import { useTrainer } from "#lib/useTrainer.ts";

/**
 * The application shell.
 * @returns Masthead, errors and the current screen.
 */
function App(): ReactElement {
  const trainer = useTrainer();
  const { view } = trainer;
  return (
    <div className="min-h-dvh">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-sm focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Masthead
        catalogue={view.name === "catalogue"}
        inSession={view.name === "session" && trainer.active !== null}
        examDate={trainer.summary?.settings.examDate ?? null}
        onPause={() => {
          trainer.setView({ name: "dashboard" });
        }}
      />
      {trainer.error === null ? null : (
        <ErrorBanner
          message={trainer.error}
          onDismiss={trainer.handleDismissError}
        />
      )}
      <div id="content">
        <Screen trainer={trainer} />
      </div>
    </div>
  );
}

export default App;
