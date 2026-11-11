import { useRef, useState } from "react";
import type { ReactElement } from "react";

import type { BackupActions } from "#lib/useBackup.ts";

import { ConfirmDialog } from "./ConfirmDialog.tsx";

/**
 * Where progress lives, with export, import and reset.
 * @param props - Backup actions, and whether a session is in progress.
 * @returns The data section.
 */
function DataSection(
  props: Readonly<{ backup: BackupActions; disabled: boolean }>,
): ReactElement {
  const { backup, disabled } = props;
  const fileInput = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);
  return (
    <section className="mt-16 border-t border-line pt-8">
      <h2 className="text-heading">Ihre Daten · Your data</h2>
      <p className="mt-3 max-w-prose text-muted">
        Your progress stays in this browser on this device and is never
        uploaded. Clearing your browser data deletes it, so export a backup now
        and then. Importing a backup replaces the progress here, so you can
        carry on in another browser.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn"
          onClick={backup.handleExport}
        >
          Exportieren · Export backup
        </button>
        <button
          type="button"
          className="btn"
          disabled={disabled}
          onClick={() => {
            fileInput.current?.click();
          }}
        >
          Importieren · Import backup
        </button>
        <button
          type="button"
          className="btn"
          disabled={disabled}
          onClick={() => {
            setConfirming(true);
          }}
        >
          Zurücksetzen · Reset progress
        </button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        aria-label="Backup file"
        hidden
        onChange={(event) => {
          const [file] = event.target.files ?? [];
          event.target.value = "";
          if (file !== undefined) {
            backup.handleImport(file);
          }
        }}
      />
      {disabled ? (
        <p className="mt-3 text-sm text-muted">
          Finish or discard the session in progress to import or reset.
        </p>
      ) : null}
      <output className="mt-3 block text-sm text-muted">{backup.status}</output>
      <ConfirmDialog
        open={confirming}
        title="Fortschritt löschen? · Reset progress?"
        confirmLabel="Löschen · Delete"
        onConfirm={() => {
          setConfirming(false);
          backup.handleReset();
        }}
        onCancel={() => {
          setConfirming(false);
        }}
      >
        Every session and answer in this browser is deleted; your settings stay.
        Export a backup first if you might want them back.
      </ConfirmDialog>
    </section>
  );
}

export { DataSection };
