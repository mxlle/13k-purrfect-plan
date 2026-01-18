import { shuffleArray } from "../utils/random-utils";
import { getAllCellPositions, getEmptyFields } from "./checks";
import { ALL_CAT_IDS } from "./data/catId";
import { CellPosition, containsCell, isSameCell } from "./data/cell";
import { hasMoveLimit, showMoon } from "./config/config";
import { DEFAULT_FIELD_SIZE, FieldSize, getMiddleCoordinates } from "./data/field-size";
import { copyGameSetup, EMPTY_ELEMENT_MAP, GameElementPositions, GameSetup, getMoonColumnFromDesiredPar } from "./data/game-elements";
import { calculatePar, MAX_PAR, MIN_PAR } from "./par";
import { ALL_OBJECT_IDS, DEFAULT_MOON_POSITION, isMoon } from "./data/objects";
import { sleep } from "../utils/promise-utils";
import { Difficulty, ObjectId } from "../types";
import { getRandomItem } from "../utils/array-utils";
import { difficultyEmoji } from "./difficulty";
import { getXpLevelModifier, hasXpLevelOfPlayedGames } from "./data/experience-points";
import { HAS_GAMEPLAY_NICE_TO_HAVES, IS_DEV } from "../env-utils";
import { deserializeGame } from "./serializer";

const MAX_ITERATIONS_FOR_RANDOM_PLACEMENT = 13;

interface RandomGameSetupOptions {
  shouldCalculatePar: boolean;
  randomMoonPosition: boolean;
  allowLessMoves: boolean;
  desiredPar: number;
}

export const GAME_SETUP_OPTIONS_FOR_SHUFFLE: RandomGameSetupOptions = {
  shouldCalculatePar: false,
  randomMoonPosition: true,
  allowLessMoves: true,
  desiredPar: MAX_PAR,
};

function shouldAllowLessMoves() {
  // 50% change or more depending on the xp
  return Math.random() < 1 - 0.5 * getXpLevelModifier();
}

function shouldStartWithParMinus1() {
  // 30% chance or less depending on the xp
  return Math.random() < 0.3 * getXpLevelModifier();
}

const defaultPlacedObjectsString = "🟣11🟡32🟢31🔵33🌳23💧21🌙12";
let defaultPlacedObjects: GameElementPositions | undefined;

export function getDefaultPlacedObjects() {
  if (defaultPlacedObjects) {
    return defaultPlacedObjects;
  }

  const deserializedGame = deserializeGame(defaultPlacedObjectsString, {
    skipParCalculation: true,
  });
  defaultPlacedObjects = deserializedGame.elementPositions;

  return defaultPlacedObjects;
}

export function getInitialGameSetup(fieldSize: FieldSize = DEFAULT_FIELD_SIZE): GameSetup {
  const placedObjects = getDefaultPlacedObjects();
  const elementPositions: GameElementPositions = EMPTY_ELEMENT_MAP();

  for (const obj of ALL_OBJECT_IDS) {
    if (isMoon(obj) && !showMoon()) {
      console.log("Skipping moon placement as moon is disabled");
      continue;
    }
    console.info("Placing object", obj, "at", placedObjects[obj]);
    elementPositions[obj] = { ...placedObjects[obj] };
  }

  for (const cat of ALL_CAT_IDS) {
    elementPositions[cat] = getMiddleCoordinates(fieldSize);
  }

  return {
    fieldSize,
    elementPositions,
    possibleSolutions: [],
    levelIndex: -1,
  };
}

export async function generateRandomGameSetup(fieldSize: FieldSize = DEFAULT_FIELD_SIZE): Promise<GameSetup> {
  await sleep(0);

  const tempGameSetup = getInitialGameSetup(fieldSize);

  let performanceStart: number | undefined;
  if (IS_DEV) {
    performanceStart = performance.now();
  }

  const simpleAllowLessMovesChance = Math.random() < 0.8;
  const simpleDesiredParChance = Math.random() < 0.2;
  const shouldUseSmallerPar = HAS_GAMEPLAY_NICE_TO_HAVES ? shouldStartWithParMinus1() : simpleDesiredParChance;

  const finalGameSetup = randomlyPlaceGameElementsOnField(tempGameSetup, {
    shouldCalculatePar: hasMoveLimit(),
    randomMoonPosition: false,
    allowLessMoves: HAS_GAMEPLAY_NICE_TO_HAVES ? shouldAllowLessMoves() : simpleAllowLessMovesChance,
    desiredPar: shouldUseSmallerPar ? MAX_PAR - 1 : MAX_PAR,
  });

  if (IS_DEV) {
    const performanceEnd = performance.now();
    const performanceTime = performanceEnd - performanceStart;
    console.info("Random game setup generation time:", Math.round(performanceTime), "ms");
  }

  return { ...finalGameSetup };
}

function randomlyPlaceObjectsOnField(gameSetup: GameSetup, options: RandomGameSetupOptions): GameElementPositions {
  const fieldSize = gameSetup.fieldSize;

  const allCellPositions = getAllCellPositions(fieldSize);

  const isBorderCell = (cell: CellPosition) =>
    cell.row === 0 || cell.column === 0 || cell.row === fieldSize - 1 || cell.column === fieldSize - 1;

  const isInteriorCell = (cell: CellPosition) => !isBorderCell(cell);
  const isTopRow = (cell: CellPosition) => cell.row === 0;
  const isNonTopRow = (cell: CellPosition) => !isTopRow(cell);

  const cellsAllowedForTree = allCellPositions.filter(isInteriorCell);
  const cellsAllowedForPuddle = allCellPositions.filter(isNonTopRow);
  const cellsAllowedForMoon = options.randomMoonPosition
    ? allCellPositions.filter(isTopRow)
    : [{ ...DEFAULT_MOON_POSITION, column: getMoonColumnFromDesiredPar(gameSetup, options.desiredPar) }];

  const treeCell = getRandomItem(cellsAllowedForTree);
  const puddleCell = getRandomItem(cellsAllowedForPuddle.filter((cell) => !isSameCell(cell, treeCell)));
  const moonCell = showMoon() ? getRandomItem(cellsAllowedForMoon) : null;

  return {
    ...EMPTY_ELEMENT_MAP(),
    [ObjectId.TREE]: treeCell,
    [ObjectId.PUDDLE]: puddleCell,
    [ObjectId.MOON]: moonCell,
  };
}

export function randomlyPlaceGameElementsOnField(gameSetup: GameSetup, options: RandomGameSetupOptions, iteration: number = 0): GameSetup {
  let copiedGameSetup = copyGameSetup(gameSetup);

  copiedGameSetup.elementPositions = randomlyPlaceObjectsOnField(copiedGameSetup, options);

  const emptyFields = getEmptyFields(copiedGameSetup);
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
