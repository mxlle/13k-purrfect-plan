import { CellPosition, GameFieldData, isEmptyField, PlacedCat } from "../types";

// get all 8 neighbors of a cell, plus the three cells on the other side of the table
export function getNeighbors(placedCats: PlacedCat[], self: CellPosition): PlacedCat[] {
  const { row, column } = self;

  const neighbors: PlacedCat[] = placedCats.filter((cat) => {
    const isSelf = cat.row === row && cat.column === column;
    return !isSelf && Math.abs(cat.row - row) <= 1 && Math.abs(cat.column - column) <= 1;
  });

  return neighbors;
}

export function getEmptyFields(gameFieldData: GameFieldData, placedCats: PlacedCat[]) {
  return gameFieldData.flat().filter((cell) => isEmptyField(placedCats, cell));
}
