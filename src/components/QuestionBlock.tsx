import type { ReactElement } from "react";

import { OPTION_KEYS } from "#lib/catalogue.ts";
import { optionState } from "#lib/optionState.ts";
import type { Question } from "#lib/schemas.ts";

import { OptionRow } from "./OptionRow.tsx";
import { QuestionHeading } from "./QuestionHeading.tsx";
import { QuestionImage } from "./QuestionImage.tsx";

interface Props {
  question: Question;
  order: readonly number[];
  chosen: number | null;
  /** Show which option is correct (practice feedback or exam review). */
  revealed: boolean;
  showEnglish: boolean;
  onChoose: ((option: number) => void) | undefined;
  headingId: string;
}

/**
 * A question with its options, German and English side by side.
 * @param props - Question, option order, answer state and handlers.
 * @returns The question block.
 */
function QuestionBlock(props: Readonly<Props>): ReactElement {
  const { question, order, chosen, revealed, showEnglish, headingId } = props;
  return (
    <div>
      <QuestionHeading
        question={question}
        showEnglish={showEnglish}
        headingId={headingId}
      />
      <QuestionImage question={question} />
      <fieldset className="mt-6 divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">
        <legend className="sr-only">
          Antwortmöglichkeiten · Answer options
        </legend>
        {order.map((option, position) => (
          <OptionRow
            key={option}
            name={`q-${question.id}-${headingId}`}
            option={option}
            keyLabel={OPTION_KEYS[position] ?? ""}
            german={question.de.o[option] ?? ""}
            english={question.en.o[option] ?? ""}
            state={optionState(
              revealed,
              chosen === option,
              option === question.answer,
            )}
            checked={chosen === option}
            showEnglish={showEnglish}
            onChoose={props.onChoose}
          />
        ))}
      </fieldset>
    </div>
  );
}

export { QuestionBlock };
