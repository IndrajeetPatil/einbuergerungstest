// Behaviour of the quiz view: choosing, checking, moving and finishing, with
// the API calls. Kept apart from the markup so each piece stays simple.
import { useCallback, useState } from "react";

import { api } from "./api.ts";
import { question as findQuestion } from "./catalogue.ts";
import { describeError } from "./describeError.ts";
import type {
  ActiveSession,
  Item,
  Question,
  SessionSummary,
} from "./schemas.ts";
import {
  check,
  choose,
  endSession,
  goTo,
  nextStep,
  toAnswer,
  toggleFlag,
} from "./session.ts";
import type { NextStep } from "./session.ts";

type ConfirmKind = "submit" | "end" | null;

interface QuizOptions {
  session: ActiveSession;
  /**
   * The session as of the last change, even before React re-renders, so
   * quick successive key presses build on each other.
   */
  latest: () => ActiveSession;
  shuffleOptions: boolean;
  onChange: (session: ActiveSession) => void;
  onFinished: (summary: SessionSummary, session: ActiveSession) => void;
  onExit: () => void;
  onError: (message: string) => void;
}

interface Quiz {
  exam: boolean;
  item: Item;
  question: Question;
  isLast: boolean;
  busy: boolean;
  confirm: ConfirmKind;
  setConfirm: (kind: ConfirmKind) => void;
  handleChoose: (option: number) => void;
  handleCheck: () => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleJump: (index: number) => void;
  handleFlag: () => void;
  handleFinish: () => void;
  handleEnd: () => void;
  /** Enter: check the answer in practice, otherwise move on. */
  handleEnter: () => void;
}

const BLANK_ITEM: Item = {
  qid: "g1",
  order: [],
  chosen: null,
  flagged: false,
  checked: false,
  retry: false,
  timeMs: 0,
};

async function submit(
  session: ActiveSession,
  exam: boolean,
  options: Pick<QuizOptions, "onFinished" | "onError">,
): Promise<void> {
  const final = goTo(session, session.index);
  const answers = exam
    ? final.items.map((entry, index) => toAnswer(entry, index))
    : [];
  try {
    const summary = await api.finish(
      final.id,
      answers,
      Date.now() - final.startedAt,
    );
    options.onFinished(summary, final);
  } catch (error) {
    options.onError(`Could not save the session: ${describeError(error)}`);
  }
}

async function record(
  session: ActiveSession,
  item: Item,
  onError: (message: string) => void,
): Promise<void> {
  try {
    await api.answer(session.id, toAnswer(item, session.index));
  } catch (error) {
    onError(`Could not save your answer: ${describeError(error)}`);
  }
}

/**
 * Submits the session once, re-enabling submission if saving fails.
 * @param options - The latest session and completion and error callbacks.
 * @returns Whether a submission is in flight, and the submit action.
 */
function useSubmit(
  options: Pick<QuizOptions, "latest" | "onFinished" | "onError">,
): { busy: boolean; submitNow: () => void } {
  const [busy, setBusy] = useState(false);
  const { latest, onFinished, onError } = options;
  const submitNow = useCallback(() => {
    if (busy) {
      return;
    }
    setBusy(true);
    const session = latest();
    void submit(session, session.mode === "exam", {
      onFinished,
      onError: (message) => {
        onError(message);
        setBusy(false);
      },
    });
  }, [busy, latest, onError, onFinished]);
  return { busy, submitNow };
}

function checkLatest(options: QuizOptions): void {
  const session = options.latest();
  const item = session.items[session.index];
  if (item === undefined) {
    return;
  }
  const next = check(session, {
    question: findQuestion(item.qid),
    shuffleOptions: options.shuffleOptions,
  });
  const checked = next.items[session.index];
  if (next !== session && checked !== undefined) {
    options.onChange(next);
    void record(session, checked, options.onError);
  }
}

function enterLatest(options: QuizOptions, moveOn: () => void): void {
  const session = options.latest();
  const item = session.items[session.index];
  if (session.mode === "exam" || item?.checked === true) {
    moveOn();
  } else {
    checkLatest(options);
  }
}

/**
 * State and actions of the quiz in progress. Actions read the latest session
 * rather than the one this render saw.
 * @param options - Session, settings and callbacks.
 * @returns The quiz controller.
 */
function useQuiz(options: QuizOptions): Quiz {
  const { session, latest, onChange } = options;
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const { busy, submitNow } = useSubmit(options);
  const item = session.items[session.index] ?? BLANK_ITEM;
  const update = (change: (current: ActiveSession) => ActiveSession): void => {
    onChange(change(latest()));
  };
  const finish = (): void => {
    setConfirm(null);
    submitNow();
  };
  const steps: Readonly<Record<NextStep, () => void>> = {
    advance: () => {
      update((current) => goTo(current, current.index + 1));
    },
    confirm: () => {
      setConfirm("submit");
    },
    finish,
  };
  const next = (): void => {
    steps[nextStep(latest())]();
  };
  return {
    exam: session.mode === "exam",
    item,
    question: findQuestion(item.qid),
    isLast: session.index === session.items.length - 1,
    busy,
    confirm,
    setConfirm,
    handleChoose: (option) => {
      update((current) => choose(current, option));
    },
    handleCheck: () => {
      checkLatest(options);
    },
    handleNext: next,
    handlePrevious: () => {
      update((current) => goTo(current, current.index - 1));
    },
    handleJump: (index) => {
      update((current) => goTo(current, index));
    },
    handleFlag: () => {
      update(toggleFlag);
    },
    handleFinish: finish,
    handleEnd: () => {
      setConfirm(null);
      endSession(latest(), { finish: submitNow, exit: options.onExit });
    },
    handleEnter: () => {
      enterLatest(options, next);
    },
  };
}

export { useQuiz };
export type { ConfirmKind, QuizOptions, Quiz };
