// Wires the quiz keyboard shortcuts to the quiz controller.
import { useEffect } from "react";

import { actionFor } from "./quizKeys.ts";
import type { KeyAction } from "./quizKeys.ts";
import type { Quiz } from "./useQuiz.ts";

function run(quiz: Quiz, action: KeyAction, toggleEnglish: () => void): void {
  if (action.kind === "choose") {
    const option = quiz.item.order[action.position];
    if (option !== undefined) {
      quiz.handleChoose(option);
    }
    return;
  }
  const handlers: Readonly<
    Record<Exclude<KeyAction["kind"], "choose">, () => void>
  > = {
    enter: quiz.handleEnter,
    next: quiz.handleNext,
    previous: quiz.handlePrevious,
    flag: quiz.handleFlag,
    english: toggleEnglish,
  };
  handlers[action.kind]();
}

/**
 * Listens for quiz shortcuts while no dialog is open.
 * @param quiz - The quiz controller.
 * @param toggleEnglish - Shows or hides the English column.
 */
function useQuizKeys(quiz: Quiz, toggleEnglish: () => void): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      // Dialogs own the keyboard while they are open.
      const action = actionFor(event, {
        exam: quiz.exam,
        dialogOpen: quiz.confirm !== null,
      });
      if (action === null) {
        return;
      }
      event.preventDefault();
      run(quiz, action, toggleEnglish);
    };
    globalThis.addEventListener("keydown", onKey);
    return () => {
      globalThis.removeEventListener("keydown", onKey);
    };
  }, [quiz, toggleEnglish]);
}

export { useQuizKeys };
