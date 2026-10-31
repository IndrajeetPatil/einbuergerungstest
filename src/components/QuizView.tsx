import { useCallback, useEffect, useRef, useState } from "react";
import { label, question as getQuestion } from "../catalogue.ts";
import { api } from "../lib/api.ts";
import { EXAM } from "../lib/quiz.ts";
import { check, choose, goTo, toAnswer, toggleFlag, type ActiveSession } from "../lib/session.ts";
import type { QuestionStat, SessionSummary, Settings } from "../lib/types.ts";
import { ConfirmDialog } from "./ConfirmDialog.tsx";
import { Feedback } from "./Feedback.tsx";
import { ArrowLeft, ArrowRight, ClockIcon, FlagIcon } from "./icons.tsx";
import { QuestionBlock } from "./QuestionBlock.tsx";

interface Props {
  session: ActiveSession;
  onChange: (s: ActiveSession) => void;
  settings: Settings;
  stats: Record<string, QuestionStat>;
  onToggleEnglish: () => void;
  onFinished: (summary: SessionSummary, session: ActiveSession) => void;
  onExit: () => void;
  onError: (message: string) => void;
}

export function QuizView(props: Props) {
  const { session, onChange, settings, stats, onToggleEnglish, onFinished, onExit, onError } =
    props;
  const exam = session.mode === "exam";
  const item = session.items[session.index]!;
  const q = getQuestion(item.qid);
  const [confirm, setConfirm] = useState<"submit" | "end" | null>(null);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);
  const isLast = session.index === session.items.length - 1;

  // Move focus to the new question so screen readers and keyboard users start at its top.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [session.index]);

  // Guard against closing the tab mid-session (progress is saved, but the timer keeps running).
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const finish = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setConfirm(null);
    try {
      const final = goTo(session, session.index);
      const durationMs = Date.now() - final.startedAt;
      const answers = exam ? final.items.map((it, i) => toAnswer(it, i)) : [];
      const summary = await api.finish(final.id, answers, durationMs);
      onFinished(summary, final);
    } catch (error) {
      onError(`Could not save the session: ${(error as Error).message}`);
      setBusy(false);
    }
  }, [busy, exam, onError, onFinished, session]);

  const submitCheck = useCallback(() => {
    if (item.chosen === null || item.checked) return;
    const next = check(session, q, settings.shuffleOptions);
    onChange(next);
    const checked = next.items[session.index]!;
    api.answer(session.id, toAnswer(checked, session.index)).catch((error: Error) => {
      onError(`Could not save your answer: ${error.message}`);
    });
  }, [item, onChange, onError, q, session, settings.shuffleOptions]);

  const next = useCallback(() => {
    if (isLast) {
      if (exam) setConfirm("submit");
      else void finish();
      return;
    }
    onChange(goTo(session, session.index + 1));
  }, [exam, finish, isLast, onChange, session]);

  // Keyboard: 1–4 / A–D choose, Enter checks or continues, ← → move (exam), F flags, E English.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (confirm || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.closest("input[type=text], textarea, select, dialog")) return;
      const k = e.key.toLowerCase();
      const pos = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
      if (pos >= 0 && k.length === 1) {
        if (!item.checked) onChange(choose(session, item.order[pos]!));
        e.preventDefault();
      } else if (k === "enter" && !target.closest("button, a")) {
        if (exam) next();
        else if (!item.checked) submitCheck();
        else next();
        e.preventDefault();
      } else if (exam && k === "arrowright") {
        next();
      } else if (exam && k === "arrowleft") {
        onChange(goTo(session, session.index - 1));
      } else if (exam && k === "f") {
        onChange(toggleFlag(session));
      } else if (k === "e") {
        onToggleEnglish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm, exam, item, next, onChange, onToggleEnglish, session, submitCheck]);

  const answered = session.items.filter((it) => it.chosen !== null).length;
  const flagged = session.items.filter((it) => it.flagged).length;
  const firstAttempts = session.items.filter((it) => !it.retry);
  const checkedFirst = firstAttempts.filter((it) => it.checked);
  const correctSoFar = checkedFirst.filter((it) => it.chosen === getQuestion(it.qid).answer).length;
  const comesBack =
    !exam &&
    item.checked &&
    !item.retry &&
    item.chosen !== q.answer &&
    session.items.some((it, i) => i > session.index && it.retry && it.qid === item.qid);

  return (
    <main className="mx-auto max-w-5xl px-5 pt-6 pb-24 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="field-mark">
            {exam ? "Prüfungssimulation · Mock exam" : "Üben · Practice"}
          </span>
          <span className="folio-mark">
            {label(q)}
            {item.retry && " · Wiederholung · Second try"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {exam && session.deadline && (
            <Timer deadline={session.deadline} onExpire={() => void finish()} />
          )}
          <button
            type="button"
            className="btn btn-quiet min-h-9 px-2 text-sm"
            onClick={onToggleEnglish}
            aria-pressed={settings.showEnglish}
          >
            {settings.showEnglish ? "Hide English" : "Show English"}
          </button>
        </div>
      </div>

      <Progress
        done={exam ? answered : session.index + (item.checked ? 1 : 0)}
        total={session.items.length}
        caption={
          exam
            ? `Frage ${session.index + 1} von ${session.items.length} · ${answered} answered`
            : `${session.index + 1} / ${session.items.length}${
                checkedFirst.length ? ` · ${correctSoFar} of ${checkedFirst.length} correct` : ""
              }`
        }
      />

      <div ref={headingRef} tabIndex={-1} className="mt-8 outline-none">
        <QuestionBlock
          key={`${session.index}-${item.qid}`}
          question={q}
          order={item.order}
          chosen={item.chosen}
          revealed={!exam && item.checked}
          showEnglish={settings.showEnglish}
          onChoose={item.checked ? undefined : (option) => onChange(choose(session, option))}
          headingId="current-question"
        />
      </div>

      {!exam && item.checked && (
        <Feedback
          question={q}
          chosen={item.chosen}
          stat={stats[q.id]}
          comesBack={comesBack}
          showEnglish={settings.showEnglish}
        />
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          {exam ? (
            <>
              <button
                type="button"
                className="btn"
                disabled={session.index === 0}
                onClick={() => onChange(goTo(session, session.index - 1))}
              >
                <ArrowLeft /> Zurück
              </button>
              <button
                type="button"
                className="btn"
                aria-pressed={item.flagged}
                onClick={() => onChange(toggleFlag(session))}
              >
                <FlagIcon className={item.flagged ? "text-ochre" : ""} />
                {item.flagged ? "Markiert · Flagged" : "Markieren · Flag"}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-quiet" onClick={() => setConfirm("end")}>
              End session
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {exam && (
            <button type="button" className="btn" onClick={() => setConfirm("submit")}>
              Abgeben · Submit
            </button>
          )}
          {!exam && !item.checked ? (
            <button
              type="button"
              className="btn btn-primary min-w-40"
              disabled={item.chosen === null}
              onClick={submitCheck}
            >
              Prüfen · Check
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary min-w-40"
              onClick={next}
              disabled={busy}
            >
              {isLast ? (exam ? "Abgeben · Submit" : "Ergebnis · Results") : "Weiter · Next"}
              <ArrowRight />
            </button>
          )}
        </div>
      </div>

      {exam && (
        <nav aria-label="Questions" className="mt-10 border-t border-line pt-5">
          <p className="folio-mark mb-3">Übersicht · Overview</p>
          <ol className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
            {session.items.map((it, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onChange(goTo(session, i))}
                  aria-current={i === session.index ? "step" : undefined}
                  aria-label={`Frage ${i + 1}${it.chosen !== null ? ", beantwortet" : ""}${it.flagged ? ", markiert" : ""}`}
                  className={`relative flex h-11 w-full items-center justify-center rounded-sm border text-sm tabular-nums transition-colors ${
                    i === session.index
                      ? "border-ink font-semibold"
                      : it.chosen !== null
                        ? "border-accent/40 bg-accent/[0.08] text-accent"
                        : "border-line text-muted hover:border-accent"
                  }`}
                >
                  {i + 1}
                  {it.flagged && (
                    <FlagIcon
                      className="absolute top-0.5 right-0.5 text-ochre"
                      width={11}
                      height={11}
                    />
                  )}
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted">
            Keys: 1–4 choose · ← → move · F flag · E English. Questions {EXAM.general + 1}–
            {EXAM.total} are about your Bundesland, as in the real test.
          </p>
        </nav>
      )}
      {!exam && (
        <p className="mt-10 text-sm text-muted">
          Keys: 1–4 choose · Enter check / next · E English
        </p>
      )}

      <ConfirmDialog
        open={confirm === "submit"}
        title="Test abgeben? · Submit the test?"
        confirmLabel="Abgeben · Submit"
        onConfirm={() => void finish()}
        onCancel={() => setConfirm(null)}
      >
        <p>
          {answered} of {session.items.length} questions answered
          {flagged > 0 && `, ${flagged} flagged for review`}.
          {answered < session.items.length &&
            " Unanswered questions count as wrong — in the real test there is no penalty for guessing."}
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === "end"}
        title="Sitzung beenden? · End this session?"
        confirmLabel="End session"
        onConfirm={() => {
          setConfirm(null);
          if (checkedFirst.length > 0) void finish();
          else onExit();
        }}
        onCancel={() => setConfirm(null)}
      >
        <p>
          {checkedFirst.length > 0
            ? "Your answers so far are saved and count towards your progress."
            : "You have not answered anything yet; nothing will be recorded."}
        </p>
      </ConfirmDialog>
    </main>
  );
}

function Progress({ done, total, caption }: { done: number; total: number; caption: string }) {
  return (
    <div className="mt-4">
      <div
        className="h-1 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label="Progress"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-muted tabular-nums">{caption}</p>
    </div>
  );
}

function Timer({ deadline, onExpire }: { deadline: number; onExpire: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const expired = useRef(false);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const left = Math.max(0, deadline - now);
  useEffect(() => {
    if (left === 0 && !expired.current) {
      expired.current = true;
      onExpire();
    }
  }, [left, onExpire]);
  const min = Math.floor(left / 60_000);
  const sec = Math.floor((left % 60_000) / 1000);
  const low = left < 5 * 60_000;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums ${low ? "text-rust" : "text-muted"}`}
      role="timer"
      aria-label={`${min} Minuten verbleibend`}
    >
      <ClockIcon />
      {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
      {low && <span className="sr-only md:not-sr-only">left</span>}
    </span>
  );
}
