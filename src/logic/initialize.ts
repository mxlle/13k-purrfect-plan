import { getDefaultPlacedObjects } from "./onboarding";
import { shuffleArray } from "../utils/random-utils";
import { getAllCellPositions, getEmptyFields } from "./checks";
import { ALL_CAT_IDS } from "./data/catId";
import { containsCell, isSameCell } from "./data/cell";
import { hasMoveLimit, showMoon } from "./config/config";
import { DEFAULT_FIELD_SIZE, FieldSize, getMiddleCoordinates } from "./data/field-size";
import { copyGameSetup, EMPTY_ELEMENT_MAP, GameElementPositions, GameSetup, getMoonColumnFromDesiredPar } from "./data/game-elements";
import { calculatePar, MAX_PAR, MIN_PAR } from "./par";
import { ALL_OBJECT_IDS, DEFAULT_MOON_POSITION } from "./data/objects";
import { sleep } from "../utils/promise-utils";
import { Difficulty, ObjectId } from "../types";
import { getRandomItem } from "../utils/array-utils";
import { difficultyEmoji } from "./difficulty";
import { getXpLevelModifier, hasXpLevelOfPlayedGames } from "./data/experience-points";

const MAX_ITERATIONS_FOR_RANDOM_PLACEMENT = 13;

interface RandomGameSetupOptions {
  shouldCalculatePar: boolean;
  randomMoonPosition: boolean;
  allowLessMoves: boolean;
  desiredPar: number;
}

function shouldAllowLessMoves() {
  // 50% change or more depending on the xp
  return Math.random() < 1 - 0.5 * getXpLevelModifier();
}

function shouldStartWithParMinus1() {
  // 30% chance or less depending on the xp
  return Math.random() < 0.3 * getXpLevelModifier();
}

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

  const finalGameSetup = randomlyPlaceGameElementsOnField(tempGameSetup, {
    shouldCalculatePar: hasMoveLimit(),
    randomMoonPosition: false,
    allowLessMoves: shouldAllowLessMoves(),
    desiredPar: shouldStartWithParMinus1() ? MAX_PAR - 1 : MAX_PAR,
  });

  if (import.meta.env.DEV) {
    const performanceEnd = performance.now();
    const performanceTime = performanceEnd - performanceStart;
    console.info("Random game setup generation time:", Math.round(performanceTime), "ms");
  }

  return { ...finalGameSetup };
}

function randomlyPlaceObjectsOnField(gameSetup: GameSetup, options: RandomGameSetupOptions): GameElementPositions {
  const allCellPositions = getAllCellPositions(gameSetup.fieldSize);
  const cellsAllowedForTree = allCellPositions.filter(
    (cell) => cell.row !== 0 && cell.column !== 0 && cell.row !== gameSetup.fieldSize - 1 && cell.column !== gameSetup.fieldSize - 1,
  );
  const cellsAllowedForPuddle = allCellPositions.filter((cell) => cell.row !== 0);
  const cellsAllowedForMoon = options.randomMoonPosition
    ? allCellPositions.filter((cell) => cell.column !== 0 && cell.row === 0)
    : [{ ...DEFAULT_MOON_POSITION, column: getMoonColumnFromDesiredPar(gameSetup, options.desiredPar) }];

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

export function randomlyPlaceGameElementsOnField(gameSetup: GameSetup, options: RandomGameSetupOptions, iteration: number = 0): GameSetup {
  let copiedGameSetup = copyGameSetup(gameSetup);

  const newObjectPositions = randomlyPlaceObjectsOnField(copiedGameSetup, options);
  ALL_OBJECT_IDS.forEach((objId) => {
    copiedGameSetup.elementPositions[objId] = newObjectPositions[objId];
  });

  const emptyFields = getEmptyFields(copiedGameSetup, { ignoreCats: true });
  const shuffledFields = shuffleArray(emptyFields);
  ALL_CAT_IDS.forEach((catId, index) => {
    copiedGameSetup.elementPositions[catId] = shuffledFields[index] ?? shuffledFields[0];
  });

  let possibleSolutions = copiedGameSetup.possibleSolutions;
  let difficulty: Difficulty | undefined;

  if (options.shouldCalculatePar) {
    const parInfo = calculatePar(copiedGameSetup, { returnAllSolutions: options.allowLessMoves });

    if (
      (parInfo.par > options.desiredPar ||
        parInfo.par < MIN_PAR ||
        (parInfo.difficulty >= Difficulty.HARD && !hasXpLevelOfPlayedGames(10))) &&
      iteration < MAX_ITERATIONS_FOR_RANDOM_PLACEMENT
    ) {
      console.info("not a good setup", parInfo.par, difficultyEmoji[parInfo.difficulty]);

      return randomlyPlaceGameElementsOnField(copiedGameSetup, options, iteration + 1);
    }

    if (!options.allowLessMoves && parInfo.par < options.desiredPar && iteration < MAX_ITERATIONS_FOR_RANDOM_PLACEMENT) {
      const alternativePar = parInfo.par;
      const innerCopy = copyGameSetup(copiedGameSetup);
      const newMoonPosition = {
        ...DEFAULT_MOON_POSITION,
        column: getMoonColumnFromDesiredPar(innerCopy, alternativePar),
      };

      const emptyFields = getEmptyFields(innerCopy);
      if (!containsCell(emptyFields, newMoonPosition)) {
        console.info("not a good setup - moon is not on an empty field");

        return randomlyPlaceGameElementsOnField(copiedGameSetup, options, iteration + 1);
      }

      innerCopy.elementPositions[ObjectId.MOON] = newMoonPosition;
      const parInfo2 = calculatePar(innerCopy);

      if (parInfo2.par !== alternativePar) {
        console.info("not a good setup - par doesn't match moon");

        return randomlyPlaceGameElementsOnField(copiedGameSetup, options, iteration + 1);
      }

      copiedGameSetup = innerCopy;
      possibleSolutions = parInfo2.possibleSolutions;
      difficulty = parInfo2.difficulty;
    } else {
      possibleSolutions = parInfo.possibleSolutions;
      difficulty = parInfo.difficulty;
    }

    console.info("found setup, iterations: ", iteration, "par: ", parInfo.par);
  }

  return {
    ...copiedGameSetup,
    elementPositions: copiedGameSetup.elementPositions,
    possibleSolutions,
    difficulty,
  };
}
