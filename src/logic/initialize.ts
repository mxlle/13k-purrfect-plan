import { defaultPlacedObjects } from "./onboarding";
import { shuffleArray } from "../utils/random-utils";
import { getEmptyFields } from "./checks";
import { ALL_CAT_IDS } from "./data/cats";
import { CellPosition } from "./data/cell";
import { allInConfig, Config } from "./config";
import { DEFAULT_FIELD_SIZE, FieldSize } from "./data/field-size";
import { copyGameSetup, EMPTY_ELEMENT_MAP, GameElementPositions, GameSetup, isValidGameSetup } from "./data/game-elements";
import { calculatePar, MAX_PAR, MIN_PAR } from "./par";
import { ALL_OBJECT_IDS } from "./data/objects";

export function generateRandomGameSetup(fieldSize: FieldSize = DEFAULT_FIELD_SIZE, config: Config = allInConfig): GameSetup {
  const placedObjects = defaultPlacedObjects;
  const elementPositions: GameElementPositions = EMPTY_ELEMENT_MAP();

  for (const obj of ALL_OBJECT_IDS) {
    elementPositions[obj] = { ...placedObjects[obj] };
  }

  const tempGameSetup: GameSetup = {
    fieldSize,
    elementPositions,
    config,
    possibleSolutions: [],
  };

  const finalGameSetup = randomlyPlaceCatsOnField(tempGameSetup);

  return { ...finalGameSetup };
}

function randomlyPlaceCatsOnField(gameSetup: GameSetup, iteration: number = 0): GameSetup {
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

  const parInfo = calculatePar(copiedGameSetup);

  if ((parInfo.par > MAX_PAR || parInfo.par < MIN_PAR) && iteration < 10) {
    console.info("not a good setup");

    return randomlyPlaceCatsOnField(copiedGameSetup, iteration + 1);
  }

  return {
    ...copiedGameSetup,
    elementPositions: copiedGameSetup.elementPositions,
    possibleSolutions: [parInfo.moves],
  };
}
