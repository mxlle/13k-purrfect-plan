import { Difficulty } from "../types";

export const difficultyEmoji: Record<Difficulty, string> = {
  [Difficulty.EASY]: "💚",
  [Difficulty.MEDIUM]: "🟡",
  [Difficulty.HARD]: "🟥",
};

const DIFFICULTY_SYMBOL = "●";

export function getDifficultyRepresentation(difficulty: Difficulty): string {
  return Array.from({ length: difficulty }, () => DIFFICULTY_SYMBOL).join("");
}
