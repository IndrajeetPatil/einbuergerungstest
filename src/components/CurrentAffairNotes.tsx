import type { ReactElement } from "react";

import type { CurrentFact } from "#lib/currentAffairs.ts";

import { AnswerPair } from "./AnswerPair.tsx";

/**
 * The latest facts behind an answer, a known upcoming change and sources.
 * @param props - The fact and the language toggle.
 * @returns The notes.
 */
function CurrentAffairNotes(
  props: Readonly<{ fact: CurrentFact; showEnglish: boolean }>,
): ReactElement {
  const { fact, showEnglish } = props;
  return (
    <>
      <AnswerPair
        caption="Stand heute · Latest"
        german={fact.latest.de}
        english={fact.latest.en}
        showEnglish={showEnglish}
        struck={false}
      />
      {fact.outlook === null ? null : (
        <AnswerPair
          caption="Demnächst · Coming up"
          german={fact.outlook.de}
          english={fact.outlook.en}
          showEnglish={showEnglish}
          struck={false}
        />
      )}
      <p className="mt-3 text-sm text-muted">
        Quellen · Sources:{" "}
        {fact.sources.map((source, index) => (
          <span key={source.url}>
            {index === 0 ? null : ", "}
            <a
              className="link"
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              {source.label}
            </a>
          </span>
        ))}
      </p>
    </>
  );
}

export { CurrentAffairNotes };
