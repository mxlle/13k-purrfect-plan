import { getRandomItem, removeDuplicates } from "./array-utils";

export function getLanguagesFromVoices(voices: SpeechSynthesisVoice[]) {
  return removeDuplicates(
    voices
      .map((voice) => {
        return getShortLanguageName(voice.lang);
      })
      .filter((lang) => lang)
  );
}

export function getShortLanguageName(lang: string) {
  return lang?.slice(0, 2);
}

export function getDefaultLanguage(long = false) {
  return long ? navigator.language : getShortLanguageName(navigator.language);
}

export function getLanguagesWithoutDefault(
  languages: string[],
  defaultLanguage = getDefaultLanguage()
) {
  return languages.filter((lang) => lang !== defaultLanguage);
}

export function getLanguageForGame(
  languages: string[],
  useNonDefaultLanguage = false
) {
  if (useNonDefaultLanguage) {
    languages = getLanguagesWithoutDefault(languages);
  }

  return getRandomItem(languages);
}
