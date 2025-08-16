import "./game-field.scss";

import { createButton, createElement } from "../../utils/html-utils";
import { newGame } from "../../logic/game-logic";
import { Cell, CellPosition, GameFieldData, PlacedCat } from "../../types";
import { createCellElement } from "./cell-component";
import { getTranslation, TranslationKey } from "../../translations/i18n";
import { globals } from "../../globals";
import { requestAnimationFrameWithTimeout } from "../../utils/promise-utils";
import { getGameFieldData, placeCatsInitially } from "../../logic/initialize";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { handlePokiCommercial } from "../../poki-integration";
import { getOnboardingData, increaseOnboardingStepIfApplicable, isOnboarding, wasOnboarding } from "../../logic/onboarding";
import { getArrowComponent } from "../arrow-component/arrow-component";
import { CssClass } from "../../utils/css-class";
import { getControlsComponent } from "../controls/controls-component";

let mainContainer: HTMLElement | undefined;
let gameFieldElem: HTMLElement | undefined;
let controlsElem: HTMLElement | undefined;
let startButton: HTMLElement | undefined;
let onboardingArrow: HTMLElement | undefined;
const cellElements: HTMLElement[][] = [];

const TIMEOUT_BETWEEN_GAMES = 300;
const TIMEOUT_CELL_APPEAR = 20;

export async function initializeEmptyGameField() {
  document.body.classList.remove(CssClass.SELECTING);

  const baseData = getGameFieldData();

  if (gameFieldElem) {
    console.error("initialize function should only be called once");
    return;
  }

  gameFieldElem = generateGameFieldElement(baseData);

  addStartButton(TranslationKey.START_GAME);

  appendGameField();
}

function addStartButton(buttonLabelKey: TranslationKey) {
  startButton = createButton({
    text: getTranslation(buttonLabelKey),
    onClick: (event: MouseEvent) => {
      if (isOnboarding()) {
        increaseOnboardingStepIfApplicable();
      }
      newGame();
      (event.target as HTMLElement)?.remove();
    },
  });
  startButton.classList.add(CssClass.START_BUTTON, "prm");
  gameFieldElem.append(startButton);
}

export async function startNewGame() {
  document.body.classList.remove(CssClass.SELECTING, CssClass.WON);
  globals.isWon = false;
  globals.motherCat.inventory.items = [];
  startButton?.remove();

  if (globals.gameFieldData.length && gameFieldElem) {
    // reset old game field
    pubSubService.publish(PubSubEvent.UPDATE_SCORE, { score: 0, moves: 0, par: 0 });
    await cleanGameField(globals.gameFieldData);
    if (process.env.POKI_ENABLED === "true") await handlePokiCommercial();
    await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);

    if (wasOnboarding()) {
      console.debug("Was onboard, removing game field");
      gameFieldElem.remove();
      gameFieldElem = undefined;
      controlsElem?.remove();
      controlsElem = undefined;
      globals.gameFieldData = [];
    }
  }

  console.debug("Starting new game, onboarding step", globals.onboardingStep);

  if (!globals.gameFieldData.length) {
    globals.gameFieldData = getGameFieldData();
  }

  globals.placedCats = placeCatsInitially(globals.gameFieldData);
  globals.motherCat = globals.placedCats.find((cat) => cat.isMother);

  if (!gameFieldElem) {
    gameFieldElem = generateGameFieldElement(globals.gameFieldData);
    appendGameField();
    await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
  }

  await initializeCatsOnGameField(globals.placedCats);

  addOnboardingArrowIfApplicable();
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

export function generateGameFieldElement(gameFieldData: GameFieldData) {
  const gameField = createElement({
    cssClass: CssClass.FIELD,
  });
  cellElements.length = 0;

  gameFieldData.forEach((row, _rowIndex) => {
    const rowElements: HTMLElement[] = [];
    const rowElem = createElement({
      cssClass: "row",
    });
    gameField.append(rowElem);

    row.forEach((cell, _columnIndex) => {
      const cellElement = createCellElement(cell);

      rowElem.append(cellElement);
      rowElements.push(cellElement);
    });

    cellElements.push(rowElements);
  });

  return gameField;
}

function addOnboardingArrowIfApplicable() {
  const onboardingData = getOnboardingData();

  if (onboardingData?.arrow) {
    onboardingArrow = getArrowComponent(onboardingData.arrow.direction, true);
    const cell = globals.gameFieldData[onboardingData.arrow.row][onboardingData.arrow.column];
    const cellElement = getCellElement(cell);
    cellElement.append(onboardingArrow);
  }
}

export async function initializeCatsOnGameField(cats: PlacedCat[]) {
  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i];
    const cellElement = getCellElement(cat);
    cellElement.innerHTML = "";
    cellElement.append(cat.catElement);
    await requestAnimationFrameWithTimeout(TIMEOUT_CELL_APPEAR);
  }
}

export async function cleanGameField(gameFieldData: GameFieldData) {
  const allCells = gameFieldData.flat();

  for (let i = 0; i < allCells.length; i++) {
    const cell: Cell = allCells[i];
    const cellElement = getCellElement(cell);
    cellElement.innerHTML = "";
  }
}
