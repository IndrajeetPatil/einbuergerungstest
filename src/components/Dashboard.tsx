import { useState } from "react";
import { catalogue, label, questions, stateName } from "../catalogue.ts";
import {
  EXAM,
  MASTERY_LABEL,
  accuracy,
  daysUntil,
  masteryOf,
  passed,
  poolFor,
  streak,
  weakest,
  type Mastery,
} from "../lib/quiz.ts";
import type { Focus, Settings, StateCode, Summary } from "../lib/types.ts";
import { History } from "./Feedback.tsx";
import { ScoreChart } from "./ScoreChart.tsx";

interface Props {
  summary: Summary;
  hasActive: boolean;
  onResume: () => void;
  onDiscard: () => void;
  onStartExam: () => void;
  onStartPractice: (focus: Focus, size: number, ids?: string[]) => void;
  onSettings: (patch: Partial<Settings>) => void;
}

const FOCI: { value: Focus; label: string; hint: string }[] = [
  {
    value: "smart",
    label: "Smart mix",
    hint: "Recommended. Up to half the session revisits questions you missed or got right only once; the rest are new ones, with mastered ones returning now and then.",
  },
  { value: "new", label: "Not seen yet", hint: "Only questions you have never answered." },
  {
    value: "mistakes",
    label: "My mistakes",
    hint: "Questions you missed last time or have got right only once since.",
  },
  { value: "state", label: "Bundesland", hint: "The 10 questions about your federal state." },
  {
    value: "all",
    label: "Whole catalogue",
    hint: "All 310 questions that can come up for you, in random order. Takes a while.",
  },
];
const SIZES = [10, 20, 33, 50];

