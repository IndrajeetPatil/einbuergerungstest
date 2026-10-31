import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Native modal dialog: focus trapping, Escape to cancel and inert background come for free. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Zurück · Go back",
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-6 text-ink backdrop:bg-ink/25"
    >
      <h2 id="confirm-title" className="text-xl">
        {title}
      </h2>
      <div className="mt-3 text-[0.95rem] text-muted">{children}</div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" className="btn" onClick={onCancel} autoFocus>
          {cancelLabel}
        </button>
        <button type="button" className="btn btn-primary" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
