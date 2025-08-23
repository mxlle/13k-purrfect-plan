import { CellPosition } from "./cell";

export type FieldSize = 3 | 4 | 5;

export const DEFAULT_FIELD_SIZE: FieldSize = 5;

export function getMiddleCoordinates(fieldSize: FieldSize): CellPosition | undefined {
  const middleRow = Math.floor((fieldSize - 1) / 2);
  const middleColumn = Math.floor((fieldSize - 1) / 2);

  return { row: middleRow, column: middleColumn };
}
