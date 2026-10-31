// Display state of an answer option.
type OptionState = "idle" | "chosen" | "correct" | "wrong" | "dim";

/**
 * How an option looks, from whether answers are revealed and what was chosen.
 * @param revealed - Whether the correct answer is shown.
 * @param isChosen - Whether this option was chosen.
 * @param isAnswer - Whether this option is correct.
 * @returns The option's display state.
 */
function optionState(
  revealed: boolean,
  isChosen: boolean,
  isAnswer: boolean,
): OptionState {
  if (!revealed) {
    return isChosen ? "chosen" : "idle";
  }
  if (isAnswer) {
    return "correct";
  }
  return isChosen ? "wrong" : "dim";
}

export { optionState };
export type { OptionState };
