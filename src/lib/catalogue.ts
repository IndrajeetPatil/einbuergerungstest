// The bundled question catalogue, validated once at start-up.
import data from "#data/catalogue.json" with { type: "json" };

import { catalogueSchema } from "./schemas.ts";
import type { Catalogue, Question, StateCode } from "./schemas.ts";

const catalogue: Catalogue = catalogueSchema.parse(data);
const questions: readonly Question[] = catalogue.questions;
const byId = new Map(questions.map((entry) => [entry.id, entry]));

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

/**
 * Looks up a question by id.
 * @param id - Catalogue id such as `g21` or `BE3`.
 * @returns The question.
 */
function question(id: string): Question {
  const found = byId.get(id);
  if (found === undefined) {
    throw new Error(`unknown question ${id}`);
  }
  return found;
}

/**
 * Text of one option in one language.
 * @param entry - The question.
 * @param option - Catalogue option index.
 * @param lang - Language.
 * @returns The option text, or an empty string for an invalid index.
 */
function optionText(
  entry: Question,
  option: number,
  lang: "de" | "en",
): string {
  return entry[lang].o[option] ?? "";
}

/**
 * Names a federal state.
 * @param code - Two-letter state code, or null.
 * @param lang - Language of the name.
 * @returns The state's name, or an empty string.
 */
function stateName(code: StateCode | null, lang: "de" | "en" = "de"): string {
  return catalogue.states.find((state) => state.code === code)?.[lang] ?? "";
}

/**
 * Human-facing label of a question, such as "Frage 57" or "Berlin 4".
 * @param entry - The question.
 * @returns The label.
 */
function label(entry: Question): string {
  return entry.state === null
    ? `Frage ${entry.num}`
    : `${stateName(entry.state)} ${entry.num}`;
}

export {
  catalogue,
  label,
  OPTION_KEYS,
  optionText,
  question,
  questions,
  stateName,
};
