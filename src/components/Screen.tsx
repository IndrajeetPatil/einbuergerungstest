import type { ComponentType, ReactElement } from "react";

import type { Trainer } from "#lib/useTrainer.ts";
import type { View } from "#lib/useView.ts";

import { CatalogueScreen } from "./CatalogueScreen.tsx";
import { DashboardScreen } from "./DashboardScreen.tsx";
import { ResultsScreen } from "./ResultsScreen.tsx";
import type { ScreenProps } from "./screenProps.ts";
import { SessionScreen } from "./SessionScreen.tsx";

const SCREENS: Readonly<
  Record<View["name"], ComponentType<Readonly<ScreenProps>>>
> = {
  dashboard: DashboardScreen,
  catalogue: CatalogueScreen,
  session: SessionScreen,
  results: ResultsScreen,
};

/**
 * The screen for the current view, once progress has loaded.
 * @param props - The trainer.
 * @returns The screen, or a loading note.
 */
function Screen(props: Readonly<{ trainer: Trainer }>): ReactElement {
  const { trainer } = props;
  if (trainer.summary === null) {
    return (
      <p className="mx-auto max-w-5xl px-5 pt-16 text-muted md:px-8">
        Loading…
      </p>
    );
  }
  const Current = SCREENS[trainer.view.name];
  return (
    <Current
      trainer={trainer}
      summary={trainer.summary}
    />
  );
}

export { Screen };
