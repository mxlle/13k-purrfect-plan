import { PlacedCat } from "./cats";

export const enum CellType {
  EMPTY = "",
  TABLE = "🟫",
  CHAIR = "🪑",
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
export const isChair = (typeOrObject: string | Cell) => getType(typeOrObject) === CellType.CHAIR;

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

export function getCellTypesWithoutPrefix() {
  return {
    _: CellType.EMPTY,
    T: CellType.TABLE,
    c: CellType.CHAIR,
  };
}
