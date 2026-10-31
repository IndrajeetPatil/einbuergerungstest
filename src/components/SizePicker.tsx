import type { ReactElement } from "react";

import { SIZES } from "#lib/practiceFoci.ts";

import { ChoiceChips } from "./ChoiceChips.tsx";
import type { Choice } from "./ChoiceChips.tsx";

const SIZE_CHOICES: readonly Choice<number>[] = SIZES.map((size) => ({
  value: size,
  label: String(size),
}));

/**
 * How many questions a practice session has.
 * @param props - Current size and change handler.
 * @returns The labelled chips.
 */
function SizePicker(
  props: Readonly<{ value: number; onChange: (size: number) => void }>,
): ReactElement {
  return (
    <div className="mt-4 flex items-center gap-3">
      <span className="text-sm text-muted">Questions</span>
      <ChoiceChips
        name="size"
        legend="Number of questions"
        choices={SIZE_CHOICES}
        value={props.value}
        shape="square"
        onChange={props.onChange}
      />
    </div>
  );
}

export { SizePicker };
