import { isMother, PlacedCat } from "./data/cats";
import { CellPosition, isEmptyField, isSameCell } from "./data/cell";
import { FieldSize } from "./data/field-size";
import { isTree, PlacedObject } from "./data/objects";

// get all 8 neighbors of a cell
export function getNeighbors(placedCats: PlacedCat[], self: PlacedCat): PlacedCat[] {
  const { row, column } = self;

  const neighbors: PlacedCat[] = placedCats.filter((cat) => {
    const isSelf = cat.id === self.id;
    return !isSelf && Math.abs(cat.row - row) <= 1 && Math.abs(cat.column - column) <= 1;
  });

  return neighbors;
}

export function getKittensOnCell(placedCats: PlacedCat[], cell: CellPosition): PlacedCat[] {
  return placedCats.filter((cat) => !isMother(cat) && cat.row === cell.row && cat.column === cell.column);
}

export function getKittensElsewhere(placedCats: PlacedCat[], cell: CellPosition): PlacedCat[] {
  return placedCats.filter((cat) => !isMother(cat) && (cat.row !== cell.row || cat.column !== cell.column));
}

export function getEmptyFields(fieldSize: FieldSize, placedCats: PlacedCat[], placedObjects: PlacedObject[]): CellPosition[] {
  return getAllCellPositions(fieldSize).filter((cell) => isEmptyField(cell, placedCats, placedObjects));
}

export function getAllCellPositions(fieldSize: FieldSize): CellPosition[] {
  const positions: CellPosition[] = [];
  for (let row = 0; row < fieldSize.height; row++) {
    for (let column = 0; column < fieldSize.width; column++) {
      positions.push({ row, column });
    }
  }
  return positions;
}

export function isValidCellPosition(fieldSize: FieldSize, position: CellPosition, placedObjects: PlacedObject[]): boolean {
  if (position.row < 0 || position.row >= fieldSize.height || position.column < 0 || position.column >= fieldSize.width) {
    return false;
  }

  return !placedObjects.some((obj) => isSameCell(obj, position) && isTree(obj));
}

export function getMotherCat(placedCats: PlacedCat[]): PlacedCat | undefined {
  return placedCats.find(isMother);
}
