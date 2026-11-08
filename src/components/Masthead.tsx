import type { ReactElement } from "react";

import type { View } from "#lib/useView.ts";

import { MastheadNav } from "./MastheadNav.tsx";
import { ThemeToggle } from "./ThemeToggle.tsx";

/**
 * Site title with navigation, or a pause button during sessions, and the
 * theme toggle.
 * @param props - Current view, exam date and pause handler.
 * @returns The header.
 */
function Masthead(
  props: Readonly<{
    view: View["name"];
    inSession: boolean;
    examDate: string | null;
    onPause: () => void;
  }>,
): ReactElement {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3 md:px-8">
        <p className="font-serif text-lg font-semibold">Leben in Deutschland</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {props.inSession ? (
            <button
              type="button"
              className="btn btn-quiet min-h-9 text-sm"
              onClick={props.onPause}
            >
              Pause · back to overview
            </button>
          ) : (
            <MastheadNav
              view={props.view}
              examDate={props.examDate}
            />
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export { Masthead };
