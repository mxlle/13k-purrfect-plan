import { CellPosition, Direction, PlacedCat } from "../types";
import { PubSubEvent, pubSubService } from "../utils/pub-sub-service";
import { getCellElement } from "../components/game-field/game-field";
import { isValidCellPosition } from "./checks";
import { globals } from "../globals";
import { createWinScreen } from "../components/win-screen/win-screen";

export function newGame() {
  pubSubService.publish(PubSubEvent.NEW_GAME);
}

export function moveCat(cat: PlacedCat, direction: Direction) {
  const newPosition = newCellPositionFromDirection(cat, direction);
  moveCatToCell(cat, newPosition);
}

export function moveCatToCell(cat: PlacedCat, cell: CellPosition) {
  const isValidMove = isValidCellPosition(globals.gameFieldData, cell);

  if (!isValidMove) {
    throw new Error("invalid");
  }

  cat.row = cell.row;
  cat.column = cell.column;

  const newCellElement = getCellElement(cat);

  if (newCellElement) {
    newCellElement.appendChild(cat.catElement);
  }

  moveInventory(cat, cell);
  updateInventory(cat);

  checkWinCondition();
}

function moveInventory(cat: PlacedCat, cell: CellPosition) {
  const currentInventory = cat.inventory;

  // Place each item in the inventory into the cell
  currentInventory.items.forEach((item) => {
    moveCatToCell(item, cell);
  });
}

function updateInventory(cat: PlacedCat) {
  if (!cat.isMother) {
    return; // Only mother cat can pick up smaller cats
  }

  const currentInventory = cat.inventory;
  const otherCatsOnCell = globals.placedCats.filter((c) => c.id !== cat.id && c.row === cat.row && c.column === cat.column);
  const smallerCats = otherCatsOnCell.filter((c) => c.size < cat.size);
  const catsToPickUp = smallerCats.filter((c) => !currentInventory.items.some((item) => item.id === c.id));

  catsToPickUp.forEach((smallerCat) => {
    if (currentInventory.items.length < currentInventory.size) {
      currentInventory.items.push(smallerCat);
    } else {
      console.warn("Inventory is full, cannot add smaller cat", smallerCat);
    }
  });
}

function checkWinCondition() {
  const allCatsOnOneCell = globals.placedCats.every((cat) => {
    return cat.row === globals.placedCats[0].row && cat.column === globals.placedCats[0].column;
  });

  if (allCatsOnOneCell) {
    globals.isWon = true;
    createWinScreen(100, true);
  }
}

function newCellPositionFromDirection(fromCell: CellPosition, direction: Direction): CellPosition {
  switch (direction) {
    case Direction.UP:
      return { ...fromCell, row: fromCell.row - 1 };
    case Direction.DOWN:
      return { ...fromCell, row: fromCell.row + 1 };
    case Direction.LEFT:
      return { ...fromCell, column: fromCell.column - 1 };
    case Direction.RIGHT:
      return { ...fromCell, column: fromCell.column + 1 };
  }
}
