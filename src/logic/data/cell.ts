import { CatId, PlacedCat } from "./cats";

export const enum CellType {
  EMPTY = "",
  TREE = "🌳",
  PUDDLE = "💧",
  MOON = "🌙",
}

export interface CellPosition {
  row: number;
  column: number;
}

export interface Cell extends CellPosition {
  type: CellType;
}

export type GameFieldData = Cell[][];
const getType = (typeOrObject: string | Cell) => (typeof typeOrObject === "string" ? typeOrObject : typeOrObject.type);

export function isEmptyField(placedCats: PlacedCat[], cell: Cell): boolean {
  return !hasCat(placedCats, cell);
}

export function hasCat(placedCats: PlacedCat[], cell: CellPosition): boolean {
  return placedCats.some((p) => isSameCell(p, cell));
}

export function findCat(placedCats: PlacedCat[], cell: CellPosition): PlacedCat | undefined {
  return placedCats.find((p) => isSameCell(p, cell));
}

export function isSameCell(cell1: CellPosition, cell2: CellPosition) {
  return cell1.row === cell2.row && cell1.column === cell2.column;
}

export function getCellDifference(cell1: CellPosition, cell2: CellPosition): CellPosition {
  return {
    row: cell1.row - cell2.row,
    column: cell1.column - cell2.column,
  };
}

export function getCellTypePlaceholders() {
  return {
    _: CellType.EMPTY,
    T: CellType.TREE,
    O: CellType.PUDDLE,
    C: CellType.MOON,
    M: CatId.MOTHER,
    t: CatId.IVY,
    o: CatId.SPLASHY,
    c: CatId.MOONY,
  };
}
