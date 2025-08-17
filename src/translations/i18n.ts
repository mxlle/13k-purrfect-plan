import { getShortLanguageName } from "../utils/language-util";
import { enTranslations } from "./en";
import { getDeTranslationMap } from "./de";

export const enum TranslationKey {
  START_GAME,
  NEW_GAME,
  RESTART_GAME,
  WIN,
  CONTINUE,
  BACK,
  DIFFICULTY,
  DIFFICULTY_EASY,
  DIFFICULTY_MEDIUM,
  DIFFICULTY_HARD,
  DIFFICULTY_EXTREME,
  MOVES,
  HIGHSCORE,
  AVERAGE,
}

function getTranslationRecords(): Record<TranslationKey, string> {
  if (process.env.GERMAN_ENABLED === "true") {
    if (isGermanLanguage()) {
      return getDeTranslationMap();
    }
  }

  return enTranslations;
}

export function isGermanLanguage() {
  return getShortLanguageName(navigator.language) === "de";
}

export function getTranslation(key, ...args) {
  let language = "en";

  if (process.env.GERMAN_ENABLED === "true") {
    if (isGermanLanguage()) {
      language = "de";
    }
  }

  document.documentElement.setAttribute("lang", language);

  let translation = getTranslationRecords()[key];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const regex = new RegExp(`\\{${i}\\}`, "g");
    translation = translation.replace(regex, arg);
  }

  return translation;
}
