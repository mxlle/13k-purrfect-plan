import { getShortLanguageName } from "../utils/language-util";
import { enTranslations } from "./en";
import { getDeTranslationMap } from "./de";
import { TranslationKey } from "./translationKey";
import { HAS_SHORT_TEXTS } from "../env-utils";

function getTranslationRecords(): Record<TranslationKey, string> {
  if (import.meta.env.GERMAN_ENABLED === "true") {
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

  if (import.meta.env.GERMAN_ENABLED === "true") {
    if (isGermanLanguage()) {
      language = "de";
    }
  }

  document.documentElement.setAttribute("lang", language);

  const translation = getTranslationRecords()[key];

  if (HAS_SHORT_TEXTS) {
    return translation;
  }

  return translation.replace(/\{(\d+)}/g, ([v, i]) => args[i]);
}
