import { Direction, isTool, RECOVERY_TIME_MAP, Tool, TurnMove } from "../types";
import { PubSubEvent, pubSubService } from "../utils/pub-sub-service";
import { getKittensElsewhere, getKittensOnCell, isValidCellPosition } from "./checks";
import { ALL_CAT_IDS, CatId } from "./data/catId";
import { CAT_NAMES } from "./data/cats";
import { CellPosition, isSameCell } from "./data/cell";
import { playSoundForAction } from "../audio/sound-control/sound-control";
import { updateAllPositions } from "../components/game-field/game-field";
import { sleep } from "../utils/promise-utils";
import { ConfigCategory, shouldApplyKittenBehavior } from "./config";
import { ObjectId } from "./data/objects";
import { GameState } from "./data/game-elements";

import { styles as catStyles } from "../components/cat-component/cat-component";

let isPerformingMove = false;

const MEOW_TIME = 1500;

export async function performMove(gameState: GameState, turnMove: TurnMove) {
  console.debug(`Make move: ${turnMove}`);

  if (isPerformingMove) {
    console.warn("Already performing a move, ignoring this one.");
    return;
  }

  if (!isValidMove(gameState, turnMove)) {
    console.warn(`Invalid move: ${turnMove}`);
    return;
  }

  isPerformingMove = true;

  gameState.moves.push(turnMove);

  await playSoundForAction(turnMove);
  isTool(turnMove) && (await preToolAction(turnMove));

  calculateNewPositions(gameState, turnMove);

  isTool(turnMove) && (await postToolAction(turnMove));

  updateAllPositions(gameState);

  if (isWinConditionMet(gameState)) {
    pubSubService.publish(PubSubEvent.GAME_END);
  }

  isPerformingMove = false;
}

export function isValidMove(gameState: GameState, turnMove: TurnMove): boolean {
  const motherPosition = gameState.currentPositions[CatId.MOTHER];

  if (!motherPosition) {
    console.error("Mother cat not found, cannot perform move.");
    return false;
  }

  if (isTool(turnMove)) {
    if (!gameState.setup.config[ConfigCategory.TOOLS][turnMove]) {
      return false;
    }

    const recoveryTime = RECOVERY_TIME_MAP[turnMove];
    // If the move is a tool, check if it can be used based on the recovery time
    const lastIndex = gameState.moves.lastIndexOf(turnMove);

    return lastIndex === -1 || gameState.moves.length - lastIndex > recoveryTime;
  }

  const newPosition = newCellPositionFromDirection(motherPosition, turnMove);

  return isValidCellPosition(gameState, newPosition);
}

export function calculateNewPositions(gameState: GameState, turnMove: TurnMove) {
  const previousMotherPosition = gameState.currentPositions[CatId.MOTHER];

  if (!previousMotherPosition) {
    console.error("Mother cat not found, cannot perform move.");
    return false;
  }

  doMoonMove(gameState);

  const kittensOnCell = getKittensOnCell(gameState, previousMotherPosition);
  const freeKittens = getKittensElsewhere(gameState, previousMotherPosition);

  if (isTool(turnMove)) {
    executeTool(gameState, turnMove);
  } else {
    moveCat(gameState, CatId.MOTHER, turnMove);

    for (const kitten of kittensOnCell) {
      moveCat(gameState, kitten, turnMove);
    }

    for (const kitten of freeKittens) {
      handleKittenBehavior(gameState, kitten, previousMotherPosition, gameState.currentPositions[CatId.MOTHER]);
    }
  }
}

function doMoonMove(gameState: GameState) {
  const moon = gameState.currentPositions[ObjectId.MOON];
  const width = gameState.setup.fieldSize;

  if (moon && moon.column < width) {
    moon.column = moon.column + 1;
  }
}

async function preToolAction(tool: Tool) {
  switch (tool) {
    case Tool.MEOW:
      document.body.classList.add(catStyles.meow);

      await sleep(300); // Wait for meow speech bubble to appear

      break;
  }
}

async function postToolAction(tool: Tool) {
  switch (tool) {
    case Tool.MEOW:
      setTimeout(() => {
        document.body.classList.remove(catStyles.meow);
      }, MEOW_TIME);
      break;
  }
}

function executeTool(gameState: GameState, tool: Tool) {
  const momPosition = gameState.currentPositions[CatId.MOTHER];

  switch (tool) {
    case Tool.MEOW:
      // all kittens move one cell in the direction of the mother cat
      const freeKittens = getKittensElsewhere(gameState, momPosition);

      for (const kitten of freeKittens) {
        moveCatTowardsCell(gameState, kitten, momPosition);
      }
  }
}

