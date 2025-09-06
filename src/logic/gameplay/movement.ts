import { GameState } from "../data/game-elements";
import { ConfigCategory, Direction, isSpecialAction, isTool, RECOVERY_TIME_MAP, TurnMove } from "../../types";
import { CatId } from "../data/catId";
import { CellPosition, getCellDifferenceTotal, getFourNeighbors, newCellPositionFromDirection } from "../data/cell";
import { isValidCellPosition } from "../checks";

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

export function moveCatTowardsCell(gameState: GameState, catId: CatId, targetCell: CellPosition): CellPosition {
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

export function moveCatInDirection(gameState: GameState, catId: CatId, direction: Direction): CellPosition {
  const newPosition = newCellPositionFromDirection(gameState.currentPositions[catId], direction);
  const isValidMove = isValidCellPosition(gameState, newPosition, catId);
  return isValidMove ? newPosition : gameState.currentPositions[catId];
}
