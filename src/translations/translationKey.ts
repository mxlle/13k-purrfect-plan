import { defineEnum } from "../utils/enums";

export type TranslationKey = defineEnum<typeof TranslationKey>;
export const TranslationKey = defineEnum({
  START_GAME: 0,
  NEW_GAME: 1,
  WIN: 2,
  CONTINUE: 3,
  BACK: 4,
  DIFFICULTY: 5,
  DIFFICULTY_EASY: 6,
  DIFFICULTY_MEDIUM: 7,
  DIFFICULTY_HARD: 8,
  DIFFICULTY_EXTREME: 9,
  MOVES: 10,
  HIGHSCORE: 11,
  AVERAGE: 12,
  RESTART_GAME: 13,
  POSSIBLE_SOLUTIONS: 14,
});
