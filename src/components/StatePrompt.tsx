import type { ReactElement } from "react";

import type { StateCode } from "#lib/schemas.ts";

import { StateSelect } from "./StateSelect.tsx";

/**
 * First-run prompt for the federal state.
 * @param props - Change handler.
 * @returns The prompt section.
 */
function StatePrompt(
  props: Readonly<{ onChange: (code: StateCode) => void }>,
): ReactElement {
  const { onChange } = props;
  return (
    <section className="mt-10 rounded-md border border-accent/40 bg-surface p-5">
      <h2 className="text-xl">Wo wohnen Sie? · Where do you live?</h2>
      <p className="mt-1 text-muted">
        Three questions in the test are about the federal state of your main
        residence.
      </p>
      <StateSelect
        value={null}
        onChange={onChange}
      />
    </section>
  );
}

export { StatePrompt };
