import type { ReactElement } from "react";

import type { Question, QuestionStat } from "#lib/schemas.ts";

import { Correction } from "./Correction.tsx";
import { Explanation } from "./Explanation.tsx";
import { FeedbackRecord } from "./FeedbackRecord.tsx";
import { Verdict } from "./Verdict.tsx";

interface Props {
  question: Question;
  chosen: number | null;
  stat?: QuestionStat | undefined;
  /** Practice: the question was queued again later in this session. */
  comesBack?: boolean;
  showEnglish: boolean;
}

/**
 * What to learn from an answer: the correct option in both languages, why,
 * and your record.
 * @param props - Question, chosen option, record and language toggle.
 * @returns The feedback panel.
 */
function Feedback(props: Readonly<Props>): ReactElement {
  const { question, chosen, stat, comesBack = false, showEnglish } = props;
  const correct = chosen === question.answer;
  return (
    <section
      aria-live="polite"
      className={`mt-6 border-l-2 pl-5 ${correct ? "border-accent" : "border-rust"}`}
    >
      <Verdict
        correct={correct}
        answered={chosen !== null}
      />
      {correct ? null : (
        <Correction
          question={question}
          chosen={chosen}
          showEnglish={showEnglish}
        />
      )}
      <Explanation question={question} />
      <FeedbackRecord
        stat={stat}
        comesBack={comesBack}
      />
    </section>
  );
}

export { Feedback };
