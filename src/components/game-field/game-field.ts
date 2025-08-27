import styles from "./game-field.module.scss";
import { getControlsComponent, styles as controlsStyles } from "../controls/controls-component";
import { cssClassByDirection, getArrowComponent, styles as arrowStyles } from "../arrow-component/arrow-component";
import { getCatIdClass, styles as catStyles } from "../cat-component/cat-component";

import { createButton, createElement } from "../../utils/html-utils";
import { getTranslation } from "../../translations/i18n";
import { globals } from "../../globals";
import { requestAnimationFrameWithTimeout } from "../../utils/promise-utils";
import { generateRandomGameSetup } from "../../logic/initialize";
import { handlePokiCommercial } from "../../poki-integration";
import { getOnboardingData, increaseOnboardingStepIfApplicable, isSameLevel, OnboardingData } from "../../logic/onboarding";
import { CssClass } from "../../utils/css-class";
import { ALL_CAT_IDS, ALL_KITTEN_IDS } from "../../logic/data/catId";
import { CellPosition, getCellDifference, getDirection } from "../../logic/data/cell";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { isTool, ObjectId, SpecialAction } from "../../types";
import { ConfigCategory } from "../../logic/config/config";
import { FieldSize } from "../../logic/data/field-size";
import { ALL_OBJECT_IDS } from "../../logic/data/objects";
import { isValidCellPosition } from "../../logic/checks";
import { deserializeGame, serializeGame } from "../../logic/serializer";
import {
  GameElementId,
  GameElementPositions,
  GameSetup,
  GameState,
  getInitialGameState,
  isValidGameSetup,
} from "../../logic/data/game-elements";
import { calculateNewPositions, isWinConditionMet } from "../../logic/game-logic";
import { TranslationKey } from "../../translations/translationKey";
import { getConfigComponent } from "../config/config-component";

let mainContainer: HTMLElement | undefined;
let gameFieldElem: HTMLElement | undefined;
let controlsElem: HTMLElement | undefined;
let configElem: HTMLElement | undefined;
let startButton: HTMLElement | undefined;
const cellElements: HTMLElement[][] = [];

const TIMEOUT_BETWEEN_GAMES = 300;
const TIMEOUT_CELL_APPEAR = -1;

export function toggleConfig() {
  configElem?.classList.toggle(CssClass.HIDDEN);
}

export async function initializeEmptyGameField(fieldSize: FieldSize) {
  if (gameFieldElem) {
    console.error("initialize function should only be called once");
    return;
  }

  gameFieldElem = generateGameFieldElement(fieldSize);

  addStartButton(TranslationKey.NEW_GAME, gameFieldElem);

  appendGameField();
}

function addStartButton(buttonLabelKey: TranslationKey, elementToAttachTo: HTMLElement) {
  startButton = createButton({
    text: getTranslation(buttonLabelKey),
    onClick: (event: MouseEvent) => {
      pubSubService.publish(PubSubEvent.START_NEW_GAME);
      (event.target as HTMLElement)?.remove();
    },
  });
  startButton.classList.add(styles.startButton, CssClass.PRM);
  elementToAttachTo.append(startButton);
}

export async function startNewGame(options: { shouldIncreaseLevel: boolean } = { shouldIncreaseLevel: true }) {
  const isInitialStart = !globals.gameState;

  if (isWinConditionMet(globals.gameState) && options.shouldIncreaseLevel) {
    increaseOnboardingStepIfApplicable();
  }

  document.body.classList.remove(CssClass.WON);

  startButton?.remove();

  if (gameFieldElem) {
    // reset old game field
    // await cleanGameField(globals.gameFieldData);
    if (import.meta.env.POKI_ENABLED === "true") await handlePokiCommercial();
    // await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);

    if (!isSameLevel()) {
      console.debug("Was different setup, removing game field");
      gameFieldElem.remove();
      gameFieldElem = undefined;
      controlsElem?.remove();
      controlsElem = undefined;
      configElem?.remove();
      configElem = undefined;
    }
  }

  console.debug("Starting new game, onboarding step", globals.onboardingStep);

  const onboardingData: OnboardingData | undefined = getOnboardingData();
  const gameSetupFromHash = location.hash.replace("#", "");

  let gameSetupFromUrl: GameSetup | undefined;
  if (isInitialStart && gameSetupFromHash && !onboardingData) {
    try {
      gameSetupFromUrl = deserializeGame(decodeURI(gameSetupFromHash));
      console.debug("Loaded game setup from hash:", gameSetupFromUrl);

      if (!isValidGameSetup(gameSetupFromUrl)) {
        console.warn("Invalid game setup in URL hash, ignoring it.");
        gameSetupFromUrl = undefined;
      }
    } catch (error) {
      console.error("Failed to parse game setup from hash:", error);
    }
  }

  let gameSetup: GameSetup;
  if (gameSetupFromUrl) {
    gameSetup = gameSetupFromUrl;
  } else {
    if (!options.shouldIncreaseLevel && globals.gameState) {
      gameSetup = globals.gameState.setup;
    } else {
      gameSetup = onboardingData ? onboardingData.gameSetup : generateRandomGameSetup();
    }
  }

  if (!isValidGameSetup(gameSetup)) {
    throw new Error("Generated or provided game setup is invalid, cannot start game.", { cause: gameSetup });
  }

  await refreshFieldWithSetup(gameSetup, onboardingData, isInitialStart);

  addOnboardingSuggestionIfApplicable(onboardingData);
}

