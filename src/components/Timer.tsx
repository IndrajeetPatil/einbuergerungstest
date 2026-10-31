import type { ReactElement } from "react";

import { clock } from "#lib/format.ts";
import { useCountdown } from "#lib/useCountdown.ts";

import { Icon } from "./Icon.tsx";

const LOW_MS = 300_000;
const MINUTE_MS = 60_000;

/**
 * Mock-exam countdown; submits the exam when time is up.
 * @param props - Deadline in ms and the expiry handler.
 * @returns The timer.
 */
function Timer(
  props: Readonly<{ deadline: number; onExpire: () => void }>,
): ReactElement {
  const left = useCountdown(props.deadline, props.onExpire);
  const low = left < LOW_MS;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums ${low ? "text-rust" : "text-muted"}`}
      role="timer"
      aria-label={`${Math.ceil(left / MINUTE_MS)} Minuten verbleibend`}
    >
      <Icon name="clock" />
      {clock(left)}
      {low ? <span className="sr-only md:not-sr-only">left</span> : null}
    </span>
  );
}

export { Timer };
