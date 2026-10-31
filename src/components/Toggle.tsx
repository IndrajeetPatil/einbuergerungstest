import { useId } from "react";
import type { ReactElement } from "react";

/**
 * A checkbox with a visible label and a hint linked as its description.
 * @param props - State, label, hint and change handler.
 * @returns The checkbox row.
 */
function Toggle(
  props: Readonly<{
    checked: boolean;
    label: string;
    hint: string;
    onChange: (value: boolean) => void;
  }>,
): ReactElement {
  const { checked, label, hint, onChange } = props;
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        aria-describedby={`${id}-hint`}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
        className="mt-1.5 size-4 accent-[var(--color-accent)]"
      />
      <div>
        <label
          htmlFor={id}
          className="cursor-pointer font-semibold"
        >
          {label}
        </label>
        <p
          id={`${id}-hint`}
          className="text-sm text-muted"
        >
          {hint}
        </p>
      </div>
    </div>
  );
}

export { Toggle };
