import { ALL_KITTEN_IDS, CatId } from "./data/cats";
import { CellPosition, isEmptyField, isSameCell } from "./data/cell";
import { FieldSize } from "./data/field-size";
import { ObjectId } from "./data/objects";
import { GameSetup, GameState } from "./data/game-elements";

export function getKittensOnCell(gameState: GameState, cell: CellPosition): CatId[] {
  return ALL_KITTEN_IDS.filter((catId) => isSameCell(gameState.currentPositions[catId], cell));
}

export function getKittensElsewhere(gameState: GameState, cell: CellPosition): CatId[] {
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

export function isValidCellPosition(gameState: GameState, position: CellPosition): boolean {
  const fieldSize = gameState.setup.fieldSize;

  if (position.row < 0 || position.row >= fieldSize || position.column < 0 || position.column >= fieldSize) {
    return false;
  }

  if (!gameState.currentPositions[ObjectId.TREE]) {
    return true;
  }

  return !isSameCell(position, gameState.currentPositions[ObjectId.TREE]);
}
