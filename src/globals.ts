import { getLocalStorageItem, LocalStorageKey } from "./utils/local-storage";
import { GameElementPositions, GameState } from "./logic/data/game-elements";
import { hasLost, isWinConditionMet } from "./logic/game-logic";

interface GameGlobals {
  previousOnboardingStep: number | undefined;
  onboardingStep: number;
  gameState: GameState | undefined;
  nextPositionsIfWait: GameElementPositions | undefined;
  language: string;
  failedAttempts: number;
}

const onboardingStepSetting = getLocalStorageItem(LocalStorageKey.ONBOARDING_STEP);

const defaultGlobals: GameGlobals = {
  previousOnboardingStep: undefined,
  onboardingStep: onboardingStepSetting ? Number(onboardingStepSetting) : 0,
  gameState: undefined,
  nextPositionsIfWait: undefined,
  language: "en",
  failedAttempts: 0,
};

export const globals: GameGlobals = { ...defaultGlobals };

export function resetGlobals() {
  Object.assign(globals, defaultGlobals);
}

function getNumFromParam(param: string, fallback: number) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const valueParam = urlParams.get(param);
  let num = valueParam ? Number(valueParam) : fallback;
  num = isNaN(num) ? fallback : num;

  return num;
}

export function isGameInProgress(): boolean {
  return globals.gameState !== undefined && !isWinConditionMet(globals.gameState) && !hasLost(globals.gameState);
}
