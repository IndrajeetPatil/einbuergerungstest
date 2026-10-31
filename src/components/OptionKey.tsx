import type { ReactElement } from "react";

import type { OptionState } from "#lib/optionState.ts";

import { Icon } from "./Icon.tsx";

const KEY_TONE: Readonly<Record<OptionState, string>> = {
  idle: "border-line text-muted",
  chosen: "border-accent bg-accent text-surface",
  correct: "border-accent bg-accent text-surface",
  wrong: "border-rust bg-rust text-surface",
  dim: "border-line text-muted",
};

const MARK: Readonly<Partial<Record<OptionState, "check" | "cross">>> = {
  correct: "check",
  wrong: "cross",
};

/**
 * The letter key of an option, or a tick or cross once revealed.
 * @param props - Option state and its key letter.
 * @returns The key box.
 */
function OptionKey(
  props: Readonly<{ state: OptionState; keyLabel: string }>,
): ReactElement {
  const mark = MARK[props.state];
  return (
    <span
      className={`mt-0.5 inline-flex size-7 items-center justify-center rounded-sm border text-xs font-semibold tabular-nums peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${KEY_TONE[props.state]}`}
      aria-hidden="true"
    >
      {mark === undefined ? props.keyLabel : <Icon name={mark} />}
    </span>
  );
}

export { OptionKey };
