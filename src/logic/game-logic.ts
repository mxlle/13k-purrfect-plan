import { Direction } from "../types";
import { PubSubEvent, pubSubService } from "../utils/pub-sub-service";
import { getCellElement } from "../components/game-field/game-field";
import { getKittensElsewhere, getKittensOnCell, isValidCellPosition } from "./checks";
import { globals } from "../globals";
import { createWinScreen } from "../components/win-screen/win-screen";
import { requestAnimationFrameWithTimeout } from "../utils/promise-utils";
import { CatId, isMother, PlacedCat } from "./data/cats";
import { CellPosition, CellType } from "./data/cell";

const KITTEN_DELAY_TIME = 0;

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

  const freeKittens = getKittensElsewhere(globals.placedCats, globals.motherCat);

  for (const kitten of freeKittens) {
    await requestAnimationFrameWithTimeout(KITTEN_DELAY_TIME);
    handleKittenBehavior(kitten);
  }

  checkWinCondition();
}

function handleKittenBehavior(cat: PlacedCat) {
  switch (cat.id) {
    case CatId.MOONY:
      doMoonyMove(cat);
      break;
    case CatId.IVY:
      doIvyMove(cat);
      break;
    case CatId.SPLASHY:
      doSplashyMove(cat);
      break;
  }
}

function doMoonyMove(cat: PlacedCat) {
  // Moony moves towards the moon
  const { row, column } = cat;

  const moonPosition = globals.gameFieldData.flat().find((cell) => cell.type === CellType.MOON);
  if (moonPosition) {
    if (moonPosition.row !== row) {
      // one row closer to the moon
      const newRow = row < moonPosition.row ? row + 1 : row - 1;

      if (isValidCellPosition(globals.gameFieldData, { row: newRow, column })) {
        moveCatToCell(cat, { row: newRow, column });
        return;
      }
    }

    if (moonPosition.column !== column) {
      // one column closer to the moon
      const newColumn = column < moonPosition.column ? column + 1 : column - 1;

      if (isValidCellPosition(globals.gameFieldData, { row, column: newColumn })) {
        moveCatToCell(cat, { row, column: newColumn });
        return;
      }
    }
  }
}

function doIvyMove(cat: PlacedCat) {
  // if next to a tree, then move clockwise around it
  const { row, column } = cat;
  const treePosition = globals.gameFieldData.flat().find((cell) => cell.type === CellType.TREE);

  if (treePosition) {
    const rowDiff = treePosition.row - row;
    const columnDiff = treePosition.column - column;

    if (Math.abs(rowDiff) <= 1 && Math.abs(columnDiff) <= 1) {
      let newRow = row;
      let newColumn = column;

      if (rowDiff === 1) {
        // cat above tree
        if (columnDiff === -1) {
          newRow = row + 1; // move down
        } else {
          newColumn = column + 1; // move right
        }

        moveCatToCell(cat, { row: newRow, column: newColumn });
        return;
      }

      if (rowDiff === -1) {
        // cat below tree
        if (columnDiff === 1) {
          newRow = row - 1; // move up
        } else {
          newColumn = column - 1; // move left
        }

        moveCatToCell(cat, { row: newRow, column: newColumn });
        return;
      }

      if (columnDiff === 1) {
        // cat to the left of tree
        newRow = row - 1; // move up
        moveCatToCell(cat, { row: newRow, column });
        return;
      }

      if (columnDiff === -1) {
        // cat to the right of tree
        newRow = row + 1; // move down
        moveCatToCell(cat, { row: newRow, column });
        return;
      }
    }
  }
}

function doSplashyMove(cat: PlacedCat) {
  // Splashy moves towards the puddle
  const { row, column } = cat;
  const waterPosition = globals.gameFieldData.flat().find((cell) => cell.type === CellType.PUDDLE);

  if (waterPosition) {
    if (waterPosition.column !== column) {
      // one column closer to the puddle
      const newColumn = column < waterPosition.column ? column + 1 : column - 1;

      if (isValidCellPosition(globals.gameFieldData, { row, column: newColumn })) {
        moveCatToCell(cat, { row, column: newColumn });
        return;
      }
    }

    if (waterPosition.row !== row) {
      // one row closer to the puddle
      const newRow = row < waterPosition.row ? row + 1 : row - 1;

      if (isValidCellPosition(globals.gameFieldData, { row: newRow, column })) {
        moveCatToCell(cat, { row: newRow, column });
        return;
      }
    }
  }
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
  if (!isMother(cat)) {
    return; // Only mother cat can pick up smaller cats
  }

  const kittensToPickUp = globals.placedCats.filter((c) => c.id !== cat.id && c.row === cat.row && c.column === cat.column);

  kittensToPickUp.forEach((kitten) => {
    if (!cat.inventory) {
      cat.inventory = kitten;
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
