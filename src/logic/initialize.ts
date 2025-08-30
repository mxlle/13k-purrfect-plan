import { getDefaultPlacedObjects } from "./onboarding";
import { shuffleArray } from "../utils/random-utils";
import { getEmptyFields } from "./checks";
import { ALL_CAT_IDS } from "./data/catId";
import { CellPosition } from "./data/cell";
import { Config, emptyConfig, getValidatedConfig, showMovesInfo } from "./config/config";
import { DEFAULT_FIELD_SIZE, FieldSize, getMiddleCoordinates } from "./data/field-size";
import { copyGameSetup, EMPTY_ELEMENT_MAP, GameElementPositions, GameSetup, isValidGameSetup } from "./data/game-elements";
import { calculatePar, MAX_PAR, MIN_PAR } from "./par";
import { ALL_OBJECT_IDS } from "./data/objects";
import { sleep } from "../utils/promise-utils";

export function getInitialGameSetup(config: Config = emptyConfig, fieldSize: FieldSize = DEFAULT_FIELD_SIZE): GameSetup {
  const placedObjects = getDefaultPlacedObjects();
  const elementPositions: GameElementPositions = EMPTY_ELEMENT_MAP();

  for (const obj of ALL_OBJECT_IDS) {
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

  const finalGameSetup = randomlyPlaceCatsOnField(tempGameSetup, showMovesInfo(config));

  return { ...finalGameSetup };
}

export function randomlyPlaceCatsOnField(gameSetup: GameSetup, shouldCalculatePar: boolean, iteration: number = 0): GameSetup {
  const copiedGameSetup = copyGameSetup(gameSetup);
  const cats = [...ALL_CAT_IDS];
  const emptyFields = getEmptyFields(copiedGameSetup);
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

      return randomlyPlaceCatsOnField(copiedGameSetup, shouldCalculatePar, iteration + 1);
    }

    possibleSolutions = parInfo.possibleSolutions;
  }

  return {
    ...copiedGameSetup,
    elementPositions: copiedGameSetup.elementPositions,
    possibleSolutions,
  };
}
