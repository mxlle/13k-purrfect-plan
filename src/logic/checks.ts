import { ALL_KITTEN_IDS, CatId, KittenId } from "./data/catId";
import { CellPosition, isSameCell } from "./data/cell";
import { FieldSize } from "./data/field-size";
import { ObjectId, RECOVERY_TIME_MAP, Tool } from "../types";
import { GameElementId, GameSetup, GameState, getParFromGameState } from "./data/game-elements";
import { isCatId, isMom } from "./data/cats";
import { hasMoveLimit } from "./config/config";

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

export function isMoveLimitExceeded(gameState: GameState | null): boolean {
  if (!gameState || !hasMoveLimit()) {
    return false;
  }

  return gameState.moves.length >= getParFromGameState(gameState, { skipSolutionCheck: true }) && !isWinConditionMet(gameState);
}

export function getKittensOnCell(gameState: GameState, cell: CellPosition): KittenId[] {
  return ALL_KITTEN_IDS.filter((catId) => isSameCell(gameState.currentPositions[catId], cell));
}

export function getKittensElsewhere(gameState: GameState, cell: CellPosition): KittenId[] {
  return ALL_KITTEN_IDS.filter((catId) => !isSameCell(gameState.currentPositions[catId], cell));
}

export function isEmptyField(cell: CellPosition, gameSetup: GameSetup): boolean {
  const occupiedPositions = Object.values(gameSetup.elementPositions).filter(Boolean) as CellPosition[];
  return occupiedPositions.every((pos: CellPosition) => !isSameCell(pos, cell));
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

function isWithinBounds(position: CellPosition, size: number): boolean {
  const { row, column } = position;
  return row >= 0 && row < size && column >= 0 && column < size;
}

export function isValidCellPosition(gameState: GameState, position: CellPosition, elementId: GameElementId): boolean {
  const fieldSize = gameState.setup.fieldSize;
  if (!isWithinBounds(position, fieldSize)) {
    return false;
  }

  const treePos = gameState.currentPositions[ObjectId.TREE];
  const puddlePos = gameState.currentPositions[ObjectId.PUDDLE];

  const targetIsTree = !!treePos && isSameCell(position, treePos);

  if (targetIsTree) {
    return false;
  }

  const targetIsPuddle = !!puddlePos && isSameCell(position, puddlePos);
  const isMomElement = isCatId(elementId) && isMom(elementId);

  return !targetIsPuddle || !isMomElement; // Mother cannot move into the puddle
}

export function getRemainingToolRecoveryTime(gameState: GameState, tool: Tool): number {
  const recoveryTime = RECOVERY_TIME_MAP[tool];
  const lastIndex = gameState.moves.lastIndexOf(tool);
  const remainingTime = lastIndex === -1 ? 0 : recoveryTime - (gameState.moves.length - lastIndex);

  return Math.max(0, remainingTime);
}
