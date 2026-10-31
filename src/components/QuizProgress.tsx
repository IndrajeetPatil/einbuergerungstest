import type { ReactElement } from "react";

/**
 * Progress through the session, with a caption.
 * @param props - Done and total counts, and the caption.
 * @returns The progress bar.
 */
function QuizProgress(
  props: Readonly<{ done: number; total: number; caption: string }>,
): ReactElement {
  const { done, total, caption } = props;
  return (
    <div className="mt-4">
      <progress
        className="progress-bar"
        max={total}
        value={done}
        aria-label="Progress"
      />
      <p className="mt-2 text-sm text-muted tabular-nums">{caption}</p>
    </div>
  );
}

export { QuizProgress };
