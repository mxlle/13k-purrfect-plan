import { Direction, isTool, RECOVERY_TIME_MAP, Tool, TurnMove } from "../types";
import { PubSubEvent, pubSubService } from "../utils/pub-sub-service";
import { getKittensElsewhere, getKittensOnCell, isValidCellPosition } from "./checks";
import { globals } from "../globals";
import { CatId, isMother, PlacedCat } from "./data/cats";
import { CellPosition, isSameCell } from "./data/cell";
import { playSoundForAction } from "../audio/sound-control/sound-control";
import { CssClass } from "../utils/css-class";
import { updateAllPositions } from "../components/game-field/game-field";
import { sleep } from "../utils/promise-utils";
import { shouldApplyKittenBehavior } from "./config";
import { isMoon, isPuddle, isTree, PlacedObject } from "./data/objects";

let isPerformingMove = false;

const MEOW_TIME = 1500;

export async function performMove(turnMove: TurnMove) {
  console.debug(`Make move: ${turnMove}`);

  if (isPerformingMove) {
    console.warn("Already performing a move, ignoring this one.");
    return;
  }

  if (!isValidMove(turnMove, globals.placedCats, globals.placedObjects, globals.moves)) {
    console.warn(`Invalid move: ${turnMove}`);
    return;
  }

  isPerformingMove = true;

  globals.moves.push(turnMove);

  await playSoundForAction(turnMove);
  isTool(turnMove) && (await preToolAction(turnMove));

  calculateNewPositions(turnMove, globals.placedCats, globals.placedObjects);

  isTool(turnMove) && (await postToolAction(turnMove));

  updateAllPositions();

  checkWinCondition();

  isPerformingMove = false;
}

export function isValidMove(
  turnMove: TurnMove,
  placedCats: PlacedCat[],
  placedObjects: PlacedObject[],
  previousMoves: TurnMove[],
): boolean {
  const motherCat = placedCats.find(isMother);

  if (!motherCat) {
    console.error("Mother cat not found, cannot perform move.");
    return false;
  }

  if (isTool(turnMove)) {
    const recoveryTime = RECOVERY_TIME_MAP[turnMove];
    // If the move is a tool, check if it can be used based on the recovery time
    const lastIndex = previousMoves.lastIndexOf(turnMove);

    return lastIndex === -1 || previousMoves.length - lastIndex > recoveryTime;
  }

  const newPosition = newCellPositionFromDirection(motherCat, turnMove);

  return isValidCellPosition(globals.fieldSize, newPosition, placedObjects);
}

export function calculateNewPositions(turnMove: TurnMove, placedCats: PlacedCat[], placedObjects: PlacedObject[]) {
  doMoonMove(placedObjects);

  const motherCat = placedCats.find(isMother);

  if (!motherCat) {
    console.error("Mother cat not found, cannot perform move.");
    return;
  }

  const previousMotherPosition = { row: motherCat.row, column: motherCat.column };
  const kittensOnCell = getKittensOnCell(placedCats, motherCat);
  const freeKittens = getKittensElsewhere(placedCats, motherCat);

  if (isTool(turnMove)) {
    executeTool(turnMove, placedCats, placedObjects);
  } else {
    moveCat(motherCat, turnMove, placedObjects);

    for (const kitten of kittensOnCell) {
      moveCat(kitten, turnMove, placedObjects);
    }

    for (const kitten of freeKittens) {
      handleKittenBehavior(kitten, placedObjects, previousMotherPosition, motherCat);
    }
  }
}

function doMoonMove(placedObjects: PlacedObject[]) {
  const moon = placedObjects.find(isMoon);
  const width = globals.fieldSize.width;

  if (moon && moon.column < width) {
    moon.column = moon.column + 1;
  }
}

async function preToolAction(tool: Tool) {
  switch (tool) {
    case Tool.MEOW:
      document.body.classList.add(CssClass.MEOW);

      await sleep(300); // Wait for meow speech bubble to appear

      break;
  }
}

async function postToolAction(tool: Tool) {
  switch (tool) {
    case Tool.MEOW:
      setTimeout(() => {
        document.body.classList.remove(CssClass.MEOW);
      }, MEOW_TIME);
      break;
  }
}

function executeTool(tool: Tool, placedCats: PlacedCat[], placedObjects: PlacedObject[]) {
  const motherCat = placedCats.find(isMother);

  switch (tool) {
    case Tool.MEOW:
      // all kittens move one cell in the direction of the mother cat
      const freeKittens = getKittensElsewhere(placedCats, motherCat);

      for (const kitten of freeKittens) {
        moveCatTowardsCell(kitten, motherCat, placedObjects);
      }
  }
}

