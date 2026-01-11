import styles from "./game-field.module.scss";
import { getArrowComponent, styles as arrowStyles, updateArrowComponent } from "../arrow-component/arrow-component";
import { getCatIdClass } from "../cat-component/cat-component";

import { createElement, resetTransform } from "../../utils/html-utils";
import { requestAnimationFrameWithTimeout } from "../../utils/promise-utils";
import { generateRandomGameSetup, getInitialGameSetup, randomlyPlaceGameElementsOnField } from "../../logic/initialize";
import { CssClass } from "../../utils/css-class";
import { ALL_KITTEN_IDS, isKittenId } from "../../logic/data/catId";
import { getCellDifference, getDirection } from "../../logic/data/cell";
import { ObjectId, Tool } from "../../types";
import { isConfigItemEnabled } from "../../logic/config/config";
import { DEFAULT_FIELD_SIZE, FieldSize } from "../../logic/data/field-size";
import { isValidCellPosition } from "../../logic/checks";
import {
  ALL_GAME_ELEMENT_IDS,
  GameElementPositions,
  GameSetup,
  GameState,
  getHtmlElementForGameElement,
  getInitialGameState,
  getInitialPositionOfGameElement,
} from "../../logic/data/game-elements";
import { getTranslation } from "../../translations/i18n";
import { TranslationKey } from "../../translations/translationKey";
import { isCatId } from "../../logic/data/cats";
import { calculateNewPositions } from "../../logic/gameplay/calculate-new-positions";
import { MAX_PAR } from "../../logic/par";
import { isMoon } from "../../logic/data/objects";

interface GameFieldComponentResult {
  element: HTMLElement;
  initializeElementsOnGameField: (options: InitializeElementsOptions) => Promise<void>;
  generateRandomGameWhileAnimating: (fieldSize?: FieldSize) => Promise<GameSetup>;
}

interface InitializeElementsOptions {
  gameState: GameState;
  nextPositionsIfWait?: GameElementPositions;
  isInitialStart?: boolean;
  shouldResetToInitialPosition?: boolean;
}

const TIMEOUT_BETWEEN_GAMES = 300;

export function GameFieldComponent(fieldSize: FieldSize): GameFieldComponentResult {
  const gameFieldElement = createElement({ cssClass: styles.field });
  const cellElements: HTMLElement[][] = [];

  for (let rowIndex = 0; rowIndex < fieldSize; rowIndex++) {
    const rowElements: HTMLElement[] = [];
    const rowElem = createElement({ cssClass: styles.row });
    gameFieldElement.append(rowElem);

    for (let columnIndex = 0; columnIndex < fieldSize; columnIndex++) {
      const cellElement = createElement({ cssClass: CssClass.CELL });

      rowElem.append(cellElement);
      rowElements.push(cellElement);
    }

    cellElements.push(rowElements);
  }

  async function shuffleFieldAnimation() {
    const loader = createElement({ cssClass: styles.loader, text: getTranslation(TranslationKey.LOADING) });

    gameFieldElement.append(loader);

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
      await initializeElementsOnGameField({ gameState: randomState, nextPositionsIfWait, shouldResetToInitialPosition: true });
      await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
    }

    loader.remove();
  }

  async function generateRandomGameWhileAnimating(fieldSize: FieldSize = DEFAULT_FIELD_SIZE) {
    const gameSetupPromise = generateRandomGameSetup(fieldSize);
    const animatePromise = shuffleFieldAnimation();

    const [gameSetup] = await Promise.all([gameSetupPromise, animatePromise]);

    return gameSetup;
  }

  async function initializeElementsOnGameField(options: InitializeElementsOptions) {
    const { gameState, nextPositionsIfWait, isInitialStart, shouldResetToInitialPosition } = options;

    for (const gameElementId of ALL_GAME_ELEMENT_IDS) {
      const htmlElement = getHtmlElementForGameElement(gameElementId);
      const initialPosition = getInitialPositionOfGameElement(gameState.setup, gameElementId);

      if (initialPosition) {
        const cellElement = cellElements[initialPosition.row]?.[initialPosition.column];

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

  return { element: gameFieldElement, initializeElementsOnGameField, generateRandomGameWhileAnimating };
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
