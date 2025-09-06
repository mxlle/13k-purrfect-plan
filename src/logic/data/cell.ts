import { Direction } from "../../types";

export interface CellPosition {
  row: number;
  column: number;
}

export interface CellDifference {
  rowDiff: number;
  columnDiff: number;
}

export function isSameCell(cell1: CellPosition, cell2: CellPosition) {
  return cell1.row === cell2.row && cell1.column === cell2.column;
}

export function containsCell(cells: CellPosition[], cell: CellPosition): boolean {
  return cells.some((c) => isSameCell(c, cell));
}

export function getCellDifference(cell1: CellPosition, cell2: CellPosition): CellDifference {
  return {
    rowDiff: cell1.row - cell2.row,
    columnDiff: cell1.column - cell2.column,
  };
}

export function getCellDifferenceAbsolute(cell1: CellPosition, cell2: CellPosition): CellDifference {
  const diff = getCellDifference(cell1, cell2);
  return {
    rowDiff: Math.abs(diff.rowDiff),
    columnDiff: Math.abs(diff.columnDiff),
  };
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

  if (diff.rowDiff === 0 && diff.columnDiff > 0) {
    return Direction.RIGHT;
  } else if (diff.rowDiff === 0 && diff.columnDiff < 0) {
    return Direction.LEFT;
  } else if (diff.columnDiff === 0 && diff.rowDiff > 0) {
    return Direction.DOWN;
  } else if (diff.columnDiff === 0 && diff.rowDiff < 0) {
    return Direction.UP;
  }

  return null; // Not a straight line
}

export function newCellPositionFromDirection(fromCell: CellPosition, direction: Direction): CellPosition {
  switch (direction) {
    case Direction.UP:
      return { ...fromCell, row: fromCell.row - 1 };
    case Direction.DOWN:
      return { ...fromCell, row: fromCell.row + 1 };
    case Direction.LEFT:
      return { ...fromCell, column: fromCell.column - 1 };
    case Direction.RIGHT:
      return { ...fromCell, column: fromCell.column + 1 };
  }
}
