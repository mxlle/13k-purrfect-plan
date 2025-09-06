import {
  ConfigCategory,
  Direction,
  isDirection,
  isSpecialAction,
  isTool,
  ObjectId,
  RECOVERY_TIME_MAP,
  SpecialAction,
  Tool,
  TurnMove,
} from "../types";
import { PubSubEvent, pubSubService } from "../utils/pub-sub-service";
import { getKittensElsewhere, getKittensOnCell, isValidCellPosition } from "./checks";
import { ALL_KITTEN_IDS, CatId } from "./data/catId";
import { CellPosition, getCellDifferenceTotal, getEightNeighborsClockwise, getFourNeighbors, isSameCell } from "./data/cell";
import { updateAllPositions } from "../components/game-field/game-field";
import { sleep } from "../utils/promise-utils";
import { hasMoveLimit, shouldApplyKittenBehavior, showMovesInfo } from "./config/config";
import { deepCopyElementsMap, GameElementPositions, GameState, getParFromGameState } from "./data/game-elements";

import { kittenMeows, meow } from "../components/cat-component/cat-component";
import { globals, isGameInProgress } from "../globals";
import { removeAllSpeechBubbles, showSpeechBubble } from "../components/speech-bubble/speech-bubble";
import { getTranslation } from "../translations/i18n";
import { TranslationKey } from "../translations/translationKey";
import { pokiSdk } from "../poki-integration";
import { removeDuplicates } from "../utils/array-utils";

let isPerformingMove = false;

const MEOW_TIME = 1500;

export async function performMove(gameState: GameState, turnMove: TurnMove) {
  console.debug(`Make move: ${turnMove}`);

  if (isPerformingMove) {
    console.warn("Already performing a move, ignoring this one.");
    return;
  }

  if (!isGameInProgress()) {
    console.warn("Game is not in progress, ignoring this move.");
    return;
  }

  if (!isValidMove(gameState, turnMove)) {
    console.warn(`Invalid move: ${turnMove}`);
    return;
  }

  if (import.meta.env.POKI_ENABLED === "true" && gameState.moves.length === 0) {
    pokiSdk.gameplayStart();
  }

  isPerformingMove = true;

  try {
    removeAllSpeechBubbles();

    gameState.moves.push(turnMove);

    const toolStartPromise = isTool(turnMove) ? preToolAction(gameState, turnMove) : Promise.resolve();

    const kittensOnCellBefore = getKittensOnCell(gameState, gameState.currentPositions[CatId.MOTHER]);
    gameState.currentPositions = calculateNewPositions(gameState, turnMove);
    const kittensOnCellAfter = getKittensOnCell(gameState, gameState.currentPositions[CatId.MOTHER]);

    await toolStartPromise;

    globals.nextPositionsIfWait = calculateNewPositions(gameState, SpecialAction.WAIT);

    const hasWon = isWinConditionMet(gameState);

    updateAllPositions(gameState, globals.nextPositionsIfWait, hasWon);

    isTool(turnMove) && (await postToolAction(gameState, turnMove));

    const newKittensOnCell = kittensOnCellAfter.filter((kitten) => !kittensOnCellBefore.includes(kitten));
    await kittenMeows(newKittensOnCell);

    if (hasWon) {
      await sleep(300); // to finish moving
      showSpeechBubble(gameState.representations[CatId.MOTHER].htmlElement, getTranslation(TranslationKey.UNITED));
      pubSubService.publish(PubSubEvent.GAME_END, { isWon: true });
      await kittenMeows(ALL_KITTEN_IDS, true);
    } else if (hasLost(gameState)) {
      await sleep(300); // to finish moving
      showSpeechBubble(gameState.representations[CatId.MOTHER].htmlElement, getTranslation(TranslationKey.LOST));
      pubSubService.publish(PubSubEvent.GAME_END, { isWon: false });
    }
  } catch (error) {
    console.error("Error performing move:", error);
  }

  isPerformingMove = false;
}

export function isValidMove(gameState: GameState, turnMove: TurnMove): boolean {
  const motherPosition = gameState.currentPositions[CatId.MOTHER];

  if (!motherPosition) {
    console.error("Mother cat not found, cannot perform move.");
    return false;
  }

  if (isSpecialAction(turnMove)) {
    return true;
  }

  if (isTool(turnMove)) {
    if (!gameState.setup.config[ConfigCategory.TOOLS][turnMove]) {
      return false;
    }

    const recoveryTime = RECOVERY_TIME_MAP[turnMove];
    // If the move is a tool, check if it can be used based on the recovery time
    const lastIndex = gameState.moves.lastIndexOf(turnMove);

    return lastIndex === -1 || gameState.moves.length - lastIndex > recoveryTime;
  }

  const newPosition = newCellPositionFromDirection(motherPosition, turnMove);

  return isValidCellPosition(gameState, newPosition, CatId.MOTHER);
}

