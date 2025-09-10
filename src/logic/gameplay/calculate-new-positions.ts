import { deepCopyElementsMap, GameElementPositions, GameState } from "../data/game-elements";
import { CellPosition } from "../data/cell";
import { isDirection, isTool, ObjectId, Tool, TurnMove } from "../../types";
import { showMovesInfo } from "../config/config";
import { CatId } from "../data/catId";
import { getKittensElsewhere, getKittensOnCell } from "../checks";
import { moveCatInDirection, moveCatTowardsCell } from "./movement";
import { handleKittenBehavior } from "./kitten-behavior";

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
  }

  // regular movement, except for meow
  if (turnMove !== Tool.MEOW) {
    newElementPositions = deepCopyElementsMap(gameState.currentPositions);

    if (isDirection(turnMove)) {
      newElementPositions[CatId.MOTHER] = moveCatInDirection(gameState, CatId.MOTHER, turnMove);

      for (const kitten of kittensOnCell) {
        newElementPositions[kitten] = { ...newElementPositions[CatId.MOTHER] };
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
