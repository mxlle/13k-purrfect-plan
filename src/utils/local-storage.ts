const LOCAL_STORAGE_PREFIX = "mxlle13";

export const enum LocalStorageKey {
  MUTED = "muted",
  ONBOARDING_STEP = "onbSt",
  DIFFICULTY = "d8y",
  DIFFICULTY_EASY = "d8y0",
  DIFFICULTY_MEDIUM = "d8y1",
  DIFFICULTY_HARD = "d8y2",
  DIFFICULTY_EXTREME = "d8y3",
}

export function setLocalStorageItem(key: LocalStorageKey, value: string | false) {
  if (value === false) {
    removeLocalStorageItem(key);
    return;
  }

  localStorage.setItem(LOCAL_STORAGE_PREFIX + "." + key, value);
}

export function getLocalStorageItem(key: LocalStorageKey) {
  return localStorage.getItem(LOCAL_STORAGE_PREFIX + "." + key);
}

export function removeLocalStorageItem(key: LocalStorageKey) {
  localStorage.removeItem(LOCAL_STORAGE_PREFIX + "." + key);
}

export function getArrayFromStorage(key: LocalStorageKey) {
  const item = getLocalStorageItem(key);
  if (!item) {
    return [];
  }

  return item.split(",");
}
