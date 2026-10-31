// A ticking countdown to a wall-clock deadline.
import { useEffect, useRef, useState } from "react";

const TICK_MS = 1000;

/**
 * Milliseconds left until a deadline, calling `onExpire` once at zero.
 * @param deadline - Deadline in ms since the epoch.
 * @param onExpire - Called once when time is up.
 * @returns Time left in ms, never negative.
 */
function useCountdown(deadline: number, onExpire: () => void): number {
  const [now, setNow] = useState(() => Date.now());
  const expired = useRef(false);
  useEffect(() => {
    const id = globalThis.setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);
    return () => {
      globalThis.clearInterval(id);
    };
  }, []);
  const left = Math.max(0, deadline - now);
  useEffect(() => {
    if (left === 0 && !expired.current) {
      expired.current = true;
      onExpire();
    }
  }, [left, onExpire]);
  return left;
}

export { useCountdown };
