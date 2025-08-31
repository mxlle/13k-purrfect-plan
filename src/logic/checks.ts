import { ALL_KITTEN_IDS, KittenId } from "./data/catId";
import { CellPosition, isEmptyField, isSameCell } from "./data/cell";
import { FieldSize } from "./data/field-size";
import { ObjectId } from "../types";
import { GameElementId, GameSetup, GameState } from "./data/game-elements";
import { isCatId, isMom } from "./data/cats";

export function getKittensOnCell(gameState: GameState, cell: CellPosition): KittenId[] {
  return ALL_KITTEN_IDS.filter((catId) => isSameCell(gameState.currentPositions[catId], cell));
}

export function getKittensElsewhere(gameState: GameState, cell: CellPosition): KittenId[] {
  return ALL_KITTEN_IDS.filter((catId) => !isSameCell(gameState.currentPositions[catId], cell));
}

export function getEmptyFields(gameSetup: GameSetup): CellPosition[] {
  return getAllCellPositions(gameSetup.fieldSize).filter((cell) => isEmptyField(cell, gameSetup));
}

export function getAllCellPositions(fieldSize: FieldSize): CellPosition[] {
  const positions: CellPosition[] = [];
  for (let row = 0; row < fieldSize; row++) {
    for (let column = 0; column < fieldSize; column++) {
      positions.push({ row, column });
    }
  }
  return positions;
}

export function isValidCellPosition(gameState: GameState, position: CellPosition, elementToBeMoved: GameElementId): boolean {
  const fieldSize = gameState.setup.fieldSize;

  if (position.row < 0 || position.row >= fieldSize || position.column < 0 || position.column >= fieldSize) {
    return false;
  }

  if (!gameState.currentPositions[ObjectId.TREE]) {
    return true;
  }

  const targetIsTree = isSameCell(position, gameState.currentPositions[ObjectId.TREE]);
  const targetIsPuddle = isSameCell(position, gameState.currentPositions[ObjectId.PUDDLE]);

  return !targetIsTree && (!targetIsPuddle || !isCatId(elementToBeMoved) || !isMom(elementToBeMoved)); // mom doesn't move into the puddle
}
