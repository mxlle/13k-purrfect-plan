import styles from "./game-field.module.scss";
import { activateOnboardingHighlight } from "../controls-and-info/controls/controls-component";
import { getArrowComponent, styles as arrowStyles, updateArrowComponent } from "../arrow-component/arrow-component";
import { getCatIdClass } from "../cat-component/cat-component";

import { createElement, resetTransform } from "../../utils/html-utils";
import { globals } from "../../globals";
import { requestAnimationFrameWithTimeout } from "../../utils/promise-utils";
import { generateRandomGameSetup, getInitialGameSetup, randomlyPlaceGameElementsOnField } from "../../logic/initialize";
import { handlePokiCommercial } from "../../poki-integration";
import {
  getOnboardingData,
  increaseOnboardingStepIfApplicable,
  isOnboarding,
  isSameLevel,
  OnboardingData,
  wasLastOnboardingStep,
} from "../../logic/onboarding";
import { CssClass } from "../../utils/css-class";
import { ALL_KITTEN_IDS, isKittenId } from "../../logic/data/catId";
import { CellPosition, getCellDifference, getDirection } from "../../logic/data/cell";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { ConfigItemId, isTool, ObjectId, Tool } from "../../types";
import { hasUnknownConfigItems, isConfigItemEnabled } from "../../logic/config/config";
import { DEFAULT_FIELD_SIZE, FieldSize } from "../../logic/data/field-size";
import { isValidCellPosition, isWinConditionMet } from "../../logic/checks";
import { serializeGame } from "../../logic/serializer";
import {
  ALL_GAME_ELEMENT_IDS,
  determineGameSetup,
  GameElementPositions,
  GameSetup,
  GameState,
  getHtmlElementForGameElement,
  getInitialGameState,
  getInitialPositionOfGameElement,
  isValidGameSetup,
} from "../../logic/data/game-elements";
import { createConfigChooserComponent } from "../config-chooser/config-chooser-component";
import { removeAllSpeechBubbles } from "../speech-bubble/speech-bubble";
import { getTranslation } from "../../translations/i18n";
import { TranslationKey } from "../../translations/translationKey";
import { isCatId } from "../../logic/data/cats";
import { calculateNewPositions } from "../../logic/gameplay/calculate-new-positions";
import { getControlsAndInfoComponent } from "../controls-and-info/controls-and-info-component";
import { MAX_PAR } from "../../logic/par";
import { HAS_LOCATION_SERIALIZATION, IS_DEV, IS_POKI_ENABLED } from "../../env-utils";
import { isMoon } from "../../logic/data/objects";

let mainContainer: HTMLElement | undefined;
let gameFieldElem: HTMLElement | undefined;
let controlsElem: HTMLElement | undefined;
const cellElements: HTMLElement[][] = [];

const TIMEOUT_BETWEEN_GAMES = 300;

export async function initializeEmptyGameField(fieldSize: FieldSize) {
  if (gameFieldElem) {
    console.error("initialize function should only be called once");
    return;
  }

  gameFieldElem = generateGameFieldElement(fieldSize);

  const tempGameState = getInitialGameState(getInitialGameSetup());
  await initializeElementsOnGameField(tempGameState, undefined, true, true);

  appendGameField();
}

async function shuffleFieldAnimation() {
  if (!gameFieldElem) {
    console.error("shuffleFieldAnimation should only be called after gameFieldElem is initialized");
    return;
  }

  const loader = createElement({ cssClass: styles.loader, text: getTranslation(TranslationKey.LOADING) });

  gameFieldElem.append(loader);

  for (let i = 0; i < 2; i++) {
    const randomState = getInitialGameState(
      randomlyPlaceGameElementsOnField(getInitialGameSetup(), {
        shouldCalculatePar: false,
        randomMoonPosition: true,
        allowLessMoves: true,
        desiredPar: MAX_PAR,
      }),
    );
    const nextPositionsIfWait = calculateNewPositions(randomState, Tool.WAIT);
    await initializeElementsOnGameField(randomState, nextPositionsIfWait, false, true);
    await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
  }

  loader.remove();
}

export async function startNewGame(options: { isDoOver: boolean }) {
  const notYetAllConfigItems = hasUnknownConfigItems();
  let newConfigItem: ConfigItemId | boolean = false;

  if (isWinConditionMet(globals.gameState) && !options.isDoOver) {
    increaseOnboardingStepIfApplicable();
  }

  if (notYetAllConfigItems && !isOnboarding() && !options.isDoOver) {
    newConfigItem = await createConfigChooserComponent();
  }

  removeAllSpeechBubbles();
  document.body.classList.remove(CssClass.WON);

  if (gameFieldElem) {
    // reset old game field
    if (IS_POKI_ENABLED) await handlePokiCommercial();

    if (!isSameLevel() && !wasLastOnboardingStep()) {
      console.debug("Was different setup, removing game field");
      resetGameField();
    }
  }

  const onboardingData: OnboardingData | undefined = getOnboardingData();

  let gameSetup = determineGameSetup(options, onboardingData);
  if (gameSetup === null) {
    gameSetup = await generateRandomGameWhileAnimating();
  }

  if (IS_DEV) {
    if (!isValidGameSetup(gameSetup)) {
      throw new Error("Generated or provided game setup is invalid, cannot start game.", { cause: gameSetup });
    }
  }

  globals.failedAttempts = options.isDoOver ? globals.failedAttempts + 1 : 0;

  await refreshFieldWithSetup(gameSetup, onboardingData, false, !options.isDoOver);

  addOnboardingSuggestionIfApplicable(onboardingData, newConfigItem);
}

