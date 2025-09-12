import { Direction, OnboardingStep, TurnMove } from "../types";
import { globals } from "../globals";
import { LocalStorageKey, setLocalStorageItem } from "../utils/local-storage";
import { FieldSize } from "./data/field-size";
import { GameElementPositions, GameSetup } from "./data/game-elements";
import { deserializeGame } from "./serializer";

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

const serializedGameOnboardingMap: Record<OnboardingStep, string> = {
  [OnboardingStep.INTRO]: "🟣11🟡21🟢21🔵21",
  [OnboardingStep.INTERMEDIATE_OBJECTS]: "🟣12🟡32🟢31🔵32🌳22💧21",
  [OnboardingStep.LAST_SETUP]: "🟣11🟡32🟢31🔵33🌳23💧21🌙12",
};

const onboardingFieldSizeMap: Record<OnboardingStep, FieldSize> = {
  [OnboardingStep.INTRO]: 3,
  [OnboardingStep.INTERMEDIATE_OBJECTS]: 4,
  [OnboardingStep.LAST_SETUP]: 5,
};

let defaultPlacedObjects: GameElementPositions | undefined;
export function getDefaultPlacedObjects() {
  if (defaultPlacedObjects) {
    return defaultPlacedObjects;
  }

  const deserializedGame = deserializeGame(serializedGameOnboardingMap[OnboardingStep.LAST_SETUP], {
    skipParCalculation: true,
  });
  defaultPlacedObjects = deserializedGame.elementPositions;

  return defaultPlacedObjects;
}

export function getOnboardingData(): OnboardingData | undefined {
  const step = globals.onboardingStep;

  const serializedGame = serializedGameOnboardingMap[step];

  if (!serializedGame) {
    return undefined;
  }

  const deserializedGame = deserializeGame(serializedGame, { skipParCalculation: true, removeMoon: true });

  return {
    gameSetup: {
      fieldSize: onboardingFieldSizeMap[step],
      elementPositions: deserializedGame.elementPositions,
      possibleSolutions: [],
    },
    highlightedAction: step === OnboardingStep.INTRO ? Direction.DOWN : undefined,
  };
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