const MASTERY_ORDER: Mastery[] = ["mastered", "once", "missed", "new"];
const MASTERY_FILL: Record<Mastery, string> = {
  mastered: "var(--color-accent)",
  once: "var(--color-slate)",
  missed: "var(--color-rust)",
  new: "var(--color-line)",
};

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const longDate = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function Dashboard({
  summary,
  hasActive,
  onResume,
  onDiscard,
  onStartExam,
  onStartPractice,
  onSettings,
}: Props) {
  const { settings, sessions, stats } = summary;
  const [focus, setFocus] = useState<Focus>("smart");
  const [size, setSize] = useState(20);
  const state = settings.state;

  const exams = sessions.filter((s) => s.mode === "exam");
  const lastExam = exams.at(-1);
  const recent3 = exams.slice(-3);
  const avg3 = recent3.length
    ? recent3.reduce((sum, s) => sum + s.correct, 0) / recent3.length
    : null;
  const best = exams.length ? Math.max(...exams.map((s) => s.correct)) : null;
  const passRate = exams.length
    ? exams.filter((s) => passed(s.correct)).length / exams.length
    : null;
  const days = daysUntil(settings.examDate);
  const [y, m, d] = settings.examDate.split("-").map(Number);
  const examDay = new Date(y!, m! - 1, d!);

  const pool = state ? poolFor(questions, state) : [];
  const counts = Object.fromEntries(MASTERY_ORDER.map((k) => [k, 0])) as Record<Mastery, number>;
  for (const q of pool) counts[masteryOf(stats[q.id])]++;
  const focusCount: Record<Focus, number> = {
    smart: pool.length,
    new: counts.new,
    mistakes: counts.missed + counts.once,
    state: pool.filter((q) => q.state).length,
    all: pool.length,
    selected: 0,
  };
  const weak = state ? weakest(questions, state, stats, 8) : [];

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 md:px-8">
      <section className="grid gap-x-12 gap-y-6 pt-10 md:grid-cols-[1.4fr_1fr] md:pt-14">
        <div className="min-w-0">
          <p className="field-mark">Einbürgerungstest</p>
          <h1 className="mt-2 text-title">Leben in Deutschland</h1>
          <p className="mt-4 max-w-prose text-lg text-muted">
            Practise the official BAMF catalogue side by side in German and English. The test:{" "}
            {EXAM.total} questions, {EXAM.minutes} minutes, {EXAM.passMark} correct to pass.
          </p>
        </div>
        <div className="min-w-0 self-end md:text-right">
          <p className="folio-mark">Prüfungstermin · Exam day</p>
          <p className="mt-1 font-serif text-2xl font-semibold">{longDate.format(examDay)}</p>
          <p className="mt-1 text-muted">
            {days > 1
              ? `${days} days to go`
              : days === 1
                ? "Tomorrow — viel Erfolg!"
                : days === 0
                  ? "Today — viel Erfolg!"
                  : "The exam date has passed."}
          </p>
        </div>
      </section>

      {!state && (
        <section className="mt-10 rounded-md border border-accent/40 bg-surface p-5">
          <h2 className="text-xl">Wo wohnen Sie? · Where do you live?</h2>
          <p className="mt-1 text-muted">
            Three questions in the test are about the federal state of your main residence.
          </p>
          <StateSelect value={null} onChange={(code) => onSettings({ state: code })} />
        </section>
      )}

      {state && (
        <>
          {hasActive && (
            <section className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-md border border-accent/40 bg-surface px-5 py-4">
              <p>You have an unfinished session.</p>
              <div className="flex gap-3">
                <button type="button" className="btn btn-quiet" onClick={onDiscard}>
                  Discard
                </button>
                <button type="button" className="btn btn-primary" onClick={onResume}>
                  Resume
                </button>
              </div>
            </section>
          )}

          <section className="mt-10 grid gap-5 md:grid-cols-2" aria-label="Start">
            <div className="flex min-w-0 flex-col rounded-md border border-line bg-surface p-6">
              <h2 className="text-heading">Prüfungssimulation</h2>
              <p className="folio-mark mt-1">Mock exam</p>
              <p className="mt-3 text-muted">
                {EXAM.general} random general questions plus {EXAM.state} about {stateName(state)}.{" "}
                {EXAM.minutes}-minute timer, no feedback until you submit — just like the real test.
                Do one a day to track your score.
              </p>
              <div className="mt-auto pt-6">
                <button
                  type="button"
                  className="btn btn-primary w-full"
                  onClick={onStartExam}
                  disabled={hasActive}
                >
                  Start mock exam
                </button>
              </div>
            </div>

            <div className="flex min-w-0 flex-col rounded-md border border-line bg-surface p-6">
              <h2 className="text-heading">Üben</h2>
              <p className="folio-mark mt-1">Practice with explanations</p>
              <fieldset className="mt-4">
                <legend className="sr-only">Which questions</legend>
                <div className="flex flex-wrap gap-2">
                  {FOCI.map((f) => (
                    <label
                      key={f.value}
                      className={`inline-flex min-h-9 cursor-pointer items-center rounded-sm border px-3 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                        focus === f.value
                          ? "border-accent bg-accent text-surface"
                          : "border-line hover:border-accent"
                      }`}
                    >
                      <input
                        type="radio"
                        name="focus"
                        value={f.value}
                        checked={focus === f.value}
                        onChange={() => setFocus(f.value)}
                        className="sr-only"
                      />
                      {f.label}
                      {f.value !== "smart" && f.value !== "all" && (
                        <span className="ml-1.5 tabular-nums">{focusCount[f.value]}</span>
                      )}
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="mt-3 text-sm text-muted">{FOCI.find((f) => f.value === focus)!.hint}</p>
              {focus !== "all" && focus !== "state" && (
                <fieldset className="mt-4 flex items-center gap-3">
                  <legend className="sr-only">Number of questions</legend>
                  <span className="text-sm text-muted">Questions</span>
                  {SIZES.map((n) => (
                    <label
                      key={n}
                      className={`inline-flex size-9 cursor-pointer items-center justify-center rounded-sm border text-sm tabular-nums has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                        size === n ? "border-accent font-semibold text-accent" : "border-line"
                      }`}
                    >
                      <input
                        type="radio"
                        name="size"
                        value={n}
                        checked={size === n}
                        onChange={() => setSize(n)}
                        className="sr-only"
                      />
                      {n}
                    </label>
                  ))}
                </fieldset>
              )}
              <div className="mt-auto pt-6">
                <button
                  type="button"
                  className="btn btn-primary w-full"
                  disabled={hasActive || focusCount[focus] === 0}
                  onClick={() => onStartPractice(focus, size)}
                >
                  {focusCount[focus] === 0 ? "Nothing to practise here yet" : "Start practice"}
                </button>
              </div>
            </div>
          </section>

          <section className="mt-16">
            <div className="rule-ticks" />
            <h2 className="mt-6 text-heading">Fortschritt · Progress</h2>
            <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-5">
              <div className="col-span-2 md:col-span-1">
                <dt className="text-sm text-muted">Latest mock exam</dt>
                <dd className="mt-1 text-5xl font-semibold">
                  {lastExam ? lastExam.correct : "–"}
                  <span className="text-xl text-muted">/{EXAM.total}</span>
                </dd>
                {lastExam && (
                  <dd className="mt-1">
                    <span
                      className={`chip ${passed(lastExam.correct) ? "chip-accent" : "chip-rust"}`}
                    >
                      {passed(lastExam.correct) ? "Passed" : "Below pass mark"}
                    </span>
                  </dd>
                )}
              </div>
              <Stat label="Average, last 3" value={avg3 === null ? "–" : avg3.toFixed(1)} />
              <Stat label="Best" value={best === null ? "–" : String(best)} />
              <Stat
                label="Mock exams passed"
                value={
                  passRate === null
                    ? "–"
                    : `${exams.filter((s) => passed(s.correct)).length}/${exams.length}`
                }
              />
              <Stat
                label="Day streak"
                value={String(streak(sessions))}
                note={sessions.length ? undefined : "Practise daily"}
              />
            </dl>
            <div className="mt-10">
              <ScoreChart sessions={sessions} examDate={settings.examDate} />
            </div>
          </section>

          <section className="mt-16">
            <h2 className="text-heading">Fragenkatalog · Catalogue coverage</h2>
            <p className="mt-2 text-muted">
              {pool.length} questions can come up for you: 300 general and 10 about{" "}
              {stateName(state)}. A question counts as mastered after two correct answers in a row.
            </p>
            <MasteryBar counts={counts} total={pool.length} />
          </section>

          {weak.length > 0 && (
            <section className="mt-16">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-heading">Schwachstellen · Weak spots</h2>
                <button
                  type="button"
                  className="btn"
                  disabled={hasActive}
                  onClick={() =>
                    onStartPractice(
                      "selected",
                      weak.length,
                      weak.map((w) => w.question.id),
                    )
                  }
                >
                  Practise these {weak.length}
                </button>
              </div>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {weak.map(({ question: q, stat }) => (
                  <li key={q.id} className="grid gap-x-10 gap-y-1 py-4 md:grid-cols-2">
                    <div className="min-w-0">
                      <p className="folio-mark">{label(q)}</p>
                      <p lang="de" className="mt-0.5">
                        {q.de.q}
                      </p>
                      <p lang="de" className="mt-1 font-semibold text-accent">
                        {q.de.o[q.answer]}
                      </p>
                    </div>
                    <div className="min-w-0 text-muted md:pt-5">
                      <p lang="en">{q.en.q}</p>
                      <p lang="en" className="mt-1">
                        {q.en.o[q.answer]}
                      </p>
                      <p className="mt-1 text-sm">
                        <History stat={stat} />
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {sessions.length > 0 && (
            <section className="mt-16">
              <h2 className="text-heading">Verlauf · Session history</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[34rem] text-left text-sm tabular-nums">
                  <thead className="text-muted">
                    <tr className="border-b border-line">
                      <th scope="col" className="py-2 pr-4 font-semibold">
                        When
                      </th>
                      <th scope="col" className="py-2 pr-4 font-semibold">
                        Type
                      </th>
                      <th scope="col" className="py-2 pr-4 text-right font-semibold">
                        Score
                      </th>
                      <th scope="col" className="py-2 pr-4 text-right font-semibold">
                        Accuracy
                      </th>
                      <th scope="col" className="py-2 text-right font-semibold">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {sessions
                      .slice()
                      .reverse()
                      .slice(0, 30)
                      .map((s) => (
                        <tr key={s.id}>
                          <td className="py-2 pr-4">{dateFmt.format(new Date(s.startedAt))}</td>
                          <td className="py-2 pr-4">
                            {s.mode === "exam" ? (
                              <span className="chip chip-accent">Mock exam</span>
                            ) : (
                              <span className="chip chip-slate">
                                Practice
                                {s.focus && s.focus !== "selected"
                                  ? ` · ${FOCI.find((f) => f.value === s.focus)?.label}`
                                  : ""}
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-4 text-right font-semibold">
                            {s.correct}/{s.mode === "exam" ? s.questionCount : s.answered}
                          </td>
                          <td className="py-2 pr-4 text-right">{Math.round(accuracy(s) * 100)}%</td>
                          <td className="py-2 text-right text-muted">
                            {s.durationMs
                              ? `${Math.max(1, Math.round(s.durationMs / 60_000))} min`
                              : "–"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="mt-16 border-t border-line pt-8">
            <h2 className="text-heading">Einstellungen · Settings</h2>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="text-sm text-muted">Bundesland</span>
                <StateSelect value={state} onChange={(code) => onSettings({ state: code })} />
              </label>
              <label className="block">
                <span className="text-sm text-muted">Exam date</span>
                <input
                  type="date"
                  className="input mt-1 block w-full"
                  value={settings.examDate}
                  onChange={(e) => e.target.value && onSettings({ examDate: e.target.value })}
                />
              </label>
              <Toggle
                checked={settings.showEnglish}
                onChange={(v) => onSettings({ showEnglish: v })}
                label="Show English next to German"
                hint="Turn off in the last days to check you can read the German alone (press E during a session)."
              />
              <Toggle
                checked={settings.shuffleOptions}
                onChange={(v) => onSettings({ shuffleOptions: v })}
                label="Shuffle answer options"
                hint="Stops you from remembering positions instead of answers. Picture and number options keep their order."
              />
            </div>
          </section>
        </>
      )}

      <footer className="mt-16 border-t border-line pt-6 text-sm text-muted">
        <p>
          Questions and answers:{" "}
          <a className="link" href={catalogue.source.url} target="_blank" rel="noreferrer">
            BAMF Gesamtfragenkatalog
          </a>
          , edition {catalogue.source.edition}. English translations and answer key via{" "}
          <a
            className="link"
            href="https://github.com/lezeroq/lebenindeutschland"
            target="_blank"
            rel="noreferrer"
          >
            lezeroq/lebenindeutschland
          </a>
          ; explanations via{" "}
          <a
            className="link"
            href="https://github.com/abdullahbutt/leben-in-deutschland-test"
            target="_blank"
            rel="noreferrer"
          >
            abdullahbutt/leben-in-deutschland-test
          </a>{" "}
          (both MIT). Progress is stored locally in <code>data/progress.sqlite</code>.
        </p>
      </footer>
    </main>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold">{value}</dd>
      {note && <dd className="text-sm text-muted">{note}</dd>}
    </div>
  );
}

function StateSelect({
  value,
  onChange,
}: {
  value: StateCode | null;
  onChange: (code: StateCode) => void;
}) {
  return (
    <select
      className="select mt-2 block w-full max-w-sm"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value as StateCode)}
      aria-label="Bundesland"
    >
      {!value && (
        <option value="" disabled>
          Bundesland wählen · Choose your state
        </option>
      )}
      {catalogue.states.map((s) => (
        <option key={s.code} value={s.code}>
          {s.de}
          {s.en !== s.de ? ` (${s.en})` : ""}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1.5 size-4 accent-[var(--color-accent)]"
      />
      <span>
        <span className="font-semibold">{label}</span>
        <span className="block text-sm text-muted">{hint}</span>
      </span>
    </label>
  );
}

function MasteryBar({ counts, total }: { counts: Record<Mastery, number>; total: number }) {
  return (
    <div className="mt-5">
      <div
        className="flex h-2 gap-[2px] overflow-hidden rounded-full"
        role="img"
        aria-label={MASTERY_ORDER.map((k) => `${MASTERY_LABEL[k].en}: ${counts[k]}`).join(", ")}
      >
        {MASTERY_ORDER.map((k) =>
          counts[k] > 0 ? (
            <div
              key={k}
              style={{ width: `${(counts[k] / total) * 100}%`, background: MASTERY_FILL[k] }}
              className="first:rounded-l-full last:rounded-r-full"
            />
          ) : null,
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {MASTERY_ORDER.map((k) => (
          <li key={k} className="inline-flex items-center gap-2">
            <span
              className="inline-block size-2.5 rounded-sm"
              style={{ background: MASTERY_FILL[k] }}
              aria-hidden="true"
            />
            <span className="font-semibold tabular-nums">{counts[k]}</span>
            <span className="text-muted">
              {MASTERY_LABEL[k].de} · {MASTERY_LABEL[k].en}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
