import { defineEnum } from "./enums";

const LOCAL_STORAGE_PREFIX = "mxlle13";

export type LocalStorageKey = defineEnum<typeof LocalStorageKey>;
export const LocalStorageKey = defineEnum({
  MUTED: "muted",
  ONBOARDING_STEP: "onbStep",
  DIFFICULTY: "d8y",
  DIFFICULTY_EASY: "d8y0",
  DIFFICULTY_MEDIUM: "d8y1",
  DIFFICULTY_HARD: "d8y2",
  DIFFICULTY_EXTREME: "d8y3",
  SOUND: "sound",
  KNOWN_CONFIG_ELEMENTS: "knownConfig",
});

export function setLocalStorageItem(key: LocalStorageKey, value: string | false, postfix?: string) {
  if (value === false) {
    removeLocalStorageItem(key);
    return;
  }

  localStorage.setItem(LOCAL_STORAGE_PREFIX + "." + key + (postfix ? "." + postfix : ""), value);
}

export function getLocalStorageItem(key: LocalStorageKey, postfix?: string) {
  return localStorage.getItem(LOCAL_STORAGE_PREFIX + "." + key + (postfix ? "." + postfix : ""));
}

export function removeLocalStorageItem(key: LocalStorageKey, postfix?: string) {
  localStorage.removeItem(LOCAL_STORAGE_PREFIX + "." + key + (postfix ? "." + postfix : ""));
}

export function getArrayFromStorage(key: LocalStorageKey) {
  const item = getLocalStorageItem(key);
  if (!item) {
    return [];
  }

  return item.split(",");
}
