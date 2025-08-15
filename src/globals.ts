import { GameFieldData, GameMetaData, INITIAL_MOTHER_CAT, PlacedCat, Settings } from "./types";
import { getLocalStorageItem, LocalStorageKey } from "./utils/local-storage";
import { Difficulty, difficultySettings } from "./logic/difficulty";

interface GameGlobals {
  previousOnboardingStep: number | undefined;
  onboardingStep: number;
  gameFieldData: GameFieldData;
  motherCat: PlacedCat;
  placedCats: PlacedCat[];
  language: string;
  difficulty: Difficulty;
  settings: Settings;
  isWon: boolean;
  metaData?: GameMetaData;
}

const onboardingStepSetting = getLocalStorageItem(LocalStorageKey.ONBOARDING_STEP);
const difficultySetting = getLocalStorageItem(LocalStorageKey.DIFFICULTY);

const initialDifficulty: Difficulty = difficultySetting ? Number(difficultySetting) : Difficulty.EASY;
const initialSettings = difficultySettings[initialDifficulty];

const defaultGlobals: GameGlobals = {
  previousOnboardingStep: undefined,
  onboardingStep: onboardingStepSetting ? Number(onboardingStepSetting) : 0,
  gameFieldData: [],
  placedCats: [],
  motherCat: INITIAL_MOTHER_CAT,
  language: "en",
  difficulty: initialDifficulty,
  settings: initialSettings,
  isWon: false,
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
