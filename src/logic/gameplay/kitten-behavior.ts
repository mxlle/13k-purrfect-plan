import { GameState } from "../data/game-elements";
import { CellPosition, getEightNeighborsClockwise, isSameCell } from "../data/cell";
import { CatId } from "../data/catId";
import { ObjectId } from "../../types";
import { moveCatTowardsCell } from "./movement";
import { shouldApplyKittenBehavior } from "../config/config";

export function handleKittenBehavior(
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
