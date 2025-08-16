import { Cell, CellPosition, GameFieldData, isEmptyField, PlacedCat } from "../types";

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
  return placedCats.filter((cat) => !cat.isMother && cat.row === cell.row && cat.column === cell.column);
}

export function getEmptyFields(gameFieldData: GameFieldData, placedCats: PlacedCat[]) {
  return gameFieldData.flat().filter((cell) => isEmptyField(placedCats, cell));
}

const findField = (gameFieldData: GameFieldData, position: CellPosition): Cell | undefined => {
  return gameFieldData[position.row]?.[position.column];
};

export function isValidCellPosition(gameFieldData: GameFieldData, position: CellPosition): boolean {
  return findField(gameFieldData, position) !== undefined;
}

export function getMotherCat(placedCats: PlacedCat[]): PlacedCat | undefined {
  return placedCats.find((cat) => cat.isMother);
}
