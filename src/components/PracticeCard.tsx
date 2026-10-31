import { useMemo, useState } from "react";
import type { ReactElement } from "react";

import { DEFAULT_SIZE, FOCI, focusChoice } from "#lib/practiceFoci.ts";
import type { FocusChoice } from "#lib/practiceFoci.ts";

import { ChoiceChips } from "./ChoiceChips.tsx";
import { SizePicker } from "./SizePicker.tsx";
import { StartPracticeButton } from "./StartPracticeButton.tsx";

type FocusValue = FocusChoice["value"];

function focusLabel(choice: FocusChoice, count: number): string {
  return choice.value === "smart" || choice.value === "all"
    ? choice.label
    : `${choice.label} ${count}`;
}

/**
 * Starts a practice session with a chosen focus and size.
 * @param props - Counts per focus, whether a session is active, and start.
 * @returns The card.
 */
function PracticeCard(
  props: Readonly<{
    counts: Readonly<Record<FocusValue, number>>;
    disabled: boolean;
    onStart: (focus: FocusValue, size: number) => void;
  }>,
): ReactElement {
  const { counts, disabled, onStart } = props;
  const [focus, setFocus] = useState<FocusValue>("smart");
  const [size, setSize] = useState<number>(DEFAULT_SIZE);
  const choice = focusChoice(focus);
  const empty = counts[focus] === 0;
  const blocked = disabled || empty;
  const focusChoices = useMemo(
    () =>
      FOCI.map((entry) => ({
        value: entry.value,
        label: focusLabel(entry, counts[entry.value]),
      })),
    [counts],
  );
  return (
    <div className="flex min-w-0 flex-col rounded-md border border-line bg-surface p-6">
      <h2 className="text-heading">Üben</h2>
      <p className="folio-mark mt-1 mb-4">Practice with explanations</p>
      <ChoiceChips
        name="focus"
        legend="Which questions"
        choices={focusChoices}
        value={focus}
        shape="chip"
        onChange={setFocus}
      />
      <p className="mt-3 text-sm text-muted">{choice.hint}</p>
      {choice.sized ? (
        <SizePicker
          value={size}
          onChange={setSize}
        />
      ) : null}
      <StartPracticeButton
        empty={empty}
        disabled={blocked}
        onStart={() => {
          onStart(focus, size);
        }}
      />
    </div>
  );
}

export { PracticeCard };
