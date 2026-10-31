import type { ReactElement } from "react";

interface Choice<Value extends string | number> {
  value: Value;
  label: string;
}

const STYLES = {
  chip: {
    base: "inline-flex min-h-9 cursor-pointer items-center rounded-sm border px-3 text-sm transition-colors",
    on: "border-accent bg-accent text-surface",
    off: "border-line hover:border-accent",
  },
  square: {
    base: "inline-flex size-9 cursor-pointer items-center justify-center rounded-sm border text-sm tabular-nums",
    on: "border-accent font-semibold text-accent",
    off: "border-line",
  },
} as const;

const FOCUS_RING =
  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent";

/**
 * A radio group drawn as chips.
 * @param props - Name, legend, choices, value, shape and change handler.
 * @returns The fieldset.
 */
function ChoiceChips<Value extends string | number>(
  props: Readonly<{
    name: string;
    legend: string;
    choices: readonly Choice<Value>[];
    value: Value;
    shape: keyof typeof STYLES;
    onChange: (value: Value) => void;
  }>,
): ReactElement {
  const { name, legend, choices, value, shape, onChange } = props;
  const style = STYLES[shape];
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{legend}</legend>
      {choices.map((choice) => (
        <label
          key={choice.value}
          className={`${style.base} ${FOCUS_RING} ${choice.value === value ? style.on : style.off}`}
        >
          <input
            type="radio"
            name={name}
            value={choice.value}
            checked={choice.value === value}
            onChange={() => {
              onChange(choice.value);
            }}
            className="sr-only"
          />
          {choice.label}
        </label>
      ))}
    </fieldset>
  );
}

export { ChoiceChips };
export type { Choice };