function handleKittenBehavior(
  cat: PlacedCat,
  placedObjects: PlacedObject[],
  previousMotherPosition: CellPosition,
  newMotherPosition: CellPosition,
) {
  if (!shouldApplyKittenBehavior(cat)) {
    return;
  }

  const previousPosition = { row: cat.row, column: cat.column };

  switch (cat.id) {
    case CatId.MOONY:
      doMoonyMove(cat, placedObjects);
      break;
    case CatId.IVY:
      doIvyMove(cat, placedObjects);
      break;
    case CatId.SPLASHY:
      doSplashyMove(cat, placedObjects);
      break;
  }

  // on swap, revert kitten to previous position
  if (isSameCell(cat, previousMotherPosition) && isSameCell(previousPosition, newMotherPosition)) {
    console.debug(`Reverting ${cat.name} to previous position:`, previousPosition);
    moveCatToCell(cat, previousPosition, placedObjects);
  }
}

function doMoonyMove(cat: PlacedCat, placedObjects: PlacedObject[]) {
  // Moony moves towards the moon
  const moonPosition = placedObjects.find(isMoon);

  if (moonPosition) {
    moveCatTowardsCell(cat, moonPosition, placedObjects);
  }
}

function doIvyMove(cat: PlacedCat, placedObjects: PlacedObject[]) {
  // if next to a tree, then move clockwise around it
  const { row, column } = cat;
  const treePosition = placedObjects.find(isTree);

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

        moveCatToCell(cat, { row: newRow, column: newColumn }, placedObjects);
        return;
      }

      if (rowDiff === -1) {
        // cat below tree
        if (columnDiff === 1) {
          newRow = row - 1; // move up
        } else {
          newColumn = column - 1; // move left
        }

        moveCatToCell(cat, { row: newRow, column: newColumn }, placedObjects);
        return;
      }

      if (columnDiff === 1) {
        // cat to the left of tree
        newRow = row - 1; // move up
        moveCatToCell(cat, { row: newRow, column }, placedObjects);
        return;
      }

      if (columnDiff === -1) {
        // cat to the right of tree
        newRow = row + 1; // move down
        moveCatToCell(cat, { row: newRow, column }, placedObjects);
        return;
      }
    } else {
      // If not next to a tree, just move towards the tree
      moveCatTowardsCell(cat, treePosition, placedObjects);
    }
  }
}

function doSplashyMove(cat: PlacedCat, placedObjects: PlacedObject[]) {
  // Splashy moves towards the puddle
  const waterPosition = placedObjects.find(isPuddle);

  if (waterPosition) {
    moveCatTowardsCell(cat, waterPosition, placedObjects);
  }
}

function moveCatTowardsCell(cat: PlacedCat, targetCell: CellPosition, placedObjects: PlacedObject[]) {
  const rowDiff = targetCell.row - cat.row;
  const columnDiff = targetCell.column - cat.column;

  if (rowDiff === 0 && columnDiff === 0) {
    return;
  }

  if (Math.abs(rowDiff) >= Math.abs(columnDiff)) {
    // Move vertically firsts
    const newRow = cat.row + (rowDiff > 0 ? 1 : -1);

    if (isValidCellPosition(globals.fieldSize, { row: newRow, column: cat.column }, placedObjects)) {
      moveCatToCell(cat, { row: newRow, column: cat.column }, placedObjects);
      return;
    }
  }

  const newColumn = cat.column + (columnDiff > 0 ? 1 : -1);

  if (isValidCellPosition(globals.fieldSize, { row: cat.row, column: newColumn }, placedObjects)) {
    moveCatToCell(cat, { row: cat.row, column: newColumn }, placedObjects);
    return;
  }
}

export function moveCat(cat: PlacedCat, direction: Direction, placedObjects: PlacedObject[]) {
  const newPosition = newCellPositionFromDirection(cat, direction);
  moveCatToCell(cat, newPosition, placedObjects);
}

export function moveCatToCell(cat: PlacedCat, cell: CellPosition, placedObjects: PlacedObject[]) {
  const isValidMove = isValidCellPosition(globals.fieldSize, cell, placedObjects);

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
  if (isWinConditionMet(globals.placedCats)) {
    globals.isWon = true;
    document.body.classList.add(CssClass.WON);
    pubSubService.publish(PubSubEvent.GAME_END);
  }
}

export function isWinConditionMet(placedCats: PlacedCat[]): boolean {
  if (placedCats.length === 0) {
    return false; // No cats to win with
  }

  const firstCatPosition = { row: placedCats[0].row, column: placedCats[0].column };

  return placedCats.every((cat) => {
    return cat.row === firstCatPosition.row && cat.column === firstCatPosition.column;
  });
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
