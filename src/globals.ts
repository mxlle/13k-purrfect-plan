import { GameMetaData, Settings, TurnMove } from "./types";
import { getLocalStorageItem, LocalStorageKey } from "./utils/local-storage";
import { Difficulty, difficultySettings } from "./logic/difficulty";
import { INITIAL_MOTHER_CAT, PlacedCat } from "./logic/data/cats";
import { allInConfig, Config } from "./logic/config";
import { PlacedObject } from "./logic/data/objects";
import { DEFAULT_FIELD_SIZE, FieldSize } from "./logic/data/field-size";

interface GameGlobals {
  config: Config;
  previousOnboardingStep: number | undefined;
  onboardingStep: number;
  fieldSize: FieldSize;
  motherCat: PlacedCat;
  placedCats: PlacedCat[];
  placedObjects: PlacedObject[];
  language: string;
  difficulty: Difficulty;
  settings: Settings;
  isWon: boolean;
  metaData?: GameMetaData;
  moves: TurnMove[];
  par?: number;
}

const onboardingStepSetting = getLocalStorageItem(LocalStorageKey.ONBOARDING_STEP);
const difficultySetting = getLocalStorageItem(LocalStorageKey.DIFFICULTY);

const initialDifficulty: Difficulty = difficultySetting ? Number(difficultySetting) : Difficulty.EASY;
const initialSettings = difficultySettings[initialDifficulty];

const defaultGlobals: GameGlobals = {
  config: allInConfig,
  previousOnboardingStep: undefined,
  onboardingStep: onboardingStepSetting ? Number(onboardingStepSetting) : 0,
  fieldSize: DEFAULT_FIELD_SIZE,
  motherCat: INITIAL_MOTHER_CAT,
  placedCats: [],
  placedObjects: [],
  language: "en",
  difficulty: initialDifficulty,
  settings: initialSettings,
  isWon: false,
  moves: [],
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
  return !globals.isWon && globals.placedCats.length > 0;
}
