import { ALL_KITTEN_IDS, KittenId } from "./data/catId";
import { CellPosition, isSameCell } from "./data/cell";
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

export function isEmptyField(cell: CellPosition, gameSetup: GameSetup, options?: { ignoreCats: boolean }): boolean {
  const occupiedPositions = Object.entries(gameSetup.elementPositions)
    .filter(([id]) => !options?.ignoreCats || !isCatId(id))
    .map(([_id, position]) => position)
    .filter(Boolean) as CellPosition[];
  return occupiedPositions.every((pos: CellPosition) => !isSameCell(pos, cell));
}

export function getEmptyFields(gameSetup: GameSetup, options?: { ignoreCats: boolean }): CellPosition[] {
  return getAllCellPositions(gameSetup.fieldSize).filter((cell) => isEmptyField(cell, gameSetup, options));
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

  const targetIsTree = !!gameState.currentPositions[ObjectId.TREE] && isSameCell(position, gameState.currentPositions[ObjectId.TREE]);
  const targetIsPuddle = !!gameState.currentPositions[ObjectId.PUDDLE] && isSameCell(position, gameState.currentPositions[ObjectId.PUDDLE]);

  return !targetIsTree && (!targetIsPuddle || !isCatId(elementToBeMoved) || !isMom(elementToBeMoved)); // mom doesn't move into the puddle
}
