import type { ReactElement } from "react";

import { optionText } from "#lib/catalogue.ts";
import type { Question } from "#lib/schemas.ts";

import { AnswerPair } from "./AnswerPair.tsx";

/**
 * The correct answer and, if one was chosen, the wrong answer, in both
 * languages.
 * @param props - Question, chosen option and language toggle.
 * @returns The two answer pairs.
 */
function Correction(
  props: Readonly<{
    question: Question;
    chosen: number | null;
    showEnglish: boolean;
  }>,
): ReactElement {
  const { question, chosen, showEnglish } = props;
  return (
    <>
      <AnswerPair
        caption="Richtige Antwort · Correct answer"
        german={optionText(question, question.answer, "de")}
        english={optionText(question, question.answer, "en")}
        showEnglish={showEnglish}
        struck={false}
      />
      {chosen === null ? null : (
        <AnswerPair
          caption="Ihre Antwort · Your answer"
          german={optionText(question, chosen, "de")}
          english={optionText(question, chosen, "en")}
          showEnglish={showEnglish}
          struck
        />
      )}
    </>
  );
}

export { Correction };
