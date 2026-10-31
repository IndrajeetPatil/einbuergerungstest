import type { ReactElement } from "react";

import { EXAM } from "#lib/quiz.ts";
import type { ActiveSession, Item } from "#lib/schemas.ts";

import { Icon } from "./Icon.tsx";

function tone(item: Item, current: boolean): string {
  if (current) {
    return "border-ink font-semibold";
  }
  return item.chosen === null
    ? "border-line text-muted hover:border-accent"
    : "border-accent/40 bg-accent/[0.08] text-accent";
}

function ariaLabel(item: Item, position: number): string {
  const answered = item.chosen === null ? "" : ", beantwortet";
  const flagged = item.flagged ? ", markiert" : "";
  return `Frage ${position}${answered}${flagged}`;
}

/**
 * Grid of all mock-exam questions showing answered and flagged ones.
 * @param props - The session and a jump handler.
 * @returns The overview navigation.
 */
function ExamOverview(
  props: Readonly<{
    session: ActiveSession;
    onJump: (index: number) => void;
  }>,
): ReactElement {
  const { session, onJump } = props;
  return (
    <nav
      aria-label="Questions"
      className="mt-10 border-t border-line pt-5"
    >
      <p className="folio-mark mb-3">Übersicht · Overview</p>
      <ol className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
        {session.items.map((item, index) => (
          <li key={item.qid}>
            <button
              type="button"
              onClick={() => {
                onJump(index);
              }}
              aria-current={index === session.index ? "step" : undefined}
              aria-label={ariaLabel(item, index + 1)}
              className={`relative flex h-11 w-full items-center justify-center rounded-sm border text-sm tabular-nums transition-colors ${tone(item, index === session.index)}`}
            >
              {index + 1}
              {item.flagged ? (
                <span className="absolute top-0.5 right-0.5">
                  <Icon
                    name="flag"
                    tone="ochre"
                    size="sm"
                  />
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-muted">
        Keys: 1–4 choose · ← → move · F flag · E English. Questions{" "}
        {EXAM.general + 1}–{EXAM.total} are about your Bundesland, as in the
        real test.
      </p>
    </nav>
  );
}

export { ExamOverview };
