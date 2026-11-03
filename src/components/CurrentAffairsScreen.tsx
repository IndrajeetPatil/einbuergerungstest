import type { ReactElement } from "react";

import { CHECKED, currentAffairs } from "#lib/currentAffairs.ts";
import { parseLocalDate } from "#lib/dates.ts";
import { englishDate, germanDate } from "#lib/format.ts";

import { CurrentAffairEntry } from "./CurrentAffairEntry.tsx";
import type { ScreenProps } from "./screenProps.ts";

const affairs = currentAffairs();
const checked = parseLocalDate(CHECKED);

/**
 * Questions whose answer depends on when the test is taken, with the latest
 * facts and the day they were checked.
 * @param props - Trainer and summary.
 * @returns The current affairs view.
 */
function CurrentAffairsScreen(props: Readonly<ScreenProps>): ReactElement {
  const { showEnglish } = props.summary.settings;
  return (
    <main className="mx-auto max-w-5xl px-5 pt-10 pb-24 md:px-8">
      <h1 className="text-title">Aktuelles</h1>
      <p className="mt-3 max-w-prose text-lg text-muted">
        The {affairs.length} questions whose answer depends on when you take the
        test: who holds office, who sits in the Bundestag, how many people live
        in Germany. Each shows the official answer beside the latest facts and
        their sources.
      </p>
      <p className="mt-4 text-sm">
        <span className="font-semibold">
          Zuletzt geprüft am{" "}
          <time dateTime={CHECKED}>{germanDate.format(checked)}</time>
        </span>
        <span className="text-muted">
          {" "}
          · Last checked on {englishDate.format(checked)}
        </span>
      </p>
      <ol className="mt-6 divide-y divide-line border-t border-line">
        {affairs.map((affair) => (
          <CurrentAffairEntry
            key={affair.question.id}
            affair={affair}
            showEnglish={showEnglish}
          />
        ))}
      </ol>
    </main>
  );
}

export { CurrentAffairsScreen };
