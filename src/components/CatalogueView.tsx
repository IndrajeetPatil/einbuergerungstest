import { useDeferredValue, useMemo, useState } from "react";
import { label, questions, stateName } from "../catalogue.ts";
import { MASTERY_LABEL, masteryOf, poolFor, type Mastery } from "../lib/quiz.ts";
import type { QuestionStat, Settings, StateCode } from "../lib/types.ts";
import { History } from "./Feedback.tsx";

const CHIP: Record<Mastery, string> = {
  mastered: "chip-accent",
  once: "chip-slate",
  missed: "chip-rust",
  new: "",
};

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replaceAll("ß", "ss");
}

/** Read-through of every question that can come up, with answers and explanations. */
export function CatalogueView({
  state,
  settings,
  stats,
}: {
  state: StateCode;
  settings: Settings;
  stats: Record<string, QuestionStat>;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Mastery | "all">("all");
  const deferred = useDeferredValue(query);
  const pool = useMemo(() => poolFor(questions, state), [state]);
  const shown = useMemo(() => {
    const needle = fold(deferred.trim());
    return pool.filter((q) => {
      if (filter !== "all" && masteryOf(stats[q.id]) !== filter) return false;
      if (!needle) return true;
      const hay = fold([q.de.q, q.en.q, ...q.de.o, ...q.en.o, label(q), String(q.num)].join(" "));
      return hay.includes(needle);
    });
  }, [deferred, filter, pool, stats]);

  return (
    <main className="mx-auto max-w-5xl px-5 pt-10 pb-24 md:px-8">
      <h1 className="text-title">Fragenkatalog</h1>
      <p className="mt-3 max-w-prose text-lg text-muted">
        All {pool.length} questions that can come up for you (300 general, 10 for {stateName(state)}
        ), with the correct answer and an explanation. Reading is no substitute for answering — use
        it to look things up.
      </p>

      <div className="sticky top-0 z-10 mt-8 flex flex-wrap items-center gap-3 border-b border-line bg-bg py-3">
        <input
          type="search"
          className="input min-w-0 flex-1"
          placeholder="Suchen · Search (German or English)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search questions"
        />
        <select
          className="select"
          value={filter}
          onChange={(e) => setFilter(e.target.value as Mastery | "all")}
          aria-label="Filter by progress"
        >
          <option value="all">All questions</option>
          {(Object.keys(MASTERY_LABEL) as Mastery[]).map((k) => (
            <option key={k} value={k}>
              {MASTERY_LABEL[k].en}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted tabular-nums" aria-live="polite">
          {shown.length} shown
        </span>
      </div>

      <ol className="divide-y divide-line">
        {shown.map((q) => {
          const m = masteryOf(stats[q.id]);
          return (
            <li key={q.id} className="py-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="folio-mark">{label(q)}</span>
                <span className={`chip ${CHIP[m]}`}>{MASTERY_LABEL[m].en}</span>
              </div>
              <div
                className={`mt-2 grid gap-x-10 gap-y-2 ${settings.showEnglish ? "md:grid-cols-2" : ""}`}
              >
                <div className="min-w-0">
                  <p lang="de" className="font-semibold">
                    {q.de.q}
                  </p>
                  <ol className="mt-2 space-y-1">
                    {q.de.o.map((o, i) => (
                      <li
                        key={i}
                        lang="de"
                        className={i === q.answer ? "font-semibold text-accent" : "text-muted"}
                      >
                        {i === q.answer ? "✓ " : "· "}
                        {o}
                      </li>
                    ))}
                  </ol>
                </div>
                {settings.showEnglish && (
                  <div className="min-w-0 text-muted md:border-l md:border-line md:pl-10">
                    <p lang="en">{q.en.q}</p>
                    <ol className="mt-2 space-y-1">
                      {q.en.o.map((o, i) => (
                        <li
                          key={i}
                          lang="en"
                          className={i === q.answer ? "font-semibold text-ink" : ""}
                        >
                          {i === q.answer ? "✓ " : "· "}
                          {o}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
              {q.image && (
                <img
                  src={`/${q.image}`}
                  alt={`Abbildung zu ${q.de.q}`}
                  loading="lazy"
                  decoding="async"
                  className="mt-4 max-h-56 w-auto rounded-md border border-line bg-white p-2"
                />
              )}
              <details className="mt-3">
                <summary className="inline-flex min-h-9 cursor-pointer items-center text-sm font-semibold text-accent">
                  Warum · Why
                </summary>
                <div className="mt-1 max-w-prose space-y-2 text-[0.95rem]">
                  <p lang="en">{q.explanation.en}</p>
                  {q.explanation.de && (
                    <p lang="de" className="text-muted">
                      {q.explanation.de}
                    </p>
                  )}
                  {stats[q.id] && (
                    <p className="text-sm text-muted">
                      <History stat={stats[q.id]!} />
                    </p>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
