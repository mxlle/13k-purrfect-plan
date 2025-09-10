import { GameState } from "../data/game-elements";
import { ConfigCategory, Direction, isTool, TurnMove } from "../../types";
import { CatId } from "../data/catId";
import { CellPosition, getCellDifferenceAbsolute, getFourNeighbors, isSameCell, newCellPositionFromDirection } from "../data/cell";
import { getRemainingToolRecoveryTime, isValidCellPosition } from "../checks";

export function isValidMove(gameState: GameState, turnMove: TurnMove): boolean {
  const motherPosition = gameState.currentPositions[CatId.MOTHER];

  if (!motherPosition) {
    console.error("Mother cat not found, cannot perform move.");
    return false;
  }

  if (isTool(turnMove)) {
    if (!gameState.setup.config[ConfigCategory.TOOLS][turnMove]) {
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

  const validNeighbors = getFourNeighbors(catPosition).filter((cell) => isValidCellPosition(gameState, cell, catId));
  const sortedNeighbors = validNeighbors.sort((a, b) => {
    const aDiff = getCellDifferenceAbsolute(a, targetCell);
    const bDiff = getCellDifferenceAbsolute(b, targetCell);
    const aDiffTotal = aDiff.rowDiff + aDiff.columnDiff;
    const bDiffTotal = bDiff.rowDiff + bDiff.columnDiff;

    if (aDiffTotal === bDiffTotal) {
      const aMaxDiff = Math.max(aDiff.rowDiff, aDiff.columnDiff);
      const bMaxDiff = Math.max(bDiff.rowDiff, bDiff.columnDiff);

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
