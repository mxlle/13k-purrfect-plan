import { CatId } from "./catId";
import { ObjectId } from "./objects";
import { GameSetup } from "./game-elements";

export interface CellPosition {
  row: number;
  column: number;
}

export const EMPTY_CELL = " " as const;

export function isEmptyField(cell: CellPosition, gameSetup: GameSetup): boolean {
  const occupiedPositions = Object.values(gameSetup.elementPositions).filter(Boolean) as CellPosition[];
  console.debug("Occupied positions:", occupiedPositions);

  return occupiedPositions.every((pos: CellPosition) => !isSameCell(pos, cell));
}

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
