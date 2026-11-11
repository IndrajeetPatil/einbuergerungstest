import type { ReactElement } from "react";

import { optionText } from "#lib/catalogue.ts";
import type { CurrentAffair } from "#lib/currentAffairs.ts";

import { AnswerPair } from "./AnswerPair.tsx";

/**
 * The official answer, struck through with today's answer beneath once the
 * facts have moved on.
 * @param props - The question with its fact, and the language toggle.
 * @returns The answers.
 */
function CurrentAffairAnswers(
  props: Readonly<{ affair: CurrentAffair; showEnglish: boolean }>,
): ReactElement {
  const { affair, showEnglish } = props;
  const { question, fact, upToDate } = affair;
  return (
    <>
      <AnswerPair
        caption="Prüfungsantwort · Exam answer"
        german={optionText(question, question.answer, "de")}
        english={optionText(question, question.answer, "en")}
        showEnglish={showEnglish}
        struck={!upToDate}
      />
      {upToDate ? null : (
        <AnswerPair
          caption="Heute richtig · Correct today"
          german={optionText(question, fact.option, "de")}
          english={optionText(question, fact.option, "en")}
          showEnglish={showEnglish}
        />
      )}
    </>
  );
}

export { CurrentAffairAnswers };
