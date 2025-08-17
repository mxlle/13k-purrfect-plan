import { Direction, Tool, TurnMove } from "../types";
import { globals } from "../globals";
import { LocalStorageKey, setLocalStorageItem } from "../utils/local-storage";
import { CatId, getCat, PlacedCat } from "./data/cats";
import { CellType, getCellTypePlaceholders } from "./data/cell";
import { allInConfig, Config, ConfigCategory, emptyConfig } from "../components/config/config-component";

export const enum OnboardingStep {
  INTRO = 0,
  INTRO_SECOND_CAT = 1,
  INTERMEDIATE_MEOW = 2,
  INTERMEDIATE_OBJECTS = 3,
  LAST_SETUP = 4,
}

export function isOnboarding() {
  return globals.onboardingStep !== -1;
}

export function isSameLevel() {
  return globals.onboardingStep === globals.previousOnboardingStep || globals.previousOnboardingStep === undefined;
}

export interface OnboardingData {
  field: CellType[][];
  characters: PlacedCat[];
  highlightedAction?: TurnMove;
  config: Config;
}

export function getOnboardingData(): OnboardingData | undefined {
  const step = globals.onboardingStep;

  switch (step) {
    case OnboardingStep.INTRO:
    case OnboardingStep.INTRO_SECOND_CAT:
      return {
        field: getBaseFieldFromInitialSetup(introSetup),
        characters: getCatsFromInitialSetup(introSetup),
        highlightedAction: step === OnboardingStep.INTRO ? Direction.DOWN : undefined,
        config: {
          ...emptyConfig,
          [ConfigCategory.CATS]: {
            ...emptyConfig[ConfigCategory.CATS],
            [CatId.MOONY]: true,
            [CatId.IVY]: step === OnboardingStep.INTRO_SECOND_CAT,
          },
        },
      };
    case OnboardingStep.INTERMEDIATE_MEOW:
    case OnboardingStep.INTERMEDIATE_OBJECTS:
      return {
        field: getBaseFieldFromInitialSetup(intermediateSetup),
        characters: getCatsFromInitialSetup(intermediateSetup),
        highlightedAction: step === OnboardingStep.INTERMEDIATE_MEOW ? Tool.MEOW : undefined,
        config: {
          ...emptyConfig,
          [ConfigCategory.CATS]: { ...emptyConfig[ConfigCategory.CATS], [CatId.MOONY]: true, [CatId.IVY]: true },
          [ConfigCategory.OBJECTS]: {
            ...emptyConfig[ConfigCategory.OBJECTS],
            [CellType.TREE]: step === OnboardingStep.INTERMEDIATE_OBJECTS,
            [CellType.MOON]: step === OnboardingStep.INTERMEDIATE_OBJECTS,
          },
          [ConfigCategory.TOOLS]: {
            ...emptyConfig[ConfigCategory.TOOLS],
            [Tool.MEOW]: true,
          },
        },
      };
    case OnboardingStep.LAST_SETUP:
      return {
        field: getBaseFieldFromInitialSetup(lastSetup),
        characters: getCatsFromInitialSetup(lastSetup),
        config: allInConfig,
      };
    default:
      return undefined;
  }
}

export function increaseOnboardingStepIfApplicable() {
  if (!isOnboarding()) {
    globals.previousOnboardingStep = undefined;
    return;
  }

  globals.previousOnboardingStep = globals.onboardingStep;

  let step = globals.onboardingStep + 1;

  if (step > OnboardingStep.LAST_SETUP) {
    step = OnboardingStep.LAST_SETUP; // temp: always this //-1;
  }

  globals.onboardingStep = step;
  setLocalStorageItem(LocalStorageKey.ONBOARDING_STEP, step.toString());
}

type InitialSetup = (CellType | CatId)[][];

const introSetup: InitialSetup = (() => {
  const { _, M, t, o, c, T, O, C } = getCellTypePlaceholders();
  return [
    [_, M, _],
    [_, c, _],
    [_, _, t],
  ];
})();

const intermediateSetup: InitialSetup = (() => {
  const { _, M, t, o, c, T, O, C } = getCellTypePlaceholders();
  return [
    [C, _, _, _],
    [_, _, M, _],
    [_, _, T, _],
    [t, _, c, _],
  ];
})();

const lastSetup: InitialSetup = (() => {
  const { _, M, t, o, c, T, O, C } = getCellTypePlaceholders();
  return [
    [C, o, _, _, _],
    [_, _, _, _, O],
    [M, _, _, _, _],
    [_, T, _, _, _],
    [_, _, t, _, c],
  ];
})();

function getBaseFieldFromInitialSetup(initialSetup: InitialSetup): CellType[][] {
  return initialSetup.map((row) => row.map((cell) => (typeof cell === "string" ? cell : CellType.EMPTY)));
}

function getCatsFromInitialSetup(initialSetup: InitialSetup): PlacedCat[] {
  const cats: PlacedCat[] = [];
  initialSetup.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (typeof cell === "number") {
        const catId = cell as CatId;
        const cat = getCat(catId);

        if (cats.some((c) => c.id === catId)) {
          // TODO - remove after development phase
          throw new Error(`Duplicate cat ID found: ${catId}`);
        }

        cats.push({
          ...cat,
          row: rowIndex,
          column: columnIndex,
        });
      }
    });
  });

  cats.sort((a, b) => a.id - b.id); // Sort cats by their ID for consistency

  return cats;
}
