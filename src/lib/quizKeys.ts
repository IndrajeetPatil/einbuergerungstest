// Keyboard shortcuts of the quiz: 1–4 or A–D choose, Enter checks or moves on,
// arrows move and F flags in the mock exam, E toggles English.
type KeyAction =
  | { kind: "choose"; position: number }
  | { kind: "enter" }
  | { kind: "next" }
  | { kind: "previous" }
  | { kind: "flag" }
  | { kind: "english" };

const POSITIONS: Readonly<Record<string, number>> = {
  "1": 0,
  "2": 1,
  "3": 2,
  "4": 3,
  a: 0,
  b: 1,
  c: 2,
  d: 3,
};

const ALWAYS: Readonly<Record<string, KeyAction>> = {
  enter: { kind: "enter" },
  e: { kind: "english" },
};

const EXAM_ONLY: Readonly<Record<string, KeyAction>> = {
  arrowright: { kind: "next" },
  arrowleft: { kind: "previous" },
  f: { kind: "flag" },
};

/**
 * Maps a key press to a quiz action.
 * @param key - `KeyboardEvent.key`.
 * @param exam - Whether a mock exam is running.
 * @returns The action, or null for keys without one.
 */
function keyAction(key: string, exam: boolean): KeyAction | null {
  const lower = key.toLowerCase();
  const position = POSITIONS[lower];
  if (position !== undefined) {
    return { kind: "choose", position };
  }
  return ALWAYS[lower] ?? (exam ? (EXAM_ONLY[lower] ?? null) : null);
}

type KeyInfo = Pick<
  KeyboardEvent,
  "key" | "metaKey" | "ctrlKey" | "altKey" | "target"
>;

interface KeyContext {
  exam: boolean;
  dialogOpen: boolean;
}

const FORM_FIELDS =
  "input[type=text], input[type=search], textarea, select, dialog";

function modified(event: KeyInfo): boolean {
  return event.metaKey || event.ctrlKey || event.altKey;
}

function within(target: EventTarget | null, selector: string): boolean {
  return (
    target !== null &&
    target instanceof Element &&
    target.closest(selector) !== null
  );
}

/**
 * Whether a key event should be left to the focused control.
 * @param event - The keyboard event.
 * @returns True for modified keys and typing in form fields or dialogs.
 */
function ignoreKey(event: KeyInfo): boolean {
  return modified(event) || within(event.target, FORM_FIELDS);
}

function blocked(
  event: KeyInfo,
  action: KeyAction,
  dialogOpen: boolean,
): boolean {
  // Enter on a focused button or link activates that control instead.
  const onControl =
    action.kind === "enter" && within(event.target, "button, a");
  return dialogOpen || onControl || ignoreKey(event);
}

/**
 * The quiz action for a key event, unless the key belongs to something else.
 * @param event - The keyboard event.
 * @param context - Whether a mock exam runs and whether a dialog is open.
 * @returns The action, or null.
 */
function actionFor(event: KeyInfo, context: KeyContext): KeyAction | null {
  const action = keyAction(event.key, context.exam);
  return action === null || blocked(event, action, context.dialogOpen)
    ? null
    : action;
}

export { actionFor, ignoreKey, keyAction };
export type { KeyAction };