export async function generateRandomGameWhileAnimating(fieldSize: FieldSize = DEFAULT_FIELD_SIZE) {
  const gameSetupPromise = generateRandomGameSetup(fieldSize);
  const animatePromise = shuffleFieldAnimation();

  const [gameSetup] = await Promise.all([gameSetupPromise, animatePromise]);

  return gameSetup;
}

export async function refreshFieldWithSetup(
  gameSetup: GameSetup,
  onboardingData: OnboardingData | undefined,
  isInitialStart: boolean,
  shouldResetToMiddle: boolean,
) {
  globals.gameState = getInitialGameState(gameSetup);
  globals.nextPositionsIfWait = calculateNewPositions(globals.gameState, Tool.WAIT);

  if (HAS_LOCATION_SERIALIZATION) {
    const serializedGameSetup = serializeGame(gameSetup);
    location.hash = onboardingData || hasUnknownConfigItems() ? "" : `#${serializedGameSetup}`;
  }

  document.body.style.setProperty("--s-cnt", gameSetup.fieldSize.toString());

  pubSubService.publish(PubSubEvent.GAME_START);

  if (!gameFieldElem) {
    gameFieldElem = generateGameFieldElement(gameSetup.fieldSize);
    appendGameField();
    await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
  }

  await initializeElementsOnGameField(globals.gameState, globals.nextPositionsIfWait, isInitialStart, shouldResetToMiddle);
}

function resetGameField() {
  gameFieldElem.remove();
  gameFieldElem = undefined;
  controlsElem?.remove();
  controlsElem = undefined;
}

function appendGameField() {
  if (!gameFieldElem) {
    console.warn("No game field element to append");
    return;
  }

  if (!mainContainer) {
    mainContainer = createElement({ cssClass: styles.main });
    document.body.append(mainContainer);
    mainContainer.addEventListener("scroll", () => {
      removeAllSpeechBubbles();
    });
  }

  controlsElem = getControlsAndInfoComponent();

  mainContainer.append(gameFieldElem, controlsElem);
}

export function getCellElement(cell: CellPosition): HTMLElement {
  return cellElements[cell.row]?.[cell.column];
}

export function generateGameFieldElement(fieldSize: FieldSize) {
  const gameField = createElement({ cssClass: styles.field });
  cellElements.length = 0;

  for (let rowIndex = 0; rowIndex < fieldSize; rowIndex++) {
    const rowElements: HTMLElement[] = [];
    const rowElem = createElement({ cssClass: styles.row });
    gameField.append(rowElem);

    for (let columnIndex = 0; columnIndex < fieldSize; columnIndex++) {
      const cellElement = createElement({ cssClass: CssClass.CELL });

      rowElem.append(cellElement);
      rowElements.push(cellElement);
    }

    cellElements.push(rowElements);
  }

  return gameField;
}

function addOnboardingSuggestionIfApplicable(onboardingData: OnboardingData | undefined, newConfigItem: ConfigItemId | boolean) {
  if (onboardingData?.highlightedAction) {
    activateOnboardingHighlight(onboardingData?.highlightedAction);
  } else if (newConfigItem && isTool(newConfigItem)) {
    activateOnboardingHighlight(newConfigItem);
  }
}

export async function initializeElementsOnGameField(
  gameState: GameState,
  nextPositionsIfWait: GameElementPositions | undefined,
  isInitialStart: boolean,
  shouldResetToInitialPosition: boolean,
) {
  for (const gameElementId of ALL_GAME_ELEMENT_IDS) {
    const htmlElement = getHtmlElementForGameElement(gameElementId);
    const initialPosition = getInitialPositionOfGameElement(gameState.setup, gameElementId);

    if (initialPosition) {
      const cellElement = getCellElement(initialPosition);

      // append if not already there
      if (!cellElement.contains(htmlElement)) {
        cellElement.append(htmlElement);
      } else if (shouldResetToInitialPosition) {
        resetTransform(htmlElement);
      }

      if (isCatId(gameElementId)) {
        htmlElement.classList.toggle(getCatIdClass(gameElementId), !isKittenId(gameElementId) || isConfigItemEnabled(gameElementId));
      }
    }
  }

  if (!isInitialStart) {
    await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
  }

  updateAllPositions(gameState, nextPositionsIfWait);
}

export function updateAllPositions(gameState: GameState, nextPositionsIfWait: GameElementPositions | undefined, hasWon: boolean = false) {
  for (const gameElementId of ALL_GAME_ELEMENT_IDS) {
    const htmlElement = getHtmlElementForGameElement(gameElementId);
    const initialPosition = getInitialPositionOfGameElement(gameState.setup, gameElementId);
    const currentPosition = gameState.currentPositions[gameElementId];
    if (initialPosition === null || currentPosition === null) continue;

    const [rowDiff, colDiff] = getCellDifference(currentPosition, initialPosition);
    htmlElement.style.transform = `translate(${colDiff * 100}%, ${rowDiff * 100}%)`;

    if (isMoon(gameElementId)) {
      const isMoonSet = !isValidCellPosition(gameState, currentPosition, ObjectId.MOON) && !hasWon;
      document.body.classList.toggle(CssClass.DARKNESS, isMoonSet);
      htmlElement.classList.toggle(CssClass.OPACITY_HIDDEN, isMoonSet);
    }

    if (ALL_KITTEN_IDS.includes(gameElementId as any) && nextPositionsIfWait) {
      const nextPosition = nextPositionsIfWait[gameElementId];
      const direction = nextPosition ? getDirection(currentPosition, nextPosition) : undefined;
      const existingArrow = htmlElement.querySelector(`.${arrowStyles.arrow}`) as HTMLElement | undefined;

      if (direction) {
        if (existingArrow) {
          updateArrowComponent(existingArrow, direction);
        } else {
          htmlElement.append(getArrowComponent(direction));
        }
      } else {
        existingArrow?.remove();
      }
    }
  }
}
