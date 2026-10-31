import type { ReactElement } from "react";

/**
 * Starts practice, or explains why there is nothing to practise.
 * @param props - Whether the focus is empty, whether starting is blocked,
 * and the start handler.
 * @returns The button.
 */
function StartPracticeButton(
  props: Readonly<{ empty: boolean; disabled: boolean; onStart: () => void }>,
): ReactElement {
  return (
    <div className="mt-auto pt-6">
      <button
        type="button"
        className="btn btn-primary w-full"
        disabled={props.disabled}
        onClick={props.onStart}
      >
        {props.empty ? "Nothing to practise here yet" : "Start practice"}
      </button>
    </div>
  );
}

export { StartPracticeButton };
