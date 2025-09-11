import { Direction } from "../../types";

export interface CellPosition {
  row: number;
  column: number;
}

type CellDifference = [rowDiff: number, colDiff: number];

export function isSameCell(cell1: CellPosition, cell2: CellPosition) {
  return cell1.row === cell2.row && cell1.column === cell2.column;
}

export function containsCell(cells: CellPosition[], cell: CellPosition): boolean {
  return cells.some((c) => isSameCell(c, cell));
}

export function getCellDifference(cell1: CellPosition, cell2: CellPosition): CellDifference {
  return [cell1.row - cell2.row, cell1.column - cell2.column];
}

export function getCellDifferenceAbsolute(cell1: CellPosition, cell2: CellPosition): CellDifference {
  const [rowDiff, colDiff] = getCellDifference(cell1, cell2);
  return [Math.abs(rowDiff), Math.abs(colDiff)];
}

const CLOCKWISE_NEIGHBOR_OFFSETS: CellDifference[] = [
  [-1, 0], // N
  [-1, 1], // NE
  [0, 1], // E
  [1, 1], // SE
  [1, 0], // S
  [1, -1], // SW
  [0, -1], // W
  [-1, -1], // NW
];

const DELTA_BY_DIRECTION: Record<Direction, CellDifference> = {
  [Direction.UP]: [-1, 0],
  [Direction.RIGHT]: [0, 1],
  [Direction.DOWN]: [1, 0],
  [Direction.LEFT]: [0, -1],
};

const ORTHOGONAL_OFFSETS = Object.values(DELTA_BY_DIRECTION);

export function getNeighbors(cell: CellPosition, getAllClockwise: boolean = false): CellPosition[] {
  const neighborOffsets = getAllClockwise ? CLOCKWISE_NEIGHBOR_OFFSETS : ORTHOGONAL_OFFSETS;
  return neighborOffsets.map((delta) => applyDiffToCellPosition(cell, delta));
}

function applyDiffToCellPosition(cellPosition: CellPosition, [rowDiff, colDiff]: CellDifference): CellPosition {
  return {
    row: cellPosition.row + rowDiff,
    column: cellPosition.column + colDiff,
  };
}

export function getDirection(from: CellPosition, to: CellPosition): Direction | null {
  const [rowDiff, colDiff] = getCellDifference(to, from);

  for (let [direction, [directionRowDiff, directionColDiff]] of Object.entries(DELTA_BY_DIRECTION) as [Direction, CellDifference][]) {
    if (rowDiff === directionRowDiff && colDiff === directionColDiff) {
      return direction as Direction;
    }
  }

  return null; // Not a straight line or the same cell
}

export function newCellPositionFromDirection(fromCell: CellPosition, direction: Direction): CellPosition {
  return applyDiffToCellPosition(fromCell, DELTA_BY_DIRECTION[direction]);
}
