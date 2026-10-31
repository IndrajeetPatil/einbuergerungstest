import data from "./data/catalogue.json";
import type { Catalogue, Question, StateCode } from "./lib/types.ts";

export const catalogue = data as Catalogue;
export const questions: readonly Question[] = catalogue.questions;
export const byId = new Map(questions.map((q) => [q.id, q]));

export function question(id: string): Question {
  const q = byId.get(id);
  if (!q) throw new Error(`unknown question ${id}`);
  return q;
}

export function stateName(code: StateCode | null, lang: "de" | "en" = "de"): string {
  return catalogue.states.find((s) => s.code === code)?.[lang] ?? "";
}

/** Human-facing number: "Frage 57" or "Berlin 4". */
export function label(q: Question): string {
  return q.state ? `${stateName(q.state)} ${q.num}` : `Frage ${q.num}`;
}

export const OPTION_KEYS = ["A", "B", "C", "D"] as const;
