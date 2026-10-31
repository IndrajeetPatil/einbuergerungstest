import { useCallback, useEffect, useState } from "react";
import { questions } from "./catalogue.ts";
import { CatalogueView } from "./components/CatalogueView.tsx";
import { Dashboard } from "./components/Dashboard.tsx";
import { QuizView } from "./components/QuizView.tsx";
import { ResultsView } from "./components/ResultsView.tsx";
import { api } from "./lib/api.ts";
import { daysUntil, drawExam, practiceQuestions } from "./lib/quiz.ts";
import { createSession, load, save, type ActiveSession } from "./lib/session.ts";
import type { Focus, SessionSummary, Settings, Summary } from "./lib/types.ts";

type View =
  | { name: "dashboard" }
  | { name: "catalogue" }
  | { name: "session" }
  | { name: "results"; summary: SessionSummary; session: ActiveSession };

function viewFromHash(): View {
  return location.hash === "#katalog" ? { name: "catalogue" } : { name: "dashboard" };
}

export default function App() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [active, setActive] = useState<ActiveSession | null>(load);
  const [view, setView] = useState<View>(viewFromHash);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setSummary(await api.summary());
    } catch (e) {
      setError(`Could not reach the local progress database: ${(e as Error).message}`);
    }
  }, []);

  useEffect(() => {
    let live = true;
    api.summary().then(
      (s) => live && setSummary(s),
      (e: Error) => live && setError(`Could not reach the local progress database: ${e.message}`),
    );
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const onHash = () => {
      if (view.name !== "session") setView(viewFromHash());
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [view.name]);

  const updateActive = useCallback((s: ActiveSession | null) => {
    save(s);
    setActive(s);
  }, []);

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      if (!summary) return;
      setSummary({ ...summary, settings: { ...summary.settings, ...patch } });
      try {
        const settings = await api.updateSettings(patch);
        setSummary((s) => (s ? { ...s, settings } : s));
      } catch (e) {
        setError(`Could not save settings: ${(e as Error).message}`);
      }
    },
    [summary],
  );

  const start = useCallback(
    async (mode: "exam" | "practice", focus: Focus | null, picked: typeof questions) => {
      if (!summary?.settings.state || picked.length === 0) return;
      const { state, shuffleOptions } = summary.settings;
      try {
        const { id } = await api.startSession({
          mode,
          focus,
          state,
          questionCount: picked.length,
        });
        updateActive(createSession(id, mode, focus, state, [...picked], shuffleOptions));
        setView({ name: "session" });
      } catch (e) {
        setError(`Could not start a session: ${(e as Error).message}`);
      }
    },
    [summary, updateActive],
  );

  const startExam = useCallback(() => {
    if (!summary?.settings.state) return;
    void start("exam", null, drawExam(questions, summary.settings.state));
  }, [start, summary]);

  const startPractice = useCallback(
    (focus: Focus, size: number, ids: string[] = []) => {
      if (!summary?.settings.state) return;
      const picked = practiceQuestions(
        questions,
        summary.settings.state,
        focus,
        summary.stats,
        size,
        ids,
      );
      void start("practice", focus, picked);
    },
    [start, summary],
  );

  const discard = useCallback(async () => {
    if (!active) return;
    updateActive(null);
    setView({ name: "dashboard" });
    try {
      await api.discard(active.id);
    } finally {
      void refresh();
    }
  }, [active, refresh, updateActive]);

  const days = summary ? daysUntil(summary.settings.examDate) : null;
  const inSession = view.name === "session" && active;

  return (
    <div className="min-h-dvh">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-sm focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3 md:px-8">
          <a
            href="#"
            className="font-serif text-lg font-semibold"
            onClick={(e) => {
              if (inSession) e.preventDefault();
            }}
            aria-disabled={inSession ? true : undefined}
          >
            Leben in Deutschland
          </a>
          {!inSession && (
            <nav aria-label="Main" className="flex items-center gap-1 text-sm">
              <a
                href="#"
                className={`rounded-sm px-3 py-2 ${view.name !== "catalogue" ? "font-semibold text-accent" : "text-muted hover:text-ink"}`}
                aria-current={view.name === "dashboard" ? "page" : undefined}
              >
                Übersicht
              </a>
              <a
                href="#katalog"
                className={`rounded-sm px-3 py-2 ${view.name === "catalogue" ? "font-semibold text-accent" : "text-muted hover:text-ink"}`}
                aria-current={view.name === "catalogue" ? "page" : undefined}
              >
                Fragenkatalog
              </a>
              {days !== null && days >= 0 && (
                <span className="chip chip-accent ml-3 hidden sm:inline-flex">
                  {days === 0 ? "Exam today" : `${days} ${days === 1 ? "day" : "days"} to exam`}
                </span>
              )}
            </nav>
          )}
          {inSession && (
            <button
              type="button"
              className="btn btn-quiet min-h-9 text-sm"
              onClick={() => setView({ name: "dashboard" })}
            >
              Pause · back to overview
            </button>
          )}
        </div>
      </header>

      {error && (
        <div role="alert" className="mx-auto mt-4 max-w-5xl px-5 md:px-8">
          <div className="flex items-start justify-between gap-4 rounded-md border border-rust/40 bg-surface px-4 py-3 text-rust">
            <p>{error}</p>
            <button type="button" className="text-sm underline" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div id="content">
        {!summary ? (
          <p className="mx-auto max-w-5xl px-5 pt-16 text-muted md:px-8">Loading…</p>
        ) : view.name === "session" && active ? (
          <QuizView
            session={active}
            onChange={updateActive}
            settings={summary.settings}
            stats={summary.stats}
            onToggleEnglish={() =>
              void updateSettings({ showEnglish: !summary.settings.showEnglish })
            }
            onFinished={(result, session) => {
              updateActive(null);
              setView({ name: "results", summary: result, session });
              void refresh();
            }}
            onExit={() => void discard()}
            onError={setError}
          />
        ) : view.name === "results" ? (
          <ResultsView
            summary={view.summary}
            session={view.session}
            settings={summary.settings}
            stats={summary.stats}
            onPracticeMistakes={(ids) => startPractice("selected", ids.length, ids)}
            onExam={startExam}
            onDone={() => setView({ name: "dashboard" })}
          />
        ) : view.name === "catalogue" && summary.settings.state ? (
          <CatalogueView
            state={summary.settings.state}
            settings={summary.settings}
            stats={summary.stats}
          />
        ) : (
          <Dashboard
            summary={summary}
            hasActive={active !== null}
            onResume={() => setView({ name: "session" })}
            onDiscard={() => void discard()}
            onStartExam={startExam}
            onStartPractice={startPractice}
            onSettings={(patch) => void updateSettings(patch)}
          />
        )}
      </div>
    </div>
  );
}
