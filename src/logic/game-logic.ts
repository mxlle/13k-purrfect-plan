import { Direction, isTool, Tool, TurnMove } from "../types";
import { PubSubEvent, pubSubService } from "../utils/pub-sub-service";
import { getKittensElsewhere, getKittensOnCell, isValidCellPosition } from "./checks";
import { globals } from "../globals";
import { CatId, isMother, PlacedCat } from "./data/cats";
import { CellPosition } from "./data/cell";
import { playSoundForAction } from "../audio/sound-control/sound-control";
import { CssClass } from "../utils/css-class";
import { updateAllPositions } from "../components/game-field/game-field";
import { sleep } from "../utils/promise-utils";
import { shouldApplyKittenBehavior } from "./config";
import { isMoon, isPuddle, isTree } from "./data/objects";

let isPerformingMove = false;

const MEOW_TIME = 1500;

export async function performMove(turnMove: TurnMove) {
  console.debug(`Make move: ${turnMove}`);

  if (isPerformingMove) {
    console.warn("Already performing a move, ignoring this one.");
    return;
  }

  isPerformingMove = true;

  globals.moves++;
  doMoonMove();

  await playSoundForAction(turnMove);

  const kittensOnCell = getKittensOnCell(globals.placedCats, globals.motherCat);
  const freeKittens = getKittensElsewhere(globals.placedCats, globals.motherCat);

  if (isTool(turnMove)) {
    await executeTool(turnMove);
  } else {
    moveCat(globals.motherCat, turnMove);

    for (const kitten of kittensOnCell) {
      moveCat(kitten, turnMove);
    }

    for (const kitten of freeKittens) {
      handleKittenBehavior(kitten);
    }
  }

  updateAllPositions();

  checkWinCondition();

  isPerformingMove = false;
}

function doMoonMove() {
  const moon = globals.placedObjects.find(isMoon);
  const width = globals.fieldSize.width;

  if (moon && moon.column < width) {
    moon.column = moon.column + 1;
  }
}

async function executeTool(tool: Tool) {
  switch (tool) {
    case Tool.MEOW:
      document.body.classList.add(CssClass.MEOW);

      await sleep(300); // Wait for meow speech bubble to appear

      // all kittens move one cell in the direction of the mother cat
      const freeKittens = getKittensElsewhere(globals.placedCats, globals.motherCat);

      for (const kitten of freeKittens) {
        moveCatTowardsCell(kitten, globals.motherCat);
      }

      setTimeout(() => {
        document.body.classList.remove(CssClass.MEOW);
      }, MEOW_TIME);
  }
}

function handleKittenBehavior(cat: PlacedCat) {
  if (!shouldApplyKittenBehavior(cat)) {
    return;
  }

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
  const moonPosition = globals.placedObjects.find(isMoon);

  if (moonPosition) {
    moveCatTowardsCell(cat, moonPosition);
  }
}

function doIvyMove(cat: PlacedCat) {
  // if next to a tree, then move clockwise around it
  const { row, column } = cat;
  const treePosition = globals.placedObjects.find(isTree);

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
    } else {
      // If not next to a tree, just move towards the tree
      moveCatTowardsCell(cat, treePosition);
    }
  }
}

function doSplashyMove(cat: PlacedCat) {
  // Splashy moves towards the puddle
  const waterPosition = globals.placedObjects.find(isPuddle);

  if (waterPosition) {
    moveCatTowardsCell(cat, waterPosition);
  }
}

function moveCatTowardsCell(cat: PlacedCat, targetCell: CellPosition) {
  const rowDiff = targetCell.row - cat.row;
  const columnDiff = targetCell.column - cat.column;

  if (rowDiff === 0 && columnDiff === 0) {
    return;
  }

  if (Math.abs(rowDiff) >= Math.abs(columnDiff)) {
    // Move vertically firsts
    const newRow = cat.row + (rowDiff > 0 ? 1 : -1);

    if (isValidCellPosition(globals.fieldSize, { row: newRow, column: cat.column }, globals.placedObjects)) {
      moveCatToCell(cat, { row: newRow, column: cat.column });
      return;
    }
  }

  const newColumn = cat.column + (columnDiff > 0 ? 1 : -1);

  if (isValidCellPosition(globals.fieldSize, { row: cat.row, column: newColumn }, globals.placedObjects)) {
    moveCatToCell(cat, { row: cat.row, column: newColumn });
    return;
  }
}

export function moveCat(cat: PlacedCat, direction: Direction) {
  const newPosition = newCellPositionFromDirection(cat, direction);
  moveCatToCell(cat, newPosition);
}

export function moveCatToCell(cat: PlacedCat, cell: CellPosition) {
  const isValidMove = isValidCellPosition(globals.fieldSize, cell, globals.placedObjects);

  if (!isValidMove) {
    console.warn(`Invalid move for cat ${cat.name} to cell (${cell.row}, ${cell.column})`);
    return;
  }

  cat.row = cell.row;
  cat.column = cell.column;
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
    document.body.classList.add(CssClass.WON);
    pubSubService.publish(PubSubEvent.GAME_END);
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
