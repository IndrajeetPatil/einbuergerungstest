import type { ReactElement } from "react";

/**
 * Shows or hides the English column (also the E key).
 * @param props - Whether English is shown, and the toggle handler.
 * @returns The toggle button.
 */
function EnglishToggle(
  props: Readonly<{ showEnglish: boolean; onToggle: () => void }>,
): ReactElement {
  return (
    <button
      type="button"
      className="btn btn-quiet min-h-9 px-2 text-sm"
      onClick={props.onToggle}
      aria-pressed={props.showEnglish}
    >
      {props.showEnglish ? "Hide English" : "Show English"}
    </button>
  );
}

export { EnglishToggle };
