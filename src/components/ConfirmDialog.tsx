import { useEffect, useId, useRef } from "react";
import type { ReactElement, ReactNode } from "react";

function syncOpen(dialog: HTMLDialogElement | null, open: boolean): void {
  if (dialog === null || dialog.open === open) {
    return;
  }
  if (open) {
    dialog.showModal();
  } else {
    dialog.close();
  }
}

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Native modal dialog: focus trapping, Escape to cancel and an inert
 * background come for free.
 * @param props - Title, body, labels and handlers.
 * @returns The dialog.
 */
function ConfirmDialog(props: Readonly<Props>): ReactElement {
  const {
    open,
    title,
    children,
    confirmLabel,
    cancelLabel = "Zurück · Go back",
    onConfirm,
    onCancel,
  } = props;
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    syncOpen(ref.current, open);
  }, [open]);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      aria-labelledby={titleId}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-6 text-ink backdrop:bg-ink/25 dark:backdrop:bg-bg/70"
    >
      <h2
        id={titleId}
        className="text-xl"
      >
        {title}
      </h2>
      <div className="mt-3 text-[0.95rem] text-muted">{children}</div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          className="btn"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export { ConfirmDialog };
