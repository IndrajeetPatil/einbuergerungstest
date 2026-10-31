import type { ReactElement } from "react";

import { Icon } from "./Icon.tsx";

/**
 * A question's options with the correct one marked.
 * @param props - Options, correct index, language and emphasis tone.
 * @returns The list.
 */
function OptionList(
  props: Readonly<{
    options: readonly string[];
    answer: number;
    lang: "de" | "en";
    answerTone: string;
  }>,
): ReactElement {
  const { options, answer, lang, answerTone } = props;
  return (
    <ol className="mt-2 space-y-1">
      {options.map((option, index) => (
        <li
          key={option}
          lang={lang}
          className={`flex items-start gap-2 ${index === answer ? `font-semibold ${answerTone}` : ""}`}
        >
          <span className="mt-1.5 w-4">
            {index === answer ? (
              <Icon
                name="check"
                size="md"
              />
            ) : null}
          </span>
          {option}
        </li>
      ))}
    </ol>
  );
}

export { OptionList };
