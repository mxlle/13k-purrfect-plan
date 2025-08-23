import { TranslationKey } from "./translationKey";

export function getDeTranslationMap(): Record<TranslationKey, string> {
  if (import.meta.env.GERMAN_ENABLED === "true") {
    return deTranslations;
  }

  throw new Error("German language is not enabled.");
}

const deTranslations: Record<TranslationKey, string> = {
  [TranslationKey.START_GAME]: "Spiel starten",
  [TranslationKey.NEW_GAME]: "Neues Spiel",
  [TranslationKey.RESTART_GAME]: "Wiederholen",
  [TranslationKey.WIN]: "Gewonnen 🎉",
  [TranslationKey.CONTINUE]: "Weiter",
  [TranslationKey.BACK]: "Zurück",
  [TranslationKey.DIFFICULTY]: "Schwierigkeit",
  [TranslationKey.DIFFICULTY_EASY]: "Leicht",
  [TranslationKey.DIFFICULTY_MEDIUM]: "Mittel",
  [TranslationKey.DIFFICULTY_HARD]: "Schwer",
  [TranslationKey.DIFFICULTY_EXTREME]: "Extrem",
  [TranslationKey.MOVES]: "Züge",
  [TranslationKey.HIGHSCORE]: "Top:",
  [TranslationKey.AVERAGE]: "Ø",
};
