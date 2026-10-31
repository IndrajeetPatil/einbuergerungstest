import type { Item, Question } from "#lib/schemas.ts";

/** A first-try answer of a finished session, with its question. */
interface ReviewEntry {
  item: Item;
  position: number;
  question: Question;
}

export type { ReviewEntry };