export function calculateNewPositions(gameState: GameState, turnMove: TurnMove): GameElementPositions {
  const previousMotherPosition = gameState.currentPositions[CatId.MOTHER];

  if (!previousMotherPosition) {
    console.error("Mother cat not found, cannot perform move.");
    return gameState.currentPositions;
  }

  const kittensOnCell = getKittensOnCell(gameState, previousMotherPosition);
  const freeKittens = getKittensElsewhere(gameState, previousMotherPosition);

  let newElementPositions: GameElementPositions;

  if (isTool(turnMove)) {
    newElementPositions = executeTool(gameState, turnMove);
  } else {
    newElementPositions = deepCopyElementsMap(gameState.currentPositions);

    if (isDirection(turnMove)) {
      newElementPositions[CatId.MOTHER] = moveCat(gameState, CatId.MOTHER, turnMove);

      for (const kitten of kittensOnCell) {
        newElementPositions[kitten] = moveCat(gameState, kitten, turnMove);
      }
    }

    for (const kitten of freeKittens) {
      newElementPositions[kitten] = handleKittenBehavior(gameState, kitten, previousMotherPosition, newElementPositions[CatId.MOTHER]);
    }
  }

  newElementPositions[ObjectId.MOON] = doMoonMove(gameState);

  return newElementPositions;
}

function doMoonMove(gameState: GameState): CellPosition {
  const moon = gameState.currentPositions[ObjectId.MOON];

  if (!moon || !showMovesInfo(gameState.setup.config)) {
    return moon;
  }

  const width = gameState.setup.fieldSize;

  if (moon && moon.column < width) {
    return { ...moon, column: moon.column + 1 };
  }

  return moon;
}

async function preToolAction(gameState: GameState, tool: Tool) {
  switch (tool) {
    case Tool.MEOW:
      showSpeechBubble(gameState.representations[CatId.MOTHER].htmlElement, getTranslation(TranslationKey.MEOW), MEOW_TIME);

      await Promise.all([meow(CatId.MOTHER), sleep(300)]); // Wait for meow speech bubble to appear

      break;
  }
}

async function postToolAction(_gameState: GameState, _tool: Tool) {
  // currently nothing
}

function executeTool(gameState: GameState, tool: Tool): GameElementPositions {
  const newGameElementPositions: GameElementPositions = deepCopyElementsMap(gameState.currentPositions);
  const momPosition = gameState.currentPositions[CatId.MOTHER];

  switch (tool) {
    case Tool.MEOW:
      // all kittens move one cell in the direction of the mother cat
      const freeKittens = getKittensElsewhere(gameState, momPosition);

      for (const kitten of freeKittens) {
        newGameElementPositions[kitten] = moveCatTowardsCell(gameState, kitten, momPosition);
      }
  }

  return newGameElementPositions;
}

function handleKittenBehavior(
  gameState: GameState,
  kitten: CatId,
  previousMotherPosition: CellPosition,
  newMotherPosition: CellPosition,
): CellPosition {
  const previousPosition = { ...gameState.currentPositions[kitten] };

  if (!shouldApplyKittenBehavior(gameState.setup, kitten)) {
    return previousPosition;
  }

  let newPosition: CellPosition = { ...previousPosition };

  switch (kitten) {
    case CatId.MOONY:
      newPosition = doMoonyMove(gameState);
      break;
    case CatId.IVY:
      newPosition = doIvyMove(gameState);
      break;
    case CatId.SPLASHY:
      newPosition = doSplashyMove(gameState);
      break;
  }

  // on swap, revert kitten to previous position
  if (isSameCell(newPosition, previousMotherPosition) && isSameCell(previousPosition, newMotherPosition)) {
    // console.debug(`Reverting ${CAT_NAMES[kitten]} to previous position:`, previousPosition);
    newPosition = previousPosition;
  }

  return newPosition;
}

function doMoonyMove(gameState: GameState): CellPosition {
  // Moony moves towards the moon
  const catId = CatId.MOONY;
  const moonPosition = gameState.currentPositions[ObjectId.MOON];

  if (moonPosition) {
    return moveCatTowardsCell(gameState, catId, moonPosition);
  }

  return gameState.currentPositions[catId];
}

