import { getDefaultPlacedObjects } from "./onboarding";
import { shuffleArray } from "../utils/random-utils";
import { getAllCellPositions, getEmptyFields } from "./checks";
import { ALL_CAT_IDS } from "./data/catId";
import { isSameCell } from "./data/cell";
import { hasMoveLimit, hasUnknownConfigItems, showMoon } from "./config/config";
import { DEFAULT_FIELD_SIZE, FieldSize, getMiddleCoordinates } from "./data/field-size";
import { copyGameSetup, EMPTY_ELEMENT_MAP, GameElementPositions, GameSetup, isValidGameSetup } from "./data/game-elements";
import { calculatePar, MAX_PAR, MIN_PAR } from "./par";
import { ALL_OBJECT_IDS, DEFAULT_MOON_POSITION } from "./data/objects";
import { sleep } from "../utils/promise-utils";
import { Difficulty, ObjectId } from "../types";
import { getRandomItem } from "../utils/array-utils";
import { difficultyEmoji } from "./difficulty";

const MAX_ITERATIONS_FOR_RANDOM_PLACEMENT = 13;

export function getInitialGameSetup(fieldSize: FieldSize = DEFAULT_FIELD_SIZE): GameSetup {
  const placedObjects = getDefaultPlacedObjects();
  const elementPositions: GameElementPositions = EMPTY_ELEMENT_MAP();

  for (const obj of ALL_OBJECT_IDS) {
    if (obj === ObjectId.MOON && !showMoon()) {
      continue;
    }
    elementPositions[obj] = { ...placedObjects[obj] };
  }

  for (const cat of ALL_CAT_IDS) {
    elementPositions[cat] = getMiddleCoordinates(fieldSize);
  }

  return {
    fieldSize,
    elementPositions,
    possibleSolutions: [],
  };
}

export async function generateRandomGameSetup(fieldSize: FieldSize = DEFAULT_FIELD_SIZE): Promise<GameSetup> {
  await sleep(0);

  const tempGameSetup = getInitialGameSetup(fieldSize);

  let performanceStart: number | undefined;
  if (import.meta.env.DEV) {
    performanceStart = performance.now();
  }

  const finalGameSetup = randomlyPlaceGameElementsOnField(tempGameSetup, hasMoveLimit(), false);

  if (import.meta.env.DEV) {
    const performanceEnd = performance.now();
    const performanceTime = performanceEnd - performanceStart;
    console.info("Random game setup generation time:", Math.round(performanceTime), "ms");
  }

  return { ...finalGameSetup };
}

function randomlyPlaceObjectsOnField(gameSetup: GameSetup, randomMoonPosition: boolean): GameElementPositions {
  const allCellPositions = getAllCellPositions(gameSetup.fieldSize);
  const cellsAllowedForTree = allCellPositions.filter(
    (cell) => cell.row !== 0 && cell.column !== 0 && cell.row !== gameSetup.fieldSize - 1 && cell.column !== gameSetup.fieldSize - 1,
  );
  const cellsAllowedForPuddle = allCellPositions.filter((cell) => cell.row !== 0);
  const cellsAllowedForMoon = randomMoonPosition
    ? allCellPositions.filter((cell) => cell.column !== 0 && cell.row === 0)
    : [DEFAULT_MOON_POSITION];

  const newCellForTree = getRandomItem(cellsAllowedForTree);
  const newCellForPuddle = getRandomItem(cellsAllowedForPuddle.filter((cell) => !isSameCell(cell, newCellForTree)));
  const newCellForMoon = showMoon() ? getRandomItem(cellsAllowedForMoon) : null;

  return {
    ...EMPTY_ELEMENT_MAP(),
    [ObjectId.TREE]: newCellForTree,
    [ObjectId.PUDDLE]: newCellForPuddle,
    [ObjectId.MOON]: newCellForMoon,
  };
}

export function randomlyPlaceGameElementsOnField(
  gameSetup: GameSetup,
  shouldCalculatePar: boolean,
  randomMoonPosition: boolean,
  iteration: number = 0,
): GameSetup {
  const copiedGameSetup = copyGameSetup(gameSetup);

  const newObjectPositions = randomlyPlaceObjectsOnField(copiedGameSetup, randomMoonPosition);
  ALL_OBJECT_IDS.forEach((objId) => {
    copiedGameSetup.elementPositions[objId] = newObjectPositions[objId];
  });

  const emptyFields = getEmptyFields(copiedGameSetup, { ignoreCats: true });
  const shuffledFields = shuffleArray(emptyFields);
  ALL_CAT_IDS.forEach((catId, index) => {
    copiedGameSetup.elementPositions[catId] = shuffledFields[index] ?? shuffledFields[0];
  });

  if (!isValidGameSetup(copiedGameSetup) && iteration === 0) {
    console.error("not all cats placed");
  }

  let possibleSolutions = copiedGameSetup.possibleSolutions;
  let difficulty: Difficulty | undefined;

  if (shouldCalculatePar) {
    const parInfo = calculatePar(copiedGameSetup);

    if (
      (parInfo.par > MAX_PAR || parInfo.par < MIN_PAR || (parInfo.difficulty >= Difficulty.HARD && hasUnknownConfigItems())) &&
      iteration < MAX_ITERATIONS_FOR_RANDOM_PLACEMENT
    ) {
      console.info("not a good setup", parInfo.par, difficultyEmoji[parInfo.difficulty]);

      return randomlyPlaceGameElementsOnField(copiedGameSetup, shouldCalculatePar, randomMoonPosition, iteration + 1);
    } else {
      console.info("found setup, iterations: ", iteration);
    }

    possibleSolutions = parInfo.possibleSolutions;
    difficulty = parInfo.difficulty;
  }

  return {
    ...copiedGameSetup,
    elementPositions: copiedGameSetup.elementPositions,
    possibleSolutions,
    difficulty,
  };
}
