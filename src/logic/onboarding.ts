import { Direction, Tool, TurnMove } from "../types";
import { globals } from "../globals";
import { LocalStorageKey, setLocalStorageItem } from "../utils/local-storage";
import { ALL_CAT_IDS, CatId, getCat, PlacedCat } from "./data/cats";
import { CellPosition, containsCell, EMPTY_CELL, getCellTypePlaceholders } from "./data/cell";
import { allInConfig, Config, ConfigCategory, emptyConfig } from "./config";
import { getObject, ObjectId, PlacedObject } from "./data/objects";
import { FieldSize } from "./data/field-size";

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
  field: FieldSize;
  cats: PlacedCat[];
  objects: PlacedObject[];
  highlightedAction?: TurnMove;
  config: Config;
}

const lastSetup: InitialSetup = (() => {
  const { _, M, t, o, c, T, O, C } = getCellTypePlaceholders();
  return [
    [C, _, M, _, _],
    [_, _, _, _, O],
    [o, _, _, _, _],
    [_, _, T, _, _],
    [_, t, _, _, c],
  ];
})();

export const defaultPlacedObjects = getPlacedGameElementsFromInitialSetup(lastSetup).objects;

export function getOnboardingData(): OnboardingData | undefined {
  const step = globals.onboardingStep;
  let skipPositions: CellPosition[] = [];

  switch (step) {
    case OnboardingStep.INTRO:
    case OnboardingStep.INTRO_SECOND_CAT:
      const introSetup: InitialSetup = (() => {
        const { _, M, t, o, c, T, O, C } = getCellTypePlaceholders();
        return [
          [_, M, _],
          [_, c, _],
          [_, _, t],
        ];
      })();
      const isFirstStep = step === OnboardingStep.INTRO;
      skipPositions = isFirstStep ? [{ row: 2, column: 2 }] : [];

      return {
        field: getFieldSizeFromInitialSetup(introSetup),
        ...getPlacedGameElementsFromInitialSetup(introSetup, skipPositions),
        highlightedAction: isFirstStep ? Direction.DOWN : undefined,
        config: {
          ...emptyConfig,
        },
      };
    case OnboardingStep.INTERMEDIATE_MEOW:
    case OnboardingStep.INTERMEDIATE_OBJECTS:
      const intermediateSetup: InitialSetup = (() => {
        const { _, M, t, o, c, T, O, C } = getCellTypePlaceholders();
        return [
          [C, _, _, _],
          [_, _, M, _],
          [_, _, T, _],
          [t, _, c, _],
        ];
      })();
      const isMeowStep = step === OnboardingStep.INTERMEDIATE_MEOW;
      skipPositions = isMeowStep
        ? [
            { row: 0, column: 0 },
            { row: 2, column: 2 },
          ]
        : [];

      return {
        field: getFieldSizeFromInitialSetup(intermediateSetup),
        ...getPlacedGameElementsFromInitialSetup(intermediateSetup, skipPositions),
        highlightedAction: step === OnboardingStep.INTERMEDIATE_MEOW ? Tool.MEOW : undefined,
        config: {
          ...emptyConfig,
          [ConfigCategory.CATS]: { ...emptyConfig[ConfigCategory.CATS], [CatId.MOONY]: true, [CatId.IVY]: true },
          [ConfigCategory.OBJECTS]: {
            ...emptyConfig[ConfigCategory.OBJECTS],
            [ObjectId.TREE]: step === OnboardingStep.INTERMEDIATE_OBJECTS,
            [ObjectId.MOON]: step === OnboardingStep.INTERMEDIATE_OBJECTS,
          },
          [ConfigCategory.TOOLS]: {
            ...emptyConfig[ConfigCategory.TOOLS],
            [Tool.MEOW]: true,
          },
        },
      };
    case OnboardingStep.LAST_SETUP:
      return {
        field: getFieldSizeFromInitialSetup(lastSetup),
        ...getPlacedGameElementsFromInitialSetup(lastSetup),
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
    step = -1;
  }

  globals.onboardingStep = step;
  setLocalStorageItem(LocalStorageKey.ONBOARDING_STEP, step.toString());
}

type InitialSetup = (ObjectId | CatId | typeof EMPTY_CELL)[][];

function getFieldSizeFromInitialSetup(initialSetup: InitialSetup): FieldSize {
  const height = initialSetup.length;
  const width = initialSetup[0]?.length || 1;
  return { width, height };
}

interface PlacedGameElements {
  cats: PlacedCat[];
  objects: PlacedObject[];
}

function getPlacedGameElementsFromInitialSetup(initialSetup: InitialSetup, skipPositions: CellPosition[] = []): PlacedGameElements {
  const cats: PlacedCat[] = [];
  const objects: PlacedObject[] = [];
  let lastKitten: PlacedCat | undefined;
  initialSetup.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (containsCell(skipPositions, { row: rowIndex, column: columnIndex })) return;

      if (typeof cell === "number") {
        const catId = cell as CatId;
        const cat = getCat(catId);

        if (cats.some((c) => c.id === catId)) {
          // TODO - remove after development phase
          throw new Error(`Duplicate cat ID found: ${catId}`);
        }

        const placedCat: PlacedCat = {
          ...cat,
          row: rowIndex,
          column: columnIndex,
        };

        cats.push(placedCat);

        lastKitten = placedCat;
      } else if (typeof cell === "string" && cell !== EMPTY_CELL) {
        const gameObject = getObject(cell);

        if (objects.some((o) => o.id === gameObject.id)) {
          // TODO - remove after development phase
          throw new Error(`Duplicate object ID found: ${gameObject.id}`);
        }

        const placedObject: PlacedObject = {
          ...gameObject,
          row: rowIndex,
          column: columnIndex,
        };

        objects.push(placedObject);
      }
    });
  });

  if (cats.length !== ALL_CAT_IDS.length && lastKitten) {
    ALL_CAT_IDS.forEach((catId) => {
      if (!cats.some((c) => c.id === catId)) {
        const cat = getCat(catId);
        cats.push({
          ...cat,
          row: lastKitten.row,
          column: lastKitten.column,
        });
      }
    });
  }

  cats.sort((a, b) => a.id - b.id); // Sort cats by their ID for consistency

  return { cats, objects };
}
