import { GameState } from "../data/game-elements";
import { Direction, isTool, TurnMove } from "../../types";
import { CatId } from "../data/catId";
import { CellPosition, getCellDifferenceAbsolute, getNeighbors, isSameCell, newCellPositionFromDirection } from "../data/cell";
import { getRemainingToolRecoveryTime, isValidCellPosition } from "../checks";
import { isConfigItemEnabled } from "../config/config";

export function isValidMove(gameState: GameState, turnMove: TurnMove): boolean {
  const motherPosition = gameState.currentPositions[CatId.MOTHER];

  if (!motherPosition) {
    console.error("Mother cat not found, cannot perform move.");
    return false;
  }

  if (isTool(turnMove)) {
    if (!isConfigItemEnabled(turnMove)) {
      return false;
    }

    return getRemainingToolRecoveryTime(gameState, turnMove) === 0;
  }

  const newPosition = newCellPositionFromDirection(motherPosition, turnMove);

  return isValidCellPosition(gameState, newPosition, CatId.MOTHER);
}

export function moveCatTowardsCell(gameState: GameState, catId: CatId, targetCell: CellPosition): CellPosition {
  const catPosition = gameState.currentPositions[catId];

  if (isSameCell(catPosition, targetCell)) {
    return catPosition;
  }

  const validNeighbors = getNeighbors(catPosition).filter((cell) => isValidCellPosition(gameState, cell, catId));
  const sortedNeighbors = validNeighbors.sort((a, b) => {
    const [aRowDiff, aColumnDiff] = getCellDifferenceAbsolute(a, targetCell);
    const [bRowDiff, bColumnDiff] = getCellDifferenceAbsolute(b, targetCell);
    const aDiffTotal = aRowDiff + aColumnDiff;
    const bDiffTotal = bRowDiff + bColumnDiff;

    if (aDiffTotal === bDiffTotal) {
      const aMaxDiff = Math.max(aRowDiff, aColumnDiff);
      const bMaxDiff = Math.max(bRowDiff, bColumnDiff);

      return aMaxDiff - bMaxDiff || a.row - b.row || a.column - b.column;
    }

    return aDiffTotal - bDiffTotal;
  });

  return sortedNeighbors[0] ?? catPosition;
}

export function moveCatInDirection(gameState: GameState, catId: CatId, direction: Direction): CellPosition {
  const newPosition = newCellPositionFromDirection(gameState.currentPositions[catId], direction);
  const isValidMove = isValidCellPosition(gameState, newPosition, catId);
  return isValidMove ? newPosition : gameState.currentPositions[catId];
}
