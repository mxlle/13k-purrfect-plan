export interface GameMetaData {
  minMoves: number;
  maxMoves: number;
}

export const enum CellType {
  EMPTY = "",
  TABLE = "🟫",
  CHAIR = "🪑",
}

export interface Settings {
  minAmount: number;
  maxAmount: number;
}

export interface CellPosition {
  row: number;
  column: number;
}

export interface Cell extends CellPosition {
  type: CellType;
}

export interface BaseCat {
  name: string; // todo tagged type
  size: number;
  awake: boolean;
}

export interface Cat extends BaseCat {
  catElement: HTMLElement; // Optional reference to the HTML element representing the cat
}

export interface PlacedCat extends Cat, CellPosition {}

export interface CatWithPosition extends BaseCat, CellPosition {}

export type GameFieldData = Cell[][];

export interface GameData {
  gameFieldData: GameFieldData;
  placedCats: PlacedCat[];
  settings?: Settings;
  metaData?: GameMetaData;
}

// type helpers

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
