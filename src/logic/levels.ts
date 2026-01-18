import { getLocalStorageItem, LocalStorageKey, setLocalStorageItem } from "../utils/local-storage";
import { globals } from "../globals";
import { levels, onboardingLevels } from "./level-definition";

export function getCurrentHighestLevelIndex(): number {
  const currentHighestLevelString = getLocalStorageItem(LocalStorageKey.LEVEL) || "-1";
  return parseInt(currentHighestLevelString);
}

export function isOnboardingLevel(levelIndex: number = getCurrentHighestLevelIndex()): boolean {
  return levelIndex < onboardingLevels.length;
}

export function hasMoreLevels(): boolean {
  const currentHighestLevel = getCurrentHighestLevelIndex();
  return currentHighestLevel < levels.length;
}

export function updateAvailableLevels(): void {
  let activeLevel = globals.gameState?.setup.levelIndex ?? -1;

  if (activeLevel === -1) {
    return;
  }

  const currentHighestLevel = getCurrentHighestLevelIndex();

  if (activeLevel < currentHighestLevel) {
    return;
  }

  const newHighestLevel = activeLevel + 1;

  console.debug("updating active level to", readableLevel(newHighestLevel)); // another plus one for humans
  setLocalStorageItem(LocalStorageKey.LEVEL, newHighestLevel.toString());
}

export function readableLevel(levelIndex: number): number {
  return levelIndex + 1;
}

export function getLevelIndexFromHash(hash: string): number {
  const parsedLevelIndex = parseInt(hash);

  if (isNaN(parsedLevelIndex) || parsedLevelIndex > levels.length) {
    return -1;
  }

  const levelIndex = parsedLevelIndex - 1; // minus one for zero-based index

  return Math.min(levelIndex, getCurrentHighestLevelIndex());
}
