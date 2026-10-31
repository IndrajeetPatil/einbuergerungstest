import type { ReactElement } from "react";

import { CatalogueView } from "./CatalogueView.tsx";
import { DashboardScreen } from "./DashboardScreen.tsx";
import type { ScreenProps } from "./screenProps.ts";

/**
 * The catalogue, once a Bundesland is chosen.
 * @param props - Trainer and summary.
 * @returns The catalogue view.
 */
function CatalogueScreen(props: Readonly<ScreenProps>): ReactElement {
  const { trainer, summary } = props;
  const { settings } = summary;
  if (settings.state === null) {
    return (
      <DashboardScreen
        trainer={trainer}
        summary={summary}
      />
    );
  }
  return (
    <CatalogueView
      state={settings.state}
      settings={settings}
      stats={summary.stats}
    />
  );
}

export { CatalogueScreen };
