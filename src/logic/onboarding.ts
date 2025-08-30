import { ConfigCategory, Direction, ObjectId, OnboardingStep, TurnMove } from "../types";
import { globals } from "../globals";
import { LocalStorageKey, setLocalStorageItem } from "../utils/local-storage";
import { ALL_CAT_IDS, CatId } from "./data/catId";
import { CellPosition, containsCell, EMPTY_CELL, getCellTypePlaceholders } from "./data/cell";
import { allInConfig, emptyConfig, getValidatedConfig } from "./config/config";
import { FieldSize } from "./data/field-size";
import { EMPTY_ELEMENT_MAP, GameElementPositions, GameSetup } from "./data/game-elements";
import { calculatePar } from "./par";
import { isCatId } from "./data/cats";

export function isOnboarding() {
  return globals.onboardingStep !== -1;
}

export function isSameLevel() {
  return globals.onboardingStep === globals.previousOnboardingStep || globals.previousOnboardingStep === undefined;
}

export function wasLastOnboardingStep() {
  return globals.previousOnboardingStep === OnboardingStep.LAST_SETUP;
}

export interface OnboardingData {
  gameSetup: GameSetup;
  highlightedAction?: TurnMove;
}

const lastSetup: InitialSetup = (() => {
  const { _, M, t, o, c, T, O, C } = getCellTypePlaceholders();
  return [
    [C, _, M, _, _],
    [o, _, _, _, O],
    [_, _, _, _, _],
    [_, t, T, _, c],
    [_, _, _, _, _],
  ];
})();

export function getDefaultPlacedObjects() {
  return getElementPositionsFormInitialSetup(lastSetup);
}

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

      const gameSetupIntermediate: GameSetup = {
        fieldSize: getFieldSizeFromInitialSetup(intermediateSetup),
        elementPositions: getElementPositionsFormInitialSetup(intermediateSetup, skipPositions),
        config: {
          ...emptyConfig,
          [ConfigCategory.OBJECTS]: {
            ...emptyConfig[ConfigCategory.OBJECTS],
            [ObjectId.TREE]: true,
            [ObjectId.MOON]: true,
          },
        },
        possibleSolutions: [],
      };

      return {
        gameSetup: { ...gameSetupIntermediate, possibleSolutions: calculatePar(gameSetupIntermediate).possibleSolutions },
      };
    case OnboardingStep.LAST_SETUP:
      const gameSetupLast: GameSetup = {
        fieldSize: getFieldSizeFromInitialSetup(lastSetup),
        elementPositions: getElementPositionsFormInitialSetup(lastSetup),
        config: getValidatedConfig(allInConfig),
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
