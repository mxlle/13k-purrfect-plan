import "./game-field.scss";

import { createButton, createElement } from "../../utils/html-utils";
import { getTranslation, TranslationKey } from "../../translations/i18n";
import { globals } from "../../globals";
import { requestAnimationFrameWithTimeout } from "../../utils/promise-utils";
import { initializeGameField, placeCatsInitially } from "../../logic/initialize";
import { handlePokiCommercial } from "../../poki-integration";
import { getOnboardingData, increaseOnboardingStepIfApplicable, isSameLevel, OnboardingData } from "../../logic/onboarding";
import { CssClass } from "../../utils/css-class";
import { getControlsComponent } from "../controls/controls-component";
import { isMother, PlacedCat } from "../../logic/data/cats";
import { CellPosition, getCellDifference } from "../../logic/data/cell";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { isTool } from "../../types";
import { allInConfig, shouldApplyKittenBehavior } from "../../logic/config";
import { FieldSize } from "../../logic/data/field-size";
import { PlacedObject } from "../../logic/data/objects";
import { isValidCellPosition } from "../../logic/checks";
import { calculatePar } from "../../logic/par";

let mainContainer: HTMLElement | undefined;
let gameFieldElem: HTMLElement | undefined;
let controlsElem: HTMLElement | undefined;
let startButton: HTMLElement | undefined;
let onboardingArrow: HTMLElement | undefined;
const cellElements: HTMLElement[][] = [];

const TIMEOUT_BETWEEN_GAMES = 300;
const TIMEOUT_CELL_APPEAR = -1;

export async function initializeEmptyGameField() {
  document.body.classList.remove(CssClass.SELECTING);

  if (gameFieldElem) {
    console.error("initialize function should only be called once");
    return;
  }

  gameFieldElem = generateGameFieldElement(globals.fieldSize);

  addStartButton(TranslationKey.START_GAME, gameFieldElem);

  appendGameField();
}

export function addStartButton(buttonLabelKey: TranslationKey, elementToAttachTo: HTMLElement) {
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
  const isInitialStart = !globals.placedCats.length;

  if (globals.isWon && options.shouldIncreaseLevel) {
    increaseOnboardingStepIfApplicable();
  }

  document.body.classList.remove(CssClass.SELECTING, CssClass.WON);
  globals.isWon = false;
  globals.moves.length = 0;

  startButton?.remove();

  let onboardingData: OnboardingData | undefined = getOnboardingData();

  if (onboardingData) {
    globals.config = onboardingData.config;
  } else {
    globals.config = allInConfig;
  }

  pubSubService.publish(PubSubEvent.GAME_START);

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

  initializeGameField();

  globals.placedObjects = onboardingData?.objects || [];
  globals.placedCats = placeCatsInitially(globals.fieldSize);
  globals.motherCat = globals.placedCats.find(isMother);

  const performanceStart = performance.now();
  const parInfo = calculatePar(globals.placedCats, globals.placedObjects, []);
  globals.par = parInfo.par;
  const performanceEnd = performance.now();
  const performanceTime = performanceEnd - performanceStart;
  console.debug("Calculated par:", parInfo, "Time taken:", Math.round(performanceTime), "ms");

  if (!gameFieldElem) {
    gameFieldElem = generateGameFieldElement(globals.fieldSize);
    appendGameField();
    await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
  }

  await initializeObjectsOnGameField(globals.placedObjects);

  await initializeCatsOnGameField(globals.placedCats, isInitialStart);

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

function getMiddleCoordinates(): CellPosition | undefined {
  if (!gameFieldElem) {
    console.warn("No game field element to get middle cell from");
    return undefined;
  }

  const rowCount = globals.fieldSize.height;
  const columnCount = globals.fieldSize.width;

  const middleRow = Math.floor((rowCount - 1) / 2);
  const middleColumn = Math.floor((columnCount - 1) / 2);

  return { row: middleRow, column: middleColumn };
}

export function generateGameFieldElement(fieldSize: FieldSize) {
  const gameField = createElement({
    cssClass: CssClass.FIELD,
  });
  cellElements.length = 0;

  for (let rowIndex = 0; rowIndex < fieldSize.height; rowIndex++) {
    const rowElements: HTMLElement[] = [];
    const rowElem = createElement({
      cssClass: "row",
    });
    gameField.append(rowElem);

    for (let columnIndex = 0; columnIndex < fieldSize.width; columnIndex++) {
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

export async function initializeCatsOnGameField(cats: PlacedCat[], isInitialStart: boolean) {
  const middleCellPosition = getMiddleCoordinates();
  const middleCellElement = getCellElement(middleCellPosition);

  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i];
    middleCellElement.append(cat.catElement);
    cat.initialPosition = { ...middleCellPosition };

    if (shouldApplyKittenBehavior(cat)) {
      cat.catElement.classList.add(`${CssClass.CAT_COLOR}${cat.id}`);
    }
  }

  if (!isInitialStart) {
    await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
  }

  updateAllPositions();
}

export async function initializeObjectsOnGameField(placedObjects: PlacedObject[]) {
  for (let i = 0; i < placedObjects.length; i++) {
    const gameObject = placedObjects[i];
    gameObject.initialPosition = { row: gameObject.row, column: gameObject.column };
    const cellElement = getCellElement(gameObject);
    cellElement.append(gameObject.objectElement);
  }
}

export function updateAllPositions() {
  globals.placedCats.forEach((cat) => {
    const diff = getCellDifference(cat, cat.initialPosition);
    cat.catElement.style.transform = `translate(${diff.column * 100}%, ${diff.row * 100}%)`;
  });

  globals.placedObjects.forEach((obj) => {
    const diff = getCellDifference(obj, obj.initialPosition);
    obj.objectElement.style.transform = `translate(${diff.column * 100}%, ${diff.row * 100}%)`;

    if (!isValidCellPosition(globals.fieldSize, obj, [])) {
      obj.objectElement.style.opacity = "0";
    } else {
      obj.objectElement.style.opacity = "1";
    }
  });
}