function handleKittenBehavior(gameState: GameState, kitten: CatId, previousMotherPosition: CellPosition, newMotherPosition: CellPosition) {
  if (!shouldApplyKittenBehavior(gameState.setup, kitten)) {
    return;
  }

  const previousPosition = { ...gameState.currentPositions[kitten] };

  switch (kitten) {
    case CatId.MOONY:
      doMoonyMove(gameState);
      break;
    case CatId.IVY:
      doIvyMove(gameState);
      break;
    case CatId.SPLASHY:
      doSplashyMove(gameState);
      break;
  }

  const newPosition = gameState.currentPositions[kitten];

  // on swap, revert kitten to previous position
  if (isSameCell(newPosition, previousMotherPosition) && isSameCell(previousPosition, newMotherPosition)) {
    console.debug(`Reverting ${CAT_NAMES[kitten]} to previous position:`, previousPosition);
    moveCatToCell(gameState, kitten, previousPosition);
  }
}

function doMoonyMove(gameState: GameState) {
  // Moony moves towards the moon
  const moonPosition = gameState.currentPositions[ObjectId.MOON];

  if (moonPosition) {
    moveCatTowardsCell(gameState, CatId.MOONY, moonPosition);
  }
}

function doIvyMove(gameState: GameState) {
  // if next to a tree, then move clockwise around it
  const catId = CatId.IVY;
  const { row, column } = gameState.currentPositions[catId];
  const treePosition = gameState.currentPositions[ObjectId.TREE];

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

        moveCatToCell(gameState, catId, { row: newRow, column: newColumn });
        return;
      }

      if (rowDiff === -1) {
        // cat below tree
        if (columnDiff === 1) {
          newRow = row - 1; // move up
        } else {
          newColumn = column - 1; // move left
        }

        moveCatToCell(gameState, catId, { row: newRow, column: newColumn });
        return;
      }

      if (columnDiff === 1) {
        // cat to the left of tree
        newRow = row - 1; // move up
        moveCatToCell(gameState, catId, { row: newRow, column });
        return;
      }

      if (columnDiff === -1) {
        // cat to the right of tree
        newRow = row + 1; // move down
        moveCatToCell(gameState, catId, { row: newRow, column });
        return;
      }
    } else {
      // If not next to a tree, just move towards the tree
      moveCatTowardsCell(gameState, catId, treePosition);
    }
  }
}

function doSplashyMove(gameState: GameState) {
  // Splashy moves towards the puddle
  const waterPosition = gameState.currentPositions[ObjectId.PUDDLE];

  if (waterPosition) {
    moveCatTowardsCell(gameState, CatId.SPLASHY, waterPosition);
  }
}

function moveCatTowardsCell(gameState: GameState, catId: CatId, targetCell: CellPosition) {
  const cat = gameState.currentPositions[catId];
  const rowDiff = targetCell.row - cat.row;
  const columnDiff = targetCell.column - cat.column;

  if (rowDiff === 0 && columnDiff === 0) {
    return;
  }

  if (Math.abs(rowDiff) >= Math.abs(columnDiff)) {
    // Move vertically firsts
    const newRow = cat.row + (rowDiff > 0 ? 1 : -1);

    if (isValidCellPosition(gameState, { row: newRow, column: cat.column })) {
      moveCatToCell(gameState, catId, { row: newRow, column: cat.column });
      return;
    }
  }

  const newColumn = cat.column + (columnDiff > 0 ? 1 : -1);

  if (isValidCellPosition(gameState, { row: cat.row, column: newColumn })) {
    moveCatToCell(gameState, catId, { row: cat.row, column: newColumn });
    return;
  }
}

export function moveCat(gameState: GameState, catId: CatId, direction: Direction) {
  const newPosition = newCellPositionFromDirection(gameState.currentPositions[catId], direction);
  moveCatToCell(gameState, catId, newPosition);
}

export function moveCatToCell(gameState: GameState, catId: CatId, cell: CellPosition) {
  const isValidMove = isValidCellPosition(gameState, cell);

  if (!isValidMove) {
    console.warn(`Invalid move for cat ${CAT_NAMES[catId]} to cell (${cell.row}, ${cell.column})`);
    return;
  }

  gameState.currentPositions[catId] = { ...cell };
}

export function isWinConditionMet(gameState: GameState | null): boolean {
  if (!gameState) {
    return false;
  }

  const momPosition = gameState.currentPositions[CatId.MOTHER];

  if (!momPosition) {
    return false;
  }

  return ALL_CAT_IDS.every((catId) => {
    const catPosition = gameState.currentPositions[catId];

    return catPosition === null || isSameCell(momPosition, catPosition);
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
