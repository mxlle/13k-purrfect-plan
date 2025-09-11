import { defineEnum } from "./enums";

const LOCAL_STORAGE_PREFIX = "mxlle13";

export type LocalStorageKey = defineEnum<typeof LocalStorageKey>;
export const LocalStorageKey = defineEnum({
  MUTED: "muted",
  ONBOARDING_STEP: "onbStepC",
  SOUND: "sound",
  KNOWN_CONFIG_ELEMENTS: "knownConfig",
  XP: "xp",
});

export function setLocalStorageItem(key: LocalStorageKey, value: string, postfix?: string) {
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
