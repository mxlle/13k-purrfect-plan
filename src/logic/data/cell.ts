import { CatId, PlacedCat } from "./cats";
import { ObjectId, PlacedObject } from "./objects";

export interface CellPosition {
  row: number;
  column: number;
}

export const EMPTY_CELL = " " as const;

export function isEmptyField(cell: CellPosition, placedCats: PlacedCat[], placedObjects: PlacedObject[]): boolean {
  return !hasCat(placedCats, cell) && !hasObject(placedObjects, cell);
}

export function hasCat(placedCats: PlacedCat[], cell: CellPosition): boolean {
  return placedCats.some((p) => isSameCell(p, cell));
}

export function hasObject(placedObjects: PlacedObject[], cell: CellPosition): boolean {
  return placedObjects.some((p) => isSameCell(p, cell));
}

export function findCat(placedCats: PlacedCat[], cell: CellPosition): PlacedCat | undefined {
  return placedCats.find((p) => isSameCell(p, cell));
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
