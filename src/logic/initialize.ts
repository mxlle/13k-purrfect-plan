import { getDefaultPlacedObjects } from "./onboarding";
import { shuffleArray } from "../utils/random-utils";
import { getAllCellPositions, getEmptyFields } from "./checks";
import { ALL_CAT_IDS } from "./data/catId";
import { CellPosition, isSameCell } from "./data/cell";
import { allInConfig, Config, getValidatedConfig, hasMoveLimit, showMoon } from "./config/config";
import { DEFAULT_FIELD_SIZE, FieldSize, getMiddleCoordinates } from "./data/field-size";
import { copyGameSetup, EMPTY_ELEMENT_MAP, GameElementPositions, GameSetup, isValidGameSetup } from "./data/game-elements";
import { calculatePar, MAX_PAR, MIN_PAR } from "./par";
import { ALL_OBJECT_IDS, DEFAULT_MOON_POSITION } from "./data/objects";
import { sleep } from "../utils/promise-utils";
import { ConfigCategory, ObjectId } from "../types";
import { getRandomItem } from "../utils/array-utils";

export function getInitialGameSetup(
  config: Config = getValidatedConfig(allInConfig),
  fieldSize: FieldSize = DEFAULT_FIELD_SIZE,
): GameSetup {
  const placedObjects = getDefaultPlacedObjects();
  const elementPositions: GameElementPositions = EMPTY_ELEMENT_MAP();

  for (const obj of ALL_OBJECT_IDS) {
    if ((obj === ObjectId.MOON && !showMoon(config)) || config[ConfigCategory.OBJECTS][obj] === false) {
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
    config: getValidatedConfig(config),
    possibleSolutions: [],
  };
}

export async function generateRandomGameSetup(config: Config, fieldSize: FieldSize = DEFAULT_FIELD_SIZE): Promise<GameSetup> {
  await sleep(0);

  const tempGameSetup = getInitialGameSetup(config, fieldSize);

  const finalGameSetup = randomlyPlaceGameElementsOnField(tempGameSetup, hasMoveLimit(config), false);

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
  const newCellForMoon = getRandomItem(cellsAllowedForMoon);

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
  copiedGameSetup.elementPositions[ObjectId.TREE] = newObjectPositions[ObjectId.TREE];
  copiedGameSetup.elementPositions[ObjectId.PUDDLE] = newObjectPositions[ObjectId.PUDDLE];
  copiedGameSetup.elementPositions[ObjectId.MOON] = newObjectPositions[ObjectId.MOON];

  const cats = [...ALL_CAT_IDS];
  const emptyFields = getEmptyFields(copiedGameSetup, { ignoreCats: true });
  const shuffledRequiredFields = shuffleArray(emptyFields).slice(0, cats.length);
  shuffledRequiredFields.forEach((cell: CellPosition) => {
    const cat = cats.pop();

    if (!cat) {
      return;
    }

    copiedGameSetup.elementPositions[cat] = cell;
  });

  if (!isValidGameSetup(copiedGameSetup) && iteration === 0) {
    console.error("not all cats placed");
  }

  let possibleSolutions = copiedGameSetup.possibleSolutions;

  if (shouldCalculatePar) {
    const parInfo = calculatePar(copiedGameSetup);

    if ((parInfo.par > MAX_PAR || parInfo.par < MIN_PAR) && iteration < 10) {
      console.info("not a good setup");

      return randomlyPlaceGameElementsOnField(copiedGameSetup, shouldCalculatePar, randomMoonPosition, iteration + 1);
    }

    possibleSolutions = parInfo.possibleSolutions;
  }

  return {
    ...copiedGameSetup,
    elementPositions: copiedGameSetup.elementPositions,
    possibleSolutions,
  };
}
