import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { EXAM, accuracy } from "../lib/quiz.ts";
import type { SessionSummary } from "../lib/types.ts";

const HEIGHT = 300;
const M = { top: 18, right: 18, bottom: 34, left: 46 };
const DAY = 86_400_000;
const PASS = EXAM.passMark / EXAM.total;

const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const fullFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface Point {
  s: SessionSummary;
  t: number;
  v: number;
  x: number;
  y: number;
}

function startOfDay(t: number): number {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Score over time on one percent axis: mock-exam scores as a line (the thing that must climb
 * past the pass mark) and practice-session accuracy as dots, with the exam date marked.
 */
export function ScoreChart({
  sessions,
  examDate,
}: {
  sessions: SessionSummary[];
  examDate: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<Point | null>(null);
  const [now] = useState(() => Date.now());

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry!.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const model = useMemo(() => {
    const [y, m, d] = examDate.split("-").map(Number);
    const examT = new Date(y!, m! - 1, d!).getTime();
    const times = sessions.map((s) => Date.parse(s.startedAt));
    const today = startOfDay(now);
    const t0 = Math.min(today - 6 * DAY, ...times.map(startOfDay));
    const t1 = Math.max(examT, today) + DAY;
    const innerW = Math.max(width - M.left - M.right, 100);
    const innerH = HEIGHT - M.top - M.bottom;
    const x = (t: number) => M.left + ((t - t0) / (t1 - t0)) * innerW;
    const yScale = (v: number) => M.top + (1 - v) * innerH;
    const toPoint = (s: SessionSummary): Point => {
      const t = Date.parse(s.startedAt);
      const v = accuracy(s);
      return { s, t, v, x: x(t), y: yScale(v) };
    };
    const exams = sessions.filter((s) => s.mode === "exam").map(toPoint);
    const practice = sessions.filter((s) => s.mode === "practice" && s.answered > 0).map(toPoint);
    const spanDays = (t1 - t0) / DAY;
    const step = spanDays <= 18 ? 1 : spanDays <= 45 ? 7 : 14;
    const ticks: number[] = [];
    for (let t = startOfDay(t0); t <= t1; t += step * DAY) ticks.push(t);
    return { examT, exams, practice, x, y: yScale, ticks, innerW, step };
  }, [examDate, now, sessions, width]);

  const all = [...model.exams, ...model.practice];
  const onMove = (e: PointerEvent<SVGRectElement>) => {
    if (all.length === 0) return;
    const box = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - box.left + M.left;
    const py = e.clientY - box.top + M.top;
    let best = all[0]!;
    let bestD = Infinity;
    for (const p of all) {
      const dist = Math.abs(p.x - px) * 4 + Math.abs(p.y - py);
      if (dist < bestD) {
        bestD = dist;
        best = p;
      }
    }
    setHover(best);
  };

  const path = model.exams.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join("");
  const examX = model.x(model.examT + DAY / 2);
  const last = model.exams.at(-1);

  return (
    <div ref={wrap} className="relative">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`Scores over time: ${model.exams.length} mock exams and ${model.practice.length} practice sessions. Details are in the session table below.`}
        className="block overflow-visible"
      >
        {/* Recessive percent grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line
              x1={M.left}
              x2={width - M.right}
              y1={model.y(v)}
              y2={model.y(v)}
              stroke="var(--color-line)"
            />
            <text
              x={M.left - 10}
              y={model.y(v)}
              dy="0.32em"
              textAnchor="end"
              className="fill-muted text-[11px] tabular-nums"
            >
              {v * 100}%
            </text>
          </g>
        ))}
        {/* Date ticks */}
        {model.ticks.map((t) => (
          <g key={t}>
            <line
              x1={model.x(t)}
              x2={model.x(t)}
              y1={HEIGHT - M.bottom}
              y2={HEIGHT - M.bottom + 5}
              stroke="var(--color-muted)"
              strokeOpacity={0.6}
            />
            {(model.step > 1 || (t - model.ticks[0]!) % (2 * DAY) === 0 || model.innerW > 760) && (
              <text
                x={model.x(t)}
                y={HEIGHT - M.bottom + 19}
                textAnchor="middle"
                className="fill-muted text-[11px] tabular-nums"
              >
                {dayFmt.format(t)}
              </text>
            )}
          </g>
        ))}
        {/* Pass mark */}
        <line
          x1={M.left}
          x2={width - M.right}
          y1={model.y(PASS)}
          y2={model.y(PASS)}
          stroke="var(--color-muted)"
          strokeWidth={1}
        />
        <text
          x={examX - 8}
          y={model.y(PASS) + 16}
          textAnchor="end"
          className="fill-muted text-[11px] font-semibold tracking-wide uppercase"
        >
          Pass mark {EXAM.passMark}/{EXAM.total}
        </text>
        {/* Exam day */}
        <line
          x1={examX}
          x2={examX}
          y1={M.top}
          y2={HEIGHT - M.bottom}
          stroke="var(--color-accent)"
          strokeWidth={1}
        />
        <text
          x={examX - 6}
          y={M.top + 10}
          textAnchor="end"
          className="fill-accent text-[11px] font-semibold tracking-wide uppercase"
        >
          Prüfung · Exam
        </text>

        {/* Practice accuracy */}
        {model.practice.map((p) => (
          <circle
            key={p.s.id}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="var(--color-slate)"
            stroke="var(--color-surface)"
            strokeWidth={2}
          />
        ))}
        {/* Mock exams */}
        <path
          d={path}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {model.exams.map((p) => (
          <circle
            key={p.s.id}
            cx={p.x}
            cy={p.y}
            r={4.5}
            fill="var(--color-accent)"
            stroke="var(--color-surface)"
            strokeWidth={2}
          />
        ))}
        {last && (
          <text
            x={last.x + 9}
            y={last.y}
            dy="0.32em"
            className="fill-ink text-[12px] font-semibold tabular-nums"
          >
            {last.s.correct}/{last.s.questionCount}
          </text>
        )}

        {hover && (
          <g pointerEvents="none">
            <line
              x1={hover.x}
              x2={hover.x}
              y1={M.top}
              y2={HEIGHT - M.bottom}
              stroke="var(--color-ink)"
              strokeOpacity={0.35}
            />
            <circle
              cx={hover.x}
              cy={hover.y}
              r={6.5}
              fill="none"
              stroke={hover.s.mode === "exam" ? "var(--color-accent)" : "var(--color-slate)"}
              strokeWidth={1.5}
            />
          </g>
        )}
        <rect
          x={M.left}
          y={M.top}
          width={Math.max(width - M.left - M.right, 0)}
          height={HEIGHT - M.top - M.bottom}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 min-w-44 rounded-md border border-line bg-surface px-3 py-2 text-sm"
          style={{
            // Beside the point, never on top of it.
            left: hover.x + 204 < width ? hover.x + 14 : Math.max(hover.x - 204, 0),
            top: Math.min(Math.max(hover.y - 40, 0), HEIGHT - 96),
          }}
        >
          <p className="font-semibold tabular-nums">
            {hover.s.correct}/{hover.s.mode === "exam" ? hover.s.questionCount : hover.s.answered}{" "}
            <span className="font-normal text-muted">({Math.round(hover.v * 100)}%)</span>
          </p>
          <p className="flex items-center gap-2 text-muted">
            <span
              className="inline-block h-0.5 w-3 rounded-full"
              style={{
                background: hover.s.mode === "exam" ? "var(--color-accent)" : "var(--color-slate)",
              }}
            />
            {hover.s.mode === "exam" ? "Mock exam" : "Practice"}
          </p>
          <p className="text-xs text-muted">{fullFmt.format(hover.t)}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-2">
          <svg width="22" height="10" aria-hidden="true">
            <line x1="1" x2="21" y1="5" y2="5" stroke="var(--color-accent)" strokeWidth="2" />
            <circle cx="11" cy="5" r="4" fill="var(--color-accent)" />
          </svg>
          Mock exam score
        </span>
        <span className="inline-flex items-center gap-2">
          <svg width="10" height="10" aria-hidden="true">
            <circle cx="5" cy="5" r="4" fill="var(--color-slate)" />
          </svg>
          Practice session, first-try accuracy
        </span>
      </div>
      {sessions.length === 0 && (
        <p className="absolute inset-x-0 top-24 text-center text-muted">
          Your scores will appear here after the first session.
        </p>
      )}
    </div>
  );
}