function doIvyMove(gameState: GameState): CellPosition {
  // if next to a tree, then move clockwise around it
  const catId = CatId.IVY;
  const catPosition = gameState.currentPositions[catId];
  const treePosition = gameState.currentPositions[ObjectId.TREE];

  if (treePosition) {
    const neighbors = getEightNeighborsClockwise(treePosition);

    const indexOfCatInNeighbors = neighbors.findIndex((cell) => isSameCell(cell, catPosition));

    if (indexOfCatInNeighbors !== -1) {
      return neighbors[(indexOfCatInNeighbors + 1) % neighbors.length];
    }

    return moveCatTowardsCell(gameState, catId, treePosition);
  }
}

function doSplashyMove(gameState: GameState) {
  // Splashy moves towards the puddle
  const catId = CatId.SPLASHY;
  const waterPosition = gameState.currentPositions[ObjectId.PUDDLE];

  if (waterPosition) {
    return moveCatTowardsCell(gameState, catId, waterPosition);
  }

  return gameState.currentPositions[catId];
}

function moveCatTowardsCell(gameState: GameState, catId: CatId, targetCell: CellPosition): CellPosition {
  const catPosition = gameState.currentPositions[catId];
  const rowDiff = targetCell.row - catPosition.row;
  const columnDiff = targetCell.column - catPosition.column;

  if (rowDiff === 0 && columnDiff === 0) {
    return catPosition;
  }

  const validNeighbors = getFourNeighbors(catPosition).filter((cell) => isValidCellPosition(gameState, cell, catId));
  const sortedNeighbors = validNeighbors.sort((a, b) => {
    const diffA = getCellDifferenceTotal(a, targetCell);
    const diffB = getCellDifferenceTotal(b, targetCell);

    if (diffA === diffB) {
      return a.column === catPosition.column ? 1 : -1;
    }

    return diffA - diffB;
  });

  return sortedNeighbors[0] ?? catPosition;
}

export function moveCat(gameState: GameState, catId: CatId, direction: Direction): CellPosition {
  const newPosition = newCellPositionFromDirection(gameState.currentPositions[catId], direction);
  const isValidMove = isValidCellPosition(gameState, newPosition, catId);
  return isValidMove ? newPosition : gameState.currentPositions[catId];
}

export function isWinConditionMet(gameState: GameState | null): boolean {
  if (!gameState) {
    return false;
  }

  const momPosition = gameState.currentPositions[CatId.MOTHER];

  return ALL_KITTEN_IDS.every((catId) => {
    const kittenPosition = gameState.currentPositions[catId];

    return isSameCell(momPosition, kittenPosition);
  });
}

export function hasLost(gameState: GameState | null): boolean {
  if (!gameState || !hasMoveLimit(gameState.setup.config)) {
    return false;
  }

  return gameState.moves.length >= getParFromGameState(gameState) && !isWinConditionMet(gameState);
}

function newCellPositionFromDirection(fromCell: CellPosition, direction: Direction): CellPosition {
  switch (direction) {
    case Direction.UP:
      return { ...fromCell, row: fromCell.row - 1 };
    case Direction.DOWN:
      return { ...fromCell, row: fromCell.row + 1 };
    case Direction.LEFT:
      return { ...fromCell, column: fromCell.column - 1 };
    case Direction.RIGHT:
      return { ...fromCell, column: fromCell.column + 1 };
  }
}

export function getRemainingSolutions(gameState: GameState): TurnMove[][] {
  return gameState.setup.possibleSolutions
    .filter((solution) => gameState.moves.every((move, index) => solution[index] === move))
    .map((solution) => solution.slice(gameState.moves.length));
}

export function getBestNextMove(gameState: GameState): TurnMove | undefined {
  const remainingSolutions = getRemainingSolutions(gameState);
  const firstSteps = remainingSolutions.map((solution) => solution[0]);
  const countPerTurnMove: { [key in TurnMove]?: number } = {};
  firstSteps.forEach((move) => {
    countPerTurnMove[move] = (countPerTurnMove[move] || 0) + 1;
  });
  const sortedMoves = removeDuplicates(firstSteps).sort((a, b) => countPerTurnMove[b] - countPerTurnMove[a]);
  console.debug("Getting best next move: ", countPerTurnMove, remainingSolutions);

  return sortedMoves[0];
}
