import { getTranslation, TranslationKey } from "../translations/i18n";
import { Settings } from "../types";
import { globals } from "../globals";
import { getLocalStorageItem, LocalStorageKey, setLocalStorageItem } from "../utils/local-storage";

export const enum Difficulty {
  EASY,
  MEDIUM,
  HARD,
  EXTREME,
}

export interface DifficultyStats {
  highscore: number;
  average: number;
  count: number;
}

export function setDifficulty(difficulty: Difficulty) {
  globals.settings = difficultySettings[difficulty];
  globals.difficulty = difficulty;
  setLocalStorageItem(LocalStorageKey.DIFFICULTY, difficulty.toString());
}

export const difficulties = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.EXTREME];

export const difficultySettings: Record<Difficulty, Settings> = {
  [Difficulty.EASY]: {
    minAmount: 2,
    maxAmount: 2,
  },
  [Difficulty.MEDIUM]: {
    minAmount: 3,
    maxAmount: 3,
  },
  [Difficulty.HARD]: {
    minAmount: 4,
    maxAmount: 4,
  },
  [Difficulty.EXTREME]: {
    minAmount: 4,
    maxAmount: 4,
  },
};

export const difficultyEmoji: Record<Difficulty, string> = {
  [Difficulty.EASY]: "💚",
  [Difficulty.MEDIUM]: "🟡",
  [Difficulty.HARD]: "🟥",
  [Difficulty.EXTREME]: "💀",
};

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

export function getDifficultyStats(difficulty: Difficulty): DifficultyStats {
  const storedScoreStats = getLocalStorageItem(getStorageKey(difficulty));

  if (!storedScoreStats) return { highscore: 0, average: 0, count: 0 };

  const [highscore, average, count] = storedScoreStats.split(",").map(Number);

  return { highscore, average, count };
}

export function setDifficultyStats(difficulty: Difficulty, score: number) {
  const stats = getDifficultyStats(difficulty);
  console.log(stats);
  const newCount = stats.count + 1;
  const newAverage = Math.round((stats.average * stats.count + score) / newCount);

  setLocalStorageItem(getStorageKey(difficulty), [Math.max(stats.highscore, score), newAverage, newCount].join(","));
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
