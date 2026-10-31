import type { ReactElement } from "react";

/**
 * A dismissible error message.
 * @param props - Message and dismiss handler.
 * @returns The alert.
 */
function ErrorBanner(
  props: Readonly<{ message: string; onDismiss: () => void }>,
): ReactElement {
  const { message, onDismiss } = props;
  return (
    <div
      role="alert"
      className="mx-auto mt-4 max-w-5xl px-5 md:px-8"
    >
      <div className="flex items-start justify-between gap-4 rounded-md border border-rust/40 bg-surface px-4 py-3 text-rust">
        <p>{message}</p>
        <button
          type="button"
          className="text-sm underline"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export { ErrorBanner };
