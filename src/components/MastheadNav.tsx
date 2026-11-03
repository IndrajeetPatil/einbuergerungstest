import type { ReactElement } from "react";

import { countdownChip } from "#lib/countdown.ts";
import type { View } from "#lib/useView.ts";

const LINKS: readonly { view: View["name"]; href: string; text: string }[] = [
  { view: "dashboard", href: "#uebersicht", text: "Übersicht" },
  { view: "catalogue", href: "#katalog", text: "Fragenkatalog" },
  { view: "current", href: "#aktuell", text: "Aktuelles" },
];

function navClass(active: boolean): string {
  const tone = active
    ? "font-semibold text-accent"
    : "text-muted hover:text-ink";
  return `rounded-sm px-3 py-2 ${tone}`;
}

/**
 * Page links with the exam countdown.
 * @param props - The current view, and the exam date.
 * @returns The navigation.
 */
function MastheadNav(
  props: Readonly<{ view: View["name"]; examDate: string | null }>,
): ReactElement {
  const chip = countdownChip(props.examDate);
  // Results and other views without a link of their own sit under Übersicht.
  const page = LINKS.some((link) => link.view === props.view)
    ? props.view
    : "dashboard";
  return (
    <nav
      aria-label="Main"
      className="flex flex-wrap items-center gap-1 text-sm"
    >
      {LINKS.map((link) => {
        const active = link.view === page;
        return (
          <a
            key={link.view}
            href={link.href}
            className={navClass(active)}
            aria-current={active ? "page" : undefined}
          >
            {link.text}
          </a>
        );
      })}
      {chip === null ? null : (
        <span className="chip chip-accent ml-3 hidden sm:inline-flex">
          {chip}
        </span>
      )}
    </nav>
  );
}

export { MastheadNav };
