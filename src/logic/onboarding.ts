import { ONBOARDING_CAT_EMOJIS, OnboardingEmojiIndex } from "../cat_emojis";
import { CatWithPosition, CellType, getCellTypesWithoutPrefix } from "../types";
import { globals } from "../globals";
import { LocalStorageKey, setLocalStorageItem } from "../utils/local-storage";
import { Direction } from "../components/onboarding/onboarding-components";
import type { IntRange } from "type-fest";
import { getRandomIntFromInterval } from "../utils/random-utils";

export const enum OnboardingStep {
  INTRO = 0,
}

export function isOnboarding() {
  return globals.onboardingStep !== -1;
}

export function wasOnboarding() {
  return isOnboarding() || globals.previousOnboardingStep !== undefined;
}

export interface OnboardingData {
  field: CellType[][];
  characters: CatWithPosition[];
  arrow?: {
    row: number;
    column: number;
    direction: Direction;
  };
}

type BaseFieldIndex = IntRange<0, 9>;

type ShortCharacterDefinition = [
  nameIndex: OnboardingEmojiIndex,
  size: number,
  awake: 0 | 1,
  rowIndex: BaseFieldIndex,
  columnIndex: BaseFieldIndex,
];

// a 4 by 4 grid
const onboardingField = (() => {
  const { _ } = getCellTypesWithoutPrefix();
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

  if (step > OnboardingStep.INTRO) {
    step = -1;
  }

  globals.onboardingStep = step;
  setLocalStorageItem(LocalStorageKey.ONBOARDING_STEP, step.toString());
}

function getOnboardingDataForIntro(): OnboardingData {
  const short: ShortCharacterDefinition[] = [
    [0, 3, 1, 1, 0],
    [0, 1, 1, 0, 3],
    [0, 1, 1, 3, 3],
  ];

  return {
    field: onboardingField,
    characters: getCatsWithPositionFromShortDescription(short),
    arrow: {
      row: 1,
      column: 0,
      direction: Direction.UP,
    },
  };
}

function getCatsWithPositionFromShortDescription(short: ShortCharacterDefinition[]): CatWithPosition[] {
  const cesar = getRandomIntFromInterval(0, ONBOARDING_CAT_EMOJIS.length - 1);
  const getOEmoji = (index) => {
    const newIndex = (cesar + index) % ONBOARDING_CAT_EMOJIS.length;
    return ONBOARDING_CAT_EMOJIS[newIndex];
  };

  return short.map(([nameIndex, size, awake, rowIndex, columnIndex]) => {
    const name = getOEmoji(nameIndex);

    return {
      name,
      size,
      awake: Boolean(awake),
      row: rowIndex,
      column: columnIndex,
    };
  });
}
