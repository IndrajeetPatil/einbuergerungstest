import type { ReactElement } from "react";

/**
 * One option in German and English, as used in feedback.
 * @param props - Caption, texts, language toggle and whether to strike it
 * through.
 * @returns The labelled pair.
 */
function AnswerPair(
  props: Readonly<{
    caption: string;
    german: string;
    english: string;
    showEnglish: boolean;
    struck?: boolean;
  }>,
): ReactElement {
  const { caption, german, english, showEnglish, struck = false } = props;
  return (
    <div className="mt-3">
      <p className="folio-mark">{caption}</p>
      <div
        className={`mt-1 grid gap-x-10 gap-y-1 ${showEnglish ? "md:grid-cols-2" : ""}`}
      >
        <p
          lang="de"
          className={
            struck ? "line-through decoration-rust/50" : "font-semibold"
          }
        >
          {german}
        </p>
        {showEnglish ? (
          <p
            lang="en"
            className="text-muted"
          >
            {english}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export { AnswerPair };
