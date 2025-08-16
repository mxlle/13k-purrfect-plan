import { Direction } from "../types";
import { PubSubEvent, pubSubService } from "../utils/pub-sub-service";
import { getCellElement } from "../components/game-field/game-field";
import { getKittensOnCell, isValidCellPosition } from "./checks";
import { globals } from "../globals";
import { createWinScreen } from "../components/win-screen/win-screen";
import { requestAnimationFrameWithTimeout } from "../utils/promise-utils";
import { PlacedCat } from "./data/cats";
import { CellPosition } from "./data/cell";

const KITTEN_DELAY_TIME = 100;

export function newGame() {
  pubSubService.publish(PubSubEvent.NEW_GAME);
}

export async function performMove(direction: Direction) {
  const kittensOnCell = getKittensOnCell(globals.placedCats, globals.motherCat);

  console.debug(`Moving ${direction}`);
  moveCat(globals.motherCat, direction);

  for (const kitten of kittensOnCell) {
    await requestAnimationFrameWithTimeout(KITTEN_DELAY_TIME);
    moveCat(kitten, direction);
  }

  checkWinCondition();
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
}

function updateInventory(cat: PlacedCat) {
  if (!cat.isMother) {
    return; // Only mother cat can pick up smaller cats
  }

  const currentInventory = cat.inventory;
  const otherCatsOnCell = globals.placedCats.filter((c) => c.id !== cat.id && c.row === cat.row && c.column === cat.column);
  // const smallerCats = otherCatsOnCell.filter((c) => c.size < cat.size);
  const kittensToPickUp = otherCatsOnCell.filter((c) => currentInventory.items.every((item) => item.id !== c.id));

  kittensToPickUp.forEach((kitten) => {
    if (currentInventory.items.length < currentInventory.size) {
      currentInventory.items.push(kitten);
    } else {
      console.warn("Inventory is full, cannot add smaller cat", kitten);
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
