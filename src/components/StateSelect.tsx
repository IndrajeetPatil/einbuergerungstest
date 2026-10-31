import type { ReactElement } from "react";

import { catalogue } from "#lib/catalogue.ts";
import { stateCodeSchema } from "#lib/schemas.ts";
import type { StateCode } from "#lib/schemas.ts";

/**
 * Picker for the federal state of main residence.
 * @param props - Current state and change handler.
 * @returns The select element.
 */
function StateSelect(
  props: Readonly<{
    id?: string;
    value: StateCode | null;
    onChange: (code: StateCode) => void;
  }>,
): ReactElement {
  const { value, onChange } = props;
  return (
    <select
      id={props.id}
      aria-label="Bundesland"
      className="select mt-1 w-full"
      value={value ?? ""}
      onChange={(event) => {
        const code = stateCodeSchema.safeParse(event.target.value);
        if (code.success) {
          onChange(code.data);
        }
      }}
    >
      {value === null ? (
        <option
          value=""
          disabled
        >
          Bundesland wählen · Choose your state
        </option>
      ) : null}
      {catalogue.states.map((state) => (
        <option
          key={state.code}
          value={state.code}
        >
          {state.de === state.en ? state.de : `${state.de} (${state.en})`}
        </option>
      ))}
    </select>
  );
}

export { StateSelect };
