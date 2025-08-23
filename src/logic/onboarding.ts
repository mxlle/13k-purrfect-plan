import { Direction, Tool, TurnMove } from "../types";
import { globals } from "../globals";
import { LocalStorageKey, setLocalStorageItem } from "../utils/local-storage";
import { ALL_CAT_IDS, CatId, isCatId } from "./data/catId";
import { CellPosition, containsCell, EMPTY_CELL, getCellTypePlaceholders } from "./data/cell";
import { allInConfig, ConfigCategory, emptyConfig } from "./config";
import { ObjectId } from "./data/objects";
import { FieldSize } from "./data/field-size";
import { EMPTY_ELEMENT_MAP, GameElementPositions, GameSetup } from "./data/game-elements";
import { calculatePar } from "./par";
import { defineEnum } from "../utils/enums";

export type OnboardingStep = defineEnum<typeof OnboardingStep>
export const OnboardingStep = defineEnum({
  INTRO: 0,
  INTRO_SECOND_CAT: 1,
  INTERMEDIATE_MEOW: 2,
  INTERMEDIATE_OBJECTS: 3,
  LAST_SETUP: 4,
})

export function isOnboarding() {
  return globals.onboardingStep !== -1;
}

export function isSameLevel() {
  return globals.onboardingStep === globals.previousOnboardingStep || globals.previousOnboardingStep === undefined;
}

export interface OnboardingData {
  gameSetup: GameSetup;
  highlightedAction?: TurnMove;
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

export const defaultPlacedObjects = getElementPositionsFormInitialSetup(lastSetup);

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

      const gameSetupIntro: GameSetup = {
        fieldSize: getFieldSizeFromInitialSetup(introSetup),
        elementPositions: getElementPositionsFormInitialSetup(introSetup, skipPositions),
        config: {
          ...emptyConfig,
        },
        possibleSolutions: [],
      };

      return {
        gameSetup: {
          ...gameSetupIntro,
          possibleSolutions: calculatePar(gameSetupIntro).possibleSolutions,
        },
        highlightedAction: isFirstStep ? Direction.DOWN : undefined,
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

      const gameSetupIntermediate: GameSetup = {
        fieldSize: getFieldSizeFromInitialSetup(intermediateSetup),
        elementPositions: getElementPositionsFormInitialSetup(intermediateSetup, skipPositions),
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
        possibleSolutions: [],
      };

      return {
        gameSetup: { ...gameSetupIntermediate, possibleSolutions: calculatePar(gameSetupIntermediate).possibleSolutions },
        highlightedAction: step === OnboardingStep.INTERMEDIATE_MEOW ? Tool.MEOW : undefined,
      };
    case OnboardingStep.LAST_SETUP:
      const gameSetupLast: GameSetup = {
        fieldSize: getFieldSizeFromInitialSetup(lastSetup),
        elementPositions: getElementPositionsFormInitialSetup(lastSetup),
        config: allInConfig,
        possibleSolutions: [],
      };

      return {
        gameSetup: {
          ...gameSetupLast,
          possibleSolutions: calculatePar(gameSetupLast).possibleSolutions,
        },
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
  return initialSetup.length as FieldSize;
}

function getElementPositionsFormInitialSetup(initialSetup: InitialSetup, skipPositions: CellPosition[] = []): GameElementPositions {
  const elementPositions: GameElementPositions = EMPTY_ELEMENT_MAP();
  let lastCatPosition: CellPosition | null = null;

  initialSetup.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (containsCell(skipPositions, { row: rowIndex, column: columnIndex })) return;
      if (cell === EMPTY_CELL) return;

      elementPositions[cell] = { row: rowIndex, column: columnIndex };

      if (isCatId(cell)) {
        lastCatPosition = { row: rowIndex, column: columnIndex };
      }
    });
  });

  for (const catId of ALL_CAT_IDS) {
    if (elementPositions[catId] === null) {
      elementPositions[catId] = lastCatPosition;
    }
  }

  return elementPositions;
}
