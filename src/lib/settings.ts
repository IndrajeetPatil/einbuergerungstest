// Applying a partial settings change.
import type { Settings, SettingsPatch } from "./schemas.ts";

/**
 * Applies the fields a patch sets; absent fields keep their value.
 * @param base - Current settings.
 * @param patch - Fields to change.
 * @returns The merged settings.
 */
function mergeSettings(base: Settings, patch: SettingsPatch): Settings {
  return {
    state: patch.state === undefined ? base.state : patch.state,
    examDate: patch.examDate === undefined ? base.examDate : patch.examDate,
    showEnglish: patch.showEnglish ?? base.showEnglish,
    shuffleOptions: patch.shuffleOptions ?? base.shuffleOptions,
  };
}

export { mergeSettings };
