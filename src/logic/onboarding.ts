import { Direction } from "../types";
import { globals } from "../globals";
import { LocalStorageKey, setLocalStorageItem } from "../utils/local-storage";
import type { IntRange } from "type-fest";
import { CatId, getCat, PlacedCat } from "./data/cats";
import { CellType, getCellTypePlaceholders } from "./data/cell";

export const enum OnboardingStep {
  INTRO = 0,
  LAST_SETUP = 1,
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
  arrow?: {
    row: number;
    column: number;
    direction: Direction;
  };
}

type BaseFieldIndex = IntRange<0, 9>;

type ShortCharacterDefinition = [awake: 0 | 1, rowIndex: BaseFieldIndex, columnIndex: BaseFieldIndex];

// a 4 by 4 grid
const onboardingField = (() => {
  const { _ } = getCellTypePlaceholders();
  return [
    [_, _, _, _],
    [_, _, _, _],
    [_, _, _, _],
    [_, _, _, _],
  ];
})();

export function getOnboardingData(): OnboardingData | undefined {
  const step = globals.onboardingStep;

  switch (step) {
    case OnboardingStep.INTRO:
      return getOnboardingDataForIntro();
    case OnboardingStep.LAST_SETUP:
      return getOnboardingDataForLastSetup();
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

function getOnboardingDataForIntro(): OnboardingData {
  const short: ShortCharacterDefinition[] = [
    [1, 1, 0],
    [1, 3, 3],
  ];

  return {
    field: onboardingField,
    characters: getCatsWithPositionFromShortDescription(short),
    // arrow: {
    //   row: 1,
    //   column: 0,
    //   direction: Direction.UP,
    // },
  };
}

type InitialSetup = (CellType | CatId)[][];

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

function getOnboardingDataForLastSetup(): OnboardingData {
  return {
    field: getBaseFieldFromInitialSetup(lastSetup),
    characters: getCatsFromInitialSetup(lastSetup),
  };
}

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

function getCatsWithPositionFromShortDescription(short: ShortCharacterDefinition[]): PlacedCat[] {
  return short.map(([awake, rowIndex, columnIndex], index: number) => {
    return {
      ...getCat(index),
      awake: Boolean(awake),
      row: rowIndex,
      column: columnIndex,
    };
  });
}
