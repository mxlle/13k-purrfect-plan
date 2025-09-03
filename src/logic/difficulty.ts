import { getTranslation } from "../translations/i18n";
import { Difficulty } from "../types";
import { LocalStorageKey } from "../utils/local-storage";
import { TranslationKey } from "../translations/translationKey";

export const difficultyEmoji: Record<Difficulty, string> = {
  [Difficulty.EASY]: "💚",
  [Difficulty.MEDIUM]: "🟡",
  [Difficulty.HARD]: "🟥",
  [Difficulty.EXTREME]: "💀",
};

const DIFFICULTY_SYMBOL = "●";

export function getDifficultyRepresention(difficulty: Difficulty): string {
  return Array.from({ length: difficulty }, () => DIFFICULTY_SYMBOL).join("");
}

export function getDifficultyText(difficulty: Difficulty): string {
  switch (difficulty) {
    case Difficulty.EASY:
      return getTranslation(TranslationKey.DIFFICULTY_EASY);
    case Difficulty.MEDIUM:
      return getTranslation(TranslationKey.DIFFICULTY_MEDIUM);
    case Difficulty.HARD:
      return getTranslation(TranslationKey.DIFFICULTY_HARD);
    case Difficulty.EXTREME:
      return getTranslation(TranslationKey.DIFFICULTY_EXTREME);
  }
}

function getStorageKey(difficulty: Difficulty): LocalStorageKey {
  switch (difficulty) {
    case Difficulty.EASY:
      return LocalStorageKey.DIFFICULTY_EASY;
    case Difficulty.MEDIUM:
      return LocalStorageKey.DIFFICULTY_MEDIUM;
    case Difficulty.HARD:
      return LocalStorageKey.DIFFICULTY_HARD;
    case Difficulty.EXTREME:
      return LocalStorageKey.DIFFICULTY_EXTREME;
  }
}
