import type { ReactElement } from "react";

import { countdownChip } from "#lib/countdown.ts";

function navClass(active: boolean): string {
  const tone = active
    ? "font-semibold text-accent"
    : "text-muted hover:text-ink";
  return `rounded-sm px-3 py-2 ${tone}`;
}

/**
 * Overview and catalogue links with the exam countdown.
 * @param props - Whether the catalogue is shown, and the exam date.
 * @returns The navigation.
 */
function MastheadNav(
  props: Readonly<{ catalogue: boolean; examDate: string | null }>,
): ReactElement {
  const { catalogue } = props;
  const chip = countdownChip(props.examDate);
  return (
    <nav
      aria-label="Main"
      className="flex items-center gap-1 text-sm"
    >
      <a
        href="#uebersicht"
        className={navClass(!catalogue)}
        aria-current={catalogue ? undefined : "page"}
      >
        Übersicht
      </a>
      <a
        href="#katalog"
        className={navClass(catalogue)}
        aria-current={catalogue ? "page" : undefined}
      >
        Fragenkatalog
      </a>
      {chip === null ? null : (
        <span className="chip chip-accent ml-3 hidden sm:inline-flex">
          {chip}
        </span>
      )}
    </nav>
  );
}

export { MastheadNav };
