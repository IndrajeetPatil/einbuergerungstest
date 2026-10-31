// Input checks shared by the progress store.
import { z as zod } from "zod/mini";

import { questions } from "#lib/catalogue.ts";
import type { AnswerInput } from "#lib/schemas.ts";

import { ValidationError } from "./errors.ts";

const ANSWERS = new Map(questions.map((entry) => [entry.id, entry.answer]));

/**
 * Parses untrusted input, turning schema failures into HTTP 400 errors.
 * @param schema - Expected shape.
 * @param value - Untrusted value.
 * @returns The parsed value.
 */
function parse<Schema extends zod.ZodMiniType>(
  schema: Schema,
  value: unknown,
): zod.infer<Schema> {
  const result = zod.safeParse(schema, value);
  if (!result.success) {
    throw new ValidationError(zod.prettifyError(result.error));
  }
  return result.data;
}

/**
 * Judges an answer against the official key.
 * @param input - A validated answer.
 * @returns Whether the chosen option is correct.
 */
function judge(input: AnswerInput): boolean {
  const answer = ANSWERS.get(input.questionId);
  if (answer === undefined) {
    throw new ValidationError(`unknown question ${input.questionId}`);
  }
  return input.chosen === answer;
}

/**
 * Rounds a duration, keeping absent values absent.
 * @param value - Milliseconds, if known.
 * @returns Whole milliseconds, or null.
 */
function roundOrNull(value: number | null | undefined): number | null {
  return value === null || value === undefined ? null : Math.round(value);
}

export { judge, parse, roundOrNull };
