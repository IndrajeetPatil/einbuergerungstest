// Tracks an element's rendered width.
import { useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";

const INITIAL_WIDTH = 720;

/**
 * Observes the width of the referenced element.
 * @returns A ref to attach and the current width in px.
 */
function useElementWidth<Target extends HTMLElement>(): [
  RefObject<Target | null>,
  number,
] {
  const ref = useRef<Target>(null);
  const [width, setWidth] = useState(INITIAL_WIDTH);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) {
        setWidth(Math.round(entry.contentRect.width));
      }
    });
    if (ref.current !== null) {
      observer.observe(ref.current);
    }
    return () => {
      observer.disconnect();
    };
  }, []);
  return [ref, width];
}

export { useElementWidth };
