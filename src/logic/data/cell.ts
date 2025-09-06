import { CatId } from "./catId";
import { Direction, ObjectId } from "../../types";

export interface CellPosition {
  row: number;
  column: number;
}

export const EMPTY_CELL = " " as const;

export function isSameCell(cell1: CellPosition, cell2: CellPosition) {
  return cell1.row === cell2.row && cell1.column === cell2.column;
}

export function containsCell(cells: CellPosition[], cell: CellPosition): boolean {
  return cells.some((c) => isSameCell(c, cell));
}

export function getCellDifference(cell1: CellPosition, cell2: CellPosition): CellPosition {
  return {
    row: cell1.row - cell2.row,
    column: cell1.column - cell2.column,
  };
}

export function getCellDifferenceTotal(cell1: CellPosition, cell2: CellPosition): number {
  const diff = getCellDifference(cell1, cell2);
  return Math.abs(diff.row) + Math.abs(diff.column);
}

export function getEightNeighborsClockwise(cell: CellPosition): CellPosition[] {
  const neighbors: CellPosition[] = [];

  for (let rowIndex = cell.row - 1; rowIndex <= cell.row + 1; rowIndex++) {
    neighbors.push({ row: rowIndex, column: cell.column + 1 });
  }

  neighbors.push({ row: cell.row + 1, column: cell.column });

  for (let rowIndex = cell.row + 1; rowIndex >= cell.row - 1; rowIndex--) {
    neighbors.push({ row: rowIndex, column: cell.column - 1 });
  }

  neighbors.push({ row: cell.row - 1, column: cell.column });

  return neighbors;
}

export function getFourNeighbors(cell: CellPosition): CellPosition[] {
  const { row, column } = cell;

  return [
    { row, column: column - 1 },
    { row, column: column + 1 },
    { row: row - 1, column },
    { row: row + 1, column },
  ];
}

export function getDirection(from: CellPosition, to: CellPosition): Direction | null {
  const diff = getCellDifference(to, from);

  if (diff.row === 0 && diff.column > 0) {
    return Direction.RIGHT;
  } else if (diff.row === 0 && diff.column < 0) {
    return Direction.LEFT;
  } else if (diff.column === 0 && diff.row > 0) {
    return Direction.DOWN;
  } else if (diff.column === 0 && diff.row < 0) {
    return Direction.UP;
  }

  return null; // Not a straight line
}

export function getCellTypePlaceholders() {
  return {
    _: EMPTY_CELL,
    T: ObjectId.TREE,
    O: ObjectId.PUDDLE,
    C: ObjectId.MOON,
    M: CatId.MOTHER,
    t: CatId.IVY,
    o: CatId.SPLASHY,
    c: CatId.MOONY,
  };
}
