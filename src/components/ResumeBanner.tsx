import type { ReactElement } from "react";

/**
 * Offers to resume or discard an unfinished session.
 * @param props - Resume and discard handlers.
 * @returns The banner.
 */
function ResumeBanner(
  props: Readonly<{ onResume: () => void; onDiscard: () => void }>,
): ReactElement {
  const { onResume, onDiscard } = props;
  return (
    <section className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-md border border-accent/40 bg-surface px-5 py-4">
      <p>You have an unfinished session.</p>
      <div className="flex gap-3">
        <button
          type="button"
          className="btn btn-quiet"
          onClick={onDiscard}
        >
          Discard
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onResume}
        >
          Resume
        </button>
      </div>
    </section>
  );
}

export { ResumeBanner };
