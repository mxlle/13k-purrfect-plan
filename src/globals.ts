import { GameMetaData, Settings } from "./types";
import { getLocalStorageItem, LocalStorageKey } from "./utils/local-storage";
import { Difficulty, difficultySettings } from "./logic/difficulty";
import { INITIAL_MOTHER_CAT, PlacedCat } from "./logic/data/cats";
import { GameFieldData } from "./logic/data/cell";
import { allInConfig, Config } from "./logic/config";

interface GameGlobals {
  config: Config;
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
  moves: number;
}

const onboardingStepSetting = getLocalStorageItem(LocalStorageKey.ONBOARDING_STEP);
const difficultySetting = getLocalStorageItem(LocalStorageKey.DIFFICULTY);

const initialDifficulty: Difficulty = difficultySetting ? Number(difficultySetting) : Difficulty.EASY;
const initialSettings = difficultySettings[initialDifficulty];

const defaultGlobals: GameGlobals = {
  config: allInConfig,
  previousOnboardingStep: undefined,
  onboardingStep: onboardingStepSetting ? Number(onboardingStepSetting) : 0,
  gameFieldData: [],
  placedCats: [],
  motherCat: INITIAL_MOTHER_CAT,
  language: "en",
  difficulty: initialDifficulty,
  settings: initialSettings,
  isWon: false,
  moves: 0,
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
  return !globals.isWon && globals.gameFieldData.length > 0 && globals.placedCats.length > 0;
}
