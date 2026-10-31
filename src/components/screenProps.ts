import type { Summary } from "#lib/schemas.ts";
import type { Trainer } from "#lib/useTrainer.ts";

/** What every screen receives: the trainer and the loaded summary. */
interface ScreenProps {
  trainer: Trainer;
  summary: Summary;
}

export type { ScreenProps };
