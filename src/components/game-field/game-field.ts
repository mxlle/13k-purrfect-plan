import "./game-field.scss";

import { createButton, createElement } from "../../utils/html-utils";
import { getTranslation, TranslationKey } from "../../translations/i18n";
import { globals } from "../../globals";
import { requestAnimationFrameWithTimeout } from "../../utils/promise-utils";
import { generateRandomGameSetup } from "../../logic/initialize";
import { handlePokiCommercial } from "../../poki-integration";
import { getOnboardingData, increaseOnboardingStepIfApplicable, isSameLevel, OnboardingData } from "../../logic/onboarding";
import { CssClass } from "../../utils/css-class";
import { getControlsComponent } from "../controls/controls-component";
import { ALL_CAT_IDS, CAT_COLOR_IDS } from "../../logic/data/cats";
import { CellPosition, getCellDifference } from "../../logic/data/cell";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { isTool } from "../../types";
import { ConfigCategory } from "../../logic/config";
import { FieldSize } from "../../logic/data/field-size";
import { ALL_OBJECT_IDS, ObjectId } from "../../logic/data/objects";
import { isValidCellPosition } from "../../logic/checks";
import { deserializeGame, serializeGame } from "../../logic/serializer";
import { GameElementId, GameSetup, GameState, getInitialGameState, isValidGameSetup } from "../../logic/data/game-elements";
import { isWinConditionMet } from "../../logic/game-logic";

let mainContainer: HTMLElement | undefined;
let gameFieldElem: HTMLElement | undefined;
let controlsElem: HTMLElement | undefined;
let startButton: HTMLElement | undefined;
let onboardingArrow: HTMLElement | undefined;
const cellElements: HTMLElement[][] = [];

const TIMEOUT_BETWEEN_GAMES = 300;
const TIMEOUT_CELL_APPEAR = -1;

export async function initializeEmptyGameField(fieldSize: FieldSize) {
  document.body.classList.remove(CssClass.SELECTING);

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
  startButton.classList.add(CssClass.START_BUTTON, "prm");
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
    if (process.env.POKI_ENABLED === "true") await handlePokiCommercial();
    // await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);

    if (!isSameLevel()) {
      console.debug("Was different setup, removing game field");
      gameFieldElem.remove();
      gameFieldElem = undefined;
      controlsElem?.remove();
      controlsElem = undefined;
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

  globals.gameState = getInitialGameState(gameSetup);
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

  await initializeCatsOnGameField(globals.gameState, isInitialStart);

  addOnboardingSuggestionIfApplicable();
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

  controlsElem = getControlsComponent();

  mainContainer.append(controlsElem);
}

export function getCellElement(cell: CellPosition): HTMLElement {
  return cellElements[cell.row]?.[cell.column];
}

export function generateGameFieldElement(fieldSize: FieldSize) {
  const gameField = createElement({
    cssClass: CssClass.FIELD,
  });
  cellElements.length = 0;

  for (let rowIndex = 0; rowIndex < fieldSize; rowIndex++) {
    const rowElements: HTMLElement[] = [];
    const rowElem = createElement({
      cssClass: "row",
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

function addOnboardingSuggestionIfApplicable() {
  const onboardingData = getOnboardingData();

  if (onboardingData?.highlightedAction) {
    let actionComponent: HTMLElement | null = null;

    if (isTool(onboardingData.highlightedAction)) {
      actionComponent = document.querySelector(`.${CssClass.MEOW}`) as HTMLElement | null;
    } else {
      const directionComponent = isTool(onboardingData.highlightedAction)
        ? undefined
        : (document.querySelector(`.${CssClass.ARROW}.${onboardingData?.highlightedAction}`) as HTMLElement | null);
      actionComponent = directionComponent.parentNode as HTMLElement | null;
    }

    if (actionComponent) {
      actionComponent.classList.add(CssClass.ONBOARDING_HIGHLIGHT);
      let listener = () => {
        actionComponent.classList.remove(CssClass.ONBOARDING_HIGHLIGHT);
        actionComponent.removeEventListener("click", listener);
      };
      actionComponent.addEventListener("click", listener);
    }
  }
}

export async function initializeCatsOnGameField(gameState: GameState, isInitialStart: boolean) {
  for (const catId of ALL_CAT_IDS) {
    const representation = gameState.representations[catId];

    if (representation) {
      const cellElement = getCellElement(representation.initialPosition);
      cellElement.append(representation.htmlElement);
      representation.htmlElement.classList.toggle(
        `${CssClass.CAT_COLOR}${CAT_COLOR_IDS[catId]}`,
        gameState.setup.config[ConfigCategory.KITTEN_BEHAVIOR][catId],
      );
    }
  }

  if (!isInitialStart) {
    await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
  }

  updateAllPositions(gameState);
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

export function updateAllPositions(gameState: GameState) {
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
  }
}
