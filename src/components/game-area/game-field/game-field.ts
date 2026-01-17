import styles from "./game-field.module.scss";
import { initializeCatElementStylesIfApplicable, updateKittenArrow } from "../../game-elements/cat-component/cat-component";

import { createElement, createElements, resetTransform } from "../../../utils/html-utils";
import { requestAnimationFrameWithTimeout } from "../../../utils/promise-utils";
import {
  GAME_SETUP_OPTIONS_FOR_SHUFFLE,
  generateRandomGameSetup,
  getInitialGameSetup,
  randomlyPlaceGameElementsOnField,
} from "../../../logic/initialize";
import { CssClass } from "../../../utils/css-class";
import { isKittenId } from "../../../logic/data/catId";
import { getCellDifference, getDirection } from "../../../logic/data/cell";
import { ObjectId, Tool } from "../../../types";
import { DEFAULT_FIELD_SIZE, FieldSize } from "../../../logic/data/field-size";
import { isValidCellPosition } from "../../../logic/checks";
import {
  ALL_GAME_ELEMENT_IDS,
  GameElementPositions,
  GameSetup,
  GameState,
  getHtmlElementForGameElement,
  getInitialGameState,
  getInitialPositionOfGameElement,
} from "../../../logic/data/game-elements";
import { getTranslation } from "../../../translations/i18n";
import { TranslationKey } from "../../../translations/translationKey";
import { calculateNewPositions } from "../../../logic/gameplay/calculate-new-positions";
import { isMoon } from "../../../logic/data/objects";

interface GameFieldComponentInterface {
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

/**
 * Creates the game field component with the specified field size.
 */
export function GameFieldComponent(fieldSize: FieldSize): GameFieldComponentInterface {
  const gameFieldElement = createElement(
    { cssClass: styles.field },
    createElements({ cssClass: styles.row }, fieldSize, () => createElements({ cssClass: CssClass.CELL }, fieldSize)),
  );

  /**
   * Animates shuffling of the game field by randomly placing game elements multiple times.
   */
  async function shuffleFieldAnimation(shuffleAmount: number = 2) {
    const loader = createElement({ cssClass: styles.loader, text: getTranslation(TranslationKey.LOADING) });

    gameFieldElement.append(loader);

    for (let i = 0; i < shuffleAmount; i++) {
      const randomState = getInitialGameState(randomlyPlaceGameElementsOnField(getInitialGameSetup(), GAME_SETUP_OPTIONS_FOR_SHUFFLE));
      const nextPositionsIfWait = calculateNewPositions(randomState, Tool.WAIT);
      await initializeElementsOnGameField({ gameState: randomState, nextPositionsIfWait, shouldResetToInitialPosition: true });
      await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
    }

    loader.remove();
  }

  /**
   * Generates a random game setup while animating the shuffling of the game field.
   */
  async function generateRandomGameWhileAnimating(fieldSize: FieldSize = DEFAULT_FIELD_SIZE) {
    const [gameSetup] = await Promise.all([generateRandomGameSetup(fieldSize), shuffleFieldAnimation()]);

    return gameSetup;
  }

  /**
   * Initializes the game elements on the game field based on the provided game state.
   */
  async function initializeElementsOnGameField(options: InitializeElementsOptions) {
    const { gameState, nextPositionsIfWait, isInitialStart, shouldResetToInitialPosition } = options;

    for (const gameElementId of ALL_GAME_ELEMENT_IDS) {
      const gameElementNode = getHtmlElementForGameElement(gameElementId);
      const initialPosition = getInitialPositionOfGameElement(gameState.setup, gameElementId);

      if (!initialPosition) continue;

      const cellElement = gameFieldElement.children[initialPosition.row].children[initialPosition.column];
      if (!cellElement.contains(gameElementNode)) cellElement.append(gameElementNode);
      if (shouldResetToInitialPosition) resetTransform(gameElementNode);
      initializeCatElementStylesIfApplicable(gameElementId);
    }

    if (!isInitialStart) await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);

    updateAllPositions(gameState, nextPositionsIfWait);
  }

  return { element: gameFieldElement, initializeElementsOnGameField, generateRandomGameWhileAnimating };
}

/**
 * Updates the positions of all game elements on the game field based on the current game state.
 */
export function updateAllPositions(gameState: GameState, nextPositionsIfWait: GameElementPositions | undefined, hasWon: boolean = false) {
  for (const gameElementId of ALL_GAME_ELEMENT_IDS) {
    const initialPosition = getInitialPositionOfGameElement(gameState.setup, gameElementId);
    const currentPosition = gameState.currentPositions[gameElementId];
    if (initialPosition === null || currentPosition === null) continue;

    const gameElementNode = getHtmlElementForGameElement(gameElementId);

    const [rowDiff, colDiff] = getCellDifference(currentPosition, initialPosition);
    gameElementNode.style.transform = `translate(${colDiff * 100}%, ${rowDiff * 100}%)`;

    if (isMoon(gameElementId)) {
      const isMoonSet = !isValidCellPosition(gameState, currentPosition, ObjectId.MOON) && !hasWon;
      document.body.classList.toggle(CssClass.DARKNESS, isMoonSet);
      gameElementNode.classList.toggle(CssClass.OPACITY_HIDDEN, isMoonSet);
    }

    if (isKittenId(gameElementId) && nextPositionsIfWait) {
      const nextPosition = nextPositionsIfWait[gameElementId];
      const nextDirection = nextPosition ? getDirection(currentPosition, nextPosition) : undefined;
      updateKittenArrow(gameElementId, nextDirection);
    }
  }
}
