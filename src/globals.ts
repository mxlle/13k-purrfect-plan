import { Settings } from "./types";
import { getLocalStorageItem, LocalStorageKey } from "./utils/local-storage";
import { Difficulty, difficultySettings } from "./logic/difficulty";
import { GameState } from "./logic/data/game-elements";
import { isWinConditionMet } from "./logic/game-logic";

interface GameGlobals {
  previousOnboardingStep: number | undefined;
  onboardingStep: number;
  gameState: GameState | undefined;
  language: string;
  difficulty: Difficulty;
  settings: Settings;
}

const onboardingStepSetting = getLocalStorageItem(LocalStorageKey.ONBOARDING_STEP);
const difficultySetting = getLocalStorageItem(LocalStorageKey.DIFFICULTY);

const initialDifficulty = difficultySetting ? Number(difficultySetting) as Difficulty : Difficulty.EASY;
const initialSettings = difficultySettings[initialDifficulty];

const defaultGlobals: GameGlobals = {
  previousOnboardingStep: undefined,
  onboardingStep: onboardingStepSetting ? Number(onboardingStepSetting) : 0,
  gameState: undefined,
  language: "en",
  difficulty: initialDifficulty,
  settings: initialSettings,
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
  return globals.gameState !== undefined && !isWinConditionMet(globals.gameState);
}