export async function refreshFieldWithSetup(gameSetup: GameSetup, onboardingData: OnboardingData | undefined, isInitialStart: boolean) {
  globals.gameState = getInitialGameState(gameSetup);
  globals.nextPositionsIfWait = calculateNewPositions(globals.gameState, SpecialAction.WAIT);
  const serializedGameSetup = serializeGame(gameSetup);
  location.hash = onboardingData ? "" : `#${serializedGameSetup}`;
  document.body.style.setProperty("--s-cnt", globals.gameState.setup.fieldSize.toString());

  pubSubService.publish(PubSubEvent.GAME_START);

  if (!gameFieldElem) {
    gameFieldElem = generateGameFieldElement(globals.gameState.setup.fieldSize);
    appendGameField();
    await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
  }

  await initializeObjectsOnGameField(globals.gameState);

  await initializeCatsOnGameField(globals.gameState, globals.nextPositionsIfWait, isInitialStart);
}

function appendGameField() {
  if (!gameFieldElem) {
    console.warn("No game field element to append");
    return;
  }

  if (!mainContainer) {
    mainContainer = createElement({
      tag: "main",
    });
    document.body.append(mainContainer);
  }

  mainContainer.append(gameFieldElem);

  if (import.meta.env.DEV) {
    configElem = getConfigComponent();
    configElem.classList.add(CssClass.HIDDEN);

    mainContainer.append(configElem);
  }

  controlsElem = getControlsComponent();

  mainContainer.append(controlsElem);
}

export function getCellElement(cell: CellPosition): HTMLElement {
  return cellElements[cell.row]?.[cell.column];
}

export function generateGameFieldElement(fieldSize: FieldSize) {
  const gameField = createElement({
    cssClass: styles.field,
  });
  cellElements.length = 0;

  for (let rowIndex = 0; rowIndex < fieldSize; rowIndex++) {
    const rowElements: HTMLElement[] = [];
    const rowElem = createElement({
      cssClass: styles.row,
    });
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

function addOnboardingSuggestionIfApplicable(onboardingData: OnboardingData | undefined) {
  if (onboardingData?.highlightedAction) {
    let actionComponent: HTMLElement | null = null;

    if (isTool(onboardingData.highlightedAction)) {
      actionComponent = document.querySelector(`.${catStyles.meow}`) as HTMLElement | null;
    } else {
      const directionComponent = isTool(onboardingData.highlightedAction)
        ? undefined
        : (document.querySelector(`.${arrowStyles.arrow}.${cssClassByDirection[onboardingData?.highlightedAction]}`) as HTMLElement | null);
      actionComponent = directionComponent.parentNode as HTMLElement | null;
    }

    if (actionComponent) {
      actionComponent.classList.add(controlsStyles.onboardingHighlight);
      let listener = () => {
        actionComponent.classList.remove(controlsStyles.onboardingHighlight);
        actionComponent.removeEventListener("click", listener);
      };
      actionComponent.addEventListener("click", listener);
    }
  }
}

export async function initializeCatsOnGameField(
  gameState: GameState,
  nextPositionsIfWait: GameElementPositions | undefined,
  isInitialStart: boolean,
) {
  for (const catId of ALL_CAT_IDS) {
    const representation = gameState.representations[catId];

    if (representation) {
      const cellElement = getCellElement(representation.initialPosition);
      cellElement.append(representation.htmlElement);
      representation.htmlElement.classList.toggle(getCatIdClass(catId), gameState.setup.config[ConfigCategory.KITTEN_BEHAVIOR][catId]);
    }
  }

  if (!isInitialStart) {
    await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
  }

  updateAllPositions(gameState, nextPositionsIfWait);
}

export async function initializeObjectsOnGameField(gameState: GameState) {
  for (const objId of ALL_OBJECT_IDS) {
    const representation = gameState.representations[objId];

    if (representation) {
      const cellElement = getCellElement(representation.initialPosition);
      cellElement.append(representation.htmlElement);
    }
  }
}

export function updateAllPositions(gameState: GameState, nextPositionsIfWait: GameElementPositions | undefined) {
  for (const gameElementId in gameState.representations) {
    const representation = gameState.representations[gameElementId as GameElementId];
    const position = gameState.currentPositions[gameElementId as GameElementId];
    if (representation === null || position === null) continue;

    const diff = getCellDifference(position, representation.initialPosition);
    representation.htmlElement.style.transform = `translate(${diff.column * 100}%, ${diff.row * 100}%)`;

    if (gameElementId === ObjectId.MOON) {
      if (!isValidCellPosition(gameState, position)) {
        representation.htmlElement.style.opacity = "0";
        document.body.classList.toggle(CssClass.DARKNESS, true);
      } else {
        representation.htmlElement.style.opacity = "1";
        document.body.classList.toggle(CssClass.DARKNESS, false);
      }
    }

    if (ALL_KITTEN_IDS.includes(gameElementId as any) && nextPositionsIfWait) {
      const existingArrow = representation.htmlElement.querySelector(`.${arrowStyles.arrow}`);
      existingArrow?.remove();

      const nextPosition = nextPositionsIfWait[gameElementId as GameElementId];
      if (nextPosition) {
        const direction = getDirection(position, nextPosition);
        direction && representation.htmlElement.append(getArrowComponent(direction));
      }
    }
  }
}
